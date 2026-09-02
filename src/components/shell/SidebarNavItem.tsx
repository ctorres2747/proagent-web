"use client";

import Link from "next/link";
import type { NavItemConfig } from "./nav-config";
import { NavIcon } from "./NavIcon";

export function SidebarNavItem({
  item,
  active,
  collapsed,
  captacionBadge,
  inventoryBadge,
  onNavigate,
}: {
  item: NavItemConfig;
  active: boolean;
  collapsed: boolean;
  captacionBadge?: number | null;
  inventoryBadge?: number;
  onNavigate?: () => void;
}) {
  const badgeCount =
    item.badge === "captacion"
      ? captacionBadge
      : item.badge === "inventory"
        ? inventoryBadge
        : undefined;

  if (item.disabled) {
    return (
      <div
        aria-disabled="true"
        className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 ${
          collapsed ? "mx-auto h-14 w-[60px] flex-col justify-center gap-1 px-0" : ""
        }`}
      >
        <NavIcon
          item={item}
          size={collapsed ? 19 : 20}
          className="shrink-0 text-[var(--pa-on-navy-disabled)]"
        />
        {!collapsed && (
          <>
            <span className="flex-1 text-[13px] font-semibold text-[var(--pa-on-navy-disabled)]">
              {item.label}
            </span>
            {item.soon ? (
              <span className="rounded-full bg-[rgba(255,255,255,.12)] px-2 py-0.5 text-[9.5px] font-bold text-[var(--pa-on-navy-disabled)]">
                Pronto
              </span>
            ) : null}
          </>
        )}
      </div>
    );
  }

  const content = (
    <>
      <span className="relative shrink-0">
        <NavIcon
          item={item}
          size={collapsed ? 19 : 20}
          className={
            collapsed && active
              ? "text-[var(--pa-navy)]"
              : active
                ? "text-[var(--pa-on-navy-primary)]"
                : "text-[var(--pa-on-navy-secondary)]"
          }
        />
        {collapsed && badgeCount != null && badgeCount > 0 && item.badge === "captacion" ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--pa-emerald-bright)] px-1 text-[9.5px] font-extrabold text-[var(--pa-emerald-ink)]">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        ) : null}
      </span>
      {!collapsed ? (
        <>
          <span
            className={`flex-1 text-[13px] ${
              active
                ? "font-bold text-[var(--pa-on-navy-primary)]"
                : "font-semibold text-[var(--pa-on-navy-secondary)]"
            }`}
          >
            {item.label}
          </span>
          {badgeCount != null && badgeCount > 0 ? (
            item.badge === "captacion" ? (
              <span className="rounded-full bg-[var(--pa-emerald-bright)] px-2 py-0.5 text-[10px] font-extrabold text-[var(--pa-emerald-ink)]">
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-[var(--pa-on-navy-muted)]">
                {badgeCount > 999 ? "999+" : badgeCount}
              </span>
            )
          ) : null}
        </>
      ) : (
        <span
          className={`max-w-[56px] truncate text-center text-[9.5px] font-bold leading-tight ${
            active
              ? "font-extrabold text-[var(--pa-navy)]"
              : "text-[var(--pa-on-navy-secondary)]"
          }`}
        >
          {item.railLabel ?? item.label}
        </span>
      )}
      {!collapsed && active ? (
        <span
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-[var(--pa-emerald-bright)]"
          aria-hidden
        />
      ) : null}
    </>
  );

  const className = `relative flex items-center transition-colors duration-[120ms] ease-out ${
    collapsed
      ? `mx-auto h-14 w-[60px] flex-col justify-center gap-1 rounded-xl px-0 ${
          active
            ? "bg-white"
            : "hover:bg-[rgba(255,255,255,.08)]"
        }`
      : `gap-3 rounded-[10px] px-3 py-2.5 ${
          active
            ? "bg-[rgba(255,255,255,.12)]"
            : "hover:bg-[rgba(255,255,255,.07)] hover:text-white"
        }`
  } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pa-focus-ring)]`;

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        title={item.label}
        onClick={onNavigate}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className} title={item.label} onClick={onNavigate}>
      {content}
    </Link>
  );
}
