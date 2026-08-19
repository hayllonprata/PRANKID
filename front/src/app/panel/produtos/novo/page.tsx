"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ImageField } from "@/components/panel/ImageField";

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [yampiToken, setYampiToken] = useState("");
  const [sku, setSku] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [active, setActive] = useState(true);
  const [personalized, setPersonalized] = useState(false);
  const [cartOffer, setCartOffer] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/admin/products", {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          price: Number(price),
          imageUrl,
          yampiToken,
          sku,
          sortOrder: Number(sortOrder),
          active,
          personalized,
          cartOffer,
        }),
      });
      router.replace("/panel/produtos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar");
    }
  }

  return (
    <>
      <h1>Novo produto</h1>
      <form className="panel-card form-grid" onSubmit={onSubmit}>
        <label>
          Nome
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Descrição
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label>
          Preço de vitrine
          <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label>
          Token Yampi
          <input value={yampiToken} onChange={(e) => setYampiToken(e.target.value)} placeholder="AABBJJ" />
        </label>
        <label>
          SKU
          <input value={sku} onChange={(e) => setSku(e.target.value)} />
        </label>
        <label>
          Ordem
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </label>
        <ImageField label="Imagem" value={imageUrl} onChange={setImageUrl} />
        <label>
          <span>
            <input type="checkbox" checked={cartOffer} onChange={(e) => setCartOffer(e.target.checked)} />{" "}
            Exibir no carrinho (oferta +1 com 15% off)
          </span>
        </label>
        <label>
          <span>
            <input type="checkbox" checked={personalized} onChange={(e) => setPersonalized(e.target.checked)} />{" "}
            Produto personalizado (pede briefing na compra)
          </span>
        </label>
        <label>
          <span>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Ativo
          </span>
        </label>
        {error ? <p className="msg err">{error}</p> : null}
        <button className="btn" type="submit">
          Criar
        </button>
      </form>
    </>
  );
}
