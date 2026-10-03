import type { MetasService } from "@/services/interfaces/metas";

const DEFAULT = Array.from({ length: 12 }, (_, i) => ({
  mes: i + 1,
  captadas: 8,
  publicadas: 10,
  leads: 60,
  conversionPct: 15,
}));

export const metasService: MetasService = {
  async get(anio, agenteId) {
    await new Promise((r) => setTimeout(r, 300));
    return { anio, agenteId: agenteId ?? 1, meses: DEFAULT };
  },
  async put(payload) {
    await new Promise((r) => setTimeout(r, 400));
    return { anio: payload.anio, agenteId: payload.agenteId ?? 1, meses: payload.meses };
  },
};
