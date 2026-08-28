"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, editionTag, type Product } from "@/lib/api";
import { ProductImagesField } from "@/components/panel/ProductImagesField";
import { SizeChart } from "@/components/SizeChart";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<Product[]>("/api/admin/products")
      .then((list) => {
        const found = list.find((item) => item.id === params.id);
        if (!found) setError("Produto não encontrado");
        else setProduct(found);
      })
      .catch((err: Error) => setError(err.message));
  }, [params.id]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!product) return;
    setError("");
    setMsg("");
    try {
      const saved = await api<Product>(`/api/admin/products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...product, images: undefined }),
      });
      setProduct(saved);
      setMsg("Produto salvo.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar");
    }
  }

  if (!product && !error) return <p>Carregando...</p>;
  if (!product) return <p className="msg err">{error}</p>;

  return (
    <>
      <h1>Editar produto</h1>
      <form className="panel-card form-grid" onSubmit={onSubmit}>
        <label>
          Nome
          <input value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} />
        </label>
        <label>
          Descrição
          <textarea value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} />
        </label>
        <label>
          Preço de vitrine
          <input
            type="number"
            step="0.01"
            value={product.price}
            onChange={(e) => setProduct({ ...product, price: Number(e.target.value) })}
          />
        </label>
        <label>
          Estoque
          <input
            type="number"
            min="0"
            step="1"
            value={product.stock ?? 0}
            onChange={(e) => setProduct({ ...product, stock: Number(e.target.value) })}
          />
          <span className="field-hint">Peças ainda disponíveis. 0 deixa o produto visível com a tarja ESGOTADO.</span>
        </label>
        <label>
          Tiragem da edição
          <input
            type="number"
            min="0"
            step="1"
            value={product.editionSize ?? 0}
            onChange={(e) => setProduct({ ...product, editionSize: Number(e.target.value) })}
          />
          <span className="field-hint">
            0 esconde a tag. A vitrine mostra vendidos / tiragem, ou seja estoque 77 e tiragem 77 vira 0 / 77.
            {editionTag(product) ? ` Tag atual: ${editionTag(product)}.` : ""}
          </span>
        </label>
        <label>
          Token Yampi
          <input value={product.yampiToken} onChange={(e) => setProduct({ ...product, yampiToken: e.target.value })} />
        </label>
        <label>
          SKU
          <input value={product.sku} onChange={(e) => setProduct({ ...product, sku: e.target.value })} />
        </label>
        <label>
          Ordem na vitrine
          <input
            type="number"
            value={product.sortOrder}
            onChange={(e) => setProduct({ ...product, sortOrder: Number(e.target.value) })}
          />
          <span className="field-hint">Também dá para arrastar ou usar as setas na lista de produtos.</span>
        </label>
        <ProductImagesField
          images={product.images ?? []}
          onUpload={async (imageUrls) => {
            const saved = await api<Product>(`/api/admin/products/${product.id}/images`, {
              method: "POST",
              body: JSON.stringify({ imageUrls }),
            });
            setProduct(saved);
          }}
          onRemove={async (image) => {
            const saved = await api<Product>(`/api/admin/products/${product.id}/images/${image.id}`, {
              method: "DELETE",
            });
            setProduct(saved);
          }}
          onReorder={async (ordered) => {
            const saved = await api<Product>(`/api/admin/products/${product.id}/images`, {
              method: "PUT",
              body: JSON.stringify({ imageIds: ordered.map((item) => item.id) }),
            });
            setProduct(saved);
          }}
        />
        <label>
          <span>
            <input
              type="checkbox"
              checked={product.cartOffer}
              onChange={(e) => setProduct({ ...product, cartOffer: e.target.checked })}
            />{" "}
            Exibir no carrinho (oferta +1 com 15% no total)
          </span>
        </label>
        <label>
          <span>
            <input
              type="checkbox"
              checked={product.personalized}
              onChange={(e) => setProduct({ ...product, personalized: e.target.checked })}
            />{" "}
            Produto personalizado (pede briefing na compra)
          </span>
        </label>
        <label>
          <span>
            <input
              type="checkbox"
              checked={product.hasSizes}
              onChange={(e) => setProduct({ ...product, hasSizes: e.target.checked })}
            />{" "}
            Pedir tamanho na compra (camiseta)
          </span>
          <span className="field-hint">O cliente escolhe P, M, G, GG, XG, G2 ou G3. A tabela de medidas aparece na hora da compra.</span>
        </label>
        {product.hasSizes ? <SizeChart /> : null}
        <label>
          <span>
            <input
              type="checkbox"
              checked={product.active}
              onChange={(e) => setProduct({ ...product, active: e.target.checked })}
            />{" "}
            Ativo na vitrine
          </span>
          <span className="field-hint">Desmarque para esconder o produto da loja sem excluir.</span>
        </label>
        {msg ? <p className="msg ok">{msg}</p> : null}
        {error ? <p className="msg err">{error}</p> : null}
        <div className="row-actions">
          <button className="btn" type="submit">
            Salvar
          </button>
          <button className="btn ghost" type="button" onClick={() => router.push("/panel/produtos")}>
            Voltar
          </button>
        </div>
      </form>
    </>
  );
}
