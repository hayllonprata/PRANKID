"use client";

import { useEffect, useState } from "react";
import { api, mediaUrl } from "@/lib/api";

type Brief = {
  id: string;
  productName: string;
  job: string;
  likes: string;
  colors: string;
  transcript: string;
  audioUrl: string;
  size: string;
  qty: number;
  createdAt: string;
};

type SizeOrder = {
  id: string;
  productName: string;
  size: string;
  qty: number;
  createdAt: string;
};

export default function CustomizationsPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [sizes, setSizes] = useState<SizeOrder[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api<Brief[]>("/api/admin/customizations"), api<SizeOrder[]>("/api/admin/size-orders")])
      .then(([nextBriefs, nextSizes]) => {
        setBriefs(nextBriefs);
        setSizes(nextSizes);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <>
      <h1>Personalizações</h1>
      <p className="muted">Briefings e tamanhos enviados na compra, para montar a peça certa.</p>
      {error ? <p className="msg err">{error}</p> : null}

      <h2 style={{ marginTop: 28 }}>Tamanhos</h2>
      {sizes.length === 0 ? <p className="muted">Nenhum tamanho pedido ainda.</p> : null}
      {sizes.map((order) => (
        <article className="panel-card" key={order.id} style={{ marginBottom: 16 }}>
          <h2>{order.productName}</h2>
          <p className="muted">
            {new Date(order.createdAt).toLocaleString("pt-BR")} · qtd {order.qty}
          </p>
          <p>
            <strong>Tamanho:</strong> {order.size}
          </p>
        </article>
      ))}

      <h2 style={{ marginTop: 28 }}>Briefings</h2>
      {briefs.length === 0 ? <p className="muted">Nenhum briefing ainda.</p> : null}
      {briefs.map((brief) => (
        <article className="panel-card" key={brief.id} style={{ marginBottom: 16 }}>
          <h2>{brief.productName}</h2>
          <p className="muted">
            {new Date(brief.createdAt).toLocaleString("pt-BR")} · qtd {brief.qty}
            {brief.size ? ` · tamanho ${brief.size}` : ""}
          </p>
          {brief.size ? (
            <p>
              <strong>Tamanho:</strong> {brief.size}
            </p>
          ) : null}
          <p>
            <strong>O que faz:</strong> {brief.job}
          </p>
          <p>
            <strong>Do que gosta:</strong> {brief.likes}
          </p>
          <p>
            <strong>Cores:</strong> {brief.colors || "—"}
          </p>
          {brief.transcript ? (
            <p>
              <strong>Áudio transcrito:</strong> {brief.transcript}
            </p>
          ) : null}
          {brief.audioUrl ? (
            <p>
              <a href={mediaUrl(brief.audioUrl)} target="_blank" rel="noreferrer">
                Ouvir áudio original
              </a>
            </p>
          ) : null}
        </article>
      ))}
    </>
  );
}
