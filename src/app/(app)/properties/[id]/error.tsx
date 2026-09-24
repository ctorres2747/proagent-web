"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function PropertyDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error en detalle de propiedad:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-10">
      <div className="rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-6">
        <h1 className="text-lg font-bold text-[var(--pa-ink)]">
          No se pudo cargar esta propiedad
        </h1>
        <p className="mt-2 text-sm text-[var(--pa-muted)]">
          Ocurrió un error inesperado al mostrar el inventario. Puedes volver al
          listado e intentar de nuevo.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/properties"
            className="inline-flex items-center justify-center rounded-xl bg-[var(--pa-navy)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Volver a inventario
          </Link>
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-xl border border-[var(--pa-border)] bg-[var(--pa-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--pa-ink)] hover:bg-[var(--pa-bg)]"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}
