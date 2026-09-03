import { API_URL } from "@/config/env";
import type {
  Lead,
  LeadCreate,
  LeadEstado,
  LeadUpdate,
  LeadsService,
} from "@/services/interfaces/leads";
import { apiFetch } from "./client";

interface RawLead {
  id: number;
  portal: string;
  municipio?: string | null;
  barrio?: string | null;
  tipo_inmueble?: string | null;
  precio?: string | null;
  precio_num?: number | null;
  area_m2?: string | null;
  habitaciones?: string | null;
  banos?: string | null;
  telefono?: string | null;
  nombre_publicador?: string | null;
  link_publicacion: string;
  imagen_url?: string | null;
  fecha_captura: string;
  estado: string;
  notas?: string | null;
  fecha_recontacto?: string | null;
  fecha_actualizacion: string;
  owner_agente_id?: number | null;
}

function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function mapLead(raw: RawLead): Lead {
  return {
    id: raw.id,
    portal: raw.portal,
    municipio: raw.municipio ?? null,
    barrio: raw.barrio ?? null,
    tipoInmueble: raw.tipo_inmueble ?? null,
    precio: raw.precio ?? null,
    precioNum: raw.precio_num ?? null,
    areaM2: raw.area_m2 ?? null,
    habitaciones: raw.habitaciones ?? null,
    banos: raw.banos ?? null,
    telefono: raw.telefono ?? null,
    nombrePublicador: raw.nombre_publicador ?? null,
    linkPublicacion: raw.link_publicacion,
    imagenUrl: resolveImageUrl(raw.imagen_url),
    fechaCaptura: raw.fecha_captura,
    estado: raw.estado as LeadEstado,
    notas: raw.notas ?? null,
    fechaRecontacto: raw.fecha_recontacto ?? null,
    fechaActualizacion: raw.fecha_actualizacion,
    ownerAgenteId: raw.owner_agente_id ?? null,
  };
}

function toRawUpdate(data: LeadUpdate): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.estado !== undefined) out.estado = data.estado;
  if (data.notas !== undefined) out.notas = data.notas;
  if (data.telefono !== undefined) out.telefono = data.telefono;
  if (data.nombrePublicador !== undefined) {
    out.nombre_publicador = data.nombrePublicador;
  }
  if (data.fechaRecontacto !== undefined) {
    out.fecha_recontacto = data.fechaRecontacto;
  }
  if (data.barrio !== undefined) out.barrio = data.barrio;
  return out;
}

function toRawCreate(data: LeadCreate): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.municipio !== undefined) out.municipio = data.municipio;
  if (data.barrio !== undefined) out.barrio = data.barrio;
  if (data.tipoInmueble !== undefined) out.tipo_inmueble = data.tipoInmueble;
  if (data.precio !== undefined) out.precio = data.precio;
  if (data.areaM2 !== undefined) out.area_m2 = data.areaM2;
  if (data.habitaciones !== undefined) out.habitaciones = data.habitaciones;
  if (data.banos !== undefined) out.banos = data.banos;
  if (data.telefono !== undefined) out.telefono = data.telefono;
  if (data.nombrePublicador !== undefined) {
    out.nombre_publicador = data.nombrePublicador;
  }
  if (data.linkPublicacion !== undefined) {
    out.link_publicacion = data.linkPublicacion;
  }
  if (data.notas !== undefined) out.notas = data.notas;
  if (data.estado !== undefined) out.estado = data.estado;
  return out;
}

export const leadsService: LeadsService = {
  async list(token) {
    const raw = await apiFetch<RawLead[]>("/api/leads", { token });
    return raw.map(mapLead);
  },

  async get(id, token) {
    const raw = await apiFetch<RawLead>(`/api/leads/${id}`, { token });
    return mapLead(raw);
  },

  async update(id, data, token) {
    const raw = await apiFetch<RawLead>(`/api/leads/${id}`, {
      method: "PATCH",
      token,
      body: toRawUpdate(data),
    });
    return mapLead(raw);
  },

  async create(data, token) {
    const raw = await apiFetch<RawLead>("/api/leads", {
      method: "POST",
      token,
      body: toRawCreate(data),
    });
    return mapLead(raw);
  },
};
