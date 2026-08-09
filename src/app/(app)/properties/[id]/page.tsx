"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { propertiesService } from "@/services";

const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { token } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["property", id],
    queryFn: () => propertiesService.get(id, token ?? undefined),
    enabled: Boolean(id),
  });

  return (
    <div>
      <Link
        href="/properties"
        className="text-sm text-[var(--pa-muted)] hover:underline"
      >
        ← Propiedades
      </Link>

      {isLoading && (
        <p className="mt-6 text-sm text-[var(--pa-muted)]">Cargando…</p>
      )}
      {isError && (
        <p className="mt-6 text-sm text-[var(--pa-danger)]">
          No se pudo cargar la propiedad.
        </p>
      )}

      {data && (
        <div className="mt-4">
          <h1 className="text-2xl font-bold text-[var(--pa-navy)]">
            {data.titulo}
          </h1>
          <p className="mt-1 text-sm text-[var(--pa-muted)]">
            {data.tipo} · {data.municipio}
          </p>
          <div className="mt-3 text-xl font-semibold text-[var(--pa-accent)]">
            {data.precio !== null
              ? cop.format(data.precio)
              : "Precio a convenir"}
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Fact label="Habitaciones" value={data.habitaciones} />
            <Fact label="Baños" value={data.banos} />
            <Fact
              label="Área"
              value={data.areaM2 !== null ? `${data.areaM2} m²` : null}
            />
            <Fact label="Completitud" value={`${data.completeness}%`} />
          </dl>
        </div>
      )}
    </div>
  );
}

function Fact({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="rounded-xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-4">
      <div className="text-lg font-semibold text-[var(--pa-ink)]">
        {value ?? "—"}
      </div>
      <div className="text-xs text-[var(--pa-muted)]">{label}</div>
    </div>
  );
}
