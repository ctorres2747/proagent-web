"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { agentInitials, agentAvatarUrl, displayName } from "@/lib/agentDisplay";

export function UserMenu() {
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

  useEffect(() => {
    setAvatarBroken(false);
  }, [avatarUrl]);

  const showAvatarPhoto = Boolean(avatarUrl) && !avatarBroken;
  const initials = session ? agentInitials(session) : "PA";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={session ? `Menú de ${displayName(session)}` : "Menú de usuario"}
        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--pa-bg-alt)] text-[13px] font-bold text-[#45525E]"
      >
        {showAvatarPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl!}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setAvatarBroken(true)}
          />
        ) : (
          initials
        )}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 min-w-[200px] rounded-xl border border-[var(--pa-border)] bg-[var(--pa-surface)] py-1 shadow-lg"
        >
          {session && (
            <div className="border-b border-[var(--pa-border)] px-4 py-2.5">
              <div className="text-[13px] font-bold text-[var(--pa-ink)]">
                {session ? displayName(session) : ""}
              </div>
              <div className="text-[11px] text-[var(--pa-muted)]">
                {session.email ?? session.username}
              </div>
            </div>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              router.push("/settings");
            }}
            className="block w-full px-4 py-2.5 text-left text-[13px] text-[var(--pa-ink)] hover:bg-[var(--pa-bg)]"
          >
            Configuración
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
              router.push("/login");
            }}
            className="block w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[var(--pa-danger)] hover:bg-[var(--pa-bg)]"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
