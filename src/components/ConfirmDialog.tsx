"use client";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  /** `danger` = botón rojo; `primary` = navy (default). */
  tone?: "primary" | "danger";
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancelar",
  busy = false,
  tone = "primary",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmClass =
    tone === "danger"
      ? "rounded-[10px] bg-[var(--pa-danger)] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
      : "rounded-[10px] bg-[var(--pa-navy)] px-4 py-2 text-xs font-bold text-white disabled:opacity-50";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={busy ? undefined : onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pa-confirm-title"
        className="w-full max-w-md rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="pa-confirm-title"
          className="text-[15px] font-extrabold text-[var(--pa-ink)]"
        >
          {title}
        </h2>
        <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-[var(--pa-muted)]">
          {message}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-[10px] border border-[var(--pa-border)] px-4 py-2 text-xs font-bold text-[var(--pa-ink)] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={confirmClass}
          >
            {busy ? "Espera…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
