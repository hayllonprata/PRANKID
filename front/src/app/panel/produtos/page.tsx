"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, formatBRL, type Product } from "@/lib/api";

export default function ProductsListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

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

  async function remove(id: string) {
    if (!confirm("Excluir este produto?")) return;
    await api(`/api/admin/products/${id}`, { method: "DELETE" });
    load();
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
                  <button className="btn sm magenta" type="button" onClick={() => remove(product.id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
