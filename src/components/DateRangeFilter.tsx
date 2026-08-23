"use client";

import { useEffect, useRef } from "react";

export interface DateRange {
  from: string;
  to: string;
}

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function presetRange(daysAgo: number): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - daysAgo);
  return { from: toDateInput(from), to: toDateInput(to) };
}

const PRESETS: { label: string; range: () => DateRange }[] = [
  { label: "Hoy", range: () => presetRange(0) },
  { label: "Últimos 7 días", range: () => presetRange(6) },
  { label: "Últimos 30 días", range: () => presetRange(29) },
];

export function isDateRangeActive(range: DateRange): boolean {
  return Boolean(range.from.trim() || range.to.trim());
}

export function isDateRangeInvalid(range: DateRange): boolean {
  return Boolean(range.from && range.to && range.from > range.to);
}

/** Client-side filter on lead.fechaCaptura (ISO string); invalid range is ignored (no filter). */
export function matchesDateRange(
  fechaCaptura: string | null | undefined,
  range: DateRange,
): boolean {
  if (!isDateRangeActive(range)) return true;
  if (isDateRangeInvalid(range)) return true;
  const day = (fechaCaptura ?? "").slice(0, 10);
  if (!day) return false;
  if (range.from && day < range.from) return false;
  if (range.to && day > range.to) return false;
  return true;
}

export function DateRangeFilter({
  range,
  onChange,
  open,
  onToggle,
  onClose,
}: {
  range: DateRange;
  onChange: (range: DateRange) => void;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const active = isDateRangeActive(range);
  const invalid = isDateRangeInvalid(range);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, onClose]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
          active || open
            ? "border-[var(--pa-navy)] bg-[var(--pa-navy)] text-white"
            : "border-[var(--pa-border)] bg-[var(--pa-surface)] text-[#45525E] hover:border-[var(--pa-navy)]"
        }`}
      >
        Fecha de captura ▾
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-[260px] rounded-xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-3 shadow-lg">
          <div className="space-y-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-[var(--pa-muted)]">
                Desde
              </span>
              <input
                type="date"
                value={range.from}
                onChange={(e) => onChange({ ...range, from: e.target.value })}
                className="w-full rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 py-2 text-[13px]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-[var(--pa-muted)]">
                Hasta
              </span>
              <input
                type="date"
                value={range.to}
                onChange={(e) => onChange({ ...range, to: e.target.value })}
                className="w-full rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 py-2 text-[13px]"
              />
            </label>
          </div>
          {invalid ? (
            <p className="mt-2 text-[11px] text-[var(--pa-danger)]">
              La fecha &quot;desde&quot; no puede ser posterior a &quot;hasta&quot;.
            </p>
          ) : null}
          <div className="mt-3 border-t border-[var(--pa-border)] pt-2">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--pa-faint)]">
              Atajos
            </p>
            <div className="flex flex-col gap-1">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    onChange(preset.range());
                    onClose();
                  }}
                  className="rounded-lg px-2 py-1.5 text-left text-[12px] text-[var(--pa-ink)] hover:bg-[var(--pa-bg)]"
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  onChange({ from: "", to: "" });
                  onClose();
                }}
                className="rounded-lg px-2 py-1.5 text-left text-[12px] text-[var(--pa-navy)] hover:bg-[var(--pa-bg)]"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
