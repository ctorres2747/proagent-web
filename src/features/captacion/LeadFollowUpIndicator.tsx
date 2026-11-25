"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
  calendarDayParts,
  composeFechaHoraIso,
  defaultAgendarParts,
  followUpAriaLabel,
  followUpRelativeLabel,
  followUpTone,
  TIPO_ACTIVIDAD_LABEL,
} from "@/lib/leadFollowUp";
import type {
  LeadActivityCreate,
  LeadActivityType,
  ProximaActividad,
} from "@/services/interfaces/leads";

const SHOW_ON = new Set(["Pendiente", "En contacto", "Captado"]);

export function shouldShowFollowUp(estado: string): boolean {
  return SHOW_ON.has(estado);
}

const TONE_CLASS: Record<string, string> = {
  empty:
    "border-[var(--pa-border)] bg-[var(--pa-bg)] text-[var(--pa-muted)]",
  ok: "border-[var(--pa-accent)]/35 bg-[var(--pa-success-bg)] text-[var(--pa-emerald-ink)]",
  soon: "border-[var(--pa-attention)] bg-[var(--pa-attention-bg)] text-[var(--pa-warning-ink)]",
  overdue:
    "border-[var(--pa-danger)]/40 bg-[var(--pa-danger-bg)] text-[var(--pa-danger)]",
};

const TILE_HEAD: Record<string, string> = {
  empty: "bg-[var(--pa-muted)]",
  ok: "bg-[var(--pa-accent)]",
  soon: "bg-[var(--pa-attention)]",
  overdue: "bg-[var(--pa-danger)]",
};

