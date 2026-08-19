import type { Product, ProductImage } from "@prisma/client";
import { prisma } from "./prisma.js";

export const productImageInclude = {
  images: { orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }] },
};

export type ProductWithImages = Product & { images: ProductImage[] };

export function parseImageUrls(body: unknown, fallbackCover = ""): string[] | undefined {
  if (!body || typeof body !== "object") return undefined;
  const data = body as { imageUrl?: unknown; images?: unknown };
  if (!Array.isArray(data.images)) return undefined;
  const list: string[] = [];
  for (const item of data.images) {
    if (typeof item === "string") list.push(item);
    else if (item && typeof item === "object" && "imageUrl" in item) {
      list.push(String((item as { imageUrl?: unknown }).imageUrl ?? ""));
    }
  }
  const cover = String(data.imageUrl ?? fallbackCover ?? "").trim();
  if (cover) list.unshift(cover);
  return [...new Set(list.map((url) => url.trim()).filter(Boolean))];
}

export async function replaceProductImages(productId: string, urls: string[]) {
  await prisma.productImage.deleteMany({ where: { productId } });
  if (urls.length) {
    await prisma.productImage.createMany({
      data: urls.map((imageUrl, sortOrder) => ({ productId, imageUrl, sortOrder })),
    });
  }
  await prisma.product.update({
    where: { id: productId },
    data: { imageUrl: urls[0] || "" },
  });
}

export async function getProductWithImages(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: productImageInclude,
  });
}
