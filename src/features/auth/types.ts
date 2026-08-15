/** Roles del MVP Web (Coordinador llega después). */
export type Role = "admin" | "asesor";

/** Sesión del agente autenticado, normalizada para la UI. */
export interface AgentSession {
  id: string;
  username: string;
  nombre: string;
  role: Role;
  /** Email del agente; los @proinversores habilitan reglas admin (E-INV-01). */
  email?: string;
  /** Sprint 010/011 — staff Proinversores puede ver Captación (API gate). */
  canAccessCaptacion?: boolean;
}

/** Respuesta del login JWT (puente temporal /api/mobile/auth/login). */
export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  agent: AgentSession;
}
