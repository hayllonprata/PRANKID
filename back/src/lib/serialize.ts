import type { Decimal } from "@prisma/client/runtime/library";
import type { Product } from "@prisma/client";

export function serializeProduct(product: Product) {
  return {
    ...product,
    price: decimalToNumber(product.price),
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
