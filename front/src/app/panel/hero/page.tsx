"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, type Hero } from "@/lib/api";
import { ImageField } from "@/components/panel/ImageField";

export default function HeroPage() {
  const [hero, setHero] = useState<Hero | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<Hero>("/api/admin/hero").then(setHero).catch((err: Error) => setError(err.message));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!hero) return;
    setMsg("");
    setError("");
    try {
      const saved = await api<Hero>("/api/admin/hero", {
        method: "PUT",
        body: JSON.stringify(hero),
      });
      setHero(saved);
      setMsg("Hero salvo.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar");
    }
  }

  if (!hero) return <p>Carregando...</p>;

  return (
    <>
      <h1>Hero</h1>
      <form className="panel-card form-grid" onSubmit={onSubmit}>
        <label>
          Título
          <input value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} />
        </label>
        <label>
          Subtítulo
          <textarea value={hero.subtitle} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} />
        </label>
        <label>
          Texto do botão
          <input value={hero.ctaText} onChange={(e) => setHero({ ...hero, ctaText: e.target.value })} />
        </label>
        <ImageField label="Imagem" value={hero.imageUrl} onChange={(imageUrl) => setHero({ ...hero, imageUrl })} />
        <label>
          <span>
            <input
              type="checkbox"
              checked={hero.enabled}
              onChange={(e) => setHero({ ...hero, enabled: e.target.checked })}
            />{" "}
            Exibir na loja
          </span>
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
