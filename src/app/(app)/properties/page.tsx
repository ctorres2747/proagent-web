"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { propertiesService } from "@/services";

const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default function PropertiesPage() {
  const { token } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["properties"],
    queryFn: () => propertiesService.list(token ?? undefined),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--pa-navy)]">Propiedades</h1>
      <p className="mt-1 text-sm text-[var(--pa-muted)]">
        Fichas disponibles para publicar.
      </p>

      {isLoading && (
        <p className="mt-6 text-sm text-[var(--pa-muted)]">Cargando…</p>
      )}
      {isError && (
        <p className="mt-6 text-sm text-[var(--pa-danger)]">
          No se pudieron cargar las propiedades.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {data?.map((p) => (
          <Link
            key={p.id}
            href={`/properties/${p.id}`}
            className="rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-5 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-[var(--pa-ink)]">{p.titulo}</h2>
              <span className="shrink-0 rounded-full bg-[var(--pa-bg)] px-2 py-0.5 text-xs text-[var(--pa-muted)]">
                {p.completeness}%
              </span>
            </div>
            <div className="mt-1 text-sm text-[var(--pa-muted)]">
              {p.tipo} · {p.municipio}
            </div>
            <div className="mt-3 font-semibold text-[var(--pa-accent)]">
              {p.precio !== null ? cop.format(p.precio) : "Precio a convenir"}
            </div>
          </Link>
        ))}
      </div>

      {data && data.length === 0 && (
        <p className="mt-6 text-sm text-[var(--pa-muted)]">
          Aún no tienes propiedades.
        </p>
      )}
    </div>
  );
}
