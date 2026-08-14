import type { AgentSession, LoginResponse } from "@/features/auth/types";

/**
 * Auth service contract. Implemented by mocks and by the HTTP adapter.
 * When `/api/web/*` exists, only the HTTP adapter changes — not the UI.
 */
export interface AuthService {
  login(username: string, password: string): Promise<LoginResponse>;
  /** Hydrate the current session from a stored token. */
  me(token: string): Promise<AgentSession>;
  /** Exchange a one-time Kanban handoff code for a JWT session. */
  exchangeHandoff(code: string): Promise<LoginResponse>;
}
