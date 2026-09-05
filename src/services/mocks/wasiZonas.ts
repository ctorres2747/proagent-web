import type { WasiZonasService } from "@/services/interfaces/wasiZonas";

const MOCK_ZONAS: Record<string, string[]> = {
  itagui: ["Ajizal", "Araucaria", "Asturias", "Suramérica"],
  sabaneta: ["Alcázares", "Aliadas", "Ancón Sur"],
  envigado: ["Alcalá", "Alto De Las Flores", "Zúñiga"],
  "la estrella": ["La Ferrería", "La Tablaza", "Suramérica"],
  bogota: ["Suba", "Kennedy", "Fontibón", "Bosa"],
};

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

export const wasiZonasService: WasiZonasService = {
  async list(municipio: string) {
    return { municipio, zonas: MOCK_ZONAS[normalizar(municipio)] ?? [] };
  },
};
