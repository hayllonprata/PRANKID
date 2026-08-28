"use client";

import { useState } from "react";
import { api, buildYampiCheckout, cartQtyForProduct, formatBRL, isSoldOut, mediaUrl, productStock, type Product } from "@/lib/api";
import { siteCopy } from "@/lib/site-copy";
import { useCart } from "./CartProvider";
import { PersonalizeModal } from "./PersonalizeModal";
import { SizeSelectModal } from "./SizeSelectModal";

export function CartDrawer({
  yampiBaseUrl,
  yampiPromocode,
  products,
}: {
  yampiBaseUrl: string;
  yampiPromocode?: string;
  products: Product[];
}) {
  const { items, total, listTotal, bundleDiscount, count, open, setOpen, setQty, remove, add } = useCart();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ product: Product; size?: string } | null>(null);
  const [sizing, setSizing] = useState<Product | null>(null);

  function atStockLimit(item: { id: string; productId: string; qty: number }) {
    const live = products.find((product) => product.id === item.productId);
    if (!live) return false;
    const max = productStock(live) - cartQtyForProduct(items, item.productId, item.id);
    return item.qty >= max;
  }

  const offers = products.filter((product) => {
    if (!product.cartOffer || isSoldOut(product)) return false;
    if (items.some((item) => item.fromOffer && item.productId === product.id)) return false;
    return cartQtyForProduct(items, product.id) < productStock(product);
  });

  function addOffer(product: Product) {
    if (isSoldOut(product)) return;
    if (product.personalized) {
      setPending({ product });
      return;
    }
    if (product.hasSizes) {
      setSizing(product);
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
    const soldOut = withTokens.filter((item) => {
      const live = products.find((product) => product.id === item.productId);
      if (!live) return false;
      return isSoldOut(live) || cartQtyForProduct(withTokens, item.productId) > productStock(live);
    });
    if (soldOut.length) {
      setError(`Sem estoque para: ${[...new Set(soldOut.map((item) => item.name))].join(", ")}.`);
      return;
    }
    const missingSize = items.filter((item) => {
      const live = products.find((product) => product.id === item.productId);
      return Boolean(live?.hasSizes && !item.size);
    });
    if (missingSize.length) {
      setError(`Escolha o tamanho de: ${[...new Set(missingSize.map((item) => item.name))].join(", ")}.`);
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
    const sized = items.filter((item) => item.size);
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
              size: item.size || item.brief?.size,
              qty: item.qty,
            })),
          }),
        });
      }
      if (sized.length) {
        await api("/api/store/size-orders", {
          method: "POST",
          body: JSON.stringify({
            items: sized.map((item) => ({
              productId: item.productId || item.id,
              size: item.size,
              qty: item.qty,
            })),
          }),
        });
      }
      const checkoutCode = bundleDiscount ? yampiPromocode : undefined;
      window.location.href = buildYampiCheckout(yampiBaseUrl, withTokens, checkoutCode);
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
                {bundleDiscount ? <div className="muted">15% off no total</div> : null}
                {item.personalized ? <div className="muted">Personalizado</div> : null}
                {item.size ? <div className="muted">Tamanho {item.size}</div> : null}
                {item.brief?.transcript ? <p className="cart-brief">{item.brief.transcript}</p> : null}
                {item.brief && !item.brief.transcript ? (
                  <p className="cart-brief">
                    {item.brief.job} · {item.brief.likes} · {item.brief.colors}
                  </p>
                ) : null}
                <div>
                  {bundleDiscount ? (
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
                  <button
                    type="button"
                    disabled={atStockLimit(item)}
                    onClick={() => setQty(item.id, item.qty + 1)}
                  >
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
            <h3>Leva +1 e ganha 15% no total</h3>
            <p className="muted">
              {count < 2
                ? "Ao incluir mais uma peça, o checkout da Yampi aplica 15% em todo o pedido."
                : "O 15% já vale no total. Mais uma peça também entra no desconto."}
            </p>
            {offers.map((product) => (
                <div className="cart-item" key={product.id}>
                  {mediaUrl(product.imageUrl) ? (
                    <img src={mediaUrl(product.imageUrl)} alt="" />
                  ) : (
                    <div className="cart-thumb" />
                  )}
                  <div>
                    <strong>{product.name}</strong>
                    <div>{formatBRL(product.price)}</div>
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
            <span>{bundleDiscount ? "Total com 15% off" : "Total da vitrine"}</span>
            <strong>
              {bundleDiscount ? (
                <>
                  <s className="muted" style={{ fontWeight: 400, marginRight: 8 }}>
                    {formatBRL(listTotal)}
                  </s>
                  {formatBRL(total)}
                </>
              ) : (
                formatBRL(total)
              )}
            </strong>
          </div>
          <p className="cart-note">
            {yampiPromocode
              ? bundleDiscount
                ? "O cupom de 15% vai no pedido inteiro para o checkout da Yampi, inclusive se você incluir mais peças lá."
                : "Leva mais um PRANKID para ganhar 15% de desconto no total da compra."
              : "O valor final é confirmado no checkout da Yampi."}
          </p>
          {error ? <p className="cart-error">{error}</p> : null}
          <button className="btn full" type="button" onClick={checkout} disabled={items.length === 0 || busy}>
            {busy ? "Enviando..." : "Finalizar compra"}
          </button>
        </div>
      </aside>
      {sizing ? (
        <SizeSelectModal
          product={sizing}
          onCancel={() => setSizing(null)}
          onConfirm={(size) => {
            add(sizing, undefined, true, size);
            setSizing(null);
          }}
        />
      ) : null}
      {pending ? (
        <PersonalizeModal
          product={pending.product}
          size={pending.size}
          onCancel={() => setPending(null)}
          onConfirm={(brief) => {
            add(pending.product, brief, true, pending.size || brief.size);
            setPending(null);
          }}
        />
      ) : null}
    </>
  );
}
