import type { WasiZonasResult, WasiZonasService } from "@/services/interfaces/wasiZonas";
import { apiFetch } from "./client";

interface RawWasiZonasResult {
  municipio: string;
  zonas?: string[];
}

export const wasiZonasService: WasiZonasService = {
  async list(municipio: string, token?: string): Promise<WasiZonasResult> {
    const raw = await apiFetch<RawWasiZonasResult>("/api/web/wasi/zonas", {
      token,
      query: { municipio },
    });
    return { municipio: raw.municipio, zonas: raw.zonas ?? [] };
  },
};
