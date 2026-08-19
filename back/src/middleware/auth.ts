import type { NextFunction, Request, Response } from "express";
import { readToken, verifyToken } from "../lib/auth.js";

export type AuthedRequest = Request & { admin?: { id: string; email: string } };

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function loginRateLimit(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || "unknown";
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current || current.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    next();
    return;
  }
  if (current.count >= 20) {
    res.status(429).json({ error: "Muitas tentativas. Tente de novo em alguns minutos." });
    return;
  }
  current.count += 1;
  next();
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const token = readToken(req);
    if (!token) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }
    const payload = verifyToken(token);
    req.admin = { id: payload.sub, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: "Sessão inválida" });
  }
}
