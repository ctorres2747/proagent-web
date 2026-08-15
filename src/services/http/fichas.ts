import type { FichasService } from "@/services/interfaces/leads";
import { apiFetch } from "./client";

interface RawFicha {
  id: number;
}

export const fichasService: FichasService = {
  async createFromLead(leadId, token) {
    const raw = await apiFetch<RawFicha>("/api/fichas", {
      method: "POST",
      token,
      body: { lead_id: leadId },
    });
    return { id: raw.id };
  },
};
