"use client";

import { LeadCoverImage } from "@/components/LeadCoverImage";
import { PortalLogo } from "@/components/PortalLogo";
import { formatPrice } from "@/lib/format";
import type { Lead } from "@/services/interfaces/leads";

/** Lead card compacta — cabe en 4 columnas dentro del max-w compartido del shell. */
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
      className={`flex w-full min-w-0 flex-col rounded-xl border bg-[var(--pa-surface)] p-2.5 text-left transition-shadow hover:shadow-sm ${
        active
          ? "border-[var(--pa-navy)] ring-1 ring-[var(--pa-navy)]"
          : "border-[var(--pa-border)]"
      }`}
    >
      <LeadCoverImage url={lead.imagenUrl} variant="compact" />
      <div className="line-clamp-2 text-[12px] font-bold leading-snug text-[var(--pa-ink)]">
        {lead.tipoInmueble ?? "Inmueble"}
        {lead.municipio ? ` · ${lead.municipio}` : ""}
      </div>
      <div className="mt-0.5">
        <PortalLogo portal={lead.portal} size={16} />
      </div>
      <div className="mt-1.5 text-[13px] font-extrabold text-[var(--pa-navy)]">
        {lead.precio ?? formatPrice(lead.precioNum, esArriendo)}
      </div>
    </button>
  );
}
