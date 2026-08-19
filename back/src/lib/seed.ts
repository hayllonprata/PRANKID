import { prisma } from "./prisma.js";
import { hashPassword } from "./auth.js";
import { prankidLegendBeats } from "./legend.js";
import { siteCopy } from "./site-copy.js";

export async function seedIfNeeded() {
  const adminCount = await prisma.admin.count();
  if (adminCount === 0) {
    const email = (process.env.ADMIN_EMAIL || "admin@prankid.com").trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || "altere-esta-senha";
    await prisma.admin.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
      },
    });
    console.log(`Admin inicial criado: ${email}`);
  }

  await prisma.settings.upsert({
    where: { id: "default" },
    update: {
      footer: siteCopy.footer,
    },
    create: {
      id: "default",
      whatsapp: "",
      yampiBaseUrl: "",
      instagram: siteCopy.instagram,
      footer: siteCopy.footer,
    },
  });

  await prisma.settings.updateMany({
    where: { id: "default", instagram: "" },
    data: { instagram: siteCopy.instagram },
  });

  await prisma.hero.upsert({
    where: { id: "default" },
    update: {
      title: siteCopy.heroTitle,
      subtitle: siteCopy.heroSubtitle,
      ctaText: siteCopy.heroCta,
    },
    create: {
      id: "default",
      title: siteCopy.heroTitle,
      subtitle: siteCopy.heroSubtitle,
      ctaText: siteCopy.heroCta,
      imageUrl: "",
      enabled: true,
    },
  });

  await prisma.story.upsert({
    where: { id: "default" },
    update: {
      title: siteCopy.foundersTitle,
      description: siteCopy.foundersDescription,
    },
    create: {
      id: "default",
      title: siteCopy.foundersTitle,
      description: siteCopy.foundersDescription,
      imageUrl: "",
    },
  });

  for (const beat of prankidLegendBeats) {
    await prisma.legendBeat.upsert({
      where: { id: beat.id },
      create: {
        id: beat.id,
        sortOrder: beat.sortOrder,
        title: beat.title,
        caption: beat.caption,
        imageUrl: "",
      },
      update: {
        sortOrder: beat.sortOrder,
        title: beat.title,
        caption: beat.caption,
      },
    });
  }

  const productCount = await prisma.product.count();
  if (productCount === 0) {
    await prisma.product.createMany({
      data: siteCopy.products.map((product, index) => ({
        name: product.name,
        description: product.description,
        price: [189.9, 219.9, 169.9][index] ?? 189.9,
        yampiToken: "",
        sku: product.sku,
        sortOrder: index + 1,
        active: true,
      })),
    });
  } else {
    for (const product of siteCopy.products) {
      const existing = await prisma.product.findFirst({ where: { sku: product.sku } });
      if (!existing) continue;
      await prisma.product.update({
        where: { id: existing.id },
        data: { name: product.name, description: product.description },
      });
    }
  }
}
