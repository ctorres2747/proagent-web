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
  /** Sprint 012 — nombre corto para saludo (Andreina, Nataly). */
  nombrePreferido?: string | null;
  /** Sprint 014 — municipios de captación del asesor. */
  municipios?: string[];
  /** Sprint 013 — foto de perfil (URL pública). */
  fotoPerfilUrl?: string | null;
  telefono?: string | null;
  instagramHandle?: string | null;
  bioCorta?: string | null;
}

/** Respuesta del login JWT (puente temporal /api/mobile/auth/login). */
export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  agent: AgentSession;
}
