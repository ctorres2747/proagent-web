import type {
  CriteriosCaptacion,
  CriteriosCaptacionUpdate,
  CriteriosService,
  ParqueaderoPreferencia,
} from "@/services/interfaces/criterios";
import { apiFetch } from "./client";

const PATH = "/api/web/me/criterios";

interface RawCriterios {
  agente_id: string;
  precio_min?: number | null;
  precio_max?: number | null;
  tipo_inmueble?: string[] | null;
  metraje_min?: number | null;
  metraje_max?: number | null;
  parqueadero?: string | null;
}

function mapCriterios(raw: RawCriterios): CriteriosCaptacion {
  const parqueadero = raw.parqueadero;
  const parqueaderoNorm: ParqueaderoPreferencia | null =
    parqueadero === "si" || parqueadero === "no" || parqueadero === "indiferente"
      ? parqueadero
      : null;
  return {
    agenteId: raw.agente_id,
    precioMin: raw.precio_min ?? null,
    precioMax: raw.precio_max ?? null,
    tipoInmueble: raw.tipo_inmueble ?? [],
    metrajeMin: raw.metraje_min ?? null,
    metrajeMax: raw.metraje_max ?? null,
    parqueadero: parqueaderoNorm,
  };
}

function toRawUpdate(data: CriteriosCaptacionUpdate): Record<string, unknown> {
  return {
    precio_min: data.precioMin ?? null,
    precio_max: data.precioMax ?? null,
    tipo_inmueble: data.tipoInmueble ?? [],
    metraje_min: data.metrajeMin ?? null,
    metraje_max: data.metrajeMax ?? null,
    parqueadero: data.parqueadero ?? null,
  };
}

export const criteriosService: CriteriosService = {
  async get(token) {
    const raw = await apiFetch<RawCriterios>(PATH, { token });
    return mapCriterios(raw);
  },

  async update(data, token) {
    const raw = await apiFetch<RawCriterios>(PATH, {
      method: "PATCH",
      token,
      body: toRawUpdate(data),
    });
    return mapCriterios(raw);
  },
};
