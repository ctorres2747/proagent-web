export type DesempenoPeriodoTipo = "mes" | "anio";

export interface DesempenoKpi {
  actual: number;
  meta: number | null;
  anterior: number | null;
}

export interface DesempenoConversionKpi extends DesempenoKpi {
  captados: number;
  recibidos: number;
}

export interface DesempenoPeriodo {
  tipo: DesempenoPeriodoTipo;
  anio: number;
  mes: number;
  comparadoCon: { anio: number; mes: number } | null;
}

export interface DesempenoSerieMensual {
  leads: number[];
  captadas: number[];
  publicadas: number[];
  metaMensual: { leads: number; captadas: number; publicadas: number } | null;
  metaLeads: (number | null)[];
  metaCaptadas: (number | null)[];
  metaPublicadas: (number | null)[];
}

export interface DesempenoPendientes {
  leadsSinContactar: { total: number; masDe48h: number };
  fichasIncompletas: { total: number; muestras: string[] };
  captadosSinRegistrar: { total: number };
  sinPublicar: { total: number };
}

export interface DesempenoDashboard {
  periodo: DesempenoPeriodo;
  kpis: {
    captadas: DesempenoKpi;
    publicadas: DesempenoKpi;
    leads: DesempenoKpi;
    conversion: DesempenoConversionKpi;
  };
  serieMensual: DesempenoSerieMensual | null;
  pendientes: DesempenoPendientes;
}

export interface DashboardService {
  getDesempeno(
    params: {
      periodo: DesempenoPeriodoTipo;
      anio?: number;
      mes?: number;
    },
    token?: string,
  ): Promise<DesempenoDashboard>;
}
