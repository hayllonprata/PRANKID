import { prisma } from "./prisma.js";
import { hashPassword } from "./auth.js";

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
    update: {},
    create: {
      id: "default",
      whatsapp: "",
      yampiBaseUrl: "",
      instagram: "",
      footer: "PRANKID — toy art feita pra bagunçar o sério.",
    },
  });

  await prisma.hero.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      title: "PRANKID",
      subtitle: "Toy art com personalidade. Peças limitadas, humor torto e coleção pra quem não leva a vida tão sério.",
      ctaText: "Ver coleção",
      imageUrl: "",
      enabled: true,
    },
  });

  await prisma.story.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      title: "A bagunça começou assim",
      description:
        "A PRANKID nasceu da vontade de transformar personagens de brincadeira em objetos de coleção. Cada peça mistura humor, cor e um pouco de caos — toy art pra estante, pra mesa e pra quem gosta de arte que pisca o olho.",
      imageUrl: "",
    },
  });

  const productCount = await prisma.product.count();
  if (productCount === 0) {
    await prisma.product.createMany({
      data: [
        {
          name: "PRANKID 001 — O Primeiro",
          description: "O drop que inaugurou a bagunça. Edição de coleção, acabamento fosco e cara de quem sabe de algo.",
          price: 189.9,
          yampiToken: "",
          sku: "PK-001",
          sortOrder: 1,
          active: true,
        },
        {
          name: "PRANKID 002 — Bagunça",
          description: "Cores gritantes, pose torta e energia de sábado à noite. Peça pra quem coleciona personalidade.",
          price: 219.9,
          yampiToken: "",
          sku: "PK-002",
          sortOrder: 2,
          active: true,
        },
        {
          name: "PRANKID 003 — Sorriso Torto",
          description: "O sorriso que não explica nada e explica tudo. Toy art compacta, pronta pra ocupar a estante.",
          price: 169.9,
          yampiToken: "",
          sku: "PK-003",
          sortOrder: 3,
          active: true,
        },
      ],
    });
  }
}
