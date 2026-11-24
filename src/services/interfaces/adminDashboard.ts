export type AdminScraperEstado = "ok" | "warn" | "error";
export type AdminPubCanal = "whatsapp" | "marketplace" | "wasi" | "instagram";
export type AdminMetrica =
  | "leads"
  | "en_contacto"
  | "captadas"
  | "descartadas"
  | "cerrados";

export interface AdminDashboardPeriodo {
  anio: number;
  mes: number;
  desde: string;
  hasta: string;
  enCurso: boolean;
  comparadoCon: { desde: string; hasta: string };
}

export interface AdminScraperCorrida {
  inicio: string | null;
  estado: "ok" | "error";
  leads: number;
  error?: string | null;
}

export interface AdminAsesorDashboard {
  id: number;
  nombre: string;
  iniciales: string;
  scraper: {
    estado: AdminScraperEstado;
    ultimaCorrida: string | null;
    ultimaCorridaOk: string | null;
    ultimoError: string | null;
    corridas: AdminScraperCorrida[];
  };
  leads: {
    recibidos: number;
    enContacto: number;
    captadas: number;
    descartadas: number;
  };
  leadsAnt: {
    recibidos: number;
    enContacto: number;
    captadas: number;
    descartadas: number;
  };
  publicacion: Record<AdminPubCanal, { fallos: number; intentos: number }>;
  publicacionFallosAnt: Record<AdminPubCanal, number>;
  clientes: {
    calificando: number;
    visitas: number;
    negociando: number;
    cerrados: number;
    cerradosAnt: number;
  };
}

export interface AdminDashboard {
  periodo: AdminDashboardPeriodo;
  canales: AdminPubCanal[];
  asesores: AdminAsesorDashboard[];
}

export interface AdminDashboardService {
  getAdminDashboard(
    params: { anio?: number; mes?: number },
    token?: string,
  ): Promise<AdminDashboard>;
}
