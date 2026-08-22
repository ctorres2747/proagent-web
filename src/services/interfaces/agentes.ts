export interface AgenteResumen {
  id: number;
  nombre: string | null;
  nombrePreferido: string | null;
  municipios: string[];
  activo: boolean;
}

export interface AgentesService {
  /** Admin-only (el backend responde 403 para un asesor). */
  list(token?: string): Promise<AgenteResumen[]>;
}
