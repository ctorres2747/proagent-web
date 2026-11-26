"use client";

import { useState } from "react";
import {
  composeFechaHoraIso,
  defaultAgendarParts,
  TIPO_ACTIVIDAD_LABEL,
} from "@/lib/leadFollowUp";
import type {
  LeadActivityCreate,
  LeadActivityType,
} from "@/services/interfaces/leads";

export function AgendarForm({
  onSave,
  pending,
  defaultTipo = "llamada",
  compact = false,
  onCancel,
  submitLabel = "Agendar",
}: {
  onSave: (data: LeadActivityCreate) => Promise<void> | void;
  pending?: boolean;
  defaultTipo?: LeadActivityType;
  compact?: boolean;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const defaults = defaultAgendarParts();
  const [tipo, setTipo] = useState<LeadActivityType>(defaultTipo);
  const [fecha, setFecha] = useState(defaults.fecha);
  const [hora, setHora] = useState(defaults.hora);
  const [todoElDia, setTodoElDia] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const field =
    compact
      ? "w-full rounded-lg border border-[var(--pa-border)] bg-[var(--pa-bg)] px-2 py-1.5 text-[12px]"
      : "w-full rounded-[9px] border border-[var(--pa-border)] bg-white px-2.5 py-2 text-[13px]";
  const labelCls = compact
    ? "mb-0.5 block text-[10px] font-semibold text-[var(--pa-muted)]"
    : "mb-1.5 block text-[11px] font-bold text-[var(--pa-text-secondary)]";

  return (
    <form
      className={compact ? "" : "rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] p-3"}
      onSubmit={(e) => {
        e.preventDefault();
        if (!fecha || (!todoElDia && !hora)) {
          setError("Elige fecha y hora.");
          return;
        }
        setError(null);
        void onSave({
          tipo,
          fechaHora: composeFechaHoraIso(fecha, todoElDia ? "00:00" : hora),
          todoElDia,
        });
      }}
    >
      <label className={compact ? "mb-1.5 block" : "mb-3 block"}>
        <span className={labelCls}>Tipo</span>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as LeadActivityType)}
          className={field}
        >
          {(Object.keys(TIPO_ACTIVIDAD_LABEL) as LeadActivityType[]).map(
            (key) => (
              <option key={key} value={key}>
                {TIPO_ACTIVIDAD_LABEL[key]}
              </option>
            ),
          )}
        </select>
      </label>
      <label className={compact ? "mb-1.5 block" : "mb-3 block"}>
        <span className={labelCls}>Fecha</span>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className={field}
        />
      </label>
      <label
        className={`flex items-center gap-2 text-[var(--pa-ink)] ${compact ? "mb-1.5 text-[11px]" : "mb-3 text-[13px]"}`}
      >
        <input
          type="checkbox"
          checked={todoElDia}
          onChange={(e) => setTodoElDia(e.target.checked)}
          className="accent-[var(--pa-navy)]"
        />
        Todo el día
      </label>
      {!todoElDia ? (
        <label className={compact ? "mb-1.5 block" : "mb-3 block"}>
          <span className={labelCls}>Hora</span>
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className={field}
          />
        </label>
      ) : null}
      {error ? (
        <p className="mb-2 text-[11px] text-[var(--pa-danger)]">{error}</p>
      ) : null}
      <div className="flex justify-end gap-1.5">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-2 py-1 text-[11px] font-semibold text-[var(--pa-muted)] hover:bg-[var(--pa-bg)]"
          >
            Cancelar
          </button>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className={
            compact
              ? "rounded-lg bg-[var(--pa-navy)] px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-60"
              : "rounded-[9px] bg-[var(--pa-navy)] px-3.5 py-2 text-[12.5px] font-bold text-white disabled:opacity-60"
          }
        >
          {pending ? "…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
