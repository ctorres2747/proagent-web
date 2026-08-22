import type { ScraperService, ScraperStatus } from "@/services/interfaces/scraper";
import { apiFetch } from "./client";

interface RawScraperStatus {
  running: boolean;
  last_execution?: ScraperStatus["lastExecution"];
  last_by_portal?: Record<string, ScraperStatus["lastExecution"]>;
  stats?: ScraperStatus["stats"];
  queue_status?: string | null;
}

export const scraperService: ScraperService = {
  async status(token?: string): Promise<ScraperStatus> {
    const raw = await apiFetch<RawScraperStatus>("/api/scraper/status", { token });
    return {
      running: raw.running,
      lastExecution: raw.last_execution ?? null,
      lastByPortal: raw.last_by_portal ?? {},
      stats: raw.stats ?? {},
      queueStatus: raw.queue_status ?? null,
    };
  },

  async run({ agenteId }, token) {
    return apiFetch("/api/scraper/run", {
      method: "POST",
      token,
      query: { agente_id: agenteId },
    });
  },
};
