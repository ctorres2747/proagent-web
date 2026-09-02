"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useAgentView } from "@/features/agentView/AgentViewProvider";
import { useAuth } from "@/features/auth/AuthProvider";
import { canAccessCaptacion } from "@/lib/agentDisplay";
import { navCountsService } from "@/services/http/navCounts";

import { MobileDrawer } from "./MobileDrawer";
import { Sidebar } from "./Sidebar";
import { ShellHeader } from "./ShellHeader";
import { useShellState } from "./use-shell-state";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, token } = useAuth();
  const { viewAgenteId, setViewAgenteId, viewAgenteLabel } = useAgentView();
  const { collapsed, toggleCollapsed, drawerOpen, setDrawerOpen, hydrated } =
    useShellState();

  const staff = canAccessCaptacion(session);
  const admin = session?.role === "admin";
  const sessionReady = Boolean(session);

  const { data: navCounts } = useQuery({
    queryKey: ["nav-counts", viewAgenteId],
    queryFn: () => navCountsService.get(token ?? undefined, viewAgenteId ?? undefined),
    enabled: Boolean(token),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  return (
    <div className="flex min-h-screen bg-[var(--pa-bg)] text-[var(--pa-ink)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
      >
        Saltar al contenido
      </a>

      <Sidebar
        pathname={pathname}
        collapsed={hydrated ? collapsed : false}
        onToggleCollapsed={toggleCollapsed}
        staff={staff}
        admin={admin}
        sessionReady={sessionReady}
        captacionBadge={navCounts?.captacionPending}
        inventoryBadge={navCounts?.inventoryCount}
      />

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        pathname={pathname}
        staff={staff}
        admin={admin}
        captacionBadge={navCounts?.captacionPending}
        inventoryBadge={navCounts?.inventoryCount}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <ShellHeader
          pathname={pathname}
          onOpenDrawer={() => setDrawerOpen(true)}
          viewAgenteLabel={admin && viewAgenteId ? viewAgenteLabel : null}
          onExitViewAs={() => setViewAgenteId(null)}
        />

        <main id="main" className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[var(--pa-shell-content-max)] px-4 py-7 pb-[60px] md:px-6 xl:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
