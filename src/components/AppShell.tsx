"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { CAPTACION_NATIVE, CAPTACION_URL } from "@/config/env";
import { canAccessCaptacion } from "@/lib/agentDisplay";
import { UserMenu } from "@/components/UserMenu";

interface NavItem {
  href: string;
  label: string;
  disabled?: boolean;
  external?: boolean;
}

const BASE_NAV: NavItem[] = [
  { href: "/", label: "Inicio" },
  { href: "/properties", label: "Inventario" },
  { href: "/publications", label: "Publicación" },
  { href: "/clients", label: "Clientes", disabled: true },
  { href: "/more", label: "Más", disabled: true },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  // Detalle /properties/[id] = flujo de publicación (contenido, fotos, canales…)
  if (href === "/publications") {
    return (
      pathname === "/publications" ||
      /^\/properties\/[^/]+/.test(pathname)
    );
  }
  if (href === "/properties") {
    return pathname === "/properties";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const staff = canAccessCaptacion(session);
  const captacionHref = CAPTACION_NATIVE ? "/captacion" : CAPTACION_URL;
  const captacionExternal = !CAPTACION_NATIVE;

  const nav: NavItem[] = staff
    ? [
        ...BASE_NAV.slice(0, 1),
        {
          href: captacionHref,
          label: "Captación",
          external: captacionExternal,
        },
        ...BASE_NAV.slice(1),
      ]
    : BASE_NAV;

  return (
    <div className="flex min-h-screen bg-[image:var(--pa-bg-app)] text-[var(--pa-ink)]">
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
          {nav.map((item) => {
            const active = !item.external && isActive(pathname, item.href);
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
            const className = `flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-colors ${
              active
                ? "bg-[var(--pa-navy)]"
                : "hover:bg-[var(--pa-bg)]"
            }`;
            const label = (
              <>
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
              </>
            );
            if (item.external) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                  title="Kanban interno de captación"
                >
                  {label}
                </a>
              );
            }
            return (
              <Link key={item.href} href={item.href} className={className}>
                {label}
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

      <div className="flex min-w-0 flex-1 flex-col">
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
          <UserMenu />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
