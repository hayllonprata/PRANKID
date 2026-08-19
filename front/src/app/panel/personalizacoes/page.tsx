"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Brief = {
  id: string;
  productName: string;
  job: string;
  likes: string;
  colors: string;
  qty: number;
  createdAt: string;
};

export default function CustomizationsPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Brief[]>("/api/admin/customizations")
      .then(setBriefs)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <>
      <h1>Personalizações</h1>
      <p className="muted">Briefings enviados na compra de peças personalizadas, para o artista montar a essência do cliente.</p>
      {error ? <p className="msg err">{error}</p> : null}
      {briefs.length === 0 ? <p>Nenhum briefing ainda.</p> : null}
      {briefs.map((brief) => (
        <article className="panel-card" key={brief.id} style={{ marginBottom: 16 }}>
          <h2>{brief.productName}</h2>
          <p className="muted">
            {new Date(brief.createdAt).toLocaleString("pt-BR")} · qtd {brief.qty}
          </p>
          <p>
            <strong>O que faz:</strong> {brief.job}
          </p>
          <p>
            <strong>Do que gosta:</strong> {brief.likes}
          </p>
          <p>
            <strong>Cores:</strong> {brief.colors}
          </p>
        </article>
      ))}
    </>
  );
}
