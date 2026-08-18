import type {
  WasiFeaturesCatalog,
  WasiFeaturesService,
} from "@/services/interfaces/wasiFeatures";
import { apiFetch } from "./client";

export const wasiFeaturesService: WasiFeaturesService = {
  async list(token?: string): Promise<WasiFeaturesCatalog> {
    return apiFetch<WasiFeaturesCatalog>("/api/web/wasi/features", { token });
  },
};
