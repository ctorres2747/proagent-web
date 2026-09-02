"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

export function SearchTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-[34px] max-w-[440px] flex-1 items-center gap-2 rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg-alt)] px-3 text-left md:flex"
        aria-label="Buscar"
      >
        <Search size={15} className="shrink-0 text-[var(--pa-text-muted)]" strokeWidth={1.9} />
        <span className="flex-1 truncate text-[12.5px] text-[var(--pa-text-muted)]">
          Buscar propiedad, cliente o código
        </span>
        <kbd className="rounded border border-[var(--pa-border)] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[var(--pa-text-muted)]">
          ⌘K
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg-alt)] md:hidden"
        aria-label="Buscar"
      >
        <Search size={18} strokeWidth={1.9} className="text-[var(--pa-text-secondary)]" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-[rgba(16,33,49,.45)] px-4 pt-[12vh]">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Búsqueda global"
            className="w-full max-w-lg rounded-2xl bg-[var(--pa-surface)] p-6 shadow-[var(--pa-shadow-overlay)]"
          >
            <h2 className="text-[15px] font-extrabold text-[var(--pa-ink)]">
              Búsqueda global
            </h2>
            <p className="mt-2 text-[13px] text-[var(--pa-muted)]">
              La búsqueda global llega en la próxima versión.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/properties"
                className="rounded-[10px] bg-[var(--pa-navy-050)] px-3 py-2 text-[12.5px] font-bold text-[var(--pa-navy)]"
                onClick={() => setOpen(false)}
              >
                Ir a Inventario
              </Link>
              <Link
                href="/captacion"
                className="rounded-[10px] bg-[var(--pa-navy-050)] px-3 py-2 text-[12.5px] font-bold text-[var(--pa-navy)]"
                onClick={() => setOpen(false)}
              >
                Ir a Captación
              </Link>
            </div>
            <button
              type="button"
              className="mt-5 text-[12.5px] font-semibold text-[var(--pa-muted)]"
              onClick={() => setOpen(false)}
            >
              Cerrar (Esc)
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
