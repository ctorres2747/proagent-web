"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";

import { filterNavItems, NAV_GROUPS, resolveActiveNavId } from "./nav-config";
import { SidebarNavItem } from "./SidebarNavItem";
import { ShellUserMenu } from "./ShellUserMenu";
import { ViewingAsSelect } from "./ViewingAsSelect";

export function Sidebar({
  pathname,
  collapsed,
  onToggleCollapsed,
  staff,
  admin,
  sessionReady,
  captacionBadge,
  inventoryBadge,
}: {
  pathname: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  staff: boolean;
  admin: boolean;
  sessionReady: boolean;
  captacionBadge?: number | null;
  inventoryBadge?: number;
}) {
  const activeId = resolveActiveNavId(pathname);
  const items = filterNavItems({ staff, admin });

  return (
    <aside
      className={`sticky top-0 hidden h-[100dvh] shrink-0 flex-col bg-[var(--pa-navy)] text-white transition-[width] duration-[180ms] ease-[cubic-bezier(.4,0,.2,1)] motion-reduce:transition-none md:flex ${
        collapsed ? "w-[var(--pa-shell-rail-w)]" : "w-[var(--pa-shell-sidebar-w)]"
      }`}
    >
      <div
        className={`flex shrink-0 items-center border-b border-[rgba(255,255,255,.12)] ${
          collapsed ? "justify-center px-2 py-4" : "gap-2.5 px-4 py-4"
        }`}
      >
        <Link
          href="/"
          aria-label="ProAgent — ir a Inicio"
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-white text-sm font-extrabold text-[var(--pa-navy)]"
        >
          P
        </Link>
        {!collapsed ? (
          <div className="min-w-0">
            <div className="truncate text-[14.5px] font-extrabold text-white">
              ProAgent
            </div>
            <div className="text-[9.5px] font-semibold uppercase tracking-[.06em] text-[rgba(255,255,255,.5)]">
              by Proinversores
            </div>
          </div>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
        {!sessionReady
          ? NAV_GROUPS.map((group) => (
              <div key={group.id} className="space-y-1">
                {!collapsed ? (
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-[.09em] text-[var(--pa-on-navy-muted)]">
                    {group.label}
                  </div>
                ) : (
                  <div className="mx-2 my-2 h-px bg-[rgba(255,255,255,.14)]" />
                )}
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded-[10px] bg-[rgba(255,255,255,.08)]"
                  />
                ))}
              </div>
            ))
          : NAV_GROUPS.map((group) => {
              const groupItems = items.filter((item) => item.group === group.id);
              if (groupItems.length === 0) return null;
              return (
                <div key={group.id}>
                  {!collapsed ? (
                    <div className="px-3 pb-2 pt-3.5 text-[10px] font-bold uppercase tracking-[.09em] text-[var(--pa-on-navy-muted)]">
                      {group.label}
                    </div>
                  ) : (
                    <div className="mx-2 mb-2 h-px bg-[rgba(255,255,255,.14)]" />
                  )}
                  <div className="flex flex-col gap-0.5">
                    {groupItems.map((item) => (
                      <SidebarNavItem
                        key={item.id}
                        item={item}
                        active={activeId === item.id}
                        collapsed={collapsed}
                        captacionBadge={captacionBadge}
                        inventoryBadge={inventoryBadge}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
      </nav>

      <div className="shrink-0 border-t border-[rgba(255,255,255,.12)] p-3">
        {admin && !collapsed ? <ViewingAsSelect collapsed={false} /> : null}
        {admin && collapsed ? <ViewingAsSelect collapsed /> : null}
        <ShellUserMenu collapsed={collapsed} />
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={`mt-2 flex w-full items-center justify-center gap-2 rounded-[10px] p-2.5 text-[11.5px] font-semibold text-[rgba(255,255,255,.5)] transition-colors hover:bg-[rgba(255,255,255,.07)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pa-focus-ring)] ${
            collapsed ? "min-h-11 min-w-11" : ""
          }`}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? (
            <PanelLeftOpen size={16} strokeWidth={1.9} aria-hidden />
          ) : (
            <>
              <PanelLeftClose size={14} strokeWidth={1.9} aria-hidden />
              <span>Colapsar menú</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
