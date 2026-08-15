"use client";

import { useEffect, useRef } from "react";

export interface PriceRange {
  min: string;
  max: string;
}

const PRESETS: { label: string; min: string; max: string }[] = [
  { label: "Hasta $500M", min: "", max: "500000000" },
  { label: "$500M – $1.000M", min: "500000001", max: "1000000000" },
  { label: "Más de $1.000M", min: "1000000001", max: "" },
];

export function parsePriceInput(value: string): number | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function isPriceRangeActive(range: PriceRange): boolean {
  return Boolean(range.min.trim() || range.max.trim());
}

export function isPriceRangeInvalid(range: PriceRange): boolean {
  const min = parsePriceInput(range.min);
  const max = parsePriceInput(range.max);
  return min !== null && max !== null && min > max;
}

/** Client-side filter on lead.precioNum; invalid range is ignored (no filter). */
export function matchesPriceRange(
  precioNum: number | null,
  range: PriceRange,
): boolean {
  if (!isPriceRangeActive(range)) return true;
  if (isPriceRangeInvalid(range)) return true;
  const min = parsePriceInput(range.min);
  const max = parsePriceInput(range.max);
  if (min !== null || max !== null) {
    if (precioNum === null) return false;
    if (min !== null && precioNum < min) return false;
    if (max !== null && precioNum > max) return false;
  }
  return true;
}

export function PriceRangeFilter({
  range,
  onChange,
  open,
  onToggle,
  onClose,
}: {
  range: PriceRange;
  onChange: (range: PriceRange) => void;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const active = isPriceRangeActive(range);
  const invalid = isPriceRangeInvalid(range);

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
        Precio ▾
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-[260px] rounded-xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-3 shadow-lg">
          <div className="space-y-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-[var(--pa-muted)]">
                Mínimo (COP)
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Sin mínimo"
                value={range.min}
                onChange={(e) => onChange({ ...range, min: e.target.value })}
                className="w-full rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 py-2 text-[13px]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-[var(--pa-muted)]">
                Máximo (COP)
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Sin máximo"
                value={range.max}
                onChange={(e) => onChange({ ...range, max: e.target.value })}
                className="w-full rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 py-2 text-[13px]"
              />
            </label>
          </div>
          {invalid ? (
            <p className="mt-2 text-[11px] text-[var(--pa-danger)]">
              El mínimo no puede ser mayor que el máximo.
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
                    onChange({ min: preset.min, max: preset.max });
                    onClose();
                  }}
                  className="rounded-lg px-2 py-1.5 text-left text-[12px] text-[var(--pa-ink)] hover:bg-[var(--pa-bg)]"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
