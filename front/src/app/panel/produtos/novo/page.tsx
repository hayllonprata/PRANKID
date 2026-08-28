"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type ProductImage } from "@/lib/api";
import { ProductImagesField } from "@/components/panel/ProductImagesField";

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [stock, setStock] = useState("0");
  const [images, setImages] = useState<ProductImage[]>([]);
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
          stock: Number(stock),
          imageUrl: images[0]?.imageUrl || "",
          images: images.map((img) => img.imageUrl),
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
          Estoque
          <input type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} />
          <span className="field-hint">0 deixa o produto visível na loja com a tarja ESGOTADO.</span>
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
        <ProductImagesField images={images} onChange={setImages} />
        <label>
          <span>
            <input type="checkbox" checked={cartOffer} onChange={(e) => setCartOffer(e.target.checked)} />{" "}
            Exibir no carrinho (oferta +1 com 15% no total)
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
