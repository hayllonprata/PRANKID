export function parseStock(value: unknown, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

export function parseEditionSize(value: unknown, fallback = 0) {
  return parseStock(value, fallback);
}

export function remainingStock(stock: number, editionSize = 0) {
  if (editionSize > 0) return Math.min(stock, editionSize);
  return stock;
}

export function isSoldOut(stock: number) {
  return stock <= 0;
}
