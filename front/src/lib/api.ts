export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  yampiToken: string;
  sku: string;
  active: boolean;
  sortOrder: number;
};

export type Hero = {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  imageUrl: string;
  enabled: boolean;
};

export type Story = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
};

export type Settings = {
  whatsapp: string;
  yampiBaseUrl: string;
  instagram: string;
  footer: string;
};

export type StoreData = {
  hero: Hero | null;
  story: Story | null;
  settings: Settings;
  products: Product[];
};

const TOKEN_KEY = "prankid_admin_token";

export function getApiUrl() {
  // O browser chama o próprio front; o Next.js encaminha para a API em runtime.
  if (typeof window !== "undefined") return "";
  return (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(
    /\/$/,
    "",
  );
}

export function mediaUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  return `${getApiUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Falha na requisição");
  }
  return data as T;
}

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function whatsappLink(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}`;
}

export function instagramLink(raw: string) {
  if (!raw) return "";
  if (raw.startsWith("http")) return raw;
  const handle = raw.replace(/^@/, "");
  return `https://instagram.com/${handle}`;
}

export function buildYampiCheckout(baseUrl: string, items: { yampiToken: string; qty: number }[]) {
  const base = baseUrl.replace(/\/$/, "");
  const path = items
    .filter((item) => item.yampiToken)
    .map((item) => `${item.yampiToken}:${item.qty}`)
    .join(",");
  return `${base}/r/${path}`;
}
