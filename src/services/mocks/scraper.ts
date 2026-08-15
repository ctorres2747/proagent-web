import type { ScraperService } from "@/services/interfaces/scraper";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const scraperService: ScraperService = {
  async status() {
    await delay(200);
    return {
      running: false,
      lastExecution: {
        portal: "MercadoLibre",
        fecha_inicio: new Date(Date.now() - 3_600_000).toISOString(),
        fecha_fin: new Date(Date.now() - 1_800_000).toISOString(),
        estado: "completed",
        leads_encontrados: 12,
        leads_nuevos: 3,
      },
      lastByPortal: {
        MercadoLibre: {
          portal: "MercadoLibre",
          fecha_inicio: new Date(Date.now() - 3_600_000).toISOString(),
          fecha_fin: new Date(Date.now() - 1_800_000).toISOString(),
          estado: "completed",
          leads_encontrados: 12,
          leads_nuevos: 3,
        },
        Facebook: {
          portal: "Facebook",
          fecha_inicio: new Date(Date.now() - 3_500_000).toISOString(),
          fecha_fin: new Date(Date.now() - 1_700_000).toISOString(),
          estado: "completed",
          leads_encontrados: 8,
          leads_nuevos: 2,
        },
      },
      stats: { total: 24, hoy: 5 },
      queueStatus: null,
    };
  },
};
