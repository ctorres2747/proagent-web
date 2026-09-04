"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/features/auth/AuthProvider";
import {
  agentAvatarUrl,
  agentInitials,
  canAccessCaptacion,
  displayName,
} from "@/lib/agentDisplay";

/** Fuente única del menú de usuario — ShellUserMenu (pie de sidebar) y
 * HeaderUserMenu (avatar del header) leen de aquí en vez de mantener cada
 * uno su propia copia. */
export const USER_MENU_ITEMS = [
  { label: "Mi perfil", path: "/account" },
  { label: "Ajustes", path: "/settings" },
  { label: "Notificaciones", path: "/settings/notifications" },
  { label: "Ayuda", path: "/help" },
  { label: "Novedades", path: "/changelog" },
] as const;

/** Estado y lógica compartida entre ambos disparadores del menú de usuario:
 * apertura/cierre, Escape, click afuera, avatar con fallback a iniciales,
 * navegación y logout. Cada disparador solo aporta su propio botón visible
 * y dónde ancla el panel. */
export function useUserMenu() {
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

  const handleLogout = () => {
    setOpen(false);
    logout();
    router.push("/login");
  };

  return {
    session,
    open,
    setOpen,
    rootRef,
    avatarUrl,
    avatarBroken,
    setAvatarBroken,
    initials,
    name,
    role,
    go,
    handleLogout,
  };
}
