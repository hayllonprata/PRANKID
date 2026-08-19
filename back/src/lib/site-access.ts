import type { Request } from "express";
import { prisma } from "./prisma.js";
import { getClientIp } from "./client-ip.js";
import { lookupIpLocation } from "./geoip.js";

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

  const needsGeo = !existing || (!existing.city && !existing.country);
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
      userAgent,
      firstSeenAt: now,
      lastSeenAt: now,
    },
    update: {
      visitCount: { increment },
      lastSeenAt: now,
      userAgent: userAgent || existing?.userAgent || "",
      ...(geo
        ? {
            city: geo.city,
            region: geo.region,
            country: geo.country,
            countryCode: geo.countryCode,
            latitude: geo.latitude,
            longitude: geo.longitude,
          }
        : {}),
    },
  });
}

export async function isIpBlocked(req: Request) {
  const ip = getClientIp(req);
  if (!ip) return false;
  const row = await prisma.siteAccess.findUnique({ where: { ip }, select: { blocked: true } });
  return Boolean(row?.blocked);
}
