import type { WasiFeaturesService } from "@/services/interfaces/wasiFeatures";

export const wasiFeaturesService: WasiFeaturesService = {
  async list() {
    return {
      internal: [
        { id: 2, nombre: "Cocina integral" },
        { id: 4, nombre: "Closet" },
        { id: 25, nombre: "Calentador" },
      ],
      external: [
        { id: 26, nombre: "Piscina" },
        { id: 30, nombre: "Terraza" },
      ],
      popularIds: [2, 26, 4],
    };
  },
};
