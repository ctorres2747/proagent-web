import type {
  WasiLocalidadesResult,
  WasiLocalidadesService,
} from "@/services/interfaces/wasiLocalidades";
import { apiFetch } from "./client";

interface RawWasiLocalidadesResult {
  municipio: string;
  localidades?: string[];
}

export const wasiLocalidadesService: WasiLocalidadesService = {
  async list(municipio: string, token?: string): Promise<WasiLocalidadesResult> {
    const raw = await apiFetch<RawWasiLocalidadesResult>("/api/web/wasi/localidades", {
      token,
      query: { municipio },
    });
    return { municipio: raw.municipio, localidades: raw.localidades ?? [] };
  },
};
