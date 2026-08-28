import type { Request } from "express";
import { prisma } from "./prisma.js";
import { getClientIp } from "./client-ip.js";
import { lookupIpLocation, parseAccuracy, parseCoordinates, reverseGeocode } from "./geoip.js";

const SESSION_MS = 30 * 60 * 1000;

function clipUserAgent(value: unknown) {
  return String(value ?? "").trim().slice(0, 400);
}

function isBot(userAgent: string) {
  return /bot|crawler|spider|preview|facebookexternalhit|whatsapp|telegram|slackbot/i.test(userAgent);
}

export async function trackSiteAccess(req: Request) {
  const ip = getClientIp(req);
  if (!ip || ip === "0.0.0.0") return;

  const userAgent = clipUserAgent(req.headers["user-agent"]);
  if (isBot(userAgent)) return;
  const now = new Date();
  const existing = await prisma.siteAccess.findUnique({ where: { ip } });
  if (existing?.blocked) return;

  const hasGps = existing?.locationSource === "gps";
  const needsGeo = !hasGps && (!existing || (!existing.city && !existing.country));
  const geo = needsGeo ? await lookupIpLocation(ip) : null;
  const increment = !existing || now.getTime() - existing.lastSeenAt.getTime() >= SESSION_MS ? 1 : 0;

  await prisma.siteAccess.upsert({
    where: { ip },
    create: {
      ip,
      visitCount: 1,
      city: geo?.city || "",
      region: geo?.region || "",
      country: geo?.country || "",
      countryCode: geo?.countryCode || "",
      latitude: geo?.latitude ?? null,
      longitude: geo?.longitude ?? null,
      locationSource: "ip",
      userAgent,
      firstSeenAt: now,
      lastSeenAt: now,
    },
    update: {
      visitCount: { increment },
      lastSeenAt: now,
      userAgent: userAgent || existing?.userAgent || "",
      ...(geo && !hasGps
        ? {
            city: geo.city,
            region: geo.region,
            country: geo.country,
            countryCode: geo.countryCode,
            latitude: geo.latitude,
            longitude: geo.longitude,
            locationSource: "ip",
          }
        : {}),
    },
  });
}

export async function saveGpsLocation(
  req: Request,
  payload: { latitude: unknown; longitude: unknown; accuracy?: unknown },
) {
  const ip = getClientIp(req);
  if (!ip || ip === "0.0.0.0") return null;

  const userAgent = clipUserAgent(req.headers["user-agent"]);
  if (isBot(userAgent)) return null;

  const coords = parseCoordinates(payload.latitude, payload.longitude);
  if (!coords) return null;

  const existing = await prisma.siteAccess.findUnique({ where: { ip } });
  if (existing?.blocked) return null;

  const geo = await reverseGeocode(coords.latitude, coords.longitude);
  const accuracy = parseAccuracy(payload.accuracy);
  const now = new Date();

  return prisma.siteAccess.upsert({
    where: { ip },
    create: {
      ip,
      visitCount: 1,
      city: geo.city,
      region: geo.region,
      country: geo.country,
      countryCode: geo.countryCode,
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy,
      address: geo.address.slice(0, 400),
      locationSource: "gps",
      userAgent,
      firstSeenAt: now,
      lastSeenAt: now,
    },
    update: {
      lastSeenAt: now,
      userAgent: userAgent || existing?.userAgent || "",
      city: geo.city || existing?.city || "",
      region: geo.region || existing?.region || "",
      country: geo.country || existing?.country || "",
      countryCode: geo.countryCode || existing?.countryCode || "",
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy,
      address: geo.address.slice(0, 400),
      locationSource: "gps",
    },
  });
}

export async function isIpBlocked(req: Request) {
  const ip = getClientIp(req);
  if (!ip) return false;
  const row = await prisma.siteAccess.findUnique({ where: { ip }, select: { blocked: true } });
  return Boolean(row?.blocked);
}
