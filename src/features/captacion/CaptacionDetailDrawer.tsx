"use client";

import { PortalLogo } from "@/components/PortalLogo";
import { formatLeadPrice } from "@/lib/format";
import { capturedAtLabel } from "@/lib/formatCapturedAt";
import type { Lead, LeadEstado } from "@/services/interfaces/leads";

const ESTADO_OPTIONS: LeadEstado[] = [
  "Pendiente",
  "En contacto",
  "Captado",
  "Descartado",
];

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
  estadoBlockedMessage,
  onClose,
  onSave,
  onPublish,
  savePending,
  publishPending,
  saveError,
  publishError,
  canPublish,
}: {
  lead: Lead;
  draft: CaptacionDraft;
  onDraftChange: (patch: Partial<CaptacionDraft>) => void;
  onEstadoChange: (estado: LeadEstado) => void;
  estadoBlockedMessage: string | null;
  onClose: () => void;
  onSave: () => void;
  onPublish: () => void;
  savePending: boolean;
  publishPending: boolean;
  saveError: string | null;
  publishError: string | null;
  canPublish: boolean;
}) {
  return (
    <>
      <button
        type="button"
        aria-label="Cerrar detalle"
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col border-l border-[var(--pa-border)] bg-[var(--pa-surface)] shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--pa-border)] px-4 py-3">
          <p className="text-[13px] font-bold text-[var(--pa-ink)]">Detalle del lead</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-[18px] leading-none text-[var(--pa-muted)] hover:bg-[var(--pa-bg)]"
          >
            ×
          </button>
        </header>

        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          <div className="mb-4 border-b border-[var(--pa-border)] pb-4">
            <div className="flex items-center gap-2">
              <PortalLogo portal={lead.portal} size={20} showLabel />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--pa-faint)]">
                · #{lead.id}
              </span>
            </div>
            <h3 className="mt-1 text-[17px] font-extrabold text-[var(--pa-ink)]">
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
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
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
            {lead.linkPublicacion && !lead.linkPublicacion.startsWith("manual-") ? (
              <a
                href={lead.linkPublicacion}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-[12px] font-semibold text-[var(--pa-navy)] underline"
              >
                Ver publicación original
              </a>
            ) : null}
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
                Estado
              </span>
              <select
                value={draft.estado}
                onChange={(e) =>
                  onEstadoChange(e.target.value as LeadEstado)
                }
                className="w-full rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 py-2 text-[13px]"
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

            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
                Teléfono propietario
              </span>
              <input
                type="tel"
                value={draft.telefono}
                onChange={(e) => onDraftChange({ telefono: e.target.value })}
                className={`w-full rounded-[10px] border bg-[var(--pa-bg)] px-3 py-2 text-[13px] ${
                  estadoBlockedMessage && !draft.telefono.trim()
                    ? "border-[var(--pa-danger)]"
                    : "border-[var(--pa-border)]"
                }`}
                placeholder="300 123 4567"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
                Barrio / zona / conjunto
              </span>
              <input
                type="text"
                value={draft.barrio}
                onChange={(e) => onDraftChange({ barrio: e.target.value })}
                className="w-full rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 py-2 text-[13px]"
                placeholder="Aves María"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
                Nombre propietario
              </span>
              <input
                type="text"
                value={draft.nombrePublicador}
                onChange={(e) =>
                  onDraftChange({ nombrePublicador: e.target.value })
                }
                className={`w-full rounded-[10px] border bg-[var(--pa-bg)] px-3 py-2 text-[13px] ${
                  estadoBlockedMessage && !draft.nombrePublicador.trim()
                    ? "border-[var(--pa-danger)]"
                    : "border-[var(--pa-border)]"
                }`}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
                Fecha recontacto
              </span>
              <input
                type="date"
                value={draft.fechaRecontacto}
                onChange={(e) =>
                  onDraftChange({ fechaRecontacto: e.target.value })
                }
                className="w-full rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 py-2 text-[13px]"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
                Notas
              </span>
              <textarea
                value={draft.notas}
                onChange={(e) => onDraftChange({ notas: e.target.value })}
                rows={3}
                className="w-full resize-y rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 py-2 text-[13px]"
              />
            </label>
          </div>

          {saveError ? (
            <p className="mt-3 text-[12px] text-[var(--pa-danger)]">{saveError}</p>
          ) : null}

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={savePending}
              className="rounded-[10px] border border-[var(--pa-navy)] bg-[var(--pa-surface)] px-4 py-2.5 text-[13px] font-bold text-[var(--pa-navy)] hover:bg-[var(--pa-bg)] disabled:opacity-60"
            >
              {savePending ? "Guardando…" : "Guardar cambios"}
            </button>

            {draft.telefono.trim() ? (
              <a
                href={`https://wa.me/57${draft.telefono.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[10px] border border-[var(--pa-border)] px-4 py-2.5 text-center text-[13px] font-semibold text-[var(--pa-accent)] hover:bg-[var(--pa-bg)]"
              >
                WhatsApp
              </a>
            ) : null}

            <button
              type="button"
              onClick={onPublish}
              disabled={!canPublish || publishPending}
              title={
                lead.estado !== "Captado"
                  ? "Disponible al pasar a Captado"
                  : undefined
              }
              className="rounded-[10px] bg-[var(--pa-navy)] px-4 py-2.5 text-[13px] font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {publishPending ? "Creando ficha…" : "Publicar inmueble"}
            </button>
            {!canPublish && lead.estado !== "Captado" ? (
              <p className="text-center text-[11px] text-[var(--pa-muted)]">
                Disponible al pasar a Captado (con nombre y teléfono).
              </p>
            ) : null}
            {publishError ? (
              <p className="text-[12px] text-[var(--pa-danger)]">{publishError}</p>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}
