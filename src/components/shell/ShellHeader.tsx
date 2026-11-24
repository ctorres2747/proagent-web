"use client";

import { Bell, Menu } from "lucide-react";

import { breadcrumbForPath } from "./nav-config";
import { HeaderUserMenu } from "./HeaderUserMenu";
import { SearchTrigger } from "./SearchTrigger";

export function ShellHeader({
  pathname,
  onOpenDrawer,
  viewAgenteLabel,
  onExitViewAs,
  mainScrolled,
  staff,
  adminChip,
  hideSearch,
}: {
  pathname: string;
  onOpenDrawer: () => void;
  viewAgenteLabel?: string | null;
  onExitViewAs?: () => void;
  mainScrolled?: boolean;
  staff?: boolean;
  adminChip?: boolean;
  hideSearch?: boolean;
}) {
  const { group, page } = breadcrumbForPath(pathname);

  return (
    <div className="sticky top-0 z-40">
      {viewAgenteLabel ? (
        <div className="flex h-7 items-center justify-between bg-[#FFF6E5] px-4 text-[12px] text-[var(--pa-ink)] md:px-7">
          <span>
            Estás viendo como <strong>{viewAgenteLabel}</strong>
          </span>
          <button
            type="button"
            onClick={onExitViewAs}
            className="font-bold text-[var(--pa-navy)] underline"
          >
            Salir
          </button>
        </div>
      ) : null}
      <header
        className={`flex h-[var(--pa-shell-header-h)] shrink-0 items-center gap-3 border-b border-[var(--pa-border)] bg-[var(--pa-surface)] px-4 md:gap-4 md:px-7 ${
          mainScrolled ? "shadow-[var(--pa-shadow-header)]" : ""
        }`}
      >
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex h-11 w-11 items-center justify-center rounded-[10px] hover:bg-[var(--pa-bg)] md:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={20} strokeWidth={1.9} className="text-[var(--pa-text-secondary)]" />
        </button>

        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 shrink-0 items-center gap-1.5 text-[13px] md:max-w-[240px]"
        >
          <span className="truncate font-semibold text-[#9AA6B2]">{group}</span>
          <span className="shrink-0 text-[#C9D0D7]" aria-hidden>
            /
          </span>
          <span className="truncate font-bold text-[#16212B]">{page}</span>
          {adminChip ? (
            <span className="ml-2 rounded-full bg-[#E6EEF5] px-[9px] py-[3px] text-[11px] font-extrabold text-[#0A3D62]">
              Administrador
            </span>
          ) : null}
        </nav>

        <div className="hidden min-w-0 flex-1 justify-center md:flex">
          {hideSearch ? null : <SearchTrigger staff={staff} />}
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 md:flex-none">
          <div className="md:hidden">
            {hideSearch ? null : <SearchTrigger staff={staff} />}
          </div>
          <button
            type="button"
            className="relative flex h-11 w-11 items-center justify-center rounded-[10px] hover:bg-[var(--pa-bg)]"
            aria-label="Notificaciones"
          >
            <Bell size={18} strokeWidth={1.9} className="text-[var(--pa-text-secondary)]" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[var(--pa-danger)]" />
          </button>
          <HeaderUserMenu />
        </div>
      </header>
    </div>
  );
}
