"use client";

import { ChevronUp } from "lucide-react";

import { UserMenuPanel } from "./UserMenuPanel";
import { useUserMenu } from "./use-user-menu";

export function ShellUserMenu({ collapsed }: { collapsed: boolean }) {
  const {
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
  } = useUserMenu();

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
        <UserMenuPanel
          session={session}
          name={name}
          onNavigate={go}
          onLogout={handleLogout}
          positionClassName={
            collapsed ? "z-30 bottom-0 left-full ml-2" : "z-30 bottom-full right-0 mb-2"
          }
        />
      ) : null}
    </div>
  );
}
