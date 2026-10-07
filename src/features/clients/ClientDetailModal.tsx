"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Phone, X } from "lucide-react";
import { formatActivityDate, formatAppointment } from "@/lib/formatRelativeTime";
import type {
  Client,
  ClientDiscardReason,
  ClientEvent,
  ClientPaymentMethod,
  ClientStage,
  ClientWrite,
} from "@/services/interfaces/clients";
import type { Property } from "@/services/interfaces/properties";
import { ChannelBadge } from "./ChannelBadge";
import { TEMP_META, TempIcon } from "./TemperatureChip";

// "Nuevo contacto" ya no tiene columna ni botón (pedido de Cristhian,
// 2026-10-07), pero el valor histórico sigue siendo válido en datos viejos
// -- por eso STAGE_LABEL cubre los 6 estados aunque STAGE_OPTIONS solo
// ofrezca los 5 seleccionables desde la ficha.
const STAGE_OPTIONS: { id: ClientStage; label: string }[] = [
  { id: "calificando", label: "Calificado" },
  { id: "visitas", label: "En visitas" },
  { id: "negociando", label: "Negociando" },
  { id: "cerrado", label: "Cerrado" },
  { id: "descartado", label: "Descartado" },
];

const STAGE_LABEL: Record<ClientStage, string> = {
  nuevo: "Nuevo contacto",
  calificando: "Calificado",
  visitas: "En visitas",
  negociando: "Negociando",
  cerrado: "Cerrado",
  descartado: "Descartado",
};

const DISCARD_REASONS: { id: ClientDiscardReason; label: string }[] = [
  { id: "compro_otro_asesor", label: "Compró con otro asesor" },
  { id: "sin_presupuesto", label: "Sin presupuesto" },
  { id: "credito_no_aprobado", label: "Crédito no aprobado" },
  { id: "no_responde", label: "No responde" },
  { id: "ya_no_busca", label: "Ya no busca" },
  { id: "otro", label: "Otro" },
];

// Mismo catálogo que Inventario (properties/[id]/page.tsx PROPERTY_TYPES).
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

function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}

function eventText(e: ClientEvent, discardReasonLabel?: string | null): string {
  if (e.estadoAnterior === null) return `Cliente creado · ${STAGE_LABEL[e.estadoNuevo]}`;
  if (e.estadoNuevo === "descartado") {
    return discardReasonLabel ? `Descartado · ${discardReasonLabel}` : "Descartado";
  }
  return `Pasó a ${STAGE_LABEL[e.estadoNuevo]}`;
}

const sectionTitle =
  "text-[11px] font-extrabold uppercase tracking-[.06em] text-[var(--pa-faint)]";
const label = "mb-1.5 block text-[11px] font-bold text-[var(--pa-text-secondary)]";
const section = "border-b border-[var(--pa-bg-alt)] py-4";
const input =
  "w-full rounded-[9px] border border-[var(--pa-border)] bg-white px-2.5 py-2 text-[13px]";

/** Ficha central de un cliente (handoff `clientes-ficha-central-README.md`)
 * — reemplaza el panel lateral. Modal centrado de 920px, dos columnas
 * independientes, acciones rápidas (Llamar/WhatsApp) y línea de tiempo de
 * Actividad (versión simple: reusa el historial de estado ya existente). */
