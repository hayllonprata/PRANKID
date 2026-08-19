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

async function fetchJson(url: string, timeoutMs = 2500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
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
