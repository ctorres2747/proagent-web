"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { agentesService } from "@/services";
import type { AgenteResumen } from "@/services/interfaces/agentes";

const STORAGE_KEY = "proagent.web.viewAgenteId";

interface AgentViewContextValue {
  /** Admin-only "ver como asesor" — null = vista combinada (todos). */
  viewAgenteId: string | null;
  setViewAgenteId: (id: string | null) => void;
  /** Lista de asesores para armar el selector — vacía para un asesor normal. */
  agentesList: AgenteResumen[];
  /** Nombre a mostrar del asesor elegido, si hay uno. */
  viewAgenteLabel: string | null;
}

const AgentViewContext = createContext<AgentViewContextValue | null>(null);

export function AgentViewProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, token } = useAuth();
  const isAdmin = session?.role === "admin";
  const [viewAgenteId, setViewAgenteIdState] = useState<string | null>(null);

  // Restaurar selección previa (misma pestaña) — evita perder el filtro con un F5.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) setViewAgenteIdState(stored);
  }, []);

  // Un asesor normal nunca debe quedar "viendo como" otro — y al cerrar
  // sesión, el próximo login (admin u otro) arranca en vista combinada.
  useEffect(() => {
    if (!isAdmin) {
      setViewAgenteIdState(null);
      if (typeof window !== "undefined") sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [isAdmin]);

  const setViewAgenteId = useCallback((id: string | null) => {
    setViewAgenteIdState(id);
    if (typeof window === "undefined") return;
    if (id) sessionStorage.setItem(STORAGE_KEY, id);
    else sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const { data: agentesList } = useQuery({
    queryKey: ["agentes"],
    queryFn: () => agentesService.list(token ?? undefined),
    enabled: isAdmin,
    staleTime: 5 * 60_000,
  });

  const viewAgenteLabel = useMemo(() => {
    if (!viewAgenteId) return null;
    const found = agentesList?.find((a) => String(a.id) === viewAgenteId);
    return found?.nombrePreferido || found?.nombre || `Asesor ${viewAgenteId}`;
  }, [viewAgenteId, agentesList]);

  const value = useMemo<AgentViewContextValue>(
    () => ({
      viewAgenteId: isAdmin ? viewAgenteId : null,
      setViewAgenteId,
      agentesList: agentesList ?? [],
      viewAgenteLabel,
    }),
    [isAdmin, viewAgenteId, setViewAgenteId, agentesList, viewAgenteLabel],
  );

  return (
    <AgentViewContext.Provider value={value}>
      {children}
    </AgentViewContext.Provider>
  );
}

export function useAgentView(): AgentViewContextValue {
  const ctx = useContext(AgentViewContext);
  if (!ctx) {
    throw new Error("useAgentView debe usarse dentro de <AgentViewProvider>");
  }
  return ctx;
}
