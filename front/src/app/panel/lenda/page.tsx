"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, type Legend } from "@/lib/api";

export default function LegendPage() {
  const [legend, setLegend] = useState<Legend | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<Legend>("/api/admin/legend")
      .then(setLegend)
      .catch((err: Error) => setError(err.message));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!legend) return;
    setMsg("");
    setError("");
    try {
      const saved = await api<Legend>("/api/admin/legend", {
        method: "PUT",
        body: JSON.stringify(legend),
      });
      setLegend(saved);
      setMsg("Lenda salva.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar");
    }
  }

  if (!legend && !error) return <p>Carregando...</p>;
  if (!legend) return error ? <p className="msg err">{error}</p> : null;

  return (
    <>
      <h1>Lenda PRANKID</h1>
      <p className="muted">O mesmo texto corrido da loja. Separe parágrafos com uma linha em branco.</p>
      <form className="panel-card form-grid" onSubmit={onSubmit}>
        <label>
          Título
          <input value={legend.title} onChange={(e) => setLegend({ ...legend, title: e.target.value })} />
        </label>
        <label>
          Texto
          <textarea
            value={legend.description}
            onChange={(e) => setLegend({ ...legend, description: e.target.value })}
            rows={22}
          />
        </label>
        {msg ? <p className="msg ok">{msg}</p> : null}
        {error ? <p className="msg err">{error}</p> : null}
        <button className="btn" type="submit">
          Salvar
        </button>
      </form>
    </>
  );
}
