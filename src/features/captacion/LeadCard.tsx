"use client";

import { LeadCoverImage } from "@/components/LeadCoverImage";
import { formatPrice } from "@/lib/format";
import type { Lead } from "@/services/interfaces/leads";

/** Lead card — misma línea gráfica que PropertyCard (Inventario tarjetas). */
export function LeadCard({
  lead,
  active,
  onClick,
}: {
  lead: Lead;
  active: boolean;
  onClick: () => void;
}) {
  const esArriendo = (lead.precioNum ?? 0) < 5_000_000;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-col rounded-2xl border bg-[var(--pa-surface)] p-3.5 text-left transition-shadow hover:shadow-sm ${
        active
          ? "border-[var(--pa-navy)] ring-1 ring-[var(--pa-navy)]"
          : "border-[var(--pa-border)]"
      }`}
    >
      <LeadCoverImage url={lead.imagenUrl} variant="card" />
      <div className="mb-1 line-clamp-1 text-sm font-bold text-[var(--pa-ink)]">
        {lead.tipoInmueble ?? "Inmueble"}
        {lead.municipio ? ` · ${lead.municipio}` : ""}
      </div>
      <div className="mb-2.5 text-xs text-[var(--pa-muted)]">{lead.portal}</div>
      <div className="text-[15px] font-extrabold text-[var(--pa-navy)]">
        {lead.precio ?? formatPrice(lead.precioNum, esArriendo)}
      </div>
    </button>
  );
}
