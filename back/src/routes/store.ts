import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { publicSettings, serializeProduct } from "../lib/serialize.js";

export const storeRouter = Router();

storeRouter.get("/", async (_req, res) => {
  const [hero, story, legend, crew, settings, products] = await Promise.all([
    prisma.hero.findUnique({ where: { id: "default" } }),
    prisma.story.findUnique({ where: { id: "default" } }),
    prisma.legendBeat.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.crewShot.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.settings.findUnique({ where: { id: "default" } }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  res.json({
    hero,
    story,
    legend,
    crew,
    settings: settings ? publicSettings(settings) : { whatsapp: "", yampiBaseUrl: "", instagram: "", footer: "" },
    products: products.map(serializeProduct),
  });
});

function clip(value: unknown, max = 1200) {
  return String(value ?? "").trim().slice(0, max);
}

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
    const job = clip(item.job);
    const likes = clip(item.likes);
    const colors = clip(item.colors);
    if (!job || !likes || !colors) {
      res.status(400).json({ error: "Preencha o que você faz, do que gosta e as cores" });
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
          qty: Math.max(1, Number(item.qty || 1)),
        },
      }),
    );
  }

  res.status(201).json({ ok: true, count: saved.length });
});
