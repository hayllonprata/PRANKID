function stripWrappingQuotes(value: string) {
  let next = value.replace(/^\uFEFF/, "").trim();
  for (let i = 0; i < 3; i += 1) {
    const quoted =
      (next.startsWith('"') && next.endsWith('"')) || (next.startsWith("'") && next.endsWith("'"));
    if (!quoted) break;
    next = next.slice(1, -1).trim();
  }
  return next;
}

export function describeDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url.replace(/^postgres:\/\//i, "postgresql://"));
    return `postgresql://${parsed.username}:****@${parsed.hostname}:${parsed.port || "5432"}${parsed.pathname}${parsed.search}`;
  } catch {
    return "(URL inválida)";
  }
}

export function normalizeDatabaseUrl(raw: string) {
  const value = stripWrappingQuotes(raw).replace(/^postgres:\/\//i, "postgresql://");

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(
      "DATABASE_URL inválida. No EasyPanel cole SEM aspas, no formato postgresql://USER:SENHA@HOST:PORTA/BANCO?sslmode=disable",
    );
  }

  const port = parsed.port || "5432";
  if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
    throw new Error(
      `Porta inválida na DATABASE_URL ("${port}"). Tire as aspas e use HOST:PORTA/BANCO?sslmode=disable — a barra e o nome do banco são obrigatórios antes do ?.`,
    );
  }

  const pathname = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "";
  if (!pathname) {
    throw new Error(
      "Falta o nome do banco na DATABASE_URL. Use ...:PORTA/NOME_DO_BANCO?sslmode=disable",
    );
  }

  const user = encodeURIComponent(decodeURIComponent(parsed.username));
  const pass = encodeURIComponent(decodeURIComponent(parsed.password));
  const auth = user || pass ? `${user}:${pass}@` : "";
  const search = parsed.search || "?sslmode=disable";
  return `postgresql://${auth}${parsed.hostname}:${port}${pathname}${search}`;
}

export function applyNormalizedDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL não configurada");
  }
  const normalized = normalizeDatabaseUrl(raw);
  process.env.DATABASE_URL = normalized;
  return normalized;
}
