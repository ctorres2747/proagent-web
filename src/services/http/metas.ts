import type { MetaMes, MetasAnio, MetasService } from "@/services/interfaces/metas";
import { apiFetch } from "./client";

const PATH = "/api/web/metas";

interface RawMetaMes {
  mes: number;
  captadas: number;
  publicadas: number;
  leads: number;
  conversion_pct: number;
}

interface RawMetas {
  anio: number;
  agente_id: number;
  meses: RawMetaMes[];
}

function mapMes(raw: RawMetaMes): MetaMes {
  return {
    mes: raw.mes,
    captadas: raw.captadas,
    publicadas: raw.publicadas,
    leads: raw.leads,
    conversionPct: raw.conversion_pct,
  };
}

function mapMetas(raw: RawMetas): MetasAnio {
  return {
    anio: raw.anio,
    agenteId: raw.agente_id,
    meses: raw.meses.map(mapMes),
  };
}

function toRawMes(m: MetaMes): RawMetaMes {
  return {
    mes: m.mes,
    captadas: m.captadas,
    publicadas: m.publicadas,
    leads: m.leads,
    conversion_pct: m.conversionPct,
  };
}

export const metasService: MetasService = {
  async get(anio, agenteId, token) {
    const raw = await apiFetch<RawMetas>(PATH, {
      token,
      query: { anio, agente_id: agenteId },
    });
    return mapMetas(raw);
  },
  async put(payload, token) {
    const raw = await apiFetch<RawMetas>(PATH, {
      method: "PUT",
      token,
      body: {
        anio: payload.anio,
        agente_id: payload.agenteId,
        meses: payload.meses.map(toRawMes),
      },
    });
    return mapMetas(raw);
  },
};
