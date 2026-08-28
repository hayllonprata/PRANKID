"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConfirmModal } from "@/components/panel/ConfirmModal";
import { api, formatBRL, type Product } from "@/lib/api";

export default function ProductsListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [togglingId, setTogglingId] = useState("");

  async function load() {
    try {
      setProducts(await api<Product[]>("/api/admin/products"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(product: Product) {
    if (togglingId || busy) return;
    setTogglingId(product.id);
    setError("");
    try {
      const saved = await api<Product>(`/api/admin/products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify({ active: !product.active }),
      });
      setProducts((list) => list.map((item) => (item.id === saved.id ? saved : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar");
    } finally {
      setTogglingId("");
    }
  }

  async function confirmRemove() {
    if (!pendingId) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/products/${pendingId}`, { method: "DELETE" });
      setPendingId("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir");
    } finally {
      setBusy(false);
    }
  }

  function productActions(product: Product) {
    const toggling = togglingId === product.id;
    return (
      <>
        <button
          className="btn sm ghost"
          type="button"
          disabled={toggling || busy}
          onClick={() => toggleActive(product)}
        >
          {toggling ? "Salvando..." : product.active ? "Desativar" : "Ativar"}
        </button>
        <Link className="btn sm" href={`/panel/produtos/${product.id}`}>
          Editar
        </Link>
        <button className="btn sm magenta" type="button" onClick={() => setPendingId(product.id)}>
          Excluir
        </button>
      </>
    );
  }

  return (
    <>
      <div className="card-row">
        <h1>Produtos</h1>
        <Link className="btn" href="/panel/produtos/novo">
          Novo produto
        </Link>
      </div>
      <p className="muted">Desative para esconder o produto da vitrine sem excluir.</p>
      {error ? <p className="msg err">{error}</p> : null}
      
      {/* Tabela para desktop */}
      <div className="panel-card product-table-desktop">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th>Token Yampi</th>
              <th>Ativo</th>
              <th>Personalizado</th>
              <th>No carrinho</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{formatBRL(product.price)}</td>
                <td>{product.stock <= 0 ? "esgotado" : product.stock}</td>
                <td>{product.yampiToken || "—"}</td>
                <td>{product.active ? "sim" : "não"}</td>
                <td>{product.personalized ? "sim" : "não"}</td>
                <td>{product.cartOffer ? "sim" : "não"}</td>
                <td className="row-actions">{productActions(product)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards para mobile */}
      <div className="product-cards-mobile">
        {products.map((product) => (
          <article key={product.id} className="panel-card product-card-mobile">
            <div className="product-card-header">
              <h3>{product.name}</h3>
              <span className="product-card-price">{formatBRL(product.price)}</span>
            </div>
            
            <div className="product-card-info">
              <div className="product-card-badges">
                {product.active && <span className="badge success">Ativo</span>}
                {!product.active && <span className="badge muted">Inativo</span>}
                {product.stock <= 0 && <span className="badge danger">Esgotado</span>}
                {product.stock > 0 && <span className="badge info">{product.stock} un.</span>}
                {product.personalized && <span className="badge info">Personalizado</span>}
                {product.cartOffer && <span className="badge warning">No carrinho</span>}
              </div>
              
              {product.yampiToken && (
                <div className="product-card-row">
                  <span className="label">Token Yampi:</span>
                  <code>{product.yampiToken}</code>
                </div>
              )}
            </div>

            <div className="product-card-actions">{productActions(product)}</div>
          </article>
        ))}
      </div>
      <ConfirmModal
        open={Boolean(pendingId)}
        message="Excluir este produto? Essa ação não pode ser desfeita."
        busy={busy}
        onCancel={() => !busy && setPendingId("")}
        onConfirm={confirmRemove}
      />
    </>
  );
}
