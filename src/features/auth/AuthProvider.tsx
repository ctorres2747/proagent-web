"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { USE_HTTP_API } from "@/config/env";
import { authService } from "@/services";
import { ApiError } from "@/services/http/client";
import { MOCK_ADMIN } from "@/services/mocks/auth";
import type { AgentSession } from "./types";

const TOKEN_KEY = "proagent.web.token";

interface AuthContextValue {
  session: AgentSession | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AgentSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    setSession(null);
    setToken(null);
    setError(null);
    if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
  }, []);

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

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    try {
      const res = await authService.login(username, password);
      setSession(res.agent);
      setToken(res.access_token);
      if (typeof window !== "undefined")
        localStorage.setItem(TOKEN_KEY, res.access_token);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo iniciar sesión";
      setError(message);
      throw err;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, token, loading, error, login, logout }),
    [session, token, loading, error, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
