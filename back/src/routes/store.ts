import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { publicSettings, serializeProduct } from "../lib/serialize.js";

export const storeRouter = Router();

storeRouter.get("/", async (_req, res) => {
  const [hero, story, settings, products] = await Promise.all([
    prisma.hero.findUnique({ where: { id: "default" } }),
    prisma.story.findUnique({ where: { id: "default" } }),
    prisma.settings.findUnique({ where: { id: "default" } }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  res.json({
    hero,
    story,
    settings: settings ? publicSettings(settings) : { whatsapp: "", yampiBaseUrl: "", instagram: "", footer: "" },
    products: products.map(serializeProduct),
  });
});