export function LeadFollowUpIndicator({
  proxima,
  now,
  onOpenActivities,
  onSchedule,
  pending,
}: {
  proxima: ProximaActividad | null;
  now: Date;
  onOpenActivities: (activityId?: number) => void;
  onSchedule: (data: LeadActivityCreate) => Promise<void> | void;
  pending?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tone = followUpTone(proxima, now);
  const label = followUpAriaLabel(proxima, now);

  return (
    <div
      ref={wrapRef}
      className="relative mt-1.5 min-w-0"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {proxima ? (
        <button
          type="button"
          aria-label={label}
          onClick={() => onOpenActivities(proxima.id)}
          className={`flex w-full min-w-0 items-center gap-2 rounded-lg border px-1.5 py-1 text-left transition-colors hover:opacity-90 ${TONE_CLASS[tone]}`}
        >
          <MiniCalendarTile
            month={calendarDayParts(proxima).month}
            day={calendarDayParts(proxima).day}
            headClass={TILE_HEAD[tone]}
          />
          <span className="min-w-0 flex-1 truncate text-[10px] font-semibold leading-tight">
            {followUpRelativeLabel(proxima, now)}
          </span>
        </button>
      ) : (
        <button
          type="button"
          aria-label={label}
          aria-expanded={open}
          onClick={() => setOpen(true)}
          disabled={pending}
          className={`flex w-full items-center gap-2 rounded-lg border border-dashed px-1.5 py-1 text-left ${TONE_CLASS.empty}`}
        >
          <span
            aria-hidden
            className="flex h-[34px] w-[28px] items-center justify-center rounded-[6px] border border-[var(--pa-border)] bg-[var(--pa-surface)] text-[16px] font-semibold leading-none text-[var(--pa-navy)]"
          >
            +
          </span>
          <span className="text-[10px] font-semibold text-[var(--pa-navy)]">
            Agendar
          </span>
        </button>
      )}
      {open ? (
        <AgendarPopover
          anchorRef={wrapRef}
          onClose={() => setOpen(false)}
          onSave={async (data) => {
            await onSchedule(data);
            setOpen(false);
          }}
          pending={pending}
        />
      ) : null}
    </div>
  );
}

function MiniCalendarTile({
  month,
  day,
  headClass,
}: {
  month: string;
  day: string;
  headClass: string;
}) {
  return (
    <span
      aria-hidden
      className="flex h-[34px] w-[28px] shrink-0 flex-col overflow-hidden rounded-[6px] border border-black/5 bg-[var(--pa-surface)]"
    >
      <span
        className={`px-0.5 py-px text-center text-[7px] font-extrabold uppercase leading-none tracking-wide text-white ${headClass}`}
      >
        {month}
      </span>
      <span className="flex flex-1 items-center justify-center text-[12px] font-extrabold leading-none text-[var(--pa-ink)]">
        {day}
      </span>
    </span>
  );
}

function AgendarPopover({
  onClose,
  onSave,
  pending,
  defaultTipo = "llamada",
  anchorRef,
}: {
  onClose: () => void;
  onSave: (data: LeadActivityCreate) => Promise<void> | void;
  pending?: boolean;
  defaultTipo?: LeadActivityType;
  anchorRef?: RefObject<HTMLElement | null>;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<CSSProperties>({});
  const defaults = defaultAgendarParts();
  const [tipo, setTipo] = useState<LeadActivityType>(defaultTipo);
  const [fecha, setFecha] = useState(defaults.fecha);
  const [hora, setHora] = useState(defaults.hora);
  const [todoElDia, setTodoElDia] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    const place = () => {
      const anchor = anchorRef?.current;
      const el = ref.current;
      if (!anchor) return;
      const box = anchor.getBoundingClientRect();
      const width = 220;
      const h = el?.offsetHeight ?? 280;
      const spaceBelow = window.innerHeight - box.bottom - 8;
      const openUp = spaceBelow < h && box.top > spaceBelow;
      const top = openUp
        ? Math.max(8, box.top - h - 4)
        : box.bottom + 4;
      const left = Math.min(
        Math.max(8, box.left),
        window.innerWidth - width - 8,
      );
      setCoords({
        position: "fixed",
        top,
        left,
        width,
        zIndex: 80,
        maxHeight: window.innerHeight - 16,
        overflowY: "auto",
      });
    };
    place();
    const id = window.requestAnimationFrame(place);
    return () => window.cancelAnimationFrame(id);
  }, [anchorRef, todoElDia]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [onClose]);

  const dialog = (
    <div
      ref={ref}
      role="dialog"
      aria-labelledby={titleId}
      style={coords}
      className="rounded-xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-2.5 shadow-[var(--pa-shadow-overlay)]"
    >
      <p id={titleId} className="mb-2 text-[12px] font-bold text-[var(--pa-ink)]">
        Agendar seguimiento
      </p>
      <label className="mb-1.5 block">
        <span className="mb-0.5 block text-[10px] font-semibold text-[var(--pa-muted)]">
          Tipo
        </span>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as LeadActivityType)}
          className="w-full rounded-lg border border-[var(--pa-border)] bg-[var(--pa-bg)] px-2 py-1.5 text-[12px]"
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
      <label className="mb-1.5 block">
        <span className="mb-0.5 block text-[10px] font-semibold text-[var(--pa-muted)]">
          Fecha
        </span>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full rounded-lg border border-[var(--pa-border)] bg-[var(--pa-bg)] px-2 py-1.5 text-[12px]"
        />
      </label>
      <label className="mb-1.5 flex items-center gap-2 text-[11px] text-[var(--pa-ink)]">
        <input
          type="checkbox"
          checked={todoElDia}
          onChange={(e) => setTodoElDia(e.target.checked)}
          className="accent-[var(--pa-navy)]"
        />
        Todo el día
      </label>
      {!todoElDia ? (
        <label className="mb-1.5 block">
          <span className="mb-0.5 block text-[10px] font-semibold text-[var(--pa-muted)]">
            Hora
          </span>
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="w-full rounded-lg border border-[var(--pa-border)] bg-[var(--pa-bg)] px-2 py-1.5 text-[12px]"
          />
        </label>
      ) : null}
      {error ? (
        <p className="mb-1.5 text-[11px] text-[var(--pa-danger)]">{error}</p>
      ) : null}
      <div className="flex justify-end gap-1.5">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-[11px] font-semibold text-[var(--pa-muted)] hover:bg-[var(--pa-bg)]"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!fecha || (!todoElDia && !hora)) {
              setError("Elige fecha y hora.");
              return;
            }
            setError(null);
            void onSave({
              tipo,
              fechaHora: composeFechaHoraIso(
                fecha,
                todoElDia ? "00:00" : hora,
              ),
              todoElDia,
            });
          }}
          className="rounded-lg bg-[var(--pa-navy)] px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-60"
        >
          {pending ? "…" : "Guardar"}
        </button>
      </div>
    </div>
  );
  if (typeof document === "undefined") return dialog;
  return createPortal(dialog, document.body);
}

export { AgendarPopover };
