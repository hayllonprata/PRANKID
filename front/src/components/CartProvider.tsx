"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cartQualifiesForDiscount, isSoldOut, offerPrice, productStock, type PersonalBrief, type Product } from "@/lib/api";

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  listPrice: number;
  imageUrl: string;
  yampiToken: string;
  qty: number;
  personalized: boolean;
  fromOffer: boolean;
  brief?: PersonalBrief;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  listTotal: number;
  bundleDiscount: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (product: Product, brief?: PersonalBrief, fromOffer?: boolean) => void;
  syncCatalog: (products: Product[]) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "prankid_cart";

function lineId(productId: string, fromOffer: boolean) {
  return fromOffer ? `${productId}__offer` : productId;
}

function catalogPrice(item: Pick<CartItem, "price" | "listPrice">) {
  return item.listPrice || item.price;
}

function cartChanged(a: CartItem[], b: CartItem[]) {
  if (a.length !== b.length) return true;
  return a.some(
    (item, index) =>
      item.id !== b[index]?.id ||
      item.qty !== b[index]?.qty ||
      item.yampiToken !== b[index]?.yampiToken ||
      item.name !== b[index]?.name ||
      catalogPrice(item) !== catalogPrice(b[index]),
  );
}

function clampCartToStock(items: CartItem[], products: Product[]) {
  const byId = new Map(products.map((product) => [product.id, product]));
  const used = new Map<string, number>();
  const next: CartItem[] = [];
  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) {
      next.push(item);
      continue;
    }
    if (isSoldOut(product)) continue;
    const stock = productStock(product);
    const already = used.get(item.productId) || 0;
    const allowed = stock - already;
    if (allowed <= 0) continue;
    const qty = Math.min(item.qty, allowed);
    used.set(item.productId, already + qty);
    next.push(qty === item.qty ? item : { ...item, qty });
  }
  return next;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const catalogRef = useRef<Product[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        setItems(
          parsed.map((item) => {
            const listPrice = catalogPrice(item);
            return {
              ...item,
              productId: item.productId || item.id.replace(/__offer$/, ""),
              listPrice,
              price: listPrice,
              fromOffer: Boolean(item.fromOffer),
            };
          }),
        );
      }
    } catch {
      setItems([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.qty, 0);
    const bundleDiscount = cartQualifiesForDiscount(items);
    const displayItems = items.map((item) => {
      const listPrice = catalogPrice(item);
      return {
        ...item,
        listPrice,
        price: bundleDiscount ? offerPrice(listPrice) : listPrice,
      };
    });
    const listTotal = displayItems.reduce((sum, item) => sum + item.listPrice * item.qty, 0);
    const total = displayItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    return {
      items: displayItems,
      count,
      total,
      listTotal,
      bundleDiscount,
      open,
      setOpen,
      add: (product, brief, fromOffer = false) => {
        if (isSoldOut(product)) return;
        const id = lineId(product.id, fromOffer);
        const price = product.price;
        const stock = productStock(product);
        setItems((current) => {
          const used = current
            .filter((item) => item.productId === product.id)
            .reduce((sum, item) => sum + item.qty, 0);
          const remaining = stock - used;
          const found = current.find((item) => item.id === id);
          if (found && !product.personalized) {
            if (remaining <= 0) return current;
            return current.map((item) =>
              item.id === id
                ? {
                    ...item,
                    qty: item.qty + 1,
                    yampiToken: product.yampiToken,
                    name: product.name,
                    price,
                    listPrice: price,
                  }
                : item,
            );
          }
          if (found && product.personalized) {
            return current.map((item) =>
              item.id === id
                ? {
                    ...item,
                    qty: 1,
                    brief,
                    personalized: true,
                    yampiToken: product.yampiToken,
                    price,
                    listPrice: price,
                  }
                : item,
            );
          }
          if (remaining <= 0) return current;
          return [
            ...current,
            {
              id,
              productId: product.id,
              name: product.name,
              price,
              listPrice: price,
              imageUrl: product.imageUrl,
              yampiToken: product.yampiToken,
              qty: 1,
              personalized: Boolean(product.personalized),
              fromOffer,
              brief,
            },
          ];
        });
        setOpen(true);
      },
      syncCatalog: (products) => {
        catalogRef.current = products;
        const byId = new Map(products.map((product) => [product.id, product]));
        setItems((current) => {
          const updated = current.map((item) => {
            const product = byId.get(item.productId);
            if (!product) return item;
            const token = (product.yampiToken || item.yampiToken || "").trim();
            if (token === item.yampiToken && product.name === item.name && product.price === catalogPrice(item)) {
              return item;
            }
            return {
              ...item,
              yampiToken: token,
              name: product.name,
              listPrice: product.price,
              price: product.price,
            };
          });
          const next = clampCartToStock(updated, products);
          return cartChanged(current, next) ? next : current;
        });
      },
      setQty: (id, qty) => {
        setItems((current) =>
          current.flatMap((item) => {
            if (item.id !== id) return [item];
            const product = catalogRef.current.find((entry) => entry.id === item.productId);
            const stock = product ? productStock(product) : Number.MAX_SAFE_INTEGER;
            const others = current
              .filter((entry) => entry.productId === item.productId && entry.id !== id)
              .reduce((sum, entry) => sum + entry.qty, 0);
            const max = Math.max(0, stock - others);
            if (item.personalized) return [{ ...item, qty: Math.min(max, Math.max(1, qty)) }];
            const nextQty = Math.min(max, qty);
            if (nextQty <= 0) return [];
            return [{ ...item, qty: nextQty }];
          }),
        );
      },
      remove: (id) => setItems((current) => current.filter((item) => item.id !== id)),
      clear: () => setItems([]),
    };
  }, [items, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa do CartProvider");
  return ctx;
}
