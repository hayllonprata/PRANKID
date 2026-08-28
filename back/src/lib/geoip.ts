import { isPrivateIp } from "./client-ip.js";

export type GeoLocation = {
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
};

const empty: GeoLocation = {
  city: "",
  region: "",
  country: "",
  countryCode: "",
  latitude: null,
  longitude: null,
};

async function fetchJson(url: string, timeoutMs = 2500, extraHeaders: Record<string, string> = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json", ...extraHeaders },
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function num(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function str(value: unknown) {
  return String(value ?? "").trim();
}

export function parseCoordinates(latitude: unknown, longitude: unknown) {
  const lat = num(latitude);
  const lng = num(longitude);
  if (lat == null || lng == null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { latitude: lat, longitude: lng };
}

export function parseAccuracy(value: unknown) {
  const n = num(value);
  if (n == null || n < 0) return null;
  return Math.min(n, 100000);
}

function nominatimAddress(data: Record<string, unknown>) {
  const details = (data.address || {}) as Record<string, unknown>;
  const city = str(details.city || details.town || details.village || details.municipality);
  const region = str(details.state);
  const country = str(details.country);
  const countryCode = str(details.country_code).toUpperCase();
  const street = [str(details.road || details.pedestrian || details.hamlet), str(details.house_number)]
    .filter(Boolean)
    .join(", ");
  const neighborhood = str(details.suburb || details.neighbourhood || details.city_district || details.quarter);
  const composed = [street, neighborhood, city, region, country].filter(Boolean).join(" · ");
  return {
    city,
    region,
    country,
    countryCode,
    address: str(data.display_name) || composed,
  };
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeoLocation & { address: string }> {
  const query = `lat=${encodeURIComponent(String(latitude))}&lon=${encodeURIComponent(String(longitude))}`;
  const nominatim = await fetchJson(
    `https://nominatim.openstreetmap.org/reverse?${query}&format=jsonv2&addressdetails=1&zoom=18`,
    4000,
    { "User-Agent": "PRANKID/1.0 (site-access)" },
  );
  if (nominatim && !nominatim.error) {
    const parsed = nominatimAddress(nominatim);
    return {
      ...parsed,
      latitude,
      longitude,
    };
  }

  const bigdata = await fetchJson(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(String(latitude))}&longitude=${encodeURIComponent(String(longitude))}&localityLanguage=pt`,
    4000,
  );
  if (bigdata) {
    const city = str(bigdata.city || bigdata.locality);
    const region = str(bigdata.principalSubdivision);
    const country = str(bigdata.countryName);
    const countryCode = str(bigdata.countryCode).toUpperCase();
    const street = [str(bigdata.locality), str(bigdata.plusCode)].filter(Boolean).join(" · ");
    const address = [str(bigdata.locality), city, region, country].filter(Boolean).join(" · ") || street;
    return {
      city,
      region,
      country,
      countryCode,
      latitude,
      longitude,
      address,
    };
  }

  return { ...empty, latitude, longitude, address: "" };
}

export async function lookupIpLocation(ip: string): Promise<GeoLocation> {
  if (!ip || isPrivateIp(ip)) return { ...empty, country: "Rede local" };

  const ipwho = await fetchJson(`https://ipwho.is/${encodeURIComponent(ip)}`);
  if (ipwho && ipwho.success !== false) {
    return {
      city: str(ipwho.city),
      region: str(ipwho.region),
      country: str(ipwho.country),
      countryCode: str(ipwho.country_code).toUpperCase(),
      latitude: num(ipwho.latitude),
      longitude: num(ipwho.longitude),
    };
  }

  const ipapi = await fetchJson(
    `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,regionName,city,lat,lon`,
  );
  if (ipapi && ipapi.status === "success") {
    return {
      city: str(ipapi.city),
      region: str(ipapi.regionName),
      country: str(ipapi.country),
      countryCode: str(ipapi.countryCode).toUpperCase(),
      latitude: num(ipapi.lat),
      longitude: num(ipapi.lon),
    };
  }

  return empty;
}
