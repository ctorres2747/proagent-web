import type { WasiLocalidadesService } from "@/services/interfaces/wasiLocalidades";

// Mismas ciudades que mocks/wasiZonas.ts — solo Bogotá tiene localidades en
// WASI (verificado en vivo); el resto del Valle de Aburrá no, igual que en
// la cuenta real.
const MOCK_LOCALIDADES: Record<string, string[]> = {
  bogota: ["Usaquén", "Chapinero", "Engativá", "Suba", "Kennedy", "Fontibón", "Bosa"],
};

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

export const wasiLocalidadesService: WasiLocalidadesService = {
  async list(municipio: string) {
    return { municipio, localidades: MOCK_LOCALIDADES[normalizar(municipio)] ?? [] };
  },
};
