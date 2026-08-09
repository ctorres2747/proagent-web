import type {
  Intent,
  PropertiesService,
  Property,
  PropertyChannel,
} from "@/services/interfaces/properties";
import type { ChannelStatus } from "@/design-system/channels";
import { CHANNEL_ORDER } from "@/design-system/channels";
import { apiFetch } from "./client";

// TEMP bridge: use /api/mobile/properties* until /api/web/properties* exists.
// When it does, only these paths + the mapper below change — not the UI.
const LIST_PATH = "/api/mobile/properties";
const detailPath = (id: string) => `/api/mobile/properties/${id}`;

interface RawProperty {
  id: number | string;
  code?: string | null;
  titulo?: string | null;
  title?: string | null;
  tipo?: string | null;
  tipo_inmueble?: string | null;
  intent?: string | null;
  intencion?: string | null;
  municipio?: string | null;
  barrio?: string | null;
  direccion?: string | null;
  codigo_postal?: string | null;
  precio?: number | string | null;
  alcobas?: number | string | null;
  habitaciones?: number | string | null;
  banos?: number | string | null;
  parqueaderos?: number | string | null;
  estrato?: number | string | null;
  piso?: number | string | null;
  area_m2?: number | string | null;
  area_privada?: number | string | null;
  area_construida?: number | string | null;
  administracion?: number | string | null;
  anio_construccion?: number | string | null;
  condicion?: string | null;
  features?: string[] | null;
  descripcion?: string | null;
  completeness?: number | null;
  portada_url?: string | null;
  owner_agente_id?: number | string | null;
  channels?: { id: string; status: string }[] | null;
}

function num(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function mapChannels(raw: RawProperty["channels"]): PropertyChannel[] {
  const byId = new Map<string, ChannelStatus>();
  for (const c of raw ?? []) {
    const status = (["published", "progress", "error", "none"] as const).includes(
      c.status as ChannelStatus,
    )
      ? (c.status as ChannelStatus)
      : "none";
    byId.set(c.id, status);
  }
  return CHANNEL_ORDER.map((id) => ({ id, status: byId.get(id) ?? "none" }));
}

function mapProperty(raw: RawProperty): Property {
  const intent: Intent = (raw.intent ?? raw.intencion) === "Arriendo" ? "Arriendo" : "Venta";
  return {
    id: String(raw.id),
    code: raw.code ?? String(raw.id),
    titulo: raw.titulo ?? raw.title ?? "(sin título)",
    tipo: raw.tipo ?? raw.tipo_inmueble ?? "",
    intent,
    municipio: raw.municipio ?? "",
    barrio: raw.barrio ?? null,
    direccion: raw.direccion ?? null,
    codigoPostal: raw.codigo_postal ?? null,
    precio: num(raw.precio),
    esArriendo: intent === "Arriendo",
    alcobas: num(raw.alcobas ?? raw.habitaciones),
    banos: num(raw.banos),
    parqueaderos: num(raw.parqueaderos),
    estrato: num(raw.estrato),
    piso: num(raw.piso),
    areaM2: num(raw.area_m2),
    areaPrivada: num(raw.area_privada),
    areaConstruida: num(raw.area_construida),
    administracion: num(raw.administracion),
    anioConstruccion: num(raw.anio_construccion),
    condicion:
      raw.condicion === "Nuevo" ||
      raw.condicion === "Usado" ||
      raw.condicion === "Proyecto" ||
      raw.condicion === "En construcción"
        ? raw.condicion
        : null,
    features: Array.isArray(raw.features) ? raw.features : [],
    descripcion: raw.descripcion ?? null,
    completeness: typeof raw.completeness === "number" ? raw.completeness : 0,
    portadaUrl: raw.portada_url ?? null,
    ownerAgenteId:
      raw.owner_agente_id !== null && raw.owner_agente_id !== undefined
        ? String(raw.owner_agente_id)
        : null,
    channels: mapChannels(raw.channels),
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
