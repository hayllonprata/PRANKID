import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { fillBriefFromTranscript, transcribeAudioFile } from "../lib/openai-transcribe.js";
import { productImageInclude } from "../lib/product-images.js";
import { parseProductSize } from "../lib/product-sizes.js";
import { publicSettings, serializeProduct } from "../lib/serialize.js";
import { isIpBlocked, saveGpsLocation, trackSiteAccess } from "../lib/site-access.js";
import { uploadDir } from "./upload.js";

export const storeRouter = Router();

storeRouter.use(async (req, res, next) => {
  try {
    if (await isIpBlocked(req)) {
      res.status(403).json({ error: "Acesso indisponível" });
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
});

storeRouter.post("/location", async (req, res) => {
  const saved = await saveGpsLocation(req, {
    latitude: req.body?.latitude,
    longitude: req.body?.longitude,
    accuracy: req.body?.accuracy,
  });
  if (!saved) {
    res.status(400).json({ error: "Localização inválida" });
    return;
  }
  res.json({ ok: true });
});

storeRouter.get("/", async (req, res) => {
  void trackSiteAccess(req).catch((error) => {
    console.error("Falha ao registrar acesso", error);
  });

  const [hero, story, legend, crew, settings, products] = await Promise.all([
    prisma.hero.findUnique({ where: { id: "default" } }),
    prisma.story.findUnique({ where: { id: "default" } }),
    prisma.legend.findUnique({ where: { id: "default" } }),
    prisma.crewShot.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.settings.findUnique({ where: { id: "default" } }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: productImageInclude,
    }),
  ]);

  res.json({
    hero,
    story,
    legend,
    crew,
    settings: settings
      ? publicSettings(settings)
      : { whatsapp: "", yampiBaseUrl: "", yampiPromocode: "", instagram: "", footer: "" },
    products: products.map(serializeProduct),
  });
});

function clip(value: unknown, max = 4000) {
  return String(value ?? "").trim().slice(0, max);
}

const audioTypes = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/m4a",
  "audio/x-m4a",
  "video/webm",
]);

const audioUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase() || ".webm";
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!audioTypes.has(file.mimetype) && !file.mimetype.startsWith("audio/")) {
      cb(new Error("Envie um áudio (webm, mp3, wav ou m4a)"));
      return;
    }
    cb(null, true);
  },
});

storeRouter.post("/transcribe", (req, res) => {
  audioUpload.single("audio")(req, res, async (err) => {
    if (err) {
      res.status(400).json({ error: err.message || "Falha no áudio" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "Áudio obrigatório" });
      return;
    }
    try {
      const settings = await prisma.settings.findUnique({ where: { id: "default" } });
      const apiKey = settings?.openaiApiKey?.trim();
      if (!apiKey) {
        res.status(400).json({ error: "A transcrição ainda não foi configurada. Peça para o painel gravar a chave da OpenAI." });
        return;
      }
      const text = await transcribeAudioFile(
        apiKey,
        req.file.path,
        req.file.filename,
        req.file.mimetype,
      );
      const fields = await fillBriefFromTranscript(apiKey, text);
      res.json({ text, audioUrl: `/uploads/${req.file.filename}`, ...fields });
    } catch (error) {
      if (req.file?.path) fs.unlink(req.file.path, () => undefined);
      const message = error instanceof Error ? error.message : "Falha ao transcrever";
      res.status(400).json({ error: message });
    }
  });
});

storeRouter.post("/customizations", async (req, res) => {
  const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!rawItems.length) {
    res.status(400).json({ error: "Nenhum briefing enviado" });
    return;
  }

  const saved = [];
  for (const item of rawItems) {
    const productId = String(item?.productId || "");
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product?.personalized || !product.active) {
      res.status(400).json({ error: "Produto personalizado inválido" });
      return;
    }
    if (product.stock <= 0) {
      res.status(400).json({ error: `${product.name} está esgotado` });
      return;
    }
    const job = clip(item.job);
    const likes = clip(item.likes);
    const colors = clip(item.colors);
    const transcript = clip(item.transcript, 8000);
    const audioUrl = clip(item.audioUrl, 400);
    const size = product.hasSizes ? parseProductSize(item.size) : "";
    if (product.hasSizes && !size) {
      res.status(400).json({ error: `Escolha o tamanho de ${product.name}` });
      return;
    }
    if ((!job || !likes || !colors) && !transcript) {
      res.status(400).json({ error: "Escreva o briefing ou envie um áudio transcrito" });
      return;
    }
    saved.push(
      await prisma.customBrief.create({
        data: {
          productId: product.id,
          productName: product.name,
          job,
          likes,
          colors,
          transcript,
          audioUrl,
          size,
          qty: Math.max(1, Number(item.qty || 1)),
        },
      }),
    );
  }

  res.status(201).json({ ok: true, count: saved.length });
});

storeRouter.post("/size-orders", async (req, res) => {
  const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!rawItems.length) {
    res.status(400).json({ error: "Nenhum tamanho enviado" });
    return;
  }

  const saved = [];
  for (const item of rawItems) {
    const productId = String(item?.productId || "");
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product?.hasSizes || !product.active) {
      res.status(400).json({ error: "Produto com tamanho inválido" });
      return;
    }
    if (product.stock <= 0) {
      res.status(400).json({ error: `${product.name} está esgotado` });
      return;
    }
    const size = parseProductSize(item.size);
    if (!size) {
      res.status(400).json({ error: `Escolha o tamanho de ${product.name}` });
      return;
    }
    saved.push(
      await prisma.sizeOrder.create({
        data: {
          productId: product.id,
          productName: product.name,
          size,
          qty: Math.max(1, Number(item.qty || 1)),
        },
      }),
    );
  }

  res.status(201).json({ ok: true, count: saved.length });
});
