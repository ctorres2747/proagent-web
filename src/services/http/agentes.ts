import type { AgenteResumen, AgentesService } from "@/services/interfaces/agentes";
import { apiFetch } from "./client";

const PATH = "/api/agentes";

interface RawAgente {
  id: number;
  nombre?: string | null;
  nombre_preferido?: string | null;
  municipios?: string[];
  activo?: boolean;
}

function mapAgente(raw: RawAgente): AgenteResumen {
  return {
    id: raw.id,
    nombre: raw.nombre ?? null,
    nombrePreferido: raw.nombre_preferido ?? null,
    municipios: raw.municipios ?? [],
    activo: raw.activo ?? true,
  };
}

export const agentesService: AgentesService = {
  async list(token) {
    const raw = await apiFetch<RawAgente[]>(PATH, { token });
    return raw.map(mapAgente);
  },
};
