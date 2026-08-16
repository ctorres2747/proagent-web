"use client";

import {
  deletePropertyConfirmMessage,
  deletePropertyConfirmTitle,
} from "@/lib/deleteProperty";

interface DeletePropertyDialogProps {
  open: boolean;
  titulo: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeletePropertyDialog({
  open,
  titulo,
  busy = false,
  onCancel,
  onConfirm,
}: DeletePropertyDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={busy ? undefined : onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-property-title"
        className="w-full max-w-md rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="delete-property-title"
          className="text-[15px] font-extrabold text-[var(--pa-ink)]"
        >
          {deletePropertyConfirmTitle()}
        </h2>
        <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-[var(--pa-muted)]">
          {deletePropertyConfirmMessage(titulo)}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-[10px] border border-[var(--pa-border)] px-4 py-2 text-xs font-bold text-[var(--pa-ink)] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="rounded-[10px] bg-[var(--pa-danger)] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {busy ? "Eliminando…" : "Eliminar permanentemente"}
          </button>
        </div>
      </div>
    </div>
  );
}
