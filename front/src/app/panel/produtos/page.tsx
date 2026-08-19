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

  return (
    <>
      <div className="card-row">
        <h1>Produtos</h1>
        <Link className="btn" href="/panel/produtos/novo">
          Novo produto
        </Link>
      </div>
      {error ? <p className="msg err">{error}</p> : null}
      <div className="panel-card">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Preço</th>
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
                <td>{product.yampiToken || "—"}</td>
                <td>{product.active ? "sim" : "não"}</td>
                <td>{product.personalized ? "sim" : "não"}</td>
                <td>{product.cartOffer ? "sim" : "não"}</td>
                <td className="row-actions">
                  <Link className="btn sm" href={`/panel/produtos/${product.id}`}>
                    Editar
                  </Link>
                  <button className="btn sm magenta" type="button" onClick={() => setPendingId(product.id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
