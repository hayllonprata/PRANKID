import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { prisma } from "./lib/prisma.js";
import { seedIfNeeded } from "./lib/seed.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { storeRouter } from "./routes/store.js";
import { uploadDir, uploadRouter } from "./routes/upload.js";

const app = express();
const port = Number(process.env.PORT || 4000);
const origins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

app.set("trust proxy", true);
app.use(
  cors({
    origin: origins,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadDir));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "prankid-back" });
});

app.use("/api/store", storeRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/upload", uploadRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno" });
});

async function start() {
  fs.mkdirSync(uploadDir, { recursive: true });
  await prisma.$connect();
  await seedIfNeeded();
  app.listen(port, "0.0.0.0", () => {
    console.log(`PRANKID API em http://0.0.0.0:${port}`);
    console.log(`Uploads em ${path.resolve(uploadDir)}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
