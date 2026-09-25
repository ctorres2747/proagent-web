import type {
  WasiCiudadResolveResult,
  WasiCiudadesResult,
  WasiCiudadesService,
} from "@/services/interfaces/wasiCiudades";
import { apiFetch } from "./client";

export const wasiCiudadesService: WasiCiudadesService = {
  async search(q: string, token?: string): Promise<WasiCiudadesResult> {
    const raw = await apiFetch<{ ciudades?: WasiCiudadesResult["ciudades"] }>(
      "/api/web/wasi/ciudades",
      { token, query: { q } },
    );
    return { ciudades: raw.ciudades ?? [] };
  },

  async resolve(municipio: string, token?: string): Promise<WasiCiudadResolveResult> {
    return apiFetch<WasiCiudadResolveResult>("/api/web/wasi/ciudades/resolve", {
      token,
      query: { municipio },
    });
  },
};
