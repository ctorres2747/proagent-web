import type { AuthService } from "@/services/interfaces/auth";
import type {
  AgentSession,
  LoginResponse,
  Role,
} from "@/features/auth/types";
import { apiFetch } from "./client";

// TEMP bridge: use /api/mobile/auth/* until /api/web/auth/* exists.
// When it does, only these paths + the mapper below change — not the UI.
const LOGIN_PATH = "/api/mobile/auth/login";
const ME_PATH = "/api/mobile/auth/me";

interface RawAgent {
  id: number | string;
  username: string;
  nombre?: string | null;
  role?: string | null;
  email?: string | null;
}

interface RawLoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  agent: RawAgent;
}

function toRole(raw: string | null | undefined): Role {
  return raw === "admin" ? "admin" : "asesor";
}

function mapAgent(raw: RawAgent): AgentSession {
  return {
    id: String(raw.id),
    username: raw.username,
    nombre: raw.nombre?.trim() || raw.username,
    role: toRole(raw.role),
    email: raw.email ?? undefined,
  };
}

export const authService: AuthService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const raw = await apiFetch<RawLoginResponse>(LOGIN_PATH, {
      method: "POST",
      body: { username, password },
    });
    return {
      access_token: raw.access_token,
      token_type: raw.token_type,
      expires_in: raw.expires_in,
      agent: mapAgent(raw.agent),
    };
  },

  async me(token: string): Promise<AgentSession> {
    const raw = await apiFetch<RawAgent>(ME_PATH, { token });
    return mapAgent(raw);
  },
};
