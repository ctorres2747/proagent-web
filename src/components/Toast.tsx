"use client";

import { useEffect } from "react";

export function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type?: "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = window.setTimeout(onClose, 3500);
    return () => window.clearTimeout(t);
  }, [onClose]);

  const styles =
    type === "error"
      ? "border-[var(--pa-danger)]/40 bg-[#FCEAEA] text-[var(--pa-danger)]"
      : "border-[var(--pa-border)] bg-[var(--pa-surface)] text-[var(--pa-ink)]";

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-[60] max-w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border px-4 py-3 text-[13px] font-semibold shadow-lg ${styles}`}
      role="status"
    >
      {message}
    </div>
  );
}
