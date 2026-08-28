"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ConfirmModal } from "@/components/panel/ConfirmModal";
import { api, formatBRL, mediaUrl, productGallery, type Product } from "@/lib/api";

function coverSrc(product: Product) {
  return mediaUrl(productGallery(product)[0] || product.imageUrl);
}

function ProductCover({ product }: { product: Product }) {
  const src = coverSrc(product);
  if (!src) {
    return <span className="product-cover-thumb is-empty" aria-hidden />;
  }
  return <img className="product-cover-thumb" src={src} alt="" draggable={false} />;
}

function withSortOrder(list: Product[]) {
  return list.map((item, sortOrder) => ({ ...item, sortOrder }));
}

function moveProduct(list: Product[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return withSortOrder(next);
}

export default function ProductsListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [togglingId, setTogglingId] = useState("");
  const [duplicatingId, setDuplicatingId] = useState("");
  const [reordering, setReordering] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const productsRef = useRef<Product[]>([]);

  async function load() {
    try {
      const list = await api<Product[]>("/api/admin/products");
      productsRef.current = list;
      setProducts(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function persistOrder(next: Product[]) {
    const previous = productsRef.current;
    productsRef.current = next;
    setProducts(next);
    setReordering(true);
    setError("");
    try {
      const saved = await api<Product[]>("/api/admin/products/reorder", {
        method: "PUT",
        body: JSON.stringify({ productIds: next.map((item) => item.id) }),
      });
      productsRef.current = saved;
      setProducts(saved);
    } catch (err) {
      productsRef.current = previous;
      setProducts(previous);
      setError(err instanceof Error ? err.message : "Falha ao reordenar");
      await load();
    } finally {
      setReordering(false);
    }
  }

  async function moveBy(index: number, delta: number) {
    if (reordering || busy || duplicatingId) return;
    const next = moveProduct(productsRef.current, index, index + delta);
    if (next === productsRef.current) return;
    await persistOrder(next);
  }

  async function dropAt(to: number) {
    if (dragIndex === null) return;
    const from = dragIndex;
    setDragIndex(null);
    setOverIndex(null);
    if (from === to || reordering || busy || duplicatingId) return;
    const next = moveProduct(productsRef.current, from, to);
    await persistOrder(next);
  }

  async function toggleActive(product: Product) {
    if (togglingId || duplicatingId || busy || reordering) return;
    setTogglingId(product.id);
    setError("");
    try {
      const saved = await api<Product>(`/api/admin/products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify({ active: !product.active }),
      });
      setProducts((list) => {
        const next = list.map((item) => (item.id === saved.id ? saved : item));
        productsRef.current = next;
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar");
    } finally {
      setTogglingId("");
    }
  }

  async function duplicateProduct(product: Product) {
    if (duplicatingId || togglingId || busy || reordering) return;
    setDuplicatingId(product.id);
    setError("");
    try {
      await api(`/api/admin/products/${product.id}/duplicate`, { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao duplicar");
    } finally {
      setDuplicatingId("");
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

  function orderControls(index: number) {
    const locked = reordering || busy || Boolean(duplicatingId);
    return (
      <div className="order-controls">
        <span className="order-index" aria-label={`Posição ${index + 1}`}>
          {index + 1}
        </span>
        <button
          className="btn sm ghost order-btn"
          type="button"
          aria-label="Subir produto"
          disabled={locked || index === 0}
          onClick={() => moveBy(index, -1)}
        >
          ↑
        </button>
        <button
          className="btn sm ghost order-btn"
          type="button"
          aria-label="Descer produto"
          disabled={locked || index === products.length - 1}
          onClick={() => moveBy(index, 1)}
        >
          ↓
        </button>
      </div>
    );
  }

  function productActions(product: Product) {
    const toggling = togglingId === product.id;
    const locked = toggling || Boolean(duplicatingId) || busy || reordering;
    return (
      <>
        <button
          className="btn sm ghost"
          type="button"
          disabled={locked}
          onClick={() => toggleActive(product)}
        >
          {toggling ? "Salvando..." : product.active ? "Desativar" : "Ativar"}
        </button>
        <button
          className="btn sm ghost"
          type="button"
          disabled={locked}
          onClick={() => duplicateProduct(product)}
        >
          {duplicatingId === product.id ? "Duplicando..." : "Duplicar"}
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
      <p className="muted">
        Desative para esconder da vitrine sem excluir. Arraste ou use as setas para definir a ordem da loja.
      </p>
      {error ? <p className="msg err">{error}</p> : null}

      {/* Tabela para desktop */}
      <div className="panel-card product-table-desktop">
        <table className="table">
          <thead>
            <tr>
              <th>Ordem</th>
              <th>Capa</th>
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
            {products.map((product, index) => (
              <tr
                key={product.id}
                className={`product-order-row${dragIndex === index ? " is-dragging" : ""}${overIndex === index && dragIndex !== index ? " is-over" : ""}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setOverIndex(index);
                }}
                onDragLeave={() => {
                  setOverIndex((current) => (current === index ? null : current));
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  dropAt(index);
                }}
              >
                <td>
                  <div className="order-cell">
                    <span
                      className="drag-handle"
                      title="Arraste para reordenar"
                      draggable={!reordering && !busy}
                      onDragStart={(event) => {
                        setDragIndex(index);
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", String(index));
                      }}
                      onDragEnd={() => {
                        setDragIndex(null);
                        setOverIndex(null);
                      }}
                    >
                      ⋮⋮
                    </span>
                    {orderControls(index)}
                  </div>
                </td>
                <td className="product-cover-cell">
                  <ProductCover product={product} />
                </td>
                <td>
                  {product.name}
                  {product.hasSizes ? (
                    <span className="badge warning" style={{ marginLeft: 8 }}>
                      Tamanhos
                    </span>
                  ) : null}
                </td>
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
        {products.map((product, index) => (
          <article
            key={product.id}
            className={`panel-card product-card-mobile${dragIndex === index ? " is-dragging" : ""}${overIndex === index && dragIndex !== index ? " is-over" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setOverIndex(index);
            }}
            onDrop={(event) => {
              event.preventDefault();
              dropAt(index);
            }}
          >
            <div className="product-card-order">
              <span
                className="drag-handle"
                title="Arraste para reordenar"
                draggable={!reordering && !busy}
                onDragStart={(event) => {
                  setDragIndex(index);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", String(index));
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
              >
                ⋮⋮
              </span>
              {orderControls(index)}
            </div>
            <div className="product-card-header">
              <ProductCover product={product} />
              <div className="product-card-heading">
                <h3>{product.name}</h3>
                <span className="product-card-price">{formatBRL(product.price)}</span>
              </div>
            </div>

            <div className="product-card-info">
              <div className="product-card-badges">
                {product.active && <span className="badge success">Ativo</span>}
                {!product.active && <span className="badge muted">Inativo</span>}
                {product.stock <= 0 && <span className="badge danger">Esgotado</span>}
                {product.stock > 0 && <span className="badge info">{product.stock} un.</span>}
                {product.personalized && <span className="badge info">Personalizado</span>}
                {product.hasSizes && <span className="badge warning">Tamanhos</span>}
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
