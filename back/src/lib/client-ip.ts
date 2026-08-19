import type { Request } from "express";

function firstHeaderValue(value: string | string[] | undefined) {
  if (!value) return "";
  const raw = Array.isArray(value) ? value[0] : value;
  return raw.split(",")[0]?.trim() || "";
}

export function normalizeIp(raw: string) {
  let ip = raw.trim().replace(/^\[|\]$/g, "");
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);
  if (ip === "::1") return "127.0.0.1";
  return ip;
}

export function isPrivateIp(ip: string) {
  const value = normalizeIp(ip);
  if (!value) return true;
  if (value === "127.0.0.1" || value === "0.0.0.0") return true;
  if (value.startsWith("10.")) return true;
  if (value.startsWith("192.168.")) return true;
  if (value.startsWith("169.254.")) return true;
  const match = /^172\.(\d+)\./.exec(value);
  if (match) {
    const second = Number(match[1]);
    if (second >= 16 && second <= 31) return true;
  }
  if (value.includes(":")) {
    const lower = value.toLowerCase();
    if (lower === "fc00" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80")) {
      return true;
    }
  }
  return false;
}

export function getClientIp(req: Request) {
  const candidates = [
    firstHeaderValue(req.headers["x-prankid-client-ip"]),
    firstHeaderValue(req.headers["cf-connecting-ip"]),
    firstHeaderValue(req.headers["x-real-ip"]),
    firstHeaderValue(req.headers["x-forwarded-for"]),
    req.ip || "",
    req.socket.remoteAddress || "",
  ];
  for (const candidate of candidates) {
    const ip = normalizeIp(candidate);
    if (ip) return ip;
  }
  return "0.0.0.0";
}
