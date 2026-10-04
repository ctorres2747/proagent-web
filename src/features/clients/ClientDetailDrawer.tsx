"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { formatAppointment } from "@/lib/formatRelativeTime";
import type {
  Client,
  ClientDiscardReason,
  ClientPaymentMethod,
  ClientStage,
  ClientTemperature,
  ClientWrite,
} from "@/services/interfaces/clients";
import type { Property } from "@/services/interfaces/properties";
import { ChannelBadge } from "./ChannelBadge";
import { TemperatureChip } from "./TemperatureChip";

const STAGE_OPTIONS: { id: ClientStage; label: string }[] = [
  { id: "nuevo", label: "Nuevo contacto" },
  { id: "calificando", label: "Calificando" },
  { id: "visitas", label: "En visitas" },
  { id: "negociando", label: "Negociando" },
  { id: "cerrado", label: "Cerrado" },
  { id: "descartado", label: "Descartado" },
];

const DISCARD_REASONS: { id: ClientDiscardReason; label: string }[] = [
  { id: "compro_otro_asesor", label: "Compró con otro asesor" },
  { id: "sin_presupuesto", label: "Sin presupuesto" },
  { id: "credito_no_aprobado", label: "Crédito no aprobado" },
  { id: "no_responde", label: "No responde" },
  { id: "ya_no_busca", label: "Ya no busca" },
  { id: "otro", label: "Otro" },
];

// Mismo catálogo que Inventario (properties/[id]/page.tsx PROPERTY_TYPES) —
// handoff §0.3.
const PROPERTY_TYPES = ["Apartamento", "Casa", "Apartaestudio", "Oficina", "Local"];

const PAYMENT_OPTIONS: { id: ClientPaymentMethod; label: string }[] = [
  { id: "contado", label: "Contado" },
  { id: "credito", label: "Crédito" },
  { id: "mixto", label: "Mixto" },
];

function chipClass(activeNow: boolean) {
  return `rounded-[8px] border px-3 py-1.5 text-[12px] font-semibold ${
    activeNow
      ? "border-[var(--pa-navy)] bg-[var(--pa-navy-050)] text-[var(--pa-navy)]"
      : "border-[var(--pa-border)] bg-white text-[var(--pa-text-secondary)]"
  }`;
}

