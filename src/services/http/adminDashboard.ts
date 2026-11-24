import type {
  AdminDashboard,
  AdminDashboardService,
  AdminPubCanal,
} from "@/services/interfaces/adminDashboard";
import { apiFetch } from "./client";

const PATH = "/api/web/admin/dashboard";
const CANALES: AdminPubCanal[] = ["whatsapp", "marketplace", "wasi", "instagram"];

interface RawLeads {
  recibidos: number;
  en_contacto: number;
  captadas: number;
  descartadas: number;
}

interface RawAsesor {
  id: number;
  nombre: string;
  iniciales: string;
  scraper: {
    estado: "ok" | "warn" | "error";
    ultima_corrida: string | null;
    ultima_corrida_ok: string | null;
    ultimo_error: string | null;
    corridas: {
      inicio: string | null;
      estado: "ok" | "error";
      leads: number;
      error?: string | null;
    }[];
  };
  leads: RawLeads;
  leads_ant: RawLeads;
  publicacion: Record<string, { fallos: number; intentos: number }>;
  publicacion_fallos_ant: Record<string, number>;
  clientes: {
    calificando: number;
    visitas: number;
    negociando: number;
    cerrados: number;
    cerrados_ant: number;
  };
}

interface RawDashboard {
  periodo: {
    anio: number;
    mes: number;
    desde: string;
    hasta: string;
    en_curso: boolean;
    comparado_con: { desde: string; hasta: string };
  };
  canales: string[];
  asesores: RawAsesor[];
}

function emptyCanal() {
  return { fallos: 0, intentos: 0 };
}

function mapPub(raw: Record<string, { fallos: number; intentos: number }>) {
  const out = {} as AdminDashboard["asesores"][0]["publicacion"];
  for (const ch of CANALES) {
    out[ch] = raw[ch] ?? emptyCanal();
  }
  return out;
}

function mapFallosAnt(raw: Record<string, number>) {
  const out = {} as AdminDashboard["asesores"][0]["publicacionFallosAnt"];
  for (const ch of CANALES) {
    out[ch] = raw[ch] ?? 0;
  }
  return out;
}

function mapLeads(raw: RawLeads) {
  return {
    recibidos: raw.recibidos,
    enContacto: raw.en_contacto,
    captadas: raw.captadas,
    descartadas: raw.descartadas,
  };
}

function mapDashboard(raw: RawDashboard): AdminDashboard {
  const canales = (raw.canales ?? CANALES).filter((c): c is AdminPubCanal =>
    (CANALES as string[]).includes(c),
  );
  return {
    periodo: {
      anio: raw.periodo.anio,
      mes: raw.periodo.mes,
      desde: raw.periodo.desde,
      hasta: raw.periodo.hasta,
      enCurso: raw.periodo.en_curso,
      comparadoCon: raw.periodo.comparado_con,
    },
    canales: canales.length ? canales : CANALES,
    asesores: raw.asesores.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      iniciales: a.iniciales,
      scraper: {
        estado: a.scraper.estado,
        ultimaCorrida: a.scraper.ultima_corrida,
        ultimaCorridaOk: a.scraper.ultima_corrida_ok,
        ultimoError: a.scraper.ultimo_error,
        corridas: a.scraper.corridas.map((c) => ({
          inicio: c.inicio,
          estado: c.estado,
          leads: c.leads,
          error: c.error,
        })),
      },
      leads: mapLeads(a.leads),
      leadsAnt: mapLeads(a.leads_ant),
      publicacion: mapPub(a.publicacion ?? {}),
      publicacionFallosAnt: mapFallosAnt(a.publicacion_fallos_ant ?? {}),
      clientes: {
        calificando: a.clientes.calificando,
        visitas: a.clientes.visitas,
        negociando: a.clientes.negociando,
        cerrados: a.clientes.cerrados,
        cerradosAnt: a.clientes.cerrados_ant,
      },
    })),
  };
}

export const adminDashboardService: AdminDashboardService = {
  async getAdminDashboard(params, token) {
    const raw = await apiFetch<RawDashboard>(PATH, {
      token,
      query: { anio: params.anio, mes: params.mes },
    });
    return mapDashboard(raw);
  },
};
