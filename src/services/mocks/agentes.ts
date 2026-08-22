import type { AgentesService } from "@/services/interfaces/agentes";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const agentesService: AgentesService = {
  async list() {
    await delay(150);
    return [
      { id: 1, nombre: "Andreina Contreras", nombrePreferido: "Andreina", municipios: ["Sabaneta", "Envigado", "Itagüí", "La Estrella"], activo: true },
      { id: 2, nombre: "Nataly", nombrePreferido: "Nataly", municipios: ["Suba", "Fontibón", "Kennedy", "Bosa", "Portal de la 80"], activo: true },
    ];
  },
};
