"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { loginUrlWithNext } from "@/lib/safeNext";

/**
 * Gate for the authenticated app. In mock mode a session always exists, so
 * this effectively never redirects. In HTTP mode, an unauthenticated user is
 * sent to /login.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !session) router.replace(loginUrlWithNext(pathname));
  }, [loading, session, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--pa-muted)]">
        Cargando…
      </div>
    );
  }

  if (!session) return null;

  return <>{children}</>;
}
