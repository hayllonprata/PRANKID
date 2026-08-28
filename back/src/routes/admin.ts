import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  getProductWithImages,
  parseImageUrls,
  productImageInclude,
  replaceProductImages,
} from "../lib/product-images.js";
import { serializeAdminSettings, serializeProduct } from "../lib/serialize.js";
import { parseStock } from "../lib/stock.js";
import { requireAuth } from "../middleware/auth.js";

function nextCopyName(name: string, taken: string[]) {
  const base = name.replace(/\s*\(cópia(?: \d+)?\)\s*$/i, "").trim() || name;
  const used = new Set(taken);
  let candidate = `${base} (cópia)`;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${base} (cópia ${n})`;
    n += 1;
  }
  return candidate;
}

function nextCopySku(sku: string, taken: string[]) {
  const base = sku.replace(/-copia(?:-\d+)?$/i, "").trim() || sku;
  const used = new Set(taken.filter(Boolean));
  let candidate = `${base}-copia`;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${base}-copia-${n}`;
    n += 1;
  }
  return candidate;
}

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
  const legend = await prisma.legend.findUnique({ where: { id: "default" } });
  res.json(legend);
});

adminRouter.put("/legend", async (req, res) => {
  const legend = await prisma.legend.upsert({
    where: { id: "default" },
    update: {
      title: String(req.body?.title ?? ""),
      description: String(req.body?.description ?? ""),
    },
    create: {
      id: "default",
      title: String(req.body?.title ?? ""),
      description: String(req.body?.description ?? ""),
    },
  });
  res.json(legend);
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
  res.json(
    settings
      ? serializeAdminSettings(settings)
      : {
          whatsapp: "",
          yampiBaseUrl: "",
          yampiPromocode: "",
          instagram: "",
          footer: "",
          openaiApiKey: "",
          hasOpenaiKey: false,
        },
  );
});

adminRouter.put("/settings", async (req, res) => {
  const existing = await prisma.settings.findUnique({ where: { id: "default" } });
  const incomingKey = String(req.body?.openaiApiKey ?? "").trim();
  const openaiApiKey = incomingKey || existing?.openaiApiKey || "";
  const yampiPromocode = String(req.body?.yampiPromocode ?? "").trim().replace(/\s+/g, "");
  const settings = await prisma.settings.upsert({
    where: { id: "default" },
    update: {
      whatsapp: String(req.body?.whatsapp ?? "").replace(/\D/g, ""),
      yampiBaseUrl: String(req.body?.yampiBaseUrl ?? "").replace(/\/$/, ""),
      yampiPromocode,
      instagram: String(req.body?.instagram ?? ""),
      footer: String(req.body?.footer ?? ""),
      openaiApiKey,
    },
    create: {
      id: "default",
      whatsapp: String(req.body?.whatsapp ?? "").replace(/\D/g, ""),
      yampiBaseUrl: String(req.body?.yampiBaseUrl ?? "").replace(/\/$/, ""),
      yampiPromocode,
      instagram: String(req.body?.instagram ?? ""),
      footer: String(req.body?.footer ?? ""),
      openaiApiKey,
    },
  });
  res.json(serializeAdminSettings(settings));
});

adminRouter.get("/products", async (_req, res) => {
  const products = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: productImageInclude,
  });
  res.json(products.map(serializeProduct));
});

adminRouter.put("/products/reorder", async (req, res) => {
  const productIds: string[] = Array.isArray(req.body?.productIds)
    ? req.body.productIds.map((item: unknown) => String(item ?? "").trim()).filter((id: string) => id.length > 0)
    : [];
  const existing = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const existingIds = existing.map((item) => item.id);
  const uniqueIds = [...new Set(productIds)];
  if (
    uniqueIds.length !== existingIds.length ||
    uniqueIds.length !== productIds.length ||
    uniqueIds.some((id) => !existingIds.includes(id))
  ) {
    res.status(400).json({ error: "Ordem de produtos inválida" });
    return;
  }
  await prisma.$transaction(
    productIds.map((id, sortOrder) => prisma.product.update({ where: { id }, data: { sortOrder } })),
  );
  const products = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: productImageInclude,
  });
  res.json(products.map(serializeProduct));
});

