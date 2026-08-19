import type {
  Intent,
  PropertiesService,
  Property,
  PropertyChannel,
  PropertyPhoto,
} from "@/services/interfaces/properties";
import type { ChannelStatus } from "@/design-system/channels";
import { CHANNEL_ORDER } from "@/design-system/channels";
import { apiFetch, apiUploadForm } from "./client";

// Dedicated web API (backend/web en agente-inmobiliario). Reemplazó al puente
// temporal /api/mobile/properties*. El DTO web ya viene en el shape que espera
// el mapper de abajo (snake_case + channels), con reglas E-INV-01 por rol.
const LIST_PATH = "/api/web/properties";
const detailPath = (id: string) => `/api/web/properties/${id}`;

interface RawPhoto {
  id: string | number;
  url?: string | null;
  orden?: number | null;
  is_cover?: boolean | null;
}

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
  feature_ids?: number[] | null;
  features?: string[] | null;
  descripcion?: string | null;
  telefono_contacto?: string | null;
  nombre_contacto?: string | null;
  completeness?: number | null;
  missing_fields?: string[] | null;
  portada_url?: string | null;
  fotos?: RawPhoto[] | null;
  owner_agente_id?: number | string | null;
  owner_agente_nombre?: string | null;
  channels?: { id: string; status: string }[] | null;
  captured_at?: string | null;
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

function mapPhotos(raw: RawProperty["fotos"]): PropertyPhoto[] {
  return (raw ?? []).map((f, index) => ({
    id: String(f.id),
    url: f.url ?? "",
    orden: typeof f.orden === "number" ? f.orden : index,
    isCover: Boolean(f.is_cover ?? index === 0),
  }));
}

function mapProperty(raw: RawProperty): Property {
  const intent: Intent =
    (raw.intent ?? raw.intencion) === "Arriendo" ? "Arriendo" : "Venta";
  const fotos = mapPhotos(raw.fotos);
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
    featureIds: Array.isArray(raw.feature_ids)
      ? raw.feature_ids.map((x) => Number(x)).filter((n) => Number.isFinite(n))
      : [],
    features: Array.isArray(raw.features) ? raw.features : [],
    descripcion: raw.descripcion ?? null,
    telefonoContacto: raw.telefono_contacto?.trim()
      ? raw.telefono_contacto.trim()
      : null,
    nombreContacto: raw.nombre_contacto?.trim()
      ? raw.nombre_contacto.trim()
      : null,
    completeness: typeof raw.completeness === "number" ? raw.completeness : 0,
    missingFields: Array.isArray(raw.missing_fields) ? raw.missing_fields : [],
    portadaUrl: raw.portada_url ?? fotos[0]?.url ?? null,
    fotos,
    ownerAgenteId:
      raw.owner_agente_id !== null && raw.owner_agente_id !== undefined
        ? String(raw.owner_agente_id)
        : null,
    ownerAgenteNombre: raw.owner_agente_nombre?.trim()
      ? raw.owner_agente_nombre.trim()
      : null,
    channels: mapChannels(raw.channels),
    capturedAt: raw.captured_at ?? null,
  };
}

function toWriteBody(
  data: Parameters<PropertiesService["create"]>[0],
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (data.titulo !== undefined) body.titulo = data.titulo;
  if (data.descripcion !== undefined) body.descripcion = data.descripcion;
  if (data.tipo !== undefined) body.tipo = data.tipo;
  if (data.municipio !== undefined) body.municipio = data.municipio;
  if (data.barrio !== undefined) body.barrio = data.barrio;
  if (data.direccion !== undefined) body.direccion = data.direccion;
  if (data.codigoPostal !== undefined) body.codigo_postal = data.codigoPostal;
  if (data.precio !== undefined) body.precio = data.precio;
  if (data.alcobas !== undefined) body.alcobas = data.alcobas;
  if (data.banos !== undefined) body.banos = data.banos;
  if (data.parqueaderos !== undefined) body.parqueaderos = data.parqueaderos;
  if (data.estrato !== undefined) body.estrato = data.estrato;
  if (data.piso !== undefined) body.piso = data.piso;
  if (data.areaM2 !== undefined) body.area_m2 = data.areaM2;
  if (data.areaPrivada !== undefined) body.area_privada = data.areaPrivada;
  if (data.areaConstruida !== undefined) body.area_construida = data.areaConstruida;
  if (data.administracion !== undefined) body.administracion = data.administracion;
  if (data.anioConstruccion !== undefined) {
    body.anio_construccion = data.anioConstruccion;
  }
  if (data.condicion !== undefined) body.condicion = data.condicion;
  if (data.featureIds !== undefined) body.feature_ids = data.featureIds;
  if (data.telefonoContacto !== undefined) {
    body.telefono_contacto = data.telefonoContacto;
  }
  if (data.nombreContacto !== undefined) body.nombre_contacto = data.nombreContacto;
  return body;
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
  async create(data, token?: string): Promise<Property> {
    const raw = await apiFetch<RawProperty>(LIST_PATH, {
      method: "POST",
      token,
      body: toWriteBody(data),
    });
    return mapProperty(raw);
  },
  async update(id, data, token?: string): Promise<Property> {
    const raw = await apiFetch<RawProperty>(detailPath(id), {
      method: "PATCH",
      token,
      body: toWriteBody(data),
    });
    return mapProperty(raw);
  },
  async delete(id: string, token?: string): Promise<void> {
    await apiFetch<{ ok: boolean }>(detailPath(id), { method: "DELETE", token });
  },
  async uploadPhotos(id, files, token?: string): Promise<Property> {
    const form = new FormData();
    for (const file of files) {
      form.append("files", file, file.name);
    }
    const raw = await apiUploadForm<RawProperty>(
      `${detailPath(id)}/photos`,
      form,
      token,
    );
    return mapProperty(raw);
  },
  async reorderPhotos(id, photoIds, token?: string): Promise<Property> {
    const raw = await apiFetch<RawProperty>(`${detailPath(id)}/photos/order`, {
      method: "PUT",
      token,
      body: { photo_ids: photoIds },
    });
    return mapProperty(raw);
  },
  async deletePhoto(id, photoId, token?: string): Promise<Property> {
    const raw = await apiFetch<RawProperty>(
      `${detailPath(id)}/photos/${photoId}`,
      { method: "DELETE", token },
    );
    return mapProperty(raw);
  },
};
