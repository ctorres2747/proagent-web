"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";

interface NavItem {
  href: string;
  label: string;
  disabled?: boolean;
}

const NAV: NavItem[] = [
  { href: "/", label: "Inicio" },
  { href: "/properties", label: "Propiedades" },
  { href: "/publications", label: "Publicar" },
  { href: "/clients", label: "Clientes", disabled: true },
  { href: "/more", label: "Más", disabled: true },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "PA";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[image:var(--pa-bg-app)] text-[var(--pa-ink)]">
      {/* Sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[var(--pa-border)] bg-[var(--pa-surface)] transition-[width] duration-150 md:flex ${
          collapsed ? "w-[68px]" : "w-56"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-[var(--pa-border)] px-4">
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-[var(--pa-navy)] text-sm font-extrabold text-white">
            P
          </div>
          {!collapsed && (
            <span className="text-[15px] font-extrabold text-[var(--pa-ink)]">
              ProAgent
            </span>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const dotColor = active
              ? "bg-white"
              : item.disabled
                ? "bg-[#D7DCE1]"
                : "bg-[var(--pa-faint)]";
            if (item.disabled) {
              return (
                <div
                  key={item.href}
                  title={`${item.label} (próximamente)`}
                  className="flex cursor-default items-center gap-3 rounded-[10px] px-3 py-2.5"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                  {!collapsed && (
                    <span className="text-[13px] font-semibold text-[#B8C0C8]">
                      {item.label}
                    </span>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-colors ${
                  active
                    ? "bg-[var(--pa-navy)]"
                    : "hover:bg-[var(--pa-bg)]"
                }`}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                {!collapsed && (
                  <span
                    className={`text-[13px] ${
                      active
                        ? "font-bold text-white"
                        : "font-semibold text-[#45525E]"
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-[var(--pa-border)] p-3">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] p-2.5 text-xs font-semibold text-[var(--pa-muted)] hover:bg-[var(--pa-bg)]"
          >
            <span className="h-4 w-4 rounded border-[1.5px] border-[var(--pa-faint)]" />
            {!collapsed && <span>Colapsar</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-[var(--pa-border)] bg-[var(--pa-surface)] px-5 md:px-7">
          <div className="flex min-w-0 max-w-[420px] flex-1 items-center truncate rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3.5 py-2.5 text-[13px] text-[var(--pa-faint)]">
            Buscar propiedad, cliente o código…
          </div>
          <div className="flex-1" />
          <div className="hidden text-[13px] font-semibold text-[var(--pa-muted)] sm:block">
            Medellín, Antioquia
          </div>
          <Link
            href="/publications"
            className="whitespace-nowrap rounded-[10px] bg-[var(--pa-navy)] px-4 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
          >
            + Nueva propiedad
          </Link>
          <button
            type="button"
            onClick={logout}
            title="Cerrar sesión"
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[var(--pa-bg-alt)] text-[13px] font-bold text-[#45525E]"
          >
            {session ? initials(session.nombre) : "PA"}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1280px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
