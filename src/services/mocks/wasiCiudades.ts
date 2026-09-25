import type { WasiCiudadesService } from "@/services/interfaces/wasiCiudades";

const MOCK_CIUDADES = [
  { name: "Medellín", region: "Antioquia" },
  { name: "Envigado", region: "Antioquia" },
  { name: "Itagüí", region: "Antioquia" },
  { name: "Rionegro", region: "Antioquia" },
  { name: "Sabaneta", region: "Antioquia" },
  { name: "Bogotá D.C.", region: "Cundinamarca" },
];

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

export const wasiCiudadesService: WasiCiudadesService = {
  async search(q: string) {
    const needle = normalizar(q);
    if (needle.length < 2) return { ciudades: [] };
    return {
      ciudades: MOCK_CIUDADES.filter((c) => normalizar(c.name).includes(needle)),
    };
  },

  async resolve(municipio: string) {
    const needle = normalizar(municipio);
    const alias: Record<string, string> = {
      suba: "Bogotá D.C.",
      kennedy: "Bogotá D.C.",
      bosa: "Bogotá D.C.",
    };
    if (alias[needle]) return { canonical: alias[needle] };
    const hit = MOCK_CIUDADES.find((c) => normalizar(c.name) === needle);
    return { canonical: hit?.name ?? null };
  },
};
