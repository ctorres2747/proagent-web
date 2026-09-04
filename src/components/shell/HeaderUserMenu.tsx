"use client";

import { UserMenuPanel } from "./UserMenuPanel";
import { useUserMenu } from "./use-user-menu";

/** Avatar compacto (36px) en header — mismo menú que ShellUserMenu del sidebar. */
export function HeaderUserMenu() {
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
        aria-label={`Menú de ${name}`}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--pa-emerald-bright)] text-[11px] font-bold text-[var(--pa-emerald-ink)] ring-2 ring-transparent transition-shadow hover:ring-[var(--pa-border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pa-navy)]"
      >
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
      </button>

      {open ? (
        <UserMenuPanel
          session={session}
          name={name}
          onNavigate={go}
          onLogout={handleLogout}
          positionClassName="z-50 right-0 top-full mt-2"
        />
      ) : null}
    </div>
  );
}
