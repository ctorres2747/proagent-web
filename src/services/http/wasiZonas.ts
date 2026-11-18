import type {
  WasiZonaItem,
  WasiZonasResult,
  WasiZonasService,
} from "@/services/interfaces/wasiZonas";
import { apiFetch } from "./client";

interface RawWasiZonaItem {
  name: string;
  id_zone?: number | null;
}

interface RawWasiZonasResult {
  municipio: string;
  zonas?: string[];
  zonas_detalle?: RawWasiZonaItem[];
}

export const wasiZonasService: WasiZonasService = {
  async list(municipio: string, localidad?: string, token?: string): Promise<WasiZonasResult> {
    const raw = await apiFetch<RawWasiZonasResult>("/api/web/wasi/zonas", {
      token,
      query: { municipio, localidad: localidad || undefined },
    });
    const zonasDetalle: WasiZonaItem[] = (raw.zonas_detalle ?? []).map((z) => ({
      name: z.name,
      idZone: z.id_zone ?? null,
    }));
    return { municipio: raw.municipio, zonas: raw.zonas ?? [], zonasDetalle };
  },
};
