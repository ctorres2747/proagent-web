import type {
  DashboardService,
  DesempenoDashboard,
  DesempenoPeriodoTipo,
} from "@/services/interfaces/dashboard";
import { apiFetch } from "./client";

const PATH = "/api/web/dashboard/desempeno";

interface RawDashboard {
  periodo: {
    tipo: DesempenoPeriodoTipo;
    anio: number;
    mes: number;
    comparado_con: { anio: number; mes: number } | null;
  };
  kpis: {
    captadas: { actual: number; meta: number | null; anterior: number | null };
    publicadas: { actual: number; meta: number | null; anterior: number | null };
    leads: { actual: number; meta: number | null; anterior: number | null };
    conversion: {
      actual: number;
      meta: number | null;
      anterior: number | null;
      captados: number;
      recibidos: number;
    };
  };
  serie_mensual: {
    leads: number[];
    captadas: number[];
    publicadas: number[];
    meta_mensual: { leads: number; captadas: number; publicadas: number } | null;
    meta_leads?: (number | null)[];
    meta_captadas?: (number | null)[];
    meta_publicadas?: (number | null)[];
  } | null;
  pendientes: {
    leads_sin_contactar: { total: number; mas_de_48h: number };
    fichas_incompletas: { total: number; muestras: string[] };
    captados_sin_registrar: { total: number };
    sin_publicar: { total: number };
  };
}

function mapDashboard(raw: RawDashboard): DesempenoDashboard {
  return {
    periodo: {
      tipo: raw.periodo.tipo,
      anio: raw.periodo.anio,
      mes: raw.periodo.mes,
      comparadoCon: raw.periodo.comparado_con,
    },
    kpis: {
      captadas: raw.kpis.captadas,
      publicadas: raw.kpis.publicadas,
      leads: raw.kpis.leads,
      conversion: raw.kpis.conversion,
    },
    serieMensual: raw.serie_mensual
      ? {
          leads: raw.serie_mensual.leads,
          captadas: raw.serie_mensual.captadas,
          publicadas: raw.serie_mensual.publicadas,
          metaMensual: raw.serie_mensual.meta_mensual,
          metaLeads: raw.serie_mensual.meta_leads ?? [],
          metaCaptadas: raw.serie_mensual.meta_captadas ?? [],
          metaPublicadas: raw.serie_mensual.meta_publicadas ?? [],
        }
      : null,
    pendientes: {
      leadsSinContactar: {
        total: raw.pendientes.leads_sin_contactar.total,
        masDe48h: raw.pendientes.leads_sin_contactar.mas_de_48h,
      },
      fichasIncompletas: raw.pendientes.fichas_incompletas,
      captadosSinRegistrar: raw.pendientes.captados_sin_registrar,
      sinPublicar: raw.pendientes.sin_publicar,
    },
  };
}

export const dashboardService: DashboardService = {
  async getDesempeno(params, token) {
    const raw = await apiFetch<RawDashboard>(PATH, {
      token,
      query: {
        periodo: params.periodo,
        anio: params.anio,
        mes: params.mes,
      },
    });
    return mapDashboard(raw);
  },
};
