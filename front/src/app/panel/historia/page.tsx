"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, type Story } from "@/lib/api";
import { ImageField } from "@/components/panel/ImageField";

export default function StoryPage() {
  const [story, setStory] = useState<Story | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<Story>("/api/admin/story").then(setStory).catch((err: Error) => setError(err.message));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!story) return;
    setMsg("");
    setError("");
    try {
      const saved = await api<Story>("/api/admin/story", {
        method: "PUT",
        body: JSON.stringify(story),
      });
      setStory(saved);
      setMsg("História salva.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar");
    }
  }

  if (!story) return <p>Carregando...</p>;

  return (
    <>
      <h1>História</h1>
      <form className="panel-card form-grid" onSubmit={onSubmit}>
        <label>
          Título
          <input value={story.title} onChange={(e) => setStory({ ...story, title: e.target.value })} />
        </label>
        <label>
          Descrição
          <textarea value={story.description} onChange={(e) => setStory({ ...story, description: e.target.value })} />
        </label>
        <ImageField label="Imagem" value={story.imageUrl} onChange={(imageUrl) => setStory({ ...story, imageUrl })} />
        {msg ? <p className="msg ok">{msg}</p> : null}
        {error ? <p className="msg err">{error}</p> : null}
        <button className="btn" type="submit">
          Salvar
        </button>
      </form>
    </>
  );
}
