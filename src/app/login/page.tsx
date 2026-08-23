"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { USE_HTTP_API } from "@/config/env";
import { useAuth } from "@/features/auth/AuthProvider";
import { sanitizeNextPath } from "@/lib/safeNext";
import { PasswordInput } from "@/components/PasswordInput";

function LoginForm() {
  const { session, login, error } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = sanitizeNextPath(searchParams.get("next")) ?? "/";

  // Already authenticated (incl. mock auto-session) -> go to dashboard.
  useEffect(() => {
    if (session) router.replace(redirectTo);
  }, [session, router, redirectTo]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(username, password);
      router.replace(redirectTo);
    } catch {
      // error is surfaced via useAuth().error
    } finally {
      setSubmitting(false);
    }
  }

  return (
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
          <PasswordInput
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            placeholder="••••••••"
            className="mt-1"
          />
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
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[image:var(--pa-bg-app)] px-6">
      <Suspense
        fallback={
          <div className="w-full max-w-sm rounded-2xl bg-[var(--pa-surface)] p-8 text-center shadow-sm">
            <p className="text-sm text-[var(--pa-muted)]">Cargando…</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
