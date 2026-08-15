export type ParqueaderoPreferencia = "si" | "no" | "indiferente";

export interface CriteriosCaptacion {
  agenteId: string;
  precioMin: number | null;
  precioMax: number | null;
  tipoInmueble: string[];
  metrajeMin: number | null;
  metrajeMax: number | null;
  parqueadero: ParqueaderoPreferencia | null;
}

export interface CriteriosCaptacionUpdate {
  precioMin?: number | null;
  precioMax?: number | null;
  tipoInmueble?: string[];
  metrajeMin?: number | null;
  metrajeMax?: number | null;
  parqueadero?: ParqueaderoPreferencia | null;
}

export interface CriteriosService {
  get(token?: string): Promise<CriteriosCaptacion>;
  update(
    data: CriteriosCaptacionUpdate,
    token?: string,
  ): Promise<CriteriosCaptacion>;
}
