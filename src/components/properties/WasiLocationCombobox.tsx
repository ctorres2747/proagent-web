"use client";

import { useEffect, useId, useRef, useState } from "react";

import { matchesWasiOption, normalizeWasiLocation } from "@/lib/wasiLocation";

const input =
  "w-full rounded-xl border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3.5 py-2.5 text-sm text-[var(--pa-ink)] outline-none focus:border-[var(--pa-navy)]";

export function WasiLocationCombobox({
  label,
  value,
  onChange,
  onValidChange,
  options,
  loading = false,
  disabled = false,
  missing = false,
  helperText,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onValidChange?: (valid: boolean) => void;
  options: string[];
  loading?: boolean;
  disabled?: boolean;
  missing?: boolean;
  helperText?: string | null;
  placeholder?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const filtered = options.filter((opt) => {
    const q = normalizeWasiLocation(value);
    if (!q) return true;
    return normalizeWasiLocation(opt).includes(q);
  });

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [value, options.length]);

  const selectOption = (option: string) => {
    onChange(option);
    onValidChange?.(true);
    setOpen(false);
  };

  const handleBlur = () => {
    window.setTimeout(() => {
      if (!value.trim()) {
        onValidChange?.(false);
        return;
      }
      const exact = options.find((opt) => matchesWasiOption(opt, value));
      if (exact) {
        if (exact !== value) onChange(exact);
        onValidChange?.(true);
      } else {
        onValidChange?.(false);
      }
      setOpen(false);
    }, 120);
  };

  return (
    <div ref={rootRef} className="relative">
      <div
        className={`mb-1.5 text-xs font-bold ${
          missing ? "text-[var(--pa-danger)]" : "text-[var(--pa-muted)]"
        }`}
      >
        {label}
      </div>
      <input
        className={`${input} ${
          missing ? "border-[var(--pa-danger)] focus:border-[var(--pa-danger)]" : ""
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        onBlur={handleBlur}
        onChange={(event) => {
          onChange(event.target.value);
          onValidChange?.(false);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setHighlight((idx) => Math.min(idx + 1, Math.max(filtered.length - 1, 0)));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlight((idx) => Math.max(idx - 1, 0));
          } else if (event.key === "Enter" && open && filtered[highlight]) {
            event.preventDefault();
            selectOption(filtered[highlight]);
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {loading ? (
        <p className="mt-1 text-xs text-[var(--pa-muted)]">Buscando…</p>
      ) : null}
      {helperText ? (
        <p className="mt-1 text-xs font-medium text-[var(--pa-warning)]">{helperText}</p>
      ) : null}
      {open && !disabled && filtered.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-[var(--pa-border)] bg-[var(--pa-surface)] py-1 shadow-lg"
        >
          {filtered.map((option, index) => (
            <li key={option}>
              <button
                type="button"
                role="option"
                aria-selected={index === highlight}
                className={`block w-full px-3.5 py-2 text-left text-sm hover:bg-[var(--pa-bg)] ${
                  index === highlight
                    ? "bg-[var(--pa-bg)] font-semibold text-[var(--pa-navy)]"
                    : "text-[var(--pa-ink)]"
                }`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectOption(option)}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
