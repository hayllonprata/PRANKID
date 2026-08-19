"use client";

import { useEffect, useRef, useState } from "react";
import { ConfirmModal } from "@/components/panel/ConfirmModal";
import { api, mediaUrl, type ProductImage } from "@/lib/api";

function withSortOrder(list: ProductImage[]) {
  return list.map((item, sortOrder) => ({ ...item, sortOrder }));
}

function moveImage(list: ProductImage[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return withSortOrder(next);
}

export function ProductImagesField({
  images,
  onChange,
  onUpload,
  onRemove,
  onReorder,
}: {
  images: ProductImage[];
  onChange?: (images: ProductImage[]) => void;
  onUpload?: (urls: string[]) => Promise<void> | void;
  onRemove?: (image: ProductImage) => Promise<void> | void;
  onReorder?: (images: ProductImage[]) => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<ProductImage | null>(null);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [didDrag, setDidDrag] = useState(false);
  const [items, setItems] = useState(images);
  const itemsRef = useRef(images);

  useEffect(() => {
    setItems(images);
    itemsRef.current = images;
  }, [images]);

  const zoomImage = zoomIndex !== null ? items[zoomIndex] : undefined;

  useEffect(() => {
    if (zoomIndex === null) return;
    if (!items.length) {
      setZoomIndex(null);
      return;
    }
    if (zoomIndex >= items.length) setZoomIndex(items.length - 1);
  }, [items, zoomIndex]);

  useEffect(() => {
    if (zoomIndex === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setZoomIndex(null);
      if (event.key === "ArrowRight" && items.length > 1) {
        setZoomIndex((current) => ((current ?? 0) + 1) % items.length);
      }
      if (event.key === "ArrowLeft" && items.length > 1) {
        setZoomIndex((current) => ((current ?? 0) - 1 + items.length) % items.length);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length, zoomIndex]);

  async function persistOrder(next: ProductImage[]) {
    if (onReorder) await onReorder(next);
    else onChange?.(next);
  }

  async function onFiles(fileList?: FileList | null) {
    const files = [...(fileList || [])];
    if (!files.length) return;
    setBusy(true);
    setError("");
    setProgress(files.length > 1 ? `Enviando 0/${files.length}...` : "Enviando...");
    const urls: string[] = [];
    let failed = "";
    try {
      for (let index = 0; index < files.length; index += 1) {
        setProgress(files.length > 1 ? `Enviando ${index + 1}/${files.length}...` : "Enviando...");
        const body = new FormData();
        body.append("file", files[index]);
        const result = await api<{ url: string; urls?: string[] }>("/api/upload", { method: "POST", body });
        const uploaded = result.urls?.length ? result.urls : result.url ? [result.url] : [];
        if (!uploaded.length) throw new Error("Falha no upload");
        urls.push(...uploaded);
      }
    } catch (err) {
      failed = err instanceof Error ? err.message : "Falha no upload";
    }

    if (urls.length) {
      try {
        if (onUpload) await onUpload(urls);
        else {
          onChange?.(
            withSortOrder([
              ...items,
              ...urls.map((imageUrl, index) => ({
                id: `local-${Date.now()}-${index}`,
                imageUrl,
                sortOrder: items.length + index,
              })),
            ]),
          );
        }
      } catch (err) {
        failed = err instanceof Error ? err.message : failed || "Falha no upload";
      }
    }

    if (failed) {
      setError(
        urls.length ? `${urls.length} imagem(ns) enviada(s). As demais falharam: ${failed}` : failed,
      );
    }

    setBusy(false);
    setProgress("");
  }

  async function confirmRemove() {
    if (!pending) return;
    setBusy(true);
    setError("");
    try {
      if (onRemove) await onRemove(pending);
      else onChange?.(withSortOrder(items.filter((item) => item.id !== pending.id)));
      setPending(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir");
    } finally {
      setBusy(false);
    }
  }

  async function dropAt(to: number) {
    if (dragIndex === null) return;
    const from = dragIndex;
    setDragIndex(null);
    setOverIndex(null);
    if (from === to) return;
    const previous = itemsRef.current;
    const next = moveImage(previous, from, to);
    itemsRef.current = next;
    setItems(next);
    setBusy(true);
    setError("");
    try {
      await persistOrder(next);
    } catch (err) {
      itemsRef.current = previous;
      setItems(previous);
      setError(err instanceof Error ? err.message : "Falha ao reordenar");
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
          accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
          multiple
          disabled={busy}
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <span className="muted">
          Clique para ampliar. Arraste para reordenar — a primeira foto vira a capa. JPG, PNG, GIF, WEBP e HEIC viram
          WEBP com no máximo 1400px de largura.
        </span>
        {progress ? <span>{progress}</span> : null}
        {error ? <span className="msg err">{error}</span> : null}
      </label>
      {items.length ? (
        <div className="image-gallery">
          {items.map((image, index) => (
            <figure
              className={`image-gallery-item${dragIndex === index ? " is-dragging" : ""}${overIndex === index && dragIndex !== index ? " is-over" : ""}`}
              key={image.id || image.imageUrl}
              draggable={!busy}
              onDragStart={(event) => {
                setDidDrag(true);
                setDragIndex(index);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", String(index));
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setOverIndex(index);
              }}
              onDragLeave={() => {
                setOverIndex((current) => (current === index ? null : current));
              }}
              onDrop={(event) => {
                event.preventDefault();
                dropAt(index);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
                window.setTimeout(() => setDidDrag(false), 0);
              }}
              onClick={() => {
                if (didDrag || busy) return;
                setZoomIndex(index);
              }}
            >
              <img src={mediaUrl(image.imageUrl)} alt={`Foto ${index + 1}`} draggable={false} />
              {index === 0 ? <span className="image-gallery-cap">Capa</span> : null}
              <button
                className="image-gallery-remove"
                type="button"
                aria-label="Excluir imagem"
                disabled={busy}
                onClick={(event) => {
                  event.stopPropagation();
                  setPending(image);
                }}
              >
                ×
              </button>
            </figure>
          ))}
        </div>
      ) : (
        <p className="muted">Nenhuma imagem cadastrada. Envie uma ou mais fotos acima.</p>
      )}
      {zoomImage ? (
        <>
          <div className="drawer-backdrop" onClick={() => setZoomIndex(null)} />
          <div className="zoom-modal" role="dialog" aria-modal="true" aria-label="Ampliar imagem">
            <div className="zoom-dialog">
              <div className="card-row">
                <h2>Foto {(zoomIndex ?? 0) + 1}</h2>
                <button className="btn ghost" type="button" onClick={() => setZoomIndex(null)}>
                  Fechar
                </button>
              </div>
              <div className="zoom-stage">
                <img src={mediaUrl(zoomImage.imageUrl)} alt={`Foto ${(zoomIndex ?? 0) + 1}`} />
              </div>
              {items.length > 1 ? (
                <div className="zoom-thumbs">
                  {items.map((image, index) => (
                    <button
                      key={image.id || image.imageUrl}
                      className={index === zoomIndex ? "on" : ""}
                      type="button"
                      aria-label={`Foto ${index + 1}`}
                      onClick={() => setZoomIndex(index)}
                    >
                      <img src={mediaUrl(image.imageUrl)} alt="" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
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
