export function parseStock(value: unknown, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

export function isSoldOut(stock: number) {
  return stock <= 0;
}
