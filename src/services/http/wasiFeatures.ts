import type {
  WasiFeaturesCatalog,
  WasiFeaturesService,
} from "@/services/interfaces/wasiFeatures";
import { apiFetch } from "./client";

interface RawWasiFeaturesCatalog {
  internal: WasiFeaturesCatalog["internal"];
  external: WasiFeaturesCatalog["external"];
  popular_ids?: number[];
}

export const wasiFeaturesService: WasiFeaturesService = {
  async list(token?: string): Promise<WasiFeaturesCatalog> {
    const raw = await apiFetch<RawWasiFeaturesCatalog>("/api/web/wasi/features", {
      token,
    });
    return {
      internal: raw.internal ?? [],
      external: raw.external ?? [],
      popularIds: Array.isArray(raw.popular_ids) ? raw.popular_ids : [],
    };
  },
};
