"use client";

import { useMemo, useState } from "react";
import { formatBRL, mediaUrl, type Product } from "@/lib/api";
import { siteCopy } from "@/lib/site-copy";
import { useCart } from "./CartProvider";
import { PersonalizeModal } from "./PersonalizeModal";

const PAGE_SIZE = 3;

export function ProductsSection({ products }: { products: Product[] }) {
  const { add } = useCart();
  const [pending, setPending] = useState<Product | null>(null);
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const carousel = products.length > PAGE_SIZE;

  const visible = useMemo(() => {
    const start = (page % pageCount) * PAGE_SIZE;
    return products.slice(start, start + PAGE_SIZE);
  }, [page, pageCount, products]);

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
          <>
            <div className="crew-stage">
              {carousel ? (
                <button
                  className="crew-nav"
                  type="button"
                  aria-label="Produtos anteriores"
                  onClick={() => setPage((current) => (current - 1 + pageCount) % pageCount)}
                >
                  ‹
                </button>
              ) : null}
              <div className="grid-products">
                {visible.map((product) => {
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
              {carousel ? (
                <button
                  className="crew-nav"
                  type="button"
                  aria-label="Próximos produtos"
                  onClick={() => setPage((current) => (current + 1) % pageCount)}
                >
                  ›
                </button>
              ) : null}
            </div>
            {carousel ? (
              <div className="crew-dots">
                {Array.from({ length: pageCount }, (_, index) => (
                  <button
                    key={index}
                    className={index === page % pageCount ? "on" : ""}
                    type="button"
                    aria-label={`Página ${index + 1}`}
                    onClick={() => setPage(index)}
                  />
                ))}
              </div>
            ) : null}
          </>
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
