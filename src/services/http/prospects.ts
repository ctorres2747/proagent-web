import type {
  Prospect,
  ProspectCounts,
  ProspectsService,
  QualifyProspectInput,
} from "../interfaces/prospects";
import { apiFetch } from "./client";

function mapProspect(raw: Record<string, unknown>): Prospect {
  return {
    id: String(raw.id),
    nombre: String(raw.nombre),
    telefono: String(raw.telefono),
    canal: raw.canal as Prospect["canal"],
    mensaje: (raw.mensaje as string) ?? null,
    fichaId: raw.ficha_id ? String(raw.ficha_id) : null,
    propertyCode: (raw.property_code as string) ?? null,
    propertyTitle: (raw.property_title as string) ?? null,
    receivedAt: String(raw.received_at),
    lastInteractionAt: String(raw.last_interaction_at),
    lastInteractionType: String(raw.last_interaction_type),
    estado: String(raw.estado),
    pausedUntil: (raw.paused_until as string) ?? null,
    possibleDuplicateClienteId: raw.possible_duplicate_cliente_id
      ? String(raw.possible_duplicate_cliente_id)
      : null,
    returnedFromPause: Boolean(raw.returned_from_pause),
  };
}

export const prospectsService: ProspectsService = {
  async list(filters, token) {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.channel && filters.channel !== "all") {
      params.set("channel", filters.channel);
    }
    if (filters.q?.trim()) params.set("q", filters.q.trim());
    const qs = params.toString();
    const rows = await apiFetch<Record<string, unknown>[]>(
      `/api/web/prospects${qs ? `?${qs}` : ""}`,
      { token },
    );
    return rows.map(mapProspect);
  },
  async counts(token) {
    const raw = await apiFetch<Record<string, unknown>>("/api/web/prospects/counts", {
      token,
    });
    return {
      new: Number(raw.new),
      contacted: Number(raw.contacted),
      paused: Number(raw.paused),
      all: Number(raw.all),
      byChannel: (raw.by_channel as Record<string, number>) ?? {},
    };
  },
  async interaction(id, type, token) {
    const raw = await apiFetch<Record<string, unknown>>(
      `/api/web/prospects/${id}/interaction`,
      { method: "POST", body: { type }, token },
    );
    return mapProspect(raw);
  },
  async qualify(id, data, token) {
    const raw = await apiFetch<{ cliente_id: string }>(
      `/api/web/prospects/${id}/qualify`,
      {
        method: "POST",
        token,
        body: {
          temperatura: data.temperatura,
          presupuesto_min: data.presupuestoMin,
          presupuesto_max: data.presupuestoMax,
          zonas: data.zonas,
          tipos_inmueble: data.tiposInmueble,
          forma_pago: data.formaPago,
        },
      },
    );
    return { clienteId: raw.cliente_id };
  },
  async discard(id, reason, token) {
    const raw = await apiFetch<Record<string, unknown>>(
      `/api/web/prospects/${id}/discard`,
      { method: "POST", body: { reason }, token },
    );
    return mapProspect(raw);
  },
  async merge(id, clienteId, token) {
    const raw = await apiFetch<{ cliente_id: string }>(
      `/api/web/prospects/${id}/merge`,
      { method: "POST", body: { cliente_id: clienteId }, token },
    );
    return { clienteId: raw.cliente_id };
  },
  async pause(id, days, token) {
    const raw = await apiFetch<Record<string, unknown>>(
      `/api/web/prospects/${id}/pause`,
      { method: "POST", body: { days }, token },
    );
    return mapProspect(raw);
  },
  async resume(id, token) {
    const raw = await apiFetch<Record<string, unknown>>(
      `/api/web/prospects/${id}/resume`,
      { method: "POST", token },
    );
    return mapProspect(raw);
  },
  async undo(id, token) {
    const raw = await apiFetch<Record<string, unknown>>(
      `/api/web/prospects/${id}/undo`,
      { method: "POST", token },
    );
    return mapProspect(raw);
  },
};
