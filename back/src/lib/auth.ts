import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { CookieOptions, Request, Response } from "express";

const COOKIE_NAME = "prankid_token";

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não configurado");
  }
  return secret;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(adminId: string, email: string) {
  return jwt.sign({ sub: adminId, email }, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as { sub: string; email: string };
}

export function cookieOptions(): CookieOptions {
  const secure = process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: secure ? "none" : "lax",
    secure,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: 0 });
}

export function readToken(req: Request) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }
  const cookie = req.cookies?.[COOKIE_NAME];
  if (typeof cookie === "string" && cookie.length > 0) {
    return cookie;
  }
  return null;
}
