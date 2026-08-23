"use client";

import { useState } from "react";

/**
 * Input de contraseña/token con toggle de mostrar-ocultar (ojito). Mismo
 * patrón que ya usaba el login (extraído acá para reusarlo en cualquier
 * campo de credencial — ej. token de WASI en Configuración).
 */
export function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
  name,
  className = "",
  inputClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  name?: string;
  className?: string;
  inputClassName?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <span className={`relative block ${className}`}>
      <input
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={
          inputClassName ??
          "w-full rounded-lg border border-[var(--pa-border)] bg-[var(--pa-surface)] px-3 py-2 pr-10 text-[13px] outline-none focus:border-[var(--pa-navy)]"
        }
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar" : "Mostrar"}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--pa-muted)] hover:text-[var(--pa-ink)]"
      >
        {visible ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </span>
  );
}
