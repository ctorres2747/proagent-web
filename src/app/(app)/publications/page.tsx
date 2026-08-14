"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { propertiesService, publicationsService } from "@/services";
import type { PublicationFilter } from "@/services/interfaces/publications";
import { formatScheduledFor } from "@/lib/schedule";

const FILTERS: { id: PublicationFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "draft", label: "Borradores" },
  { id: "scheduled", label: "Programadas" },
  { id: "published", label: "Publicadas" },
  { id: "error", label: "Con error" },
];

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  scheduled: "Programada",
  publishing: "Publicando",
  published: "Publicada",
  partial: "Parcial",
  failed: "Error",
};

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-[var(--pa-bg-alt)] text-[var(--pa-muted)]",
  scheduled: "bg-[#FEF3E2] text-[#B45309]",
  publishing: "bg-[#FEF3E2] text-[#B45309]",
  published: "bg-[#E6F4EE] text-[var(--pa-accent)]",
  partial: "bg-[#FEF3E2] text-[#B45309]",
  failed: "bg-[#FCEAEA] text-[var(--pa-danger)]",
};

export default function PublicationsInboxPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<PublicationFilter>("all");

  const {
    data: publications,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["publications", filter],
    queryFn: () => publicationsService.list(filter, token ?? undefined),
  });

  const propertyIds = useMemo(
    () => [...new Set((publications ?? []).map((p) => p.propertyId))],
    [publications],
  );

  const { data: properties } = useQuery({
    queryKey: ["properties", "for-publications", propertyIds.join(",")],
    queryFn: async () => {
      const list = await propertiesService.list(token ?? undefined);
      return Object.fromEntries(list.map((p) => [p.id, p]));
    },
    enabled: propertyIds.length > 0,
  });

  const openPublication = (propertyId: string) => {
    router.push(`/properties/${propertyId}`);
  };

  return (
    <div className="px-6 py-8 md:px-10">
      <h1 className="text-[26px] font-extrabold text-[var(--pa-ink)]">
        Publicaciones
      </h1>
      <p className="mb-6 mt-1 text-[13px] text-[var(--pa-muted)]">
        Borradores, programadas y resultados por canal.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
              filter === f.id
                ? "bg-[var(--pa-navy)] text-white"
                : "border border-[var(--pa-border)] bg-[var(--pa-surface)] text-[#45525E] hover:border-[var(--pa-navy)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <p className="text-sm text-[var(--pa-muted)]">Cargando publicaciones…</p>
      )}

      {isError && (
        <p className="text-sm text-[var(--pa-danger)]">
          {error instanceof Error
            ? error.message
            : "No se pudieron cargar las publicaciones."}
        </p>
      )}

      {!isLoading && !isError && publications?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--pa-border)] bg-[var(--pa-surface)] px-8 py-16 text-center">
          <p className="text-[15px] font-bold text-[var(--pa-ink)]">
            Sin publicaciones
          </p>
          <p className="mt-2 text-[13px] text-[var(--pa-muted)]">
            {filter === "all"
              ? "Crea una publicación desde una propiedad del inventario."
              : "No hay publicaciones con este filtro."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/properties")}
            className="mt-6 rounded-[10px] bg-[var(--pa-navy)] px-5 py-3 text-[13px] font-bold text-white"
          >
            Ir al inventario
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {publications?.map((pub) => {
          const property = properties?.[pub.propertyId];
          const title =
            pub.sharedTitle || property?.titulo || `Propiedad ${pub.propertyId}`;
          return (
            <button
              key={pub.id}
              type="button"
              onClick={() => openPublication(pub.propertyId)}
              className="flex items-center gap-4 rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] px-5 py-4 text-left transition-shadow hover:shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="line-clamp-1 text-[14px] font-bold text-[var(--pa-ink)]">
                    {title}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${STATUS_CLASS[pub.status] ?? STATUS_CLASS.draft}`}
                  >
                    {STATUS_LABEL[pub.status] ?? pub.status}
                  </span>
                </div>
                <div className="text-xs text-[var(--pa-muted)]">
                  {property
                    ? `${property.tipo} · ${property.municipio}`
                    : `Propiedad #${pub.propertyId}`}
                  {pub.status === "scheduled" && pub.scheduledFor
                    ? ` · ${formatScheduledFor(pub.scheduledFor, pub.timezone)}`
                    : ""}
                </div>
                {pub.channelResults.length > 0 && (
                  <div className="mt-1 text-[11px] text-[var(--pa-faint)]">
                    {pub.channelResults.length} canal
                    {pub.channelResults.length === 1 ? "" : "es"}
                  </div>
                )}
              </div>
              <span className="shrink-0 text-[13px] font-bold text-[var(--pa-navy)]">
                Abrir →
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