export function ClientDetailDrawer({
  client,
  allProperties,
  zoneSuggestions,
  onPatch,
  onLinkProperty,
  onUnlinkProperty,
  onClose,
  busy,
}: {
  client: Client;
  allProperties: Property[];
  zoneSuggestions: string[];
  onPatch: (patch: ClientWrite) => void;
  onLinkProperty: (propertyId: string) => void;
  onUnlinkProperty: (propertyId: string) => void;
  onClose: () => void;
  busy?: boolean;
}) {
  const [discardOpen, setDiscardOpen] = useState(false);
  const [presupuestoMin, setPresupuestoMin] = useState(
    client.presupuestoMin != null ? String(client.presupuestoMin) : "",
  );
  const [presupuestoMax, setPresupuestoMax] = useState(
    client.presupuestoMax != null ? String(client.presupuestoMax) : "",
  );
  const [notas, setNotas] = useState(client.notas ?? "");
  const [proximaCita, setProximaCita] = useState(client.proximaCita ?? "");
  const [zonaInput, setZonaInput] = useState("");
  const [propertySearch, setPropertySearch] = useState("");

  useEffect(() => {
    setDiscardOpen(false);
    setPresupuestoMin(client.presupuestoMin != null ? String(client.presupuestoMin) : "");
    setPresupuestoMax(client.presupuestoMax != null ? String(client.presupuestoMax) : "");
    setNotas(client.notas ?? "");
    setProximaCita(client.proximaCita ?? "");
  }, [client.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Debounce de los campos de texto/número — autosave sin botón "Guardar"
  // (handoff §6).
  useEffect(() => {
    const min = presupuestoMin.trim() ? Number(presupuestoMin) : null;
    if (min === client.presupuestoMin) return;
    const t = setTimeout(() => onPatch({ presupuestoMin: min }), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presupuestoMin]);

  useEffect(() => {
    const max = presupuestoMax.trim() ? Number(presupuestoMax) : null;
    if (max === client.presupuestoMax) return;
    const t = setTimeout(() => onPatch({ presupuestoMax: max }), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presupuestoMax]);

  useEffect(() => {
    if (notas === (client.notas ?? "")) return;
    const t = setTimeout(() => onPatch({ notas }), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notas]);

  useEffect(() => {
    if (proximaCita === (client.proximaCita ?? "")) return;
    const t = setTimeout(() => onPatch({ proximaCita: proximaCita || null }), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proximaCita]);

  const presupuestoError =
    presupuestoMin.trim() && presupuestoMax.trim() && Number(presupuestoMin) > Number(presupuestoMax);

  const filteredZoneSuggestions = useMemo(() => {
    const q = zonaInput.trim().toLowerCase();
    return zoneSuggestions
      .filter((z) => !client.zonas.includes(z))
      .filter((z) => !q || z.toLowerCase().includes(q))
      .slice(0, 6);
  }, [zonaInput, zoneSuggestions, client.zonas]);

  function addZona(z: string) {
    const v = z.trim();
    if (!v || client.zonas.includes(v)) return;
    onPatch({ zonas: [...client.zonas, v] });
    setZonaInput("");
  }

  function removeZona(z: string) {
    onPatch({ zonas: client.zonas.filter((x) => x !== z) });
  }

  function toggleTipo(t: string) {
    const has = client.tiposInmueble.includes(t);
    onPatch({
      tiposInmueble: has
        ? client.tiposInmueble.filter((x) => x !== t)
        : [...client.tiposInmueble, t],
    });
  }

  function changeStage(stage: ClientStage) {
    if (stage === "descartado") {
      setDiscardOpen(true);
      return;
    }
    onPatch({ estado: stage, motivoDescarte: null });
  }

  function confirmDiscard(reason: ClientDiscardReason) {
    onPatch({ estado: "descartado", motivoDescarte: reason });
    setDiscardOpen(false);
  }

  const linkedIds = new Set(client.linkedProperties.map((p) => p.id));
  const searchResults = useMemo(() => {
    const q = propertySearch.trim().toLowerCase();
    if (!q) return [];
    return allProperties
      .filter((p) => !linkedIds.has(p.id))
      .filter(
        (p) =>
          p.titulo.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q),
      )
      .slice(0, 4);
  }, [propertySearch, allProperties, linkedIds]);

  const label = "mb-1.5 block text-[11px] font-bold text-[var(--pa-text-secondary)]";
  const sectionTitle =
    "text-[11px] font-extrabold uppercase tracking-[.06em] text-[var(--pa-faint)]";
  const section = "border-t border-[var(--pa-bg-alt)] px-4 py-4";
  const input =
    "w-full rounded-[9px] border border-[var(--pa-border)] bg-white px-2.5 py-2 text-[13px]";

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar detalle"
        className="fixed inset-0 z-40 bg-[rgba(16,33,49,.28)]"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col overflow-x-hidden border-l border-[var(--pa-border)] bg-white shadow-[-8px_0_32px_rgba(16,33,49,.14)]">
        <div className="shrink-0 px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-[15px] font-extrabold text-[var(--pa-ink)]">{client.nombre}</h3>
              <div className="mt-0.5 flex items-center gap-2 text-[12.5px] font-semibold text-[var(--pa-text-secondary)]">
                <span>{client.telefono}</span>
                <ChannelBadge channel={client.canal} channelOther={client.canalOtro} />
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--pa-muted)] hover:bg-[var(--pa-bg)]"
            >
              <X size={18} />
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            {(["cold", "warm", "hot"] as ClientTemperature[]).map((t) => (
              <TemperatureChip
                key={t}
                value={t}
                active={client.temperatura === t}
                onClick={() => onPatch({ temperatura: t })}
              />
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className={section}>
            <div className={sectionTitle}>Estado</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {STAGE_OPTIONS.map((s) => {
                const isActive = client.estado === s.id;
                const isDescartado = s.id === "descartado";
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => changeStage(s.id)}
                    className={`rounded-[9px] px-2 py-2 text-[11.5px] font-bold ${
                      isActive
                        ? isDescartado
                          ? "border border-[var(--pa-danger)] bg-[var(--pa-danger-bg)] text-[var(--pa-danger)]"
                          : "bg-[var(--pa-navy)] text-white"
                        : isDescartado
                          ? "border border-[var(--pa-border)] text-[var(--pa-danger)]"
                          : "border border-[var(--pa-border)] text-[var(--pa-text-secondary)]"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            {discardOpen ? (
              <div className="mt-3 rounded-[10px] bg-[var(--pa-bg)] p-3">
                <div className="text-[12.5px] font-bold text-[var(--pa-ink)]">
                  Elige un motivo para descartar
                </div>
                <div className="mt-1 text-[11px] font-semibold text-[var(--pa-danger)]">
                  Obligatorio. El cliente no se descarta hasta elegir un motivo.
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {DISCARD_REASONS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => confirmDiscard(r.id)}
                      className="rounded-[8px] border border-[var(--pa-border)] bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-[var(--pa-text-secondary)] hover:border-[var(--pa-navy)]"
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setDiscardOpen(false)}
                  className="mt-2 text-[11.5px] font-semibold text-[var(--pa-muted)] hover:underline"
                >
                  Cancelar
                </button>
              </div>
            ) : client.estado === "descartado" && client.motivoDescarte ? (
              <div className="mt-3 rounded-[10px] bg-[var(--pa-bg)] p-3">
                <div className="text-[11px] font-bold text-[var(--pa-text-secondary)]">
                  Motivo del descarte
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {DISCARD_REASONS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => confirmDiscard(r.id)}
                      className={chipClass(r.id === client.motivoDescarte)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className={section}>
            <div className={sectionTitle}>Datos de búsqueda</div>

            <div className="mt-3">
              <div className={label}>Presupuesto (millones COP)</div>
              <div className="flex items-center gap-2">
                <input
                  className={input}
                  placeholder="Mín"
                  inputMode="numeric"
                  value={presupuestoMin}
                  onChange={(e) => setPresupuestoMin(e.target.value.replace(/[^\d]/g, ""))}
                />
                <span className="text-[var(--pa-faint)]">—</span>
                <input
                  className={input}
                  placeholder="Máx"
                  inputMode="numeric"
                  value={presupuestoMax}
                  onChange={(e) => setPresupuestoMax(e.target.value.replace(/[^\d]/g, ""))}
                />
              </div>
              {presupuestoError ? (
                <p className="mt-1 text-[11px] font-semibold text-[var(--pa-danger)]">
                  El mínimo no puede ser mayor que el máximo.
                </p>
              ) : null}
            </div>

            <div className="mt-3">
              <div className={label}>Zonas de interés</div>
              <div className="flex flex-wrap gap-1.5">
                {client.zonas.map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => removeZona(z)}
                    className={`${chipClass(true)} inline-flex items-center gap-1`}
                    title="Quitar"
                  >
                    {z} <X size={11} />
                  </button>
                ))}
              </div>
              <div className="relative mt-1.5">
                <input
                  className={input}
                  placeholder="Escribe una zona y Enter…"
                  value={zonaInput}
                  onChange={(e) => setZonaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addZona(zonaInput);
                    }
                  }}
                />
                {zonaInput && filteredZoneSuggestions.length > 0 ? (
                  <ul className="absolute z-10 mt-1 w-full rounded-[9px] border border-[var(--pa-border)] bg-white py-1 shadow-[var(--pa-shadow-overlay)]">
                    {filteredZoneSuggestions.map((z) => (
                      <li key={z}>
                        <button
                          type="button"
                          className="block w-full px-3 py-1.5 text-left text-[12.5px] hover:bg-[var(--pa-bg)]"
                          onClick={() => addZona(z)}
                        >
                          {z}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            <div className="mt-3">
              <div className={label}>Tipo de inmueble</div>
              <div className="flex flex-wrap gap-1.5">
                {PROPERTY_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTipo(t)}
                    className={chipClass(client.tiposInmueble.includes(t))}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <div className={label}>Forma de pago</div>
              <div className="flex rounded-[10px] bg-[var(--pa-bg-alt)] p-[3px]">
                {PAYMENT_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onPatch({ formaPago: p.id })}
                    className={`flex-1 rounded-[8px] px-2 py-1.5 text-[12px] font-bold ${
                      client.formaPago === p.id
                        ? "bg-white text-[var(--pa-navy)] shadow-[0_1px_3px_rgba(16,24,32,.12)]"
                        : "text-[var(--pa-text-secondary)]"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={section}>
            <div className="flex items-center justify-between">
              <div className={sectionTitle}>Próxima cita</div>
            </div>
            <input
              type="datetime-local"
              className={`${input} mt-2`}
              value={proximaCita ? proximaCita.slice(0, 16) : ""}
              onChange={(e) => setProximaCita(e.target.value)}
            />
            {client.proximaCita ? (
              <p className="mt-1 text-[11.5px] font-semibold text-[var(--pa-navy)]">
                {formatAppointment(client.proximaCita)}
              </p>
            ) : null}
          </div>

          <div className={section}>
            <div className="flex items-center justify-between">
              <div className={sectionTitle}>Inmuebles de interés</div>
              <span className="text-[11px] font-bold text-[var(--pa-faint)]">
                {client.linkedProperties.length}
              </span>
            </div>
            <input
              className={`${input} mt-2`}
              placeholder="Vincular por código o título del inventario"
              value={propertySearch}
              onChange={(e) => setPropertySearch(e.target.value)}
            />
            {propertySearch ? (
              <div className="mt-1.5">
                {searchResults.length === 0 ? (
                  <p className="text-[11.5px] text-[var(--pa-faint)]">
                    Sin resultados en el inventario.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {searchResults.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-2 rounded-[9px] border border-[var(--pa-border)] px-2 py-1.5"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-[12px] font-bold text-[var(--pa-ink)]">
                            {p.code} · {p.titulo}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onLinkProperty(p.id);
                            setPropertySearch("");
                          }}
                          className="shrink-0 text-[11.5px] font-bold text-[var(--pa-navy)] hover:underline"
                        >
                          Vincular
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            <div className="mt-2">
              {client.linkedProperties.length === 0 ? (
                <p className="text-[11.5px] text-[var(--pa-faint)]">
                  Aún no hay inmuebles vinculados.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {client.linkedProperties.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-2 rounded-[9px] border border-[var(--pa-border)] p-1.5"
                    >
                      <div className="flex h-[44px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[7px] bg-[var(--pa-bg-alt)] text-[10px] font-bold text-[var(--pa-muted)]">
                        {p.portadaUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.portadaUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          `F-${p.id}`
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-2 text-[12px] font-bold text-[var(--pa-ink)]">
                          {p.titulo}
                        </div>
                        {p.precio != null ? (
                          <div className="text-[12.5px] font-extrabold text-[var(--pa-navy)]">
                            {new Intl.NumberFormat("es-CO", {
                              style: "currency",
                              currency: "COP",
                              maximumFractionDigits: 0,
                            }).format(p.precio)}
                          </div>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => onUnlinkProperty(p.id)}
                        className="shrink-0 text-[11.5px] font-semibold text-[var(--pa-text-secondary)] hover:text-[var(--pa-danger)]"
                      >
                        Desvincular
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className={section}>
            <div className={sectionTitle}>Notas</div>
            <textarea
              className={`${input} mt-2 min-h-[96px] resize-y`}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas libres…"
            />
          </div>
        </div>

        {busy ? (
          <div className="shrink-0 border-t border-[var(--pa-bg-alt)] px-4 py-2 text-center text-[11px] font-semibold text-[var(--pa-muted)]">
            Guardando…
          </div>
        ) : null}
      </aside>
    </>
  );
}
