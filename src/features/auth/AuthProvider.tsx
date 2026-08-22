"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { USE_HTTP_API } from "@/config/env";
import { authService } from "@/services";
import { ApiError } from "@/services/http/client";
import { MOCK_ADMIN } from "@/services/mocks/auth";
import type { AgentSession, LoginResponse } from "./types";

const TOKEN_KEY = "proagent.web.token";

interface AuthContextValue {
  session: AgentSession | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  /** Persist a login/handoff response (same storage as login). */
  establishSession: (response: LoginResponse) => void;
  /** Sprint 013 — recargar sesión tras guardar perfil. */
  refreshSession: () => Promise<void>;
  updateSession: (patch: Partial<AgentSession>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AgentSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    setSession(null);
    setToken(null);
    setError(null);
    if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
    // Bug real 2026-08-22: sin esto, cerrar sesión de un agente y entrar con
    // otro (misma pestaña, sin recargar) seguía mostrando los datos
    // cacheados del agente anterior — todo React Query vive en un único
    // QueryClient con claves que no distinguen identidad (["leads"],
    // ["properties"], etc.). Limpiar el cache entero al cambiar de sesión
    // es el patrón estándar (mismo que recomienda la doc de React Query
    // para logout) — más robusto y escalable que namespacear cada clave.
    queryClient.clear();
  }, [queryClient]);

  // Bootstrap: in mock mode auto-authenticate as admin (no login gate).
  // In HTTP mode, restore token from localStorage and hydrate via /me.
  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!USE_HTTP_API) {
        if (!cancelled) {
          setSession(MOCK_ADMIN);
          setToken("mock-jwt-token");
          setLoading(false);
        }
        return;
      }
      const stored =
        typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
      if (!stored) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const me = await authService.me(stored);
        if (!cancelled) {
          setSession(me);
          setToken(stored);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const establishSession = useCallback((response: LoginResponse) => {
    setError(null);
    // Defensa en profundidad: si se establece una sesión sin pasar por
    // logout() antes (ej. handoff directo desde otra app), igual se limpia
    // el cache — nunca debe sobrevivir data de un agente distinto al actual.
    queryClient.clear();
    setSession(response.agent);
    setToken(response.access_token);
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, response.access_token);
    }
  }, [queryClient]);

  const updateSession = useCallback((patch: Partial<AgentSession>) => {
    setSession((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const refreshSession = useCallback(async () => {
    if (!USE_HTTP_API || !token) return;
    try {
      const me = await authService.me(token);
      setSession(me);
    } catch {
      // ignore — caller may show toast
    }
  }, [token]);

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    try {
      const res = await authService.login(username, password);
      establishSession(res);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo iniciar sesión";
      setError(message);
      throw err;
    }
  }, [establishSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      token,
      loading,
      error,
      login,
      establishSession,
      refreshSession,
      updateSession,
      logout,
    }),
    [
      session,
      token,
      loading,
      error,
      login,
      establishSession,
      refreshSession,
      updateSession,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
