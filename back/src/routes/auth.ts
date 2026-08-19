import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { clearAuthCookie, setAuthCookie, signToken, verifyPassword } from "../lib/auth.js";
import { loginRateLimit, requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/login", loginRateLimit, async (req, res) => {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body?.password || "");

  if (!email || !password) {
    res.status(400).json({ error: "Informe e-mail e senha" });
    return;
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }

  const token = signToken(admin.id, admin.email);
  setAuthCookie(res, token);
  res.json({ token, admin: { id: admin.id, email: admin.email } });
});

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (req: AuthedRequest, res) => {
  res.json({ admin: req.admin });
});