adminRouter.post("/products", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) {
    res.status(400).json({ error: "Nome é obrigatório" });
    return;
  }
  const urls = parseImageUrls(req.body) ?? [String(req.body?.imageUrl ?? "").trim()].filter(Boolean);
  const last = await prisma.product.aggregate({ _max: { sortOrder: true } });
  const nextOrder = (last._max.sortOrder ?? -1) + 1;
  const productSortOrder =
    req.body?.sortOrder === undefined || req.body?.sortOrder === null || req.body?.sortOrder === ""
      ? nextOrder
      : Number(req.body.sortOrder);
  const product = await prisma.product.create({
    data: {
      name,
      description: String(req.body?.description ?? ""),
      price: Number(req.body?.price || 0),
      imageUrl: urls[0] || "",
      yampiToken: String(req.body?.yampiToken ?? "").trim(),
      sku: String(req.body?.sku ?? "").trim(),
      active: req.body?.active !== false,
      sortOrder: productSortOrder,
      personalized: Boolean(req.body?.personalized),
      cartOffer: Boolean(req.body?.cartOffer),
      stock: parseStock(req.body?.stock, 0),
      images: {
        create: urls.map((imageUrl, sortOrder) => ({ imageUrl, sortOrder })),
      },
    },
    include: productImageInclude,
  });
  res.status(201).json(serializeProduct(product));
});

