"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PersonalBrief, Product } from "@/lib/api";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  yampiToken: string;
  qty: number;
  personalized: boolean;
  brief?: PersonalBrief;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (product: Product, brief?: PersonalBrief) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "prankid_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
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
    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    return {
      items,
      count,
      total,
      open,
      setOpen,
      add: (product, brief) => {
        setItems((current) => {
          const found = current.find((item) => item.id === product.id);
          if (found && !product.personalized) {
            return current.map((item) =>
              item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
            );
          }
          if (found && product.personalized) {
            return current.map((item) =>
              item.id === product.id ? { ...item, qty: 1, brief, personalized: true } : item,
            );
          }
          return [
            ...current,
            {
              id: product.id,
              name: product.name,
              price: product.price,
              imageUrl: product.imageUrl,
              yampiToken: product.yampiToken,
              qty: 1,
              personalized: Boolean(product.personalized),
              brief,
            },
          ];
        });
        setOpen(true);
      },
      setQty: (id, qty) => {
        setItems((current) =>
          current.flatMap((item) => {
            if (item.id !== id) return [item];
            if (item.personalized) return [{ ...item, qty: Math.max(1, qty) }];
            if (qty <= 0) return [];
            return [{ ...item, qty }];
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
