"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/properties", label: "Propiedades" },
  { href: "/publications", label: "Publicaciones" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--pa-bg)] text-[var(--pa-ink)]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[var(--pa-navy)] px-5 py-6 text-white md:flex">
        <div className="mb-8">
          <div className="text-lg font-bold">ProAgent</div>
          <div className="text-xs text-white/60">Created by Proinversores</div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive(pathname, item.href)
                  ? "bg-white/15 font-semibold text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {session && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="text-sm font-medium">{session.nombre}</div>
            <div className="mb-3 text-xs text-white/60">
              <span className="rounded-full bg-[var(--pa-accent)] px-2 py-0.5 font-semibold uppercase tracking-wide text-white">
                {session.role}
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="text-xs text-white/70 underline-offset-2 hover:text-white hover:underline"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </aside>

      <div className="md:pl-64">
        <header className="flex items-center justify-between border-b border-[var(--pa-border)] bg-[var(--pa-surface)] px-6 py-4 md:hidden">
          <div className="font-bold text-[var(--pa-navy)]">ProAgent</div>
          {session && (
            <button
              type="button"
              onClick={logout}
              className="text-sm text-[var(--pa-muted)]"
            >
              Salir
            </button>
          )}
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
