"use client";

import { useEffect } from "react";

export function ConfirmModal({
  open,
  title = "Confirmar exclusão",
  message,
  confirmLabel = "Excluir",
  cancelLabel = "Cancelar",
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <>
      <div className="drawer-backdrop confirm-backdrop" onClick={() => !busy && onCancel()} />
      <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <div className="confirm-dialog">
          <h2 id="confirm-modal-title">{title}</h2>
          <p>{message}</p>
          <div className="row-actions confirm-actions">
            <button className="btn ghost" type="button" disabled={busy} onClick={onCancel}>
              {cancelLabel}
            </button>
            <button className="btn magenta" type="button" disabled={busy} onClick={onConfirm}>
              {busy ? "Excluindo..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
