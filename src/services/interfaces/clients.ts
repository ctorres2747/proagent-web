export type ClientStage =
  | "nuevo"
  | "calificando"
  | "visitas"
  | "negociando"
  | "cerrado"
  | "descartado";

export type ClientChannel =
  | "facebook"
  | "mercadolibre"
  | "ciencuadras"
  | "metrocuadrado"
  | "referido"
  | "colegaje"
  | "otro";

export type ClientTemperature = "hot" | "warm" | "cold";

export type ClientPaymentMethod = "contado" | "credito" | "mixto";

export type ClientDiscardReason =
  | "compro_otro_asesor"
  | "sin_presupuesto"
  | "credito_no_aprobado"
  | "no_responde"
  | "ya_no_busca"
  | "otro";

export interface ClientLinkedProperty {
  id: string;
  titulo: string;
  precio: number | null;
  portadaUrl: string | null;
}

export interface Client {
  id: string;
  ownerAgenteId: string;
  ownerAgenteNombre: string | null;
  nombre: string;
  telefono: string;
  canal: ClientChannel;
  canalOtro: string | null;
  temperatura: ClientTemperature;
  estado: ClientStage;
  motivoDescarte: ClientDiscardReason | null;
  presupuestoMin: number | null;
  presupuestoMax: number | null;
  zonas: string[];
  tiposInmueble: string[];
  formaPago: ClientPaymentMethod | null;
  notas: string | null;
  proximaCita: string | null;
  linkedProperties: ClientLinkedProperty[];
  createdAt: string;
  updatedAt: string;
}

export interface ClientChannelCount {
  canal: ClientChannel;
  total: number;
}

export interface ClientWrite {
  nombre?: string;
  telefono?: string;
  canal?: ClientChannel;
  canalOtro?: string | null;
  temperatura?: ClientTemperature;
  estado?: ClientStage;
  motivoDescarte?: ClientDiscardReason | null;
  presupuestoMin?: number | null;
  presupuestoMax?: number | null;
  zonas?: string[];
  tiposInmueble?: string[];
  formaPago?: ClientPaymentMethod | null;
  notas?: string | null;
  proximaCita?: string | null;
}

export interface ClientListFilters {
  q?: string;
  channel?: ClientChannel;
  temp?: ClientTemperature[];
  includeDiscarded?: boolean;
}

export interface ClientsService {
  list(filters?: ClientListFilters, token?: string): Promise<Client[]>;
  channelCounts(token?: string): Promise<ClientChannelCount[]>;
  get(id: string, token?: string): Promise<Client>;
  create(data: ClientWrite, token?: string): Promise<Client>;
  update(id: string, data: ClientWrite, token?: string): Promise<Client>;
  linkProperty(id: string, propertyId: string, token?: string): Promise<Client>;
  unlinkProperty(id: string, propertyId: string, token?: string): Promise<Client>;
}
