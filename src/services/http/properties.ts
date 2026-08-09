import type {
  PropertiesService,
  Property,
} from "@/services/interfaces/properties";
import { apiFetch } from "./client";

// TEMP bridge: use /api/mobile/properties* until /api/web/properties* exists.
// When it does, only these paths + the mapper below change — not the UI.
const LIST_PATH = "/api/mobile/properties";
const detailPath = (id: string) => `/api/mobile/properties/${id}`;

interface RawProperty {
  id: number | string;
  titulo?: string | null;
  title?: string | null;
  municipio?: string | null;
  tipo?: string | null;
  tipo_inmueble?: string | null;
  precio?: number | string | null;
  habitaciones?: number | string | null;
  banos?: number | string | null;
  area_m2?: number | string | null;
  areaM2?: number | string | null;
  completeness?: number | null;
  portada_url?: string | null;
  portadaUrl?: string | null;
  owner_agente_id?: number | string | null;
}

function num(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function mapProperty(raw: RawProperty): Property {
  return {
    id: String(raw.id),
    titulo: raw.titulo ?? raw.title ?? "(sin título)",
    municipio: raw.municipio ?? "",
    tipo: raw.tipo ?? raw.tipo_inmueble ?? "",
    precio: num(raw.precio),
    habitaciones: num(raw.habitaciones),
    banos: num(raw.banos),
    areaM2: num(raw.area_m2 ?? raw.areaM2),
    completeness: typeof raw.completeness === "number" ? raw.completeness : 0,
    portadaUrl: raw.portada_url ?? raw.portadaUrl ?? null,
    ownerAgenteId:
      raw.owner_agente_id !== null && raw.owner_agente_id !== undefined
        ? String(raw.owner_agente_id)
        : null,
  };
}

export const propertiesService: PropertiesService = {
  async list(token?: string): Promise<Property[]> {
    const raw = await apiFetch<RawProperty[]>(LIST_PATH, { token });
    return Array.isArray(raw) ? raw.map(mapProperty) : [];
  },
  async get(id: string, token?: string): Promise<Property> {
    const raw = await apiFetch<RawProperty>(detailPath(id), { token });
    return mapProperty(raw);
  },
};
