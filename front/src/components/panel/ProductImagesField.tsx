"use client";

import { useState } from "react";
import { api, mediaUrl, type ProductImage } from "@/lib/api";

export function ProductImagesField({
  images,
  onChange,
  onUpload,
  onRemove,
}: {
  images: ProductImage[];
  onChange?: (images: ProductImage[]) => void;
  onUpload?: (url: string) => Promise<void> | void;
  onRemove?: (image: ProductImage) => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const result = await api<{ url: string }>("/api/upload", { method: "POST", body });
      if (onUpload) await onUpload(result.url);
      else {
        onChange?.([
          ...images,
          { id: `local-${Date.now()}`, imageUrl: result.url, sortOrder: images.length },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setBusy(false);
    }
  }

  async function remove(image: ProductImage) {
    if (!confirm("Excluir esta imagem?")) return;
    setBusy(true);
    setError("");
    try {
      if (onRemove) await onRemove(image);
      else onChange?.(images.filter((item) => item.id !== image.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="form-grid">
      <label>
        Imagens do produto
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {busy ? <span>Enviando...</span> : null}
        {error ? <span className="msg err">{error}</span> : null}
      </label>
      {images.length ? (
        <div className="image-gallery">
          {images.map((image, index) => (
            <figure className="image-gallery-item" key={image.id || image.imageUrl}>
              <img src={mediaUrl(image.imageUrl)} alt={`Foto ${index + 1}`} />
              {index === 0 ? <span className="image-gallery-cap">Capa</span> : null}
              <button
                className="image-gallery-remove"
                type="button"
                aria-label="Excluir imagem"
                disabled={busy}
                onClick={() => remove(image)}
              >
                ×
              </button>
            </figure>
          ))}
        </div>
      ) : (
        <p className="muted">Nenhuma imagem cadastrada. Envie uma ou mais fotos acima.</p>
      )}
    </div>
  );
}
