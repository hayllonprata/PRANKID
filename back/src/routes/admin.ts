import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { serializeProduct } from "../lib/serialize.js";
import { requireAuth } from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.use(requireAuth);

adminRouter.get("/hero", async (_req, res) => {
  const hero = await prisma.hero.findUnique({ where: { id: "default" } });
  res.json(hero);
});

adminRouter.put("/hero", async (req, res) => {
  const hero = await prisma.hero.upsert({
    where: { id: "default" },
    update: {
      title: String(req.body?.title ?? ""),
      subtitle: String(req.body?.subtitle ?? ""),
      ctaText: String(req.body?.ctaText ?? ""),
      imageUrl: String(req.body?.imageUrl ?? ""),
      enabled: Boolean(req.body?.enabled),
    },
    create: {
      id: "default",
      title: String(req.body?.title ?? "PRANKID"),
      subtitle: String(req.body?.subtitle ?? ""),
      ctaText: String(req.body?.ctaText ?? "Ver coleção"),
      imageUrl: String(req.body?.imageUrl ?? ""),
      enabled: req.body?.enabled !== false,
    },
  });
  res.json(hero);
});

adminRouter.get("/story", async (_req, res) => {
  const story = await prisma.story.findUnique({ where: { id: "default" } });
  res.json(story);
});

adminRouter.put("/story", async (req, res) => {
  const story = await prisma.story.upsert({
    where: { id: "default" },
    update: {
      title: String(req.body?.title ?? ""),
      description: String(req.body?.description ?? ""),
      imageUrl: String(req.body?.imageUrl ?? ""),
    },
    create: {
      id: "default",
      title: String(req.body?.title ?? ""),
      description: String(req.body?.description ?? ""),
      imageUrl: String(req.body?.imageUrl ?? ""),
    },
  });
  res.json(story);
});

adminRouter.get("/legend", async (_req, res) => {
  const legend = await prisma.legendBeat.findMany({ orderBy: { sortOrder: "asc" } });
  res.json(legend);
});

adminRouter.put("/legend/:id", async (req, res) => {
  const id = String(req.params.id);
  const existing = await prisma.legendBeat.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Cena não encontrada" });
    return;
  }
  const beat = await prisma.legendBeat.update({
    where: { id },
    data: {
      title: String(req.body?.title ?? existing.title),
      caption: String(req.body?.caption ?? existing.caption),
      imageUrl: String(req.body?.imageUrl ?? existing.imageUrl),
    },
  });
  res.json(beat);
});

adminRouter.get("/crew", async (_req, res) => {
  const shots = await prisma.crewShot.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  res.json(shots);
});

adminRouter.post("/crew", async (req, res) => {
  const imageUrl = String(req.body?.imageUrl || "").trim();
  if (!imageUrl) {
    res.status(400).json({ error: "Imagem é obrigatória" });
    return;
  }
  const shot = await prisma.crewShot.create({
    data: {
      imageUrl,
      caption: String(req.body?.caption ?? ""),
      sortOrder: Number(req.body?.sortOrder || 0),
      active: req.body?.active !== false,
    },
  });
  res.status(201).json(shot);
});

adminRouter.put("/crew/:id", async (req, res) => {
  const id = String(req.params.id);
  const existing = await prisma.crewShot.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Foto não encontrada" });
    return;
  }
  const shot = await prisma.crewShot.update({
    where: { id },
    data: {
      imageUrl: String(req.body?.imageUrl ?? existing.imageUrl),
      caption: String(req.body?.caption ?? existing.caption),
      sortOrder: req.body?.sortOrder === undefined ? existing.sortOrder : Number(req.body.sortOrder),
      active: req.body?.active === undefined ? existing.active : Boolean(req.body.active),
    },
  });
  res.json(shot);
});

adminRouter.delete("/crew/:id", async (req, res) => {
  const id = String(req.params.id);
  const existing = await prisma.crewShot.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Foto não encontrada" });
    return;
  }
  await prisma.crewShot.delete({ where: { id } });
  res.json({ ok: true });
});

adminRouter.get("/settings", async (_req, res) => {
  const settings = await prisma.settings.findUnique({ where: { id: "default" } });
  res.json(settings);
});

adminRouter.put("/settings", async (req, res) => {
  const settings = await prisma.settings.upsert({
    where: { id: "default" },
    update: {
      whatsapp: String(req.body?.whatsapp ?? "").replace(/\D/g, ""),
      yampiBaseUrl: String(req.body?.yampiBaseUrl ?? "").replace(/\/$/, ""),
      instagram: String(req.body?.instagram ?? ""),
      footer: String(req.body?.footer ?? ""),
    },
    create: {
      id: "default",
      whatsapp: String(req.body?.whatsapp ?? "").replace(/\D/g, ""),
      yampiBaseUrl: String(req.body?.yampiBaseUrl ?? "").replace(/\/$/, ""),
      instagram: String(req.body?.instagram ?? ""),
      footer: String(req.body?.footer ?? ""),
    },
  });
  res.json(settings);
});

adminRouter.get("/products", async (_req, res) => {
  const products = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  res.json(products.map(serializeProduct));
});

adminRouter.post("/products", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) {
    res.status(400).json({ error: "Nome é obrigatório" });
    return;
  }
  const product = await prisma.product.create({
    data: {
      name,
      description: String(req.body?.description ?? ""),
      price: Number(req.body?.price || 0),
      imageUrl: String(req.body?.imageUrl ?? ""),
      yampiToken: String(req.body?.yampiToken ?? "").trim(),
      sku: String(req.body?.sku ?? "").trim(),
      active: req.body?.active !== false,
      sortOrder: Number(req.body?.sortOrder || 0),
    },
  });
  res.status(201).json(serializeProduct(product));
});

adminRouter.put("/products/:id", async (req, res) => {
  const id = String(req.params.id);
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Produto não encontrado" });
    return;
  }
  const product = await prisma.product.update({
    where: { id },
    data: {
      name: String(req.body?.name ?? existing.name),
      description: String(req.body?.description ?? existing.description),
      price: req.body?.price === undefined ? existing.price : Number(req.body.price),
      imageUrl: String(req.body?.imageUrl ?? existing.imageUrl),
      yampiToken: String(req.body?.yampiToken ?? existing.yampiToken).trim(),
      sku: String(req.body?.sku ?? existing.sku).trim(),
      active: req.body?.active === undefined ? existing.active : Boolean(req.body.active),
      sortOrder: req.body?.sortOrder === undefined ? existing.sortOrder : Number(req.body.sortOrder),
    },
  });
  res.json(serializeProduct(product));
});

adminRouter.delete("/products/:id", async (req, res) => {
  const id = String(req.params.id);
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Produto não encontrado" });
    return;
  }
  await prisma.product.delete({ where: { id } });
  res.json({ ok: true });
});
