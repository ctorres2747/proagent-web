import type { WasiZonaItem, WasiZonasService } from "@/services/interfaces/wasiZonas";

const MOCK_ZONAS: Record<string, string[]> = {
  itagui: ["Ajizal", "Araucaria", "Asturias", "Suramérica"],
  sabaneta: ["Alcázares", "Aliadas", "Ancón Sur"],
  envigado: ["Alcalá", "Alto De Las Flores", "Zúñiga"],
  "la estrella": ["La Ferrería", "La Tablaza", "Suramérica"],
};

// Bogotá no tiene zonas por ciudad completa en WASI (verificado en vivo) —
// solo por localidad, igual que en la cuenta real. Mismas localidades que
// mocks/wasiLocalidades.ts.
const MOCK_ZONAS_POR_LOCALIDAD: Record<string, string[]> = {
  engativa: ["Álamo", "Bolivia", "Boyacá Real", "Garcés Navas", "Las Ferias", "Minuto de Dios"],
  suba: ["Niza", "La Academia", "El Rincón", "Tibabuyes"],
  kennedy: ["Carvajal", "Timiza", "Patio Bonito"],
};

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

function conIds(nombres: string[]): WasiZonaItem[] {
  return nombres.map((name, i) => ({ name, idZone: 100000 + i }));
}

export const wasiZonasService: WasiZonasService = {
  async list(municipio: string, localidad?: string) {
    const loc = (localidad || "").trim();
    const nombres = loc
      ? MOCK_ZONAS_POR_LOCALIDAD[normalizar(loc)] ?? []
      : MOCK_ZONAS[normalizar(municipio)] ?? [];
    return { municipio, zonas: nombres, zonasDetalle: conIds(nombres) };
  },
};
