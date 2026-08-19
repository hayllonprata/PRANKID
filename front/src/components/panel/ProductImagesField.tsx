"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/panel/ConfirmModal";
import { api, mediaUrl, type ProductImage } from "@/lib/api";

export function ProductImagesField({
  images,
  onChange,
  onUpload,
  onRemove,
}: {
  images: ProductImage[];
  onChange?: (images: ProductImage[]) => void;
  onUpload?: (urls: string[]) => Promise<void> | void;
  onRemove?: (image: ProductImage) => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<ProductImage | null>(null);

  async function onFiles(fileList?: FileList | null) {
    const files = [...(fileList || [])];
    if (!files.length) return;
    setBusy(true);
    setError("");
    setProgress(files.length > 1 ? `Enviando 0/${files.length}...` : "Enviando...");
    try {
      const body = new FormData();
      for (const file of files) body.append("file", file);
      const result = await api<{ url: string; urls?: string[] }>("/api/upload", { method: "POST", body });
      const urls = result.urls?.length ? result.urls : result.url ? [result.url] : [];
      setProgress(files.length > 1 ? `Enviando ${urls.length}/${files.length}...` : "Enviando...");
      if (!urls.length) throw new Error("Falha no upload");
      if (onUpload) await onUpload(urls);
      else {
        onChange?.([
          ...images,
          ...urls.map((imageUrl, index) => ({
            id: `local-${Date.now()}-${index}`,
            imageUrl,
            sortOrder: images.length + index,
          })),
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  async function confirmRemove() {
    if (!pending) return;
    setBusy(true);
    setError("");
    try {
      if (onRemove) await onRemove(pending);
      else onChange?.(images.filter((item) => item.id !== pending.id));
      setPending(null);
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
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          disabled={busy}
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <span className="muted">
          Selecione uma ou várias fotos. JPG, PNG, GIF e WEBP são convertidos para WEBP para ficar mais leve.
        </span>
        {progress ? <span>{progress}</span> : null}
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
                onClick={() => setPending(image)}
              >
                ×
              </button>
            </figure>
          ))}
        </div>
      ) : (
        <p className="muted">Nenhuma imagem cadastrada. Envie uma ou mais fotos acima.</p>
      )}
      <ConfirmModal
        open={Boolean(pending)}
        message="Excluir esta imagem? Essa ação não pode ser desfeita."
        busy={busy}
        onCancel={() => !busy && setPending(null)}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
