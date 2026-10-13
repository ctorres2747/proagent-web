import { apiFetch } from "./client";

export interface NavCounts {
  inventoryCount: number;
  captacionPending: number | null;
  prospectsNew: number | null;
}

export const navCountsService = {
  async get(token?: string, viewAsAgenteId?: string): Promise<NavCounts> {
    const qs = viewAsAgenteId
      ? `?view_as_agente_id=${encodeURIComponent(viewAsAgenteId)}`
      : "";
    const raw = await apiFetch<{
      inventory_count: number;
      captacion_pending: number | null;
      prospects_new?: number | null;
    }>(`/api/web/nav-counts${qs}`, { token });
    return {
      inventoryCount: raw.inventory_count,
      captacionPending: raw.captacion_pending,
      prospectsNew: raw.prospects_new ?? null,
    };
  },
};
