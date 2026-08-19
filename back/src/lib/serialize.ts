import type { Decimal } from "@prisma/client/runtime/library";
import type { Product, ProductImage } from "@prisma/client";

export function serializeProduct(product: Product & { images?: ProductImage[] }) {
  const { images: relation = [], price, ...rest } = product;
  const images = relation
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime())
    .map((img) => ({ id: img.id, imageUrl: img.imageUrl, sortOrder: img.sortOrder }))
    .filter((img) => img.imageUrl);
  if (rest.imageUrl && !images.some((img) => img.imageUrl === rest.imageUrl)) {
    images.unshift({ id: `legacy-${rest.id}`, imageUrl: rest.imageUrl, sortOrder: -1 });
  }
  return {
    ...rest,
    price: decimalToNumber(price),
    imageUrl: images[0]?.imageUrl || rest.imageUrl || "",
    images,
  };
}

export function decimalToNumber(value: Decimal | number | string) {
  return Number(value);
}

export function publicSettings(settings: {
  whatsapp: string;
  yampiBaseUrl: string;
  instagram: string;
  footer: string;
}) {
  return {
    whatsapp: settings.whatsapp,
    yampiBaseUrl: settings.yampiBaseUrl,
    instagram: settings.instagram,
    footer: settings.footer,
  };
}

export function serializeAdminSettings(settings: {
  whatsapp: string;
  yampiBaseUrl: string;
  instagram: string;
  footer: string;
  openaiApiKey: string;
}) {
  return {
    whatsapp: settings.whatsapp,
    yampiBaseUrl: settings.yampiBaseUrl,
    instagram: settings.instagram,
    footer: settings.footer,
    openaiApiKey: "",
    hasOpenaiKey: Boolean(settings.openaiApiKey),
  };
}
