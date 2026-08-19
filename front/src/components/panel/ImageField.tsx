"use client";

import { useState } from "react";
import { api, mediaUrl } from "@/lib/api";

export function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
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
      onChange(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setBusy(false);
    }
  }

  return (
    <label>
      {label}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      {busy ? <span>Enviando...</span> : null}
      <span className="muted">JPG, PNG, GIF, WEBP e HEIC são convertidos para WEBP no envio.</span>
      {error ? <span className="msg err">{error}</span> : null}
      {value ? <img className="preview" src={mediaUrl(value)} alt="" /> : null}
    </label>
  );
}
