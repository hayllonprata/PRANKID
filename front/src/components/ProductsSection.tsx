"use client";

import { formatBRL, mediaUrl, type Product } from "@/lib/api";
import { siteCopy } from "@/lib/site-copy";
import { useCart } from "./CartProvider";

export function ProductsSection({ products }: { products: Product[] }) {
  const { add } = useCart();
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
                  </div>
                  <div className="card-body">
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <div className="card-row">
                      <span className="price">{formatBRL(product.price)}</span>
                      <button className="btn magenta" type="button" onClick={() => add(product)}>
                        Adicionar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
