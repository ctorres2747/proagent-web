"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/features/auth/AuthProvider";
import { agentAvatarUrl, agentInitials, canAccessCaptacion, displayName } from "@/lib/agentDisplay";

export function ShellUserMenu({ collapsed }: { collapsed: boolean }) {
  const { session, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  const avatarUrl = agentAvatarUrl(session);
  const [avatarBroken, setAvatarBroken] = useState(false);
  useEffect(() => setAvatarBroken(false), [avatarUrl]);

  const initials = session ? agentInitials(session) : "PA";
  const name = session ? displayName(session) : "Agente";
  const role =
    session?.role === "admin"
      ? "Administrador"
      : canAccessCaptacion(session)
        ? "Staff"
        : "Asesor";

  const go = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex w-full items-center gap-2.5 rounded-xl bg-[rgba(255,255,255,.07)] text-left transition-colors hover:bg-[rgba(255,255,255,.1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pa-focus-ring)] ${
          collapsed ? "justify-center p-2" : "px-3 py-2.5"
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--pa-emerald-bright)] text-[11px] font-bold text-[var(--pa-emerald-ink)]">
          {avatarUrl && !avatarBroken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setAvatarBroken(true)}
            />
          ) : (
            initials
          )}
        </span>
        {!collapsed ? (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-bold text-white">
                {name}
              </span>
              <span className="block truncate text-[10.5px] font-semibold text-[rgba(255,255,255,.55)]">
                {role}
              </span>
            </span>
            <ChevronUp
              size={14}
              className={`shrink-0 text-[rgba(255,255,255,.5)] transition-transform ${open ? "" : "rotate-180"}`}
            />
          </>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className={`absolute z-30 w-[232px] rounded-xl border border-[var(--pa-border)] bg-white py-1 shadow-[var(--pa-shadow-overlay)] motion-reduce:transition-none ${
            collapsed ? "bottom-0 left-full ml-2" : "bottom-full right-0 mb-2"
          }`}
        >
          {session ? (
            <div className="border-b border-[var(--pa-border)] px-4 py-3">
              <div className="text-[13px] font-bold text-[var(--pa-ink)]">{name}</div>
              <div className="text-[11.5px] text-[var(--pa-muted)]">
                {session.email ?? session.username}
              </div>
            </div>
          ) : null}
          {[
            { label: "Mi perfil", path: "/account" },
            { label: "Ajustes", path: "/settings" },
            { label: "Notificaciones", path: "/settings/notifications" },
            { label: "Ayuda", path: "/help" },
            { label: "Novedades", path: "/changelog" },
          ].map((item) => (
            <button
              key={item.path}
              type="button"
              role="menuitem"
              onClick={() => go(item.path)}
              className="block w-full px-4 py-2.5 text-left text-[13px] text-[var(--pa-ink)] hover:bg-[var(--pa-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--pa-navy)]"
            >
              {item.label}
            </button>
          ))}
          <div className="my-1 h-px bg-[var(--pa-border)]" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
              router.push("/login");
            }}
            className="block w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[var(--pa-danger)] hover:bg-[#FDF0EE]"
          >
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}
