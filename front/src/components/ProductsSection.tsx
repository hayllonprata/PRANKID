"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { editionTag, formatBRL, isSoldOut, mediaUrl, productGallery, type Product } from "@/lib/api";
import { siteCopy } from "@/lib/site-copy";
import { useCart } from "./CartProvider";
import { PersonalizeModal } from "./PersonalizeModal";
import { ProductZoomModal } from "./ProductZoomModal";
import { SizeSelectModal } from "./SizeSelectModal";

const PAGE_SIZE = 3;

function ProductCard({
  product,
  onSelect,
  onOpen,
}: {
  product: Product;
  onSelect: (product: Product) => void;
  onOpen: (product: Product) => void;
}) {
  const photos = productGallery(product);
  const src = mediaUrl(photos[0] || product.imageUrl);
  const soldOut = isSoldOut(product);
  const limited = editionTag(product);
  return (
    <article className="card product-card" onClick={() => onOpen(product)}>
      <div className="card-media">
        {src ? <img src={src} alt={product.name} /> : <div className="placeholder-toy" />}
        {product.personalized ? <span className="card-tag">Personalizado</span> : null}
        {product.hasSizes && !product.personalized ? <span className="card-tag">Tamanhos</span> : null}
        {limited ? <span className="card-tag edition">{limited}</span> : null}
        {photos.length > 1 ? <span className="card-photos">{photos.length} fotos</span> : null}
      </div>
      <div className="card-body">
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="card-row">
          <span className="price">{formatBRL(product.price)}</span>
          <button
            className="btn magenta"
            type="button"
            disabled={soldOut}
            onClick={(event) => {
              event.stopPropagation();
              if (soldOut) return;
              onSelect(product);
            }}
          >
            {soldOut ? "Esgotado" : product.personalized ? "Personalizar" : product.hasSizes ? "Tamanho" : "Adicionar"}
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductsSection({ products }: { products: Product[] }) {
  const { add } = useCart();
  const [pending, setPending] = useState<{ product: Product; size?: string } | null>(null);
  const [sizing, setSizing] = useState<Product | null>(null);
  const [zoomed, setZoomed] = useState<Product | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const busy = useRef(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const pages = useMemo(() => {
    const chunks: Product[][] = [];
    for (let i = 0; i < products.length; i += PAGE_SIZE) {
      chunks.push(products.slice(i, i + PAGE_SIZE));
    }
    return chunks;
  }, [products]);

  const pageCount = Math.max(1, pages.length);
  const carousel = !isMobile && products.length > PAGE_SIZE;

  const slides = useMemo(() => {
    if (!carousel || pages.length === 0) return pages;
    return [pages[pages.length - 1], ...pages, pages[0]];
  }, [carousel, pages]);

  useEffect(() => {
    setAnimate(false);
    setIndex(carousel ? 1 : 0);
    busy.current = false;
  }, [carousel, pageCount]);

  useEffect(() => {
    if (animate) return;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimate(true));
    });
    return () => cancelAnimationFrame(frame);
  }, [animate, index]);

  const goTo = (next: number) => {
    if (!carousel || busy.current || next === index) return;
    busy.current = true;
    setAnimate(true);
    setIndex(next);
  };

  const activePage = !carousel
    ? 0
    : index === 0
      ? pageCount - 1
      : index === pageCount + 1
        ? 0
        : index - 1;

  const handleSelect = (product: Product) => {
    if (isSoldOut(product)) return;
    if (product.personalized) setPending({ product });
    else if (product.hasSizes) setSizing(product);
    else add(product);
  };

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
        ) : isMobile ? (
          <div className="grid-products">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onSelect={handleSelect} onOpen={setZoomed} />
            ))}
          </div>
        ) : (
          <>
            <div className="crew-stage">
              {carousel ? (
                <button
                  className="crew-nav"
                  type="button"
                  aria-label="Produtos anteriores"
                  onClick={() => goTo(index - 1)}
                >
                  ‹
                </button>
              ) : null}
              <div className="products-viewport">
                <div
                  className={`products-track${animate ? " is-animated" : ""}`}
                  style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
                  onTransitionEnd={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (!carousel) {
                      busy.current = false;
                      return;
                    }
                    if (index === 0) {
                      setAnimate(false);
                      setIndex(pageCount);
                    } else if (index === pageCount + 1) {
                      setAnimate(false);
                      setIndex(1);
                    }
                    busy.current = false;
                  }}
                >
                  {(slides.length ? slides : [products]).map((group, slideIndex) => (
                    <div className="grid-products products-slide" key={`slide-${slideIndex}`}>
                      {group.map((product) => (
                        <ProductCard
                          key={`${slideIndex}-${product.id}`}
                          product={product}
                          onSelect={handleSelect}
                          onOpen={setZoomed}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {carousel ? (
                <button
                  className="crew-nav"
                  type="button"
                  aria-label="Próximos produtos"
                  onClick={() => goTo(index + 1)}
                >
                  ›
                </button>
              ) : null}
            </div>
            {carousel ? (
              <div className="crew-dots">
                {Array.from({ length: pageCount }, (_, pageIndex) => (
                  <button
                    key={pageIndex}
                    className={pageIndex === activePage ? "on" : ""}
                    type="button"
                    aria-label={`Página ${pageIndex + 1}`}
                    onClick={() => goTo(pageIndex + 1)}
                  />
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
      {zoomed ? <ProductZoomModal product={zoomed} onClose={() => setZoomed(null)} /> : null}
      {sizing ? (
        <SizeSelectModal
          product={sizing}
          onCancel={() => setSizing(null)}
          onConfirm={(size) => {
            add(sizing, undefined, false, size);
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
            add(pending.product, brief, false, pending.size || brief.size);
            setPending(null);
          }}
        />
      ) : null}
    </section>
  );
}
