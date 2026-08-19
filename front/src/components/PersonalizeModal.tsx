"use client";

import { FormEvent, useState } from "react";
import type { PersonalBrief, Product } from "@/lib/api";

export function PersonalizeModal({
  product,
  onCancel,
  onConfirm,
}: {
  product: Product;
  onCancel: () => void;
  onConfirm: (brief: PersonalBrief) => void;
}) {
  const [job, setJob] = useState("");
  const [likes, setLikes] = useState("");
  const [colors, setColors] = useState("");
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!job.trim() || !likes.trim() || !colors.trim()) {
      setError("Preencha os três campos para o artista ler a sua essência.");
      return;
    }
    onConfirm({ job: job.trim(), likes: likes.trim(), colors: colors.trim() });
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onCancel} />
      <aside className="drawer personalize-drawer" aria-label="Personalizar PRANKID">
        <div className="card-row">
          <h2>Seu PRANKID</h2>
          <button className="btn ghost" type="button" onClick={onCancel}>
            Fechar
          </button>
        </div>
        <p className="muted">
          Peça personalizada. Conta um pouco de você para o Dan transferir a sua essência para o {product.name}.
        </p>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            O que você faz?
            <textarea value={job} onChange={(e) => setJob(e.target.value)} placeholder="Trabalho, ofício, rotina..." />
          </label>
          <label>
            Do que você gosta?
            <textarea value={likes} onChange={(e) => setLikes(e.target.value)} placeholder="Estilo, referências, manias, o que te representa..." />
          </label>
          <label>
            Quais cores você quer no seu PRANKID?
            <textarea value={colors} onChange={(e) => setColors(e.target.value)} placeholder="Amarelo, preto, magenta..." />
          </label>
          {error ? <p className="cart-error">{error}</p> : null}
          <button className="btn full" type="submit">
            Continuar a compra
          </button>
        </form>
      </aside>
    </>
  );
}
