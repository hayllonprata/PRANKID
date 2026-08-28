"use client";

import { useState } from "react";
import { type Product } from "@/lib/api";
import { type ProductSizeId } from "@/lib/product-sizes";
import { SizeChart, SizePicker } from "./SizeChart";

export function SizeSelectModal({
  product,
  onCancel,
  onConfirm,
}: {
  product: Product;
  onCancel: () => void;
  onConfirm: (size: ProductSizeId) => void;
}) {
  const [size, setSize] = useState<ProductSizeId | "">("");
  const [error, setError] = useState("");

  function confirm() {
    if (!size) {
      setError("Escolha um tamanho.");
      return;
    }
    onConfirm(size);
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onCancel} />
      <div className="zoom-modal" role="dialog" aria-modal="true" aria-label="Escolher tamanho">
        <div className="zoom-dialog size-dialog">
          <div className="card-row">
            <h2>Tamanho</h2>
            <button className="btn ghost" type="button" onClick={onCancel}>
              Fechar
            </button>
          </div>
          <p className="muted">{product.name}</p>
          <SizePicker
            value={size}
            onChange={(next) => {
              setSize(next);
              setError("");
            }}
          />
          <SizeChart selected={size} />
          {error ? <p className="cart-error">{error}</p> : null}
          <button className="btn magenta full" type="button" onClick={confirm}>
            {product.personalized ? "Continuar" : "Adicionar"}
          </button>
        </div>
      </div>
    </>
  );
}
