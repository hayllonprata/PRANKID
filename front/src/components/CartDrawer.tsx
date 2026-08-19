"use client";

import { useState } from "react";
import { buildYampiCheckout, formatBRL, mediaUrl } from "@/lib/api";
import { useCart } from "./CartProvider";

export function CartDrawer({ yampiBaseUrl }: { yampiBaseUrl: string }) {
  const { items, total, open, setOpen, setQty, remove } = useCart();
  const [error, setError] = useState("");

  if (!open) return null;

  function checkout() {
    setError("");
    if (items.length === 0) {
      setError("Seu carrinho está vazio.");
      return;
    }
    if (!yampiBaseUrl) {
      setError("O checkout ainda não foi configurado. Informe a URL da Yampi no painel.");
      return;
    }
    const missing = items.filter((item) => !item.yampiToken);
    if (missing.length) {
      setError(`Cadastre o token Yampi de: ${missing.map((item) => item.name).join(", ")}.`);
      return;
    }
    window.location.href = buildYampiCheckout(yampiBaseUrl, items);
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={() => setOpen(false)} />
      <aside className="drawer" aria-label="Carrinho">
        <div className="card-row">
          <h2>Carrinho</h2>
          <button className="btn ghost" type="button" onClick={() => setOpen(false)}>
            Fechar
          </button>
        </div>
        {items.length === 0 ? (
          <p className="empty">Nada por aqui ainda. Escolhe um PRANKID.</p>
        ) : (
          items.map((item) => (
            <div className="cart-item" key={item.id}>
              {mediaUrl(item.imageUrl) ? (
                <img src={mediaUrl(item.imageUrl)} alt="" />
              ) : (
                <div className="cart-thumb" />
              )}
              <div>
                <strong>{item.name}</strong>
                <div>{formatBRL(item.price)}</div>
                <div className="qty">
                  <button type="button" onClick={() => setQty(item.id, item.qty - 1)}>
                    −
                  </button>
                  <span>{item.qty}</span>
                  <button type="button" onClick={() => setQty(item.id, item.qty + 1)}>
                    +
                  </button>
                </div>
              </div>
              <button className="btn ghost" type="button" onClick={() => remove(item.id)}>
                ✕
              </button>
            </div>
          ))
        )}
        <div className="cart-total">
          <div className="card-row">
            <span>Total da vitrine</span>
            <strong>{formatBRL(total)}</strong>
          </div>
          <p className="cart-note">O valor final é confirmado no checkout da Yampi.</p>
          {error ? <p className="cart-error">{error}</p> : null}
          <button className="btn full" type="button" onClick={checkout} disabled={items.length === 0}>
            Finalizar compra
          </button>
        </div>
      </aside>
    </>
  );
}
