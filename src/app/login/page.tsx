"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { USE_HTTP_API } from "@/config/env";
import { useAuth } from "@/features/auth/AuthProvider";

export default function LoginPage() {
  const { session, login, error } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Already authenticated (incl. mock auto-session) -> go to dashboard.
  useEffect(() => {
    if (session) router.replace("/");
  }, [session, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(username, password);
      router.replace("/");
    } catch {
      // error is surfaced via useAuth().error
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[image:var(--pa-bg-app)] px-6">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--pa-surface)] p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold text-[var(--pa-navy)]">ProAgent</div>
          <div className="text-xs text-[var(--pa-muted)]">
            Created by Proinversores
          </div>
        </div>

        {!USE_HTTP_API && (
          <p className="mb-4 rounded-lg bg-[var(--pa-bg)] p-3 text-xs text-[var(--pa-muted)]">
            Modo demo (mocks): la sesión de administrador se inicia
            automáticamente.
          </p>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="text-sm font-medium">
            Usuario
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--pa-border)] px-3 py-2 text-sm outline-none focus:border-[var(--pa-navy)]"
              placeholder="agente@proinversores.com"
            />
          </label>
          <label className="text-sm font-medium">
            Contraseña
            <span className="relative mt-1 block">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[var(--pa-border)] px-3 py-2 pr-10 text-sm outline-none focus:border-[var(--pa-navy)]"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--pa-muted)] hover:text-[var(--pa-ink)]"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </span>
          </label>

          {error && <p className="text-sm text-[var(--pa-danger)]">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-lg bg-[var(--pa-navy)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
