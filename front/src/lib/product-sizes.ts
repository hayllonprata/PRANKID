export const PRODUCT_SIZES = [
  { id: "P", width: 57, length: 71, sleeve: 20 },
  { id: "M", width: 61, length: 74, sleeve: 21 },
  { id: "G", width: 64, length: 76, sleeve: 22 },
  { id: "GG", width: 67, length: 80, sleeve: 24 },
  { id: "XG", width: 70, length: 83, sleeve: 26 },
  { id: "G2", width: 72, length: 85, sleeve: 28 },
  { id: "G3", width: 75, length: 87, sleeve: 30 },
] as const;

export type ProductSizeId = (typeof PRODUCT_SIZES)[number]["id"];

const SIZE_IDS = new Set<string>(PRODUCT_SIZES.map((item) => item.id));

export function isProductSize(value: unknown): value is ProductSizeId {
  return SIZE_IDS.has(String(value ?? "").trim().toUpperCase());
}
