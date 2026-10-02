import type { DashboardService } from "@/services/interfaces/dashboard";

export const dashboardService: DashboardService = {
  async getDesempeno({ periodo, anio = 2026, mes = 9 }) {
    await new Promise((r) => setTimeout(r, 400));
    const base = {
      periodo: {
        tipo: periodo,
        anio,
        mes,
        comparadoCon: periodo === "mes" ? { anio, mes: mes === 1 ? 12 : mes - 1 } : null,
      },
      kpis: {
        captadas: { actual: 7, meta: 8, anterior: periodo === "mes" ? 5 : null },
        publicadas: { actual: 9, meta: periodo === "mes" ? 10 : 90, anterior: periodo === "mes" ? 11 : null },
        leads: { actual: 64, meta: periodo === "mes" ? 60 : 540, anterior: periodo === "mes" ? 56 : null },
        conversion: {
          actual: 14.1,
          meta: 15,
          anterior: periodo === "mes" ? 10.7 : null,
          captados: 9,
          recibidos: 64,
        },
      },
      serieMensual:
        periodo === "anio"
          ? {
              leads: [52, 48, 61, 55, 58, 62, 59, 64],
              captadas: [6, 5, 7, 8, 6, 7, 8, 7],
              publicadas: [8, 9, 10, 9, 11, 10, 9, 9],
              metaMensual: { leads: 60, captadas: 8, publicadas: 10 },
              metaLeads: [60, 60, 60, 60, 60, 60, 60, 60],
              metaCaptadas: [8, 8, 8, 8, 8, 8, 8, 8],
              metaPublicadas: [10, 10, 10, 10, 10, 10, 10, 10],
            }
          : null,
      pendientes: {
        leadsSinContactar: { total: 2, masDe48h: 1 },
        fichasIncompletas: { total: 1, muestras: ["Casa en La Estrella"] },
        captadosSinRegistrar: { total: 0 },
        sinPublicar: { total: 3 },
      },
    };
    return base;
  },
};
