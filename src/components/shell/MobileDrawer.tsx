"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import Link from "next/link";

import { filterNavItems, NAV_GROUPS, resolveActiveNavId } from "./nav-config";
import { SidebarNavItem } from "./SidebarNavItem";
import { ShellUserMenu } from "./ShellUserMenu";
import { ViewingAsSelect } from "./ViewingAsSelect";

export function MobileDrawer({
  open,
  onClose,
  pathname,
  staff,
  admin,
  captacionBadge,
  inventoryBadge,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  staff: boolean;
  admin: boolean;
  captacionBadge?: number | null;
  inventoryBadge?: number;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const activeId = resolveActiveNavId(pathname);
  const items = filterNavItems({ staff, admin });

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(16,33,49,.45)] motion-reduce:transition-none"
        aria-label="Cerrar menú"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="absolute left-0 top-0 flex h-full w-[var(--pa-shell-drawer-w)] flex-col bg-[var(--pa-navy)] text-white shadow-[var(--pa-shadow-overlay)] motion-reduce:transition-none"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,.12)] px-4 py-4">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2.5"
            aria-label="ProAgent — ir a Inicio"
          >
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-white text-sm font-extrabold text-[var(--pa-navy)]">
              P
            </span>
            <span className="text-[14.5px] font-extrabold">ProAgent</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-[10px] hover:bg-[rgba(255,255,255,.08)]"
            aria-label="Cerrar"
          >
            <X size={20} strokeWidth={1.9} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => {
            const groupItems = items.filter((item) => item.group === group.id);
            if (groupItems.length === 0) return null;
            return (
              <div key={group.id} className="mb-5">
                <div className="px-3 pb-2 pt-3.5 text-[10px] font-bold uppercase tracking-[.09em] text-[var(--pa-on-navy-muted)]">
                  {group.label}
                </div>
                <div className="flex flex-col gap-0.5">
                  {groupItems.map((item) => (
                    <SidebarNavItem
                      key={item.id}
                      item={item}
                      active={activeId === item.id}
                      collapsed={false}
                      captacionBadge={captacionBadge}
                      inventoryBadge={inventoryBadge}
                      onNavigate={onClose}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-[rgba(255,255,255,.12)] p-3">
          {admin ? <ViewingAsSelect collapsed={false} /> : null}
          <ShellUserMenu collapsed={false} />
        </div>
      </div>
    </div>
  );
}
