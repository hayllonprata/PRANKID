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
