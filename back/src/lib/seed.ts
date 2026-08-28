import { prisma } from "./prisma.js";
import { hashPassword, verifyPassword } from "./auth.js";
import { prankidLegendDescription, prankidLegendTitle } from "./legend.js";
import { siteCopy } from "./site-copy.js";

async function syncAdminFromEnv() {
  const email = (process.env.ADMIN_EMAIL || "admin@prankid.com").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "altere-esta-senha";

  const existingByEmail = await prisma.admin.findUnique({ where: { email } });
  if (existingByEmail) {
    const passwordMatches = await verifyPassword(password, existingByEmail.passwordHash);
    if (!passwordMatches) {
      await prisma.admin.update({
        where: { id: existingByEmail.id },
        data: { passwordHash: await hashPassword(password) },
      });
      console.log(`Senha do admin atualizada a partir de ADMIN_PASSWORD: ${email}`);
    }
    return;
  }

  const passwordHash = await hashPassword(password);
  const admins = await prisma.admin.findMany({ orderBy: { createdAt: "asc" }, take: 2 });
  if (admins.length === 0) {
    await prisma.admin.create({
      data: { email, passwordHash },
    });
    console.log(`Admin inicial criado: ${email}`);
    return;
  }

  if (admins.length === 1) {
    await prisma.admin.update({
      where: { id: admins[0].id },
      data: { email, passwordHash },
    });
    console.log(`Admin atualizado a partir de ADMIN_EMAIL / ADMIN_PASSWORD: ${email}`);
    return;
  }

  await prisma.admin.create({
    data: { email, passwordHash },
  });
  console.log(`Admin criado a partir de ADMIN_EMAIL / ADMIN_PASSWORD: ${email}`);
}

export async function seedIfNeeded() {
  await syncAdminFromEnv();

  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      whatsapp: "",
      yampiBaseUrl: "",
      instagram: siteCopy.instagram,
      footer: siteCopy.footer,
    },
  });

  await prisma.hero.upsert({
    where: { id: "default" },
    update: {},
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
    update: {},
    create: {
      id: "default",
      title: siteCopy.foundersTitle,
      description: siteCopy.foundersDescription,
      imageUrl: "",
    },
  });

  await prisma.legend.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      title: prankidLegendTitle,
      description: prankidLegendDescription,
    },
  });

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
        stock: 5,
      })),
    });
  }
}
