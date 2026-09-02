"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Menu, Plus } from "lucide-react";

import { CAPTACION_NATIVE, CAPTACION_URL } from "@/config/env";
import { pageTitleForPath } from "./nav-config";
import { SearchTrigger } from "./SearchTrigger";

type HeaderCta =
  | { kind: "link"; href: string; label: string; external?: boolean }
  | { kind: "event"; label: string; eventName: string };

function resolveCta(pathname: string): HeaderCta {
  const onCaptacion =
    pathname === "/captacion" || pathname.startsWith("/captacion/");
  if (onCaptacion) {
    if (CAPTACION_NATIVE) {
      return {
        kind: "event",
        label: "+ Nuevo lead",
        eventName: "pa:captacion-new-lead",
      };
    }
    return {
      kind: "link",
      href: CAPTACION_URL,
      label: "+ Nuevo lead",
      external: true,
    };
  }
  return { kind: "link", href: "/publications", label: "+ Nueva propiedad" };
}

export function ShellHeader({
  pathname,
  onOpenDrawer,
  viewAgenteLabel,
  onExitViewAs,
  mainScrolled,
  staff,
}: {
  pathname: string;
  onOpenDrawer: () => void;
  viewAgenteLabel?: string | null;
  onExitViewAs?: () => void;
  mainScrolled?: boolean;
  staff?: boolean;
}) {
  const cta = resolveCta(pathname);

  const ctaClassName =
    "hidden items-center gap-1.5 whitespace-nowrap rounded-[9px] bg-[var(--pa-navy)] px-4 py-2.5 text-[12.5px] font-bold text-white transition-colors hover:bg-[var(--pa-navy-hover)] active:bg-[var(--pa-navy-pressed)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pa-navy)] sm:inline-flex";

  const mobileCtaClassName =
    "inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--pa-navy)] text-white sm:hidden";

  const fireCtaEvent = () => {
    if (cta.kind === "event") {
      window.dispatchEvent(new CustomEvent(cta.eventName));
    }
  };

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

        <h1 className="min-w-0 shrink-0 text-[15px] font-extrabold text-[var(--pa-ink)] md:max-w-[220px]">
          {pageTitleForPath(pathname)}
        </h1>

        <div className="hidden min-w-0 flex-1 justify-center md:flex">
          <SearchTrigger staff={staff} />
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 md:flex-none">
          <div className="md:hidden">
            <SearchTrigger staff={staff} />
          </div>
          <button
            type="button"
            className="relative flex h-11 w-11 items-center justify-center rounded-[10px] hover:bg-[var(--pa-bg)]"
            aria-label="Notificaciones"
          >
            <Bell size={18} strokeWidth={1.9} className="text-[var(--pa-text-secondary)]" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[var(--pa-danger)]" />
          </button>
          {cta.kind === "link" ? (
            <>
              <Link
                href={cta.href}
                target={cta.external ? "_blank" : undefined}
                rel={cta.external ? "noopener noreferrer" : undefined}
                className={ctaClassName}
              >
                <Plus size={14} strokeWidth={2} aria-hidden />
                {cta.label}
              </Link>
              <Link
                href={cta.href}
                target={cta.external ? "_blank" : undefined}
                rel={cta.external ? "noopener noreferrer" : undefined}
                className={mobileCtaClassName}
                aria-label={cta.label}
              >
                <Plus size={20} strokeWidth={2.6} />
              </Link>
            </>
          ) : (
            <>
              <button type="button" onClick={fireCtaEvent} className={ctaClassName}>
                <Plus size={14} strokeWidth={2} aria-hidden />
                {cta.label}
              </button>
              <button
                type="button"
                onClick={fireCtaEvent}
                className={mobileCtaClassName}
                aria-label={cta.label}
              >
                <Plus size={20} strokeWidth={2.6} />
              </button>
            </>
          )}
        </div>
      </header>
    </div>
  );
}
