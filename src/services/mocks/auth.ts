import type { AuthService } from "@/services/interfaces/auth";
import type { AgentSession, LoginResponse } from "@/features/auth/types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Mock admin session used when running without a backend. */
export const MOCK_ADMIN: AgentSession = {
  id: "mock-admin",
  username: "admin@proinversores.com",
  nombre: "Admin Proinversores",
  role: "admin",
  email: "admin@proinversores.com",
  canAccessCaptacion: true,
  nombrePreferido: "Admin",
};

const MOCK_TOKEN = "mock-jwt-token";

export const authService: AuthService = {
  async login(username: string): Promise<LoginResponse> {
    await delay(300 + Math.random() * 300);
    // Any non-@proinversores login is treated as an "asesor" in mocks.
    const isAdmin = username.trim().toLowerCase().endsWith("@proinversores.com");
    const agent: AgentSession = isAdmin
      ? MOCK_ADMIN
      : {
          id: "mock-asesor",
          username: username || "asesor@demo.com",
          nombre: username || "Asesor Demo",
          role: "asesor",
          email: username || undefined,
        };
    return {
      access_token: MOCK_TOKEN,
      token_type: "bearer",
      expires_in: 60 * 60 * 24 * 7,
      agent,
    };
  },

  async me(): Promise<AgentSession> {
    await delay(150);
    return MOCK_ADMIN;
  },

  async exchangeHandoff(): Promise<LoginResponse> {
    await delay(150);
    throw new Error(
      "El handoff de Kanban requiere NEXT_PUBLIC_API_URL (modo HTTP).",
    );
  },
};
