"use client";

import { useEffect, useMemo, useState } from "react";
import { mediaUrl, productGallery, type Product } from "@/lib/api";

export function ProductZoomModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const photos = useMemo(() => productGallery(product).map(mediaUrl).filter(Boolean), [product]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [product.id]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && photos.length > 1) {
        setActive((current) => (current + 1) % photos.length);
      }
      if (event.key === "ArrowLeft" && photos.length > 1) {
        setActive((current) => (current - 1 + photos.length) % photos.length);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, photos.length]);

  const current = photos[active] || photos[0];

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="zoom-modal" role="dialog" aria-modal="true" aria-label={product.name}>
        <div className="zoom-dialog">
          <div className="card-row">
            <h2>{product.name}</h2>
            <button className="btn ghost" type="button" onClick={onClose}>
              Fechar
            </button>
          </div>
          <div className="zoom-stage">
            {current ? <img src={current} alt={product.name} /> : <div className="placeholder-toy" />}
          </div>
          {photos.length > 1 ? (
            <div className="zoom-thumbs">
              {photos.map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  className={index === active ? "on" : ""}
                  type="button"
                  aria-label={`Foto ${index + 1}`}
                  onClick={() => setActive(index)}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
