"use client";

import { formatRelativeTime } from "@/lib/formatRelativeTime";
import type { Client } from "@/services/interfaces/clients";
import { ChannelBadge } from "./ChannelBadge";
import { TemperatureChip } from "./TemperatureChip";

const DISCARD_REASON_LABEL: Record<string, string> = {
  compro_otro_asesor: "Compró con otro asesor",
  sin_presupuesto: "Sin presupuesto",
  credito_no_aprobado: "Crédito no aprobado",
  no_responde: "No responde",
  ya_no_busca: "Ya no busca",
  otro: "Otro",
};

function formatBudget(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  const fmt = (n: number) => new Intl.NumberFormat("es-CO").format(n);
  if (min != null && max != null) return `$ ${fmt(min)} – ${fmt(max)} M`;
  if (min != null) return `Desde $ ${fmt(min)} M`;
  return `Hasta $ ${fmt(max as number)} M`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Tarjeta de cliente — mismo esqueleto visual que LeadCard (Captación),
 * handoff §3: avatar, nombre, actividad pasada, canal, presupuesto,
 * búsqueda, temperatura, chip de inmuebles vinculados. */
export function ClientCard({
  client,
  active,
  onClick,
}: {
  client: Client;
  active: boolean;
  onClick: () => void;
}) {
  const presupuesto = formatBudget(client.presupuestoMin, client.presupuestoMax);
  const busqueda = [client.tiposInmueble.join(", "), client.zonas.join(", ")]
    .filter(Boolean)
    .join(" · ");
  const actividad = formatRelativeTime(client.updatedAt);
  const linkedCount = client.linkedProperties.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full min-w-0 flex-col gap-2 rounded-xl border bg-[var(--pa-surface)] p-3 text-left transition-shadow hover:shadow-[0_6px_18px_rgba(16,33,49,.10)] ${
        active ? "border-[var(--pa-navy)] ring-1 ring-[var(--pa-navy)]" : "border-[var(--pa-border)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--pa-bg-alt)] text-[11.5px] font-extrabold text-[var(--pa-text-secondary)]">
            {initials(client.nombre)}
          </span>
          <div className="min-w-0">
            <div className="line-clamp-2 text-[13px] font-bold leading-snug text-[var(--pa-ink)]">
              {client.nombre}
            </div>
            {actividad ? (
              <div className="mt-0.5 text-[11px] text-[var(--pa-faint)]">{actividad}</div>
            ) : null}
          </div>
        </div>
        <ChannelBadge channel={client.canal} channelOther={client.canalOtro} />
      </div>

      {presupuesto ? (
        <div className="text-[14px] font-extrabold text-[var(--pa-navy)]">{presupuesto}</div>
      ) : null}

      {busqueda ? (
        <div className="truncate text-[11.5px] font-semibold text-[var(--pa-text-secondary)]">
          {busqueda}
        </div>
      ) : null}

      {client.estado === "descartado" && client.motivoDescarte ? (
        <div className="text-[11px] font-bold text-[var(--pa-danger)]">
          Motivo: {DISCARD_REASON_LABEL[client.motivoDescarte] ?? client.motivoDescarte}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <TemperatureChip value={client.temperatura} />
        {linkedCount > 0 ? (
          <span className="rounded-[6px] bg-[var(--pa-navy-050)] px-[8px] py-[2px] text-[10.5px] font-bold text-[var(--pa-navy)]">
            {linkedCount === 1
              ? `F-${client.linkedProperties[0].id}`
              : `F-${client.linkedProperties[0].id} +${linkedCount - 1}`}
          </span>
        ) : null}
      </div>
    </button>
  );
}
