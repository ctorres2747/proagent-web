"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { USE_HTTP_API } from "@/config/env";
import { handoffErrorMessage } from "@/features/auth/handoffErrors";
import { useAuth } from "@/features/auth/AuthProvider";
import { loginUrlWithNext, sanitizeNextPath } from "@/lib/safeNext";
import { authService } from "@/services";

type HandoffState =
  | { status: "loading" }
  | { status: "error"; message: string; loginHref: string };

function HandoffContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading: authLoading, session, establishSession } = useAuth();
  const [state, setState] = useState<HandoffState>({ status: "loading" });
  const startedRef = useRef(false);

  const code = searchParams.get("code")?.trim() ?? "";
  const nextParam = searchParams.get("next");
  const safeNext = sanitizeNextPath(nextParam) ?? "/";
  const loginHref = loginUrlWithNext(nextParam);

  useEffect(() => {
    if (authLoading || startedRef.current) return;
    startedRef.current = true;

    async function run() {
      if (!USE_HTTP_API) {
        setState({
          status: "error",
          message:
            "El acceso desde el Kanban requiere conexión al backend (NEXT_PUBLIC_API_URL).",
          loginHref,
        });
        return;
      }

      if (!code) {
        setState({
          status: "error",
          message: "Falta el código de acceso en el enlace.",
          loginHref,
        });
        return;
      }

      if (session) {
        router.replace(safeNext);
        return;
      }

      try {
        const response = await authService.exchangeHandoff(code);
        establishSession(response);
        router.replace(safeNext);
      } catch (err) {
        setState({
          status: "error",
          message: handoffErrorMessage(err),
          loginHref,
        });
      }
    }

    void run();
  }, [
    authLoading,
    code,
    establishSession,
    loginHref,
    router,
    safeNext,
    session,
  ]);

  if (state.status === "error") {
    return (
      <div className="w-full max-w-md rounded-2xl bg-[var(--pa-surface)] p-8 shadow-sm">
        <div className="mb-4 text-center">
          <div className="text-2xl font-bold text-[var(--pa-navy)]">ProAgent</div>
          <div className="text-xs text-[var(--pa-muted)]">
            Created by Proinversores
          </div>
        </div>

        <h1 className="text-lg font-semibold text-[var(--pa-ink)]">
          No se pudo iniciar sesión automáticamente
        </h1>
        <p className="mt-2 text-sm text-[var(--pa-muted)]">{state.message}</p>

        <Link
          href={state.loginHref}
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-[var(--pa-navy)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-[var(--pa-surface)] p-8 text-center shadow-sm">
      <div className="mb-2 text-2xl font-bold text-[var(--pa-navy)]">ProAgent</div>
      <p className="text-sm text-[var(--pa-muted)]">
        Conectando tu sesión desde el Kanban…
      </p>
    </div>
  );
}

export default function HandoffPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[image:var(--pa-bg-app)] px-6">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-2xl bg-[var(--pa-surface)] p-8 text-center shadow-sm">
            <div className="mb-2 text-2xl font-bold text-[var(--pa-navy)]">
              ProAgent
            </div>
            <p className="text-sm text-[var(--pa-muted)]">Cargando…</p>
          </div>
        }
      >
        <HandoffContent />
      </Suspense>
    </div>
  );
}
