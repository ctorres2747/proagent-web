export interface ScraperExecution {
  portal?: string;
  fecha_inicio?: string;
  fecha_fin?: string | null;
  estado?: string;
  leads_encontrados?: number;
  leads_nuevos?: number;
  mensaje?: string | null;
}

export interface ScraperStatus {
  running: boolean;
  lastExecution: ScraperExecution | null;
  lastByPortal: Record<string, ScraperExecution | null | undefined>;
  stats: {
    total?: number;
    hoy?: number;
    recontactar_vencidos?: number;
    publicaciones_con_error?: number;
  };
  queueStatus: string | null;
}

export interface ScraperRunOptions {
  /** Correr solo la zona de este asesor en vez de la unión de todas. */
  agenteId?: number;
}

export interface ScraperRunResult {
  message: string;
  running: boolean;
}

export interface ScraperService {
  status(token?: string): Promise<ScraperStatus>;
  run(options: ScraperRunOptions, token?: string): Promise<ScraperRunResult>;
}
