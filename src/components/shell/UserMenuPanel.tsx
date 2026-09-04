"use client";

import type { AgentSession } from "@/features/auth/types";

import { USER_MENU_ITEMS } from "./use-user-menu";

/** Panel del menú de usuario — contenido idéntico para ShellUserMenu y
 * HeaderUserMenu; solo cambia `positionClassName` (dónde se ancla el
 * disparador que lo abre). */
export function UserMenuPanel({
  session,
  name,
  positionClassName,
  onNavigate,
  onLogout,
}: {
  session: AgentSession | null;
  name: string;
  positionClassName: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}) {
  return (
    <div
      role="menu"
      className={`absolute w-[232px] rounded-xl border border-[var(--pa-border)] bg-white py-1 shadow-[var(--pa-shadow-overlay)] motion-reduce:transition-none ${positionClassName}`}
    >
      {session ? (
        <div className="border-b border-[var(--pa-border)] px-4 py-3">
          <div className="text-[13px] font-bold text-[var(--pa-ink)]">{name}</div>
          <div className="text-[11.5px] text-[var(--pa-muted)]">
            {session.email ?? session.username}
          </div>
        </div>
      ) : null}
      {USER_MENU_ITEMS.map((item) => (
        <button
          key={item.path}
          type="button"
          role="menuitem"
          onClick={() => onNavigate(item.path)}
          className="block w-full px-4 py-2.5 text-left text-[13px] text-[var(--pa-ink)] hover:bg-[var(--pa-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--pa-navy)]"
        >
          {item.label}
        </button>
      ))}
      <div className="my-1 h-px bg-[var(--pa-border)]" />
      <button
        type="button"
        role="menuitem"
        onClick={onLogout}
        className="block w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[var(--pa-danger)] hover:bg-[#FDF0EE]"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
