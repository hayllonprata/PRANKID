"use client";

import { useState } from "react";
import { formatBRL, mediaUrl, type Product } from "@/lib/api";
import { siteCopy } from "@/lib/site-copy";
import { useCart } from "./CartProvider";
import { PersonalizeModal } from "./PersonalizeModal";

export function ProductsSection({ products }: { products: Product[] }) {
  const { add } = useCart();
  const [pending, setPending] = useState<Product | null>(null);

  return (
    <section className="section" id="produtos">
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2>{siteCopy.productsTitle}</h2>
            <p>{siteCopy.productsLead}</p>
          </div>
        </div>
        {products.length === 0 ? (
          <p className="empty">Nenhum produto ativo no momento.</p>
        ) : (
          <div className="grid-products">
            {products.map((product) => {
              const src = mediaUrl(product.imageUrl);
              return (
                <article className="card" key={product.id}>
                  <div className="card-media">
                    {src ? <img src={src} alt={product.name} /> : <div className="placeholder-toy" />}
                    {product.personalized ? <span className="card-tag">Personalizado</span> : null}
                  </div>
                  <div className="card-body">
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <div className="card-row">
                      <span className="price">{formatBRL(product.price)}</span>
                      <button
                        className="btn magenta"
                        type="button"
                        onClick={() => (product.personalized ? setPending(product) : add(product))}
                      >
                        {product.personalized ? "Personalizar" : "Adicionar"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
      {pending ? (
        <PersonalizeModal
          product={pending}
          onCancel={() => setPending(null)}
          onConfirm={(brief) => {
            add(pending, brief);
            setPending(null);
          }}
        />
      ) : null}
    </section>
  );
}
