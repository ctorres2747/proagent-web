export interface MetaMes {
  mes: number;
  captadas: number;
  publicadas: number;
  leads: number;
  conversionPct: number;
}

export interface MetasAnio {
  anio: number;
  agenteId: number;
  meses: MetaMes[];
}

export interface MetasService {
  get(anio: number, agenteId: number | undefined, token?: string): Promise<MetasAnio>;
  put(
    payload: { anio: number; agenteId?: number; meses: MetaMes[] },
    token?: string,
  ): Promise<MetasAnio>;
}
