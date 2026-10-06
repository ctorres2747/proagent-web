"use client";

import { formatRelativeTime } from "@/lib/formatRelativeTime";
import type { Client } from "@/services/interfaces/clients";
import { ChannelBadge } from "./ChannelBadge";
import { DISCARD_REASON_LABEL, formatBudget, initials } from "./ClientCard";
import { TemperatureChip } from "./TemperatureChip";

/** Tabla de clientes descartados — reemplaza el kanban cuando el toggle "Ver
 * descartados" está activo (en vez de agregar una 6ta columna, que cortaba
 * el ancho disponible de las demás y obligaba a scroll horizontal). */
export function DiscardedClientsTable({
  clients,
  selectedId,
  onSelect,
}: {
  clients: Client[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (clients.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)]">
        <p className="text-[12.5px] font-semibold text-[var(--pa-faint)]">
          No hay clientes descartados
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)]">
      <table className="w-full min-w-[920px] border-collapse text-[12.5px]">
        <thead>
          <tr className="border-b border-[var(--pa-border)] text-left text-[var(--pa-muted)]">
            <th className="px-3.5 py-2.5 font-semibold">Cliente</th>
            <th className="px-2 py-2.5 font-semibold">Canal</th>
            <th className="px-2 py-2.5 font-semibold">Presupuesto</th>
            <th className="px-2 py-2.5 font-semibold">Búsqueda</th>
            <th className="px-2 py-2.5 font-semibold">Motivo</th>
            <th className="px-2 py-2.5 font-semibold">Temperatura</th>
            <th className="px-3.5 py-2.5 font-semibold">Actividad</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => {
            const presupuesto = formatBudget(c.presupuestoMin, c.presupuestoMax);
            const busqueda = [c.tiposInmueble.join(", "), c.zonas.join(", ")]
              .filter(Boolean)
              .join(" · ");
            return (
              <tr
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`cursor-pointer border-t border-[var(--pa-border)] transition-colors hover:bg-[var(--pa-bg)] ${
                  c.id === selectedId ? "bg-[var(--pa-navy-050)]" : ""
                }`}
              >
                <td className="px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--pa-bg-alt)] text-[10.5px] font-extrabold text-[var(--pa-text-secondary)]">
                      {initials(c.nombre)}
                    </span>
                    <span className="font-bold text-[var(--pa-ink)]">{c.nombre}</span>
                  </div>
                </td>
                <td className="px-2 py-2.5">
                  <ChannelBadge channel={c.canal} channelOther={c.canalOtro} />
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 font-bold text-[var(--pa-navy)]">
                  {presupuesto ?? "—"}
                </td>
                <td className="px-2 py-2.5 text-[var(--pa-text-secondary)]">{busqueda || "—"}</td>
                <td className="px-2 py-2.5 font-bold text-[var(--pa-danger)]">
                  {c.motivoDescarte ? DISCARD_REASON_LABEL[c.motivoDescarte] ?? c.motivoDescarte : "—"}
                </td>
                <td className="px-2 py-2.5">
                  <TemperatureChip value={c.temperatura} />
                </td>
                <td className="whitespace-nowrap px-3.5 py-2.5 text-[var(--pa-faint)]">
                  {formatRelativeTime(c.updatedAt) || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