export function ClientDetailModal({
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
  const [nombre, setNombre] = useState(client.nombre);
  const [telefono, setTelefono] = useState(client.telefono);
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
  const [entered, setEntered] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setDiscardOpen(false);
    setNombre(client.nombre);
    setTelefono(client.telefono);
    setPresupuestoMin(client.presupuestoMin != null ? String(client.presupuestoMin) : "");
    setPresupuestoMax(client.presupuestoMax != null ? String(client.presupuestoMax) : "");
    setNotas(client.notas ?? "");
    setProximaCita(client.proximaCita ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id]);

  // Entrada: opacidad + escala en 160ms (handoff §2). prefers-reduced-motion
  // se respeta dejando `entered` directo en true sin transición perceptible
  // (la clase de transición solo se aplica si el usuario no lo pidió).
  useEffect(() => {
    const t = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Foco entra al cerrar, queda atrapado dentro, vuelve al origen al cerrar;
  // Esc cierra (el bloque de descarte primero si está abierto); el body no
  // scrollea mientras la ficha está abierta.
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setDiscardOpen((open) => {
          if (open) return false;
          onClose();
          return open;
        });
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previousFocusRef.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guardado automático con debounce de 500ms — sin botón "Guardar" (handoff §6).
  useEffect(() => {
    if (nombre === client.nombre || !nombre.trim()) return;
    const t = setTimeout(() => onPatch({ nombre: nombre.trim() }), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nombre]);

  useEffect(() => {
    if (telefono === client.telefono || !telefono.trim()) return;
    const t = setTimeout(() => onPatch({ telefono: telefono.trim() }), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telefono]);

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

  const phoneDigits = onlyDigits(client.telefono);
  const discardReasonLabel = client.motivoDescarte
    ? DISCARD_REASONS.find((r) => r.id === client.motivoDescarte)?.label ?? client.motivoDescarte
    : null;

  const transition = "transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none";

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar ficha"
        className={`fixed inset-0 z-[29] bg-[rgba(16,33,49,.45)] ${transition} ${entered ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-detail-nombre"
        className={`fixed left-1/2 top-1/2 z-30 flex w-[920px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(16,33,49,.06),0_24px_64px_rgba(16,33,49,.24)] ${transition} ${
          entered ? "scale-100 opacity-100" : "scale-[.98] opacity-0"
        }`}
        style={{ maxHeight: "88vh" }}
      >
        {/* Encabezado (fijo) */}
        <div className="shrink-0 border-b border-[var(--pa-border)] px-6 py-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--pa-bg-alt)] text-[13px] font-extrabold text-[var(--pa-text-secondary)]">
                {client.nombre
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase())
                  .join("") || "?"}
              </span>
              <div className="min-w-0 flex-1">
                <input
                  id="client-detail-nombre"
                  className="w-full rounded-[7px] border border-transparent bg-transparent px-1 -mx-1 text-[15px] font-extrabold text-[var(--pa-ink)] hover:bg-[var(--pa-bg)] focus:border-[var(--pa-border)] focus:bg-white focus:outline-none"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  aria-label="Nombre del cliente"
                />
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] font-semibold text-[var(--pa-text-secondary)]">
                  <input
                    className="w-[140px] shrink-0 whitespace-nowrap rounded-[7px] border border-transparent bg-transparent px-1 -mx-1 hover:bg-[var(--pa-bg)] focus:border-[var(--pa-border)] focus:bg-white focus:outline-none"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    aria-label="Teléfono del cliente"
                  />
                  <span className="text-[var(--pa-faint)]">·</span>
                  <div className="flex items-center gap-1.5">
                    <ChannelBadge channel={client.canal} channelOther={client.canalOtro} />
                    <span>
                      {client.canal === "otro" && client.canalOtro ? client.canalOtro : undefined}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[#5B6B79] hover:bg-[#F6F7F9]"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-3.5 flex gap-2">
            {(["cold", "warm", "hot"] as const).map((t) => {
              const active = client.temperatura === t;
              const meta = TEMP_META[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onPatch({ temperatura: t })}
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[9px] text-[12px] font-bold"
                  style={
                    active
                      ? { background: meta.bg, color: meta.text, border: `1px solid ${meta.border}` }
                      : { background: "#fff", color: "var(--pa-text-secondary)", border: "1px solid var(--pa-border)" }
                  }
                >
                  <TempIcon value={t} color={active ? meta.iconColor : "#9AA6B2"} size={14} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Barra de acciones rápidas (fija) — "Agendar visita" queda oculto
            (handoff §4: no hay agenda todavía, recomendación del doc). */}
        <div className="flex shrink-0 flex-wrap gap-2 border-b border-[var(--pa-border)] bg-[#FAFBFC] px-6 py-3">
          <a
            href={phoneDigits ? `tel:+57${phoneDigits}` : undefined}
            aria-disabled={!phoneDigits}
            className={`inline-flex h-9 shrink-0 items-center gap-[7px] whitespace-nowrap rounded-[9px] bg-[var(--pa-navy)] px-3.5 text-[12.5px] font-bold text-white ${
              !phoneDigits ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <Phone size={15} strokeWidth={2} /> Llamar
          </a>
          <a
            href={phoneDigits ? `https://wa.me/57${phoneDigits}` : undefined}
            target="_blank"
            rel="noopener"
            aria-disabled={!phoneDigits}
            className={`inline-flex h-9 shrink-0 items-center gap-[7px] whitespace-nowrap rounded-[9px] border border-[var(--pa-border)] bg-white px-3.5 text-[12.5px] font-bold text-[var(--pa-ink)] ${
              !phoneDigits ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <WhatsAppIcon /> WhatsApp
          </a>
        </div>

        {/* Cuerpo: dos columnas independientes, nunca scroll horizontal */}
        <div className="flex flex-1 flex-wrap items-start gap-x-8 overflow-y-auto overflow-x-hidden px-6 pb-2 pt-1">
          {/* Columna izquierda */}
          <div className="flex min-w-0 flex-[1_1_340px] flex-col">
            <div className={section}>
              <div className={sectionTitle}>Estado</div>
              <div className="mt-2.5 grid grid-cols-3 gap-2">
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
              <div className={sectionTitle}>Próxima cita</div>
              <input
                type="datetime-local"
                className={`${input} mt-2.5`}
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
                className={`${input} mt-2.5`}
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
                className={`${input} mt-2.5 min-h-[96px] resize-y`}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Notas libres…"
              />
            </div>
          </div>

          {/* Columna derecha */}
          <div className="flex min-w-0 flex-[1_1_340px] flex-col">
            <div className={section}>
              <div className={sectionTitle}>Datos de búsqueda</div>

              <div className="mt-2.5">
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
              <div className={sectionTitle}>Actividad</div>
              <div className="mt-2.5">
                {client.events.length === 0 ? (
                  <p className="text-[11.5px] text-[var(--pa-faint)]">Sin actividad todavía.</p>
                ) : (
                  client.events.map((e, i) => {
                    const isFirst = i === 0;
                    const isDiscard = e.estadoNuevo === "descartado";
                    const dotColor = isFirst ? "#0A3D62" : isDiscard ? "#C23B2B" : "#C9D0D7";
                    const isLast = i === client.events.length - 1;
                    return (
                      <div key={`${e.fecha}-${i}`} className="flex gap-3">
                        <div className="flex w-[10px] shrink-0 flex-col items-center">
                          <span
                            className="h-[10px] w-[10px] shrink-0 rounded-full border-2"
                            style={{
                              borderColor: dotColor,
                              background: isFirst ? dotColor : "#fff",
                            }}
                          />
                          {!isLast ? <span className="w-[2px] flex-1 bg-[var(--pa-bg-alt)]" /> : null}
                        </div>
                        <div className="min-w-0 flex-1 pb-3.5">
                          <div className="text-[12.5px] font-bold text-[var(--pa-ink)]">
                            {eventText(e, isFirst && isDiscard ? discardReasonLabel : null)}
                          </div>
                          <div className="text-[11.5px] text-[var(--pa-faint)]">
                            {formatActivityDate(e.fecha)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {busy ? (
          <div className="shrink-0 border-t border-[var(--pa-bg-alt)] px-6 py-2 text-center text-[11px] font-semibold text-[var(--pa-muted)]">
            Guardando…
          </div>
        ) : null}
      </div>
    </>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.76.46 3.48 1.34 5l-1.42 5.18 5.3-1.39a9.95 9.95 0 0 0 4.78 1.22h.01c5.52 0 10-4.48 10-10s-4.49-10.01-10.01-10.01Zm0 18.17h-.01a8.17 8.17 0 0 1-4.16-1.14l-.3-.18-3.14.82.84-3.06-.2-.31a8.14 8.14 0 0 1-1.25-4.3c0-4.51 3.67-8.17 8.18-8.17 2.18 0 4.23.85 5.78 2.4a8.1 8.1 0 0 1 2.39 5.78c0 4.51-3.67 8.16-8.13 8.16Zm4.47-6.12c-.25-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.25-.63.79-.78.95-.14.16-.28.18-.53.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.28.37-.42.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42-.14 0-.3-.01-.46-.01-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.16 1.73 2.64 4.2 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.44-.59 1.64-1.15.2-.57.2-1.05.14-1.15-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}
