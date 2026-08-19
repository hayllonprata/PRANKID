"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, type LegendBeat } from "@/lib/api";
import { ImageField } from "@/components/panel/ImageField";

export default function LegendPage() {
  const [beats, setBeats] = useState<LegendBeat[]>([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");

  useEffect(() => {
    api<LegendBeat[]>("/api/admin/legend")
      .then(setBeats)
      .catch((err: Error) => setError(err.message));
  }, []);

  function patch(id: string, next: Partial<LegendBeat>) {
    setBeats((current) => current.map((beat) => (beat.id === id ? { ...beat, ...next } : beat)));
  }

  async function onSave(event: FormEvent, beat: LegendBeat) {
    event.preventDefault();
    setMsg("");
    setError("");
    setSaving(beat.id);
    try {
      const saved = await api<LegendBeat>(`/api/admin/legend/${beat.id}`, {
        method: "PUT",
        body: JSON.stringify(beat),
      });
      patch(beat.id, saved);
      setMsg(`Cena ${beat.sortOrder} salva.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar");
    } finally {
      setSaving("");
    }
  }

  if (!beats.length && !error) return <p>Carregando...</p>;

  return (
    <>
      <h1>Lenda PRANKID</h1>
      <p className="muted">Texto da história e uma imagem por cena. A cena vira placeholder até o upload.</p>
      {msg ? <p className="msg ok">{msg}</p> : null}
      {error ? <p className="msg err">{error}</p> : null}
      {beats.map((beat) => (
        <form className="panel-card form-grid" key={beat.id} onSubmit={(event) => onSave(event, beat)}>
          <h2>
            Cena {beat.sortOrder} — {beat.title}
          </h2>
          <label>
            Título da cena
            <input value={beat.title} onChange={(e) => patch(beat.id, { title: e.target.value })} />
          </label>
          <label>
            Texto
            <textarea value={beat.caption} onChange={(e) => patch(beat.id, { caption: e.target.value })} />
          </label>
          <ImageField
            label="Imagem"
            value={beat.imageUrl}
            onChange={(imageUrl) => patch(beat.id, { imageUrl })}
          />
          <button className="btn" type="submit" disabled={saving === beat.id}>
            {saving === beat.id ? "Salvando..." : "Salvar cena"}
          </button>
        </form>
      ))}
    </>
  );
}
