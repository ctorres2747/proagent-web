import type {
  Client,
  ClientChannelCount,
  ClientEvent,
  ClientListFilters,
  ClientsService,
  ClientWrite,
} from "@/services/interfaces/clients";
import { apiFetch } from "./client";

const LIST_PATH = "/api/web/clients";
const detailPath = (id: string) => `/api/web/clients/${id}`;

interface RawLinkedProperty {
  id: string;
  titulo: string;
  precio?: number | null;
  portada_url?: string | null;
}

interface RawEvent {
  estado_anterior?: string | null;
  estado_nuevo: string;
  fecha: string;
}

interface RawClient {
  id: string;
  owner_agente_id: string;
  owner_agente_nombre?: string | null;
  nombre: string;
  telefono: string;
  canal: string;
  canal_otro?: string | null;
  temperatura: string;
  estado: string;
  motivo_descarte?: string | null;
  presupuesto_min?: number | null;
  presupuesto_max?: number | null;
  zonas?: string[] | null;
  tipos_inmueble?: string[] | null;
  forma_pago?: string | null;
  notas?: string | null;
  proxima_cita?: string | null;
  linked_properties?: RawLinkedProperty[] | null;
  eventos?: RawEvent[] | null;
  created_at: string;
  updated_at: string;
}

interface RawChannelCount {
  canal: string;
  total: number;
}

function mapClient(raw: RawClient): Client {
  return {
    id: String(raw.id),
    ownerAgenteId: String(raw.owner_agente_id),
    ownerAgenteNombre: raw.owner_agente_nombre ?? null,
    nombre: raw.nombre,
    telefono: raw.telefono,
    canal: raw.canal as Client["canal"],
    canalOtro: raw.canal_otro ?? null,
    temperatura: raw.temperatura as Client["temperatura"],
    estado: raw.estado as Client["estado"],
    motivoDescarte: (raw.motivo_descarte as Client["motivoDescarte"]) ?? null,
    presupuestoMin: raw.presupuesto_min ?? null,
    presupuestoMax: raw.presupuesto_max ?? null,
    zonas: Array.isArray(raw.zonas) ? raw.zonas : [],
    tiposInmueble: Array.isArray(raw.tipos_inmueble) ? raw.tipos_inmueble : [],
    formaPago: (raw.forma_pago as Client["formaPago"]) ?? null,
    notas: raw.notas ?? null,
    proximaCita: raw.proxima_cita ?? null,
    linkedProperties: (raw.linked_properties ?? []).map((p) => ({
      id: String(p.id),
      titulo: p.titulo,
      precio: p.precio ?? null,
      portadaUrl: p.portada_url ?? null,
    })),
    events: (raw.eventos ?? []).map(
      (e): ClientEvent => ({
        estadoAnterior: (e.estado_anterior as Client["estado"] | null) ?? null,
        estadoNuevo: e.estado_nuevo as Client["estado"],
        fecha: e.fecha,
      }),
    ),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function toWriteBody(data: ClientWrite): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (data.nombre !== undefined) body.nombre = data.nombre;
  if (data.telefono !== undefined) body.telefono = data.telefono;
  if (data.canal !== undefined) body.canal = data.canal;
  if (data.canalOtro !== undefined) body.canal_otro = data.canalOtro;
  if (data.temperatura !== undefined) body.temperatura = data.temperatura;
  if (data.estado !== undefined) body.estado = data.estado;
  if (data.motivoDescarte !== undefined) body.motivo_descarte = data.motivoDescarte;
  if (data.presupuestoMin !== undefined) body.presupuesto_min = data.presupuestoMin;
  if (data.presupuestoMax !== undefined) body.presupuesto_max = data.presupuestoMax;
  if (data.zonas !== undefined) body.zonas = data.zonas;
  if (data.tiposInmueble !== undefined) body.tipos_inmueble = data.tiposInmueble;
  if (data.formaPago !== undefined) body.forma_pago = data.formaPago;
  if (data.notas !== undefined) body.notas = data.notas;
  if (data.proximaCita !== undefined) body.proxima_cita = data.proximaCita;
  return body;
}

export const clientsService: ClientsService = {
  async list(filters?: ClientListFilters, token?: string): Promise<Client[]> {
    const raw = await apiFetch<RawClient[]>(LIST_PATH, {
      token,
      query: {
        q: filters?.q || undefined,
        channel: filters?.channel || undefined,
        temp: filters?.temp?.length ? filters.temp.join(",") : undefined,
        includeDiscarded: filters?.includeDiscarded || undefined,
      },
    });
    return Array.isArray(raw) ? raw.map(mapClient) : [];
  },
  async channelCounts(token?: string): Promise<ClientChannelCount[]> {
    const raw = await apiFetch<RawChannelCount[]>(`${LIST_PATH}/channel-counts`, { token });
    return Array.isArray(raw)
      ? raw.map((r) => ({ canal: r.canal as ClientChannelCount["canal"], total: r.total }))
      : [];
  },
  async get(id: string, token?: string): Promise<Client> {
    const raw = await apiFetch<RawClient>(detailPath(id), { token });
    return mapClient(raw);
  },
  async create(data: ClientWrite, token?: string): Promise<Client> {
    const raw = await apiFetch<RawClient>(LIST_PATH, {
      method: "POST",
      token,
      body: toWriteBody(data),
    });
    return mapClient(raw);
  },
  async update(id: string, data: ClientWrite, token?: string): Promise<Client> {
    const raw = await apiFetch<RawClient>(detailPath(id), {
      method: "PATCH",
      token,
      body: toWriteBody(data),
    });
    return mapClient(raw);
  },
  async linkProperty(id: string, propertyId: string, token?: string): Promise<Client> {
    const raw = await apiFetch<RawClient>(`${detailPath(id)}/properties/${propertyId}`, {
      method: "POST",
      token,
    });
    return mapClient(raw);
  },
  async unlinkProperty(id: string, propertyId: string, token?: string): Promise<Client> {
    const raw = await apiFetch<RawClient>(`${detailPath(id)}/properties/${propertyId}`, {
      method: "DELETE",
      token,
    });
    return mapClient(raw);
  },
};
