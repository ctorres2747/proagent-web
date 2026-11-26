"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { PortalLogo } from "@/components/PortalLogo";
import { LeadActivitiesSection } from "@/features/captacion/LeadActivitiesSection";
import { muestraMarcaEnRevision } from "@/lib/enRevision";
import { formatLeadPrice } from "@/lib/format";
import { capturedAtLabel } from "@/lib/formatCapturedAt";
import type {
  Lead,
  LeadEstado,
  ProximaActividad,
} from "@/services/interfaces/leads";

const ESTADO_OPTIONS: LeadEstado[] = [
  "Pendiente",
  "En contacto",
  "Captado",
  "Descartado",
];

const field =
  "w-full rounded-[9px] border border-[var(--pa-border)] bg-white px-2.5 py-2 text-[13px]";
const label = "mb-1.5 block text-[11px] font-bold text-[var(--pa-text-secondary)]";

export interface CaptacionDraft {
  estado: LeadEstado;
  telefono: string;
  nombrePublicador: string;
  barrio: string;
  notas: string;
  fechaRecontacto: string;
}

export function CaptacionDetailDrawer({
  lead,
  draft,
  onDraftChange,
  onEstadoChange,
  onEnRevisionChange,
  enRevisionPending,
  estadoBlockedMessage,
  onClose,
  onSave,
  onPublish,
  savePending,
  publishPending,
  saveError,
  publishError,
  canPublish,
  token,
  now,
  highlightActivityId,
  onProximaChange,
}: {
  lead: Lead;
  draft: CaptacionDraft;
  onDraftChange: (patch: Partial<CaptacionDraft>) => void;
  onEstadoChange: (estado: LeadEstado) => void;
  onEnRevisionChange: (enRevision: boolean) => void;
  enRevisionPending: boolean;
  estadoBlockedMessage: string | null;
  onClose: () => void;
  onSave: () => void;
  onPublish: () => void;
  savePending: boolean;
  publishPending: boolean;
  saveError: string | null;
  publishError: string | null;
  canPublish: boolean;
  token?: string;
  now: Date;
  highlightActivityId?: number | null;
  onProximaChange: (proxima: ProximaActividad | null) => void;
}) {
  useEffect(() => {
    if (highlightActivityId == null) return;
    document
      .getElementById("lead-actividades")
      ?.scrollIntoView({ block: "nearest" });
  }, [highlightActivityId, lead.id]);

  const phoneDigits = draft.telefono.replace(/\D/g, "");

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar detalle"
        className="fixed inset-0 z-[55] bg-[rgba(16,33,49,.45)]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-detail-titulo"
        className="fixed left-1/2 top-1/2 z-[56] flex w-[920px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[var(--pa-border)] bg-white shadow-[0_1px_2px_rgba(16,33,49,.06),0_24px_64px_rgba(16,33,49,.24)]"
        style={{ maxHeight: "min(88vh, calc(100dvh - 24px))" }}
      >
        <header className="shrink-0 border-b border-[var(--pa-border)] px-6 py-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <PortalLogo portal={lead.portal} size={20} showLabel />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--pa-faint)]">
                  · #{lead.id}
                </span>
              </div>
              <h3
                id="lead-detail-titulo"
                className="mt-1 text-[17px] font-extrabold text-[var(--pa-ink)]"
              >
                {lead.tipoInmueble ?? "Inmueble"}
                {lead.municipio ? ` en ${lead.municipio}` : ""}
              </h3>
              <p className="mt-1 text-[14px] font-bold text-[var(--pa-navy)]">
                {formatLeadPrice(lead)}
              </p>
              {capturedAtLabel(lead.fechaCaptura) ? (
                <p className="mt-1 text-[12px] text-[var(--pa-muted)]">
                  {capturedAtLabel(lead.fechaCaptura)}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[#5B6B79] hover:bg-[#F6F7F9]"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="flex shrink-0 flex-wrap gap-2 border-b border-[var(--pa-border)] bg-[#FAFBFC] px-6 py-3">
          {phoneDigits ? (
            <a
              href={`tel:+57${phoneDigits}`}
              className="inline-flex h-9 items-center rounded-[9px] bg-[var(--pa-navy)] px-3.5 text-[12.5px] font-bold text-white"
            >
              Llamar
            </a>
          ) : null}
          {phoneDigits ? (
            <a
              href={`https://wa.me/57${phoneDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center rounded-[9px] border border-[var(--pa-border)] bg-white px-3.5 text-[12.5px] font-bold text-[var(--pa-ink)]"
            >
              WhatsApp
            </a>
          ) : null}
        </div>

        <div className="flex flex-1 flex-wrap items-start gap-x-8 overflow-y-auto overflow-x-hidden px-6 pb-4 pt-1">
          <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-3 py-4">
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
              {lead.areaM2 ? (
                <>
                  <dt className="text-[var(--pa-muted)]">Área</dt>
                  <dd>{lead.areaM2} m²</dd>
                </>
              ) : null}
              {lead.habitaciones ? (
                <>
                  <dt className="text-[var(--pa-muted)]">Habitaciones</dt>
                  <dd>{lead.habitaciones}</dd>
                </>
              ) : null}
              {lead.banos ? (
                <>
                  <dt className="text-[var(--pa-muted)]">Baños</dt>
                  <dd>{lead.banos}</dd>
                </>
              ) : null}
            </dl>
            {lead.linkPublicacion &&
            !lead.linkPublicacion.startsWith("manual-") ? (
              <a
                href={lead.linkPublicacion}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] font-semibold text-[var(--pa-navy)] underline"
              >
                Ver publicación original
              </a>
            ) : null}

            <label className="block">
              <span className={label}>Estado</span>
              <select
                value={draft.estado}
                onChange={(e) =>
                  onEstadoChange(e.target.value as LeadEstado)
                }
                className={field}
              >
                {ESTADO_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {estadoBlockedMessage ? (
                <p className="mt-1.5 text-[12px] text-[var(--pa-danger)]">
                  {estadoBlockedMessage}
                </p>
              ) : null}
            </label>

            {muestraMarcaEnRevision(lead.estado) ? (
              <label className="flex cursor-pointer items-start gap-2.5 rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={lead.enRevision}
                  disabled={enRevisionPending}
                  onChange={(e) => onEnRevisionChange(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--pa-navy)]"
                />
                <span>
                  <span className="block text-[13px] font-semibold text-[var(--pa-ink)]">
                    En revisión
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-[var(--pa-muted)]">
                    La marca (ojo) se ve en Pendiente y se conserva en En contacto.
                  </span>
                </span>
              </label>
            ) : null}

            <label className="block">
              <span className={label}>Teléfono propietario</span>
              <input
                type="tel"
                value={draft.telefono}
                onChange={(e) => onDraftChange({ telefono: e.target.value })}
                className={`${field} ${
                  estadoBlockedMessage && !draft.telefono.trim()
                    ? "border-[var(--pa-danger)]"
                    : ""
                }`}
                placeholder="300 123 4567"
              />
            </label>

            <label className="block">
              <span className={label}>Barrio / zona / conjunto</span>
              <input
                type="text"
                value={draft.barrio}
                onChange={(e) => onDraftChange({ barrio: e.target.value })}
                className={field}
                placeholder="Aves María"
              />
            </label>

            <label className="block">
              <span className={label}>Nombre propietario</span>
              <input
                type="text"
                value={draft.nombrePublicador}
                onChange={(e) =>
                  onDraftChange({ nombrePublicador: e.target.value })
                }
                className={`${field} ${
                  estadoBlockedMessage && !draft.nombrePublicador.trim()
                    ? "border-[var(--pa-danger)]"
                    : ""
                }`}
              />
            </label>

            <label className="block">
              <span className={label}>Notas</span>
              <textarea
                value={draft.notas}
                onChange={(e) => onDraftChange({ notas: e.target.value })}
                rows={3}
                className={`${field} resize-y`}
              />
            </label>
          </div>

          <div className="flex min-w-0 flex-[1_1_340px] flex-col border-[var(--pa-border)] py-4 md:border-l md:pl-8">
            <LeadActivitiesSection
              leadId={lead.id}
              token={token}
              now={now}
              highlightActivityId={highlightActivityId}
              onProximaChange={onProximaChange}
            />
          </div>
        </div>

        <footer className="flex shrink-0 flex-col gap-2 border-t border-[var(--pa-border)] bg-white px-6 py-3">
          {saveError ? (
            <p className="text-[12px] text-[var(--pa-danger)]">{saveError}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={savePending}
              className="rounded-[9px] border border-[var(--pa-navy)] bg-white px-4 py-2 text-[13px] font-bold text-[var(--pa-navy)] hover:bg-[var(--pa-bg)] disabled:opacity-60"
            >
              {savePending ? "Guardando…" : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={onPublish}
              disabled={!canPublish || publishPending}
              title={
                lead.estado !== "Captado"
                  ? "Disponible al pasar a Captado"
                  : undefined
              }
              className="rounded-[9px] bg-[var(--pa-navy)] px-4 py-2 text-[13px] font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {publishPending ? "Creando ficha…" : "Publicar inmueble"}
            </button>
            {!canPublish && lead.estado !== "Captado" ? (
              <p className="text-[11px] text-[var(--pa-muted)]">
                Disponible al pasar a Captado (con nombre y teléfono).
              </p>
            ) : null}
          </div>
          {publishError ? (
            <p className="text-[12px] text-[var(--pa-danger)]">{publishError}</p>
          ) : null}
        </footer>
      </div>
    </>
  );
}