adminRouter.post("/products/:id/duplicate", async (req, res) => {
  const id = String(req.params.id);
  const existing = await getProductWithImages(id);
  if (!existing) {
    res.status(404).json({ error: "Produto não encontrado" });
    return;
  }
  const siblings = await prisma.product.findMany({ select: { name: true, sku: true } });
  const last = await prisma.product.aggregate({ _max: { sortOrder: true } });
  const imageUrls = [
    ...existing.images.map((img) => img.imageUrl),
    existing.imageUrl,
  ]
    .map((url) => String(url || "").trim())
    .filter(Boolean);
  const uniqueUrls = [...new Set(imageUrls)];
  const product = await prisma.product.create({
    data: {
      name: nextCopyName(
        existing.name,
        siblings.map((item) => item.name),
      ),
      description: existing.description,
      price: existing.price,
      imageUrl: uniqueUrls[0] || "",
      yampiToken: existing.yampiToken,
      sku: existing.sku
        ? nextCopySku(
            existing.sku,
            siblings.map((item) => item.sku),
          )
        : "",
      active: existing.active,
      sortOrder: (last._max.sortOrder ?? -1) + 1,
      personalized: existing.personalized,
      cartOffer: existing.cartOffer,
      stock: existing.stock,
      images: {
        create: uniqueUrls.map((imageUrl, sortOrder) => ({ imageUrl, sortOrder })),
      },
    },
    include: productImageInclude,
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
  const urls = parseImageUrls(req.body);
  await prisma.product.update({
    where: { id },
    data: {
      name: String(req.body?.name ?? existing.name),
      description: String(req.body?.description ?? existing.description),
      price: req.body?.price === undefined ? existing.price : Number(req.body.price),
      imageUrl: urls ? urls[0] || "" : String(req.body?.imageUrl ?? existing.imageUrl),
      yampiToken: String(req.body?.yampiToken ?? existing.yampiToken).trim(),
      sku: String(req.body?.sku ?? existing.sku).trim(),
      active: req.body?.active === undefined ? existing.active : Boolean(req.body.active),
      sortOrder: req.body?.sortOrder === undefined ? existing.sortOrder : Number(req.body.sortOrder),
      personalized: req.body?.personalized === undefined ? existing.personalized : Boolean(req.body.personalized),
      cartOffer: req.body?.cartOffer === undefined ? existing.cartOffer : Boolean(req.body.cartOffer),
      stock: req.body?.stock === undefined ? existing.stock : parseStock(req.body.stock, existing.stock),
    },
  });
  if (urls) await replaceProductImages(id, urls);
  const product = await getProductWithImages(id);
  res.json(serializeProduct(product!));
});

adminRouter.put("/products/:id/images", async (req, res) => {
  const id = String(req.params.id);
  const existing = await getProductWithImages(id);
  if (!existing) {
    res.status(404).json({ error: "Produto não encontrado" });
    return;
  }
  const imageIds: string[] = Array.isArray(req.body?.imageIds)
    ? req.body.imageIds.map((item: unknown) => String(item ?? "").trim()).filter((id: string) => id.length > 0)
    : [];
  const existingIds = existing.images.map((img) => img.id);
  const uniqueIds = [...new Set(imageIds)];
  if (
    uniqueIds.length !== existingIds.length ||
    uniqueIds.length !== imageIds.length ||
    uniqueIds.some((imageId) => !existingIds.includes(imageId))
  ) {
    res.status(400).json({ error: "Ordem de imagens inválida" });
    return;
  }
  await prisma.$transaction(
    imageIds.map((imageId, sortOrder) =>
      prisma.productImage.update({ where: { id: imageId }, data: { sortOrder } }),
    ),
  );
  const ordered = imageIds.map((imageId) => existing.images.find((img) => img.id === imageId)!);
  await prisma.product.update({
    where: { id },
    data: { imageUrl: ordered[0]?.imageUrl || "" },
  });
  const product = await getProductWithImages(id);
  res.json(serializeProduct(product!));
});

adminRouter.post("/products/:id/images", async (req, res) => {
  const id = String(req.params.id);
  const urls = [
    String(req.body?.imageUrl || "").trim(),
    ...(Array.isArray(req.body?.imageUrls) ? req.body.imageUrls : []),
  ]
    .map((url) => String(url || "").trim())
    .filter(Boolean);
  const uniqueUrls = [...new Set(urls)];
  if (!uniqueUrls.length) {
    res.status(400).json({ error: "Imagem é obrigatória" });
    return;
  }
  const existing = await getProductWithImages(id);
  if (!existing) {
    res.status(404).json({ error: "Produto não encontrado" });
    return;
  }
  let sortOrder = existing.images.reduce((max, img) => Math.max(max, img.sortOrder), -1) + 1;
  await prisma.productImage.createMany({
    data: uniqueUrls.map((imageUrl) => ({ productId: id, imageUrl, sortOrder: sortOrder++ })),
  });
  if (!existing.imageUrl) {
    await prisma.product.update({ where: { id }, data: { imageUrl: uniqueUrls[0] } });
  }
  const product = await getProductWithImages(id);
  res.status(201).json(serializeProduct(product!));
});

adminRouter.delete("/products/:id/images/:imageId", async (req, res) => {
  const id = String(req.params.id);
  const imageId = String(req.params.imageId);
  const existing = await getProductWithImages(id);
  if (!existing) {
    res.status(404).json({ error: "Produto não encontrado" });
    return;
  }
  const photo = existing.images.find((img) => img.id === imageId);
  if (!photo) {
    if (imageId.startsWith("legacy-") && existing.imageUrl) {
      await prisma.product.update({ where: { id }, data: { imageUrl: existing.images[0]?.imageUrl || "" } });
      const product = await getProductWithImages(id);
      res.json(serializeProduct(product!));
      return;
    }
    res.status(404).json({ error: "Imagem não encontrada" });
    return;
  }
  await prisma.productImage.delete({ where: { id: imageId } });
  const remaining = existing.images.filter((img) => img.id !== imageId);
  await prisma.product.update({
    where: { id },
    data: { imageUrl: remaining[0]?.imageUrl || "" },
  });
  const product = await getProductWithImages(id);
  res.json(serializeProduct(product!));
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

adminRouter.get("/customizations", async (_req, res) => {
  const briefs = await prisma.customBrief.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(briefs);
});

adminRouter.get("/accesses", async (_req, res) => {
  const [accesses, aggregates] = await Promise.all([
    prisma.siteAccess.findMany({
      orderBy: [{ lastSeenAt: "desc" }],
    }),
    prisma.siteAccess.aggregate({
      _count: { _all: true },
      _sum: { visitCount: true },
    }),
  ]);
  const blockedCount = accesses.filter((item) => item.blocked).length;
  res.json({
    uniqueIps: aggregates._count._all,
    totalVisits: aggregates._sum.visitCount || 0,
    blockedCount,
    accesses,
  });
});

adminRouter.put("/accesses/:id", async (req, res) => {
  const id = String(req.params.id);
  const existing = await prisma.siteAccess.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Acesso não encontrado" });
    return;
  }
  const access = await prisma.siteAccess.update({
    where: { id },
    data: {
      blocked: req.body?.blocked === undefined ? existing.blocked : Boolean(req.body.blocked),
    },
  });
  res.json(access);
});

adminRouter.delete("/accesses/:id", async (req, res) => {
  const id = String(req.params.id);
  const existing = await prisma.siteAccess.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Acesso não encontrado" });
    return;
  }
  await prisma.siteAccess.delete({ where: { id } });
  res.json({ ok: true });
});

