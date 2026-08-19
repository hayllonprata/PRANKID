"use client";

import { useState } from "react";
import { api, buildYampiCheckout, formatBRL, mediaUrl, offerPrice, type Product } from "@/lib/api";
import { siteCopy } from "@/lib/site-copy";
import { useCart } from "./CartProvider";
import { PersonalizeModal } from "./PersonalizeModal";

export function CartDrawer({ yampiBaseUrl, products }: { yampiBaseUrl: string; products: Product[] }) {
  const { items, total, open, setOpen, setQty, remove, add } = useCart();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Product | null>(null);

  const offers = products.filter((product) => {
    if (!product.cartOffer) return false;
    return !items.some((item) => item.fromOffer && item.productId === product.id);
  });

  function addOffer(product: Product) {
    if (product.personalized) {
      setPending(product);
      return;
    }
    add(product, undefined, true);
  }

  if (!open) return null;

  async function checkout() {
    setError("");
    if (items.length === 0) {
      setError("Seu carrinho está vazio.");
      return;
    }
    if (!yampiBaseUrl) {
      setError("O checkout ainda não foi configurado. Informe a URL da Yampi no painel.");
      return;
    }
    const withTokens = items.map((item) => {
      const live = products.find((product) => product.id === item.productId);
      return { ...item, yampiToken: (live?.yampiToken || item.yampiToken || "").trim() };
    });
    const missing = withTokens.filter((item) => !item.yampiToken);
    if (missing.length) {
      setError(`Cadastre o token Yampi de: ${missing.map((item) => item.name).join(", ")}.`);
      return;
    }
    const custom = items.filter((item) => item.personalized);
    const incomplete = custom.filter((item) => {
      const typed = item.brief?.job && item.brief?.likes && item.brief?.colors;
      return !typed && !item.brief?.transcript;
    });
    if (incomplete.length) {
      setError("Escreva o briefing ou grave um áudio nas peças personalizadas.");
      return;
    }
    setBusy(true);
    try {
      if (custom.length) {
        await api("/api/store/customizations", {
          method: "POST",
          body: JSON.stringify({
            items: custom.map((item) => ({
              productId: item.productId || item.id,
              job: item.brief?.job,
              likes: item.brief?.likes,
              colors: item.brief?.colors,
              transcript: item.brief?.transcript,
              audioUrl: item.brief?.audioUrl,
              qty: item.qty,
            })),
          }),
        });
      }
      window.location.href = buildYampiCheckout(yampiBaseUrl, withTokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o briefing.");
      setBusy(false);
    }
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
          <p className="empty">{siteCopy.cartEmpty}</p>
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
                {item.fromOffer ? <div className="muted">+1 com 15% off</div> : null}
                {item.personalized ? <div className="muted">Personalizado</div> : null}
                {item.brief?.transcript ? <p className="cart-brief">{item.brief.transcript}</p> : null}
                {item.brief && !item.brief.transcript ? (
                  <p className="cart-brief">
                    {item.brief.job} · {item.brief.likes} · {item.brief.colors}
                  </p>
                ) : null}
                <div>
                  {item.fromOffer ? (
                    <>
                      <s className="muted">{formatBRL(item.listPrice)}</s> {formatBRL(item.price)}
                    </>
                  ) : (
                    formatBRL(item.price)
                  )}
                </div>
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
        {items.length > 0 && offers.length > 0 ? (
          <div className="cart-offers">
            <h3>Leva +1 com 15% off</h3>
            <p className="muted">Escolhe mais um PRANKID com desconto na vitrine.</p>
            {offers.map((product) => (
              <div className="cart-item" key={product.id}>
                {mediaUrl(product.imageUrl) ? (
                  <img src={mediaUrl(product.imageUrl)} alt="" />
                ) : (
                  <div className="cart-thumb" />
                )}
                <div>
                  <strong>{product.name}</strong>
                  <div>
                    <s className="muted">{formatBRL(product.price)}</s> {formatBRL(offerPrice(product.price))}
                  </div>
                </div>
                <button className="btn magenta" type="button" onClick={() => addOffer(product)}>
                  +1
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <div className="cart-total">
          <div className="card-row">
            <span>Total da vitrine</span>
            <strong>{formatBRL(total)}</strong>
          </div>
          <p className="cart-note">O valor final é confirmado no checkout da Yampi.</p>
          {error ? <p className="cart-error">{error}</p> : null}
          <button className="btn full" type="button" onClick={checkout} disabled={items.length === 0 || busy}>
            {busy ? "Enviando..." : "Finalizar compra"}
          </button>
        </div>
      </aside>
      {pending ? (
        <PersonalizeModal
          product={pending}
          onCancel={() => setPending(null)}
          onConfirm={(brief) => {
            add(pending, brief, true);
            setPending(null);
          }}
        />
      ) : null}
    </>
  );
}
