"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, mediaUrl, type CrewShot } from "@/lib/api";
import { ImageField } from "@/components/panel/ImageField";

export default function CrewPage() {
  const [shots, setShots] = useState<CrewShot[]>([]);
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setShots(await api<CrewShot[]>("/api/admin/crew"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setMsg("");
    setError("");
    try {
      await api("/api/admin/crew", {
        method: "POST",
        body: JSON.stringify({
          imageUrl,
          caption,
          sortOrder: Number(sortOrder),
          active: true,
        }),
      });
      setCaption("");
      setImageUrl("");
      setSortOrder("0");
      setMsg("Foto adicionada.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar");
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta foto?")) return;
    await api(`/api/admin/crew/${id}`, { method: "DELETE" });
    load();
  }

  async function toggle(shot: CrewShot) {
    await api(`/api/admin/crew/${shot.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...shot, active: !shot.active }),
    });
    load();
  }

  return (
    <>
      <h1>Quem levou embora</h1>
      <p className="muted">Fotos de compradores. A loja mostra 3 por vez; se tiver mais, vira carrossel.</p>
      <form className="panel-card form-grid" onSubmit={onCreate}>
        <h2>Nova foto</h2>
        <label>
          Legenda (nome, cidade, opcional)
          <input value={caption} onChange={(e) => setCaption(e.target.value)} />
        </label>
        <label>
          Ordem
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </label>
        <ImageField label="Foto" value={imageUrl} onChange={setImageUrl} />
        {msg ? <p className="msg ok">{msg}</p> : null}
        {error ? <p className="msg err">{error}</p> : null}
        <button className="btn" type="submit" disabled={!imageUrl}>
          Adicionar
        </button>
      </form>
      <div className="panel-card">
        {shots.length === 0 ? <p className="muted">Nenhuma foto ainda.</p> : null}
        {shots.map((shot) => (
          <div className="card-row" key={shot.id} style={{ marginBottom: 16, alignItems: "center" }}>
            {mediaUrl(shot.imageUrl) ? (
              <img src={mediaUrl(shot.imageUrl)} alt="" style={{ width: 88, height: 88, objectFit: "cover" }} />
            ) : null}
            <div>
              <strong>{shot.caption || "Sem legenda"}</strong>
              <p className="muted">Ordem {shot.sortOrder} · {shot.active ? "visível" : "oculta"}</p>
            </div>
            <div className="row-actions">
              <button className="btn ghost" type="button" onClick={() => toggle(shot)}>
                {shot.active ? "Ocultar" : "Mostrar"}
              </button>
              <button className="btn ghost" type="button" onClick={() => remove(shot.id)}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
