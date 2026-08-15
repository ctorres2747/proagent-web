import type { AuthService } from "@/services/interfaces/auth";
import type {
  AgentSession,
  LoginResponse,
  Role,
} from "@/features/auth/types";
import { apiFetch } from "./client";

// Dedicated web API (backend/web en agente-inmobiliario). Reemplazó al puente
// temporal /api/mobile/auth/*. Cambiar de host = NEXT_PUBLIC_API_URL.
const LOGIN_PATH = "/api/web/auth/login";
const ME_PATH = "/api/web/auth/me";
const HANDOFF_EXCHANGE_PATH = "/api/web/auth/handoff/exchange";

interface RawAgent {
  id: number | string;
  username: string;
  nombre?: string | null;
  role?: string | null;
  email?: string | null;
  can_access_captacion?: boolean | null;
  nombre_preferido?: string | null;
  municipios?: string[] | null;
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
    canAccessCaptacion: raw.can_access_captacion ?? undefined,
    nombrePreferido: raw.nombre_preferido ?? undefined,
    municipios: raw.municipios ?? undefined,
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

  async exchangeHandoff(code: string): Promise<LoginResponse> {
    const raw = await apiFetch<RawLoginResponse>(HANDOFF_EXCHANGE_PATH, {
      method: "POST",
      body: { code },
    });
    return {
      access_token: raw.access_token,
      token_type: raw.token_type,
      expires_in: raw.expires_in,
      agent: mapAgent(raw.agent),
    };
  },
};
