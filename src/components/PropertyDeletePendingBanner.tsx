"use client";

import { X } from "lucide-react";
import { Spinner } from "@/components/Spinner";
import { deletePropertyPendingNoticeMessage } from "@/lib/deleteProperty";

interface PropertyDeletePendingBannerProps {
  variant: "list" | "detail";
  onDismiss: () => void;
}

export function PropertyDeletePendingBanner({
  variant,
  onDismiss,
}: PropertyDeletePendingBannerProps) {
  const message = deletePropertyPendingNoticeMessage(variant);

  return (
    <div
      role="status"
      className="mb-4 flex flex-col gap-3 rounded-xl border border-[#E8D4B8] bg-[#FFF8EE] px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
    >
      <p className="flex items-start gap-2 text-sm font-semibold text-[var(--pa-warning-ink)]">
        {variant === "detail" ? (
          <Spinner size={14} className="mt-0.5 shrink-0 text-[var(--pa-warning-ink)]" />
        ) : null}
        <span>{message}</span>
      </p>
      <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
        <button
          type="button"
          className="rounded-[10px] bg-white px-3 py-1.5 text-xs font-bold text-[var(--pa-navy)] shadow-sm ring-1 ring-[#E8D4B8]"
          onClick={onDismiss}
        >
          Entendido
        </button>
        <button
          type="button"
          aria-label="Cerrar aviso"
          className="rounded-lg p-1 text-[var(--pa-muted)] hover:bg-white/70"
          onClick={onDismiss}
        >
          <X size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}
