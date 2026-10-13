export type ProspectStatus = "new" | "contacted" | "paused";
export type ProspectTab = ProspectStatus | "all";
export type ProspectChannel =
  | "facebook"
  | "mercadolibre"
  | "ciencuadras"
  | "metrocuadrado";

export interface Prospect {
  id: string;
  nombre: string;
  telefono: string;
  canal: ProspectChannel;
  mensaje: string | null;
  fichaId: string | null;
  propertyCode: string | null;
  propertyTitle: string | null;
  receivedAt: string;
  lastInteractionAt: string;
  lastInteractionType: string;
  estado: string;
  pausedUntil: string | null;
  possibleDuplicateClienteId: string | null;
  returnedFromPause: boolean;
}

export interface ProspectCounts {
  new: number;
  contacted: number;
  paused: number;
  all: number;
  byChannel: Record<string, number>;
}

export interface QualifyProspectInput {
  temperatura: string;
  presupuestoMin: number;
  presupuestoMax: number;
  zonas: string[];
  tiposInmueble: string[];
  formaPago: string;
}

export interface ProspectsService {
  list(
    filters: { status?: ProspectTab; channel?: string; q?: string },
    token?: string,
  ): Promise<Prospect[]>;
  counts(token?: string): Promise<ProspectCounts>;
  interaction(id: string, type: "call" | "whatsapp", token?: string): Promise<Prospect>;
  qualify(id: string, data: QualifyProspectInput, token?: string): Promise<{ clienteId: string }>;
  discard(id: string, reason: string, token?: string): Promise<Prospect>;
  merge(id: string, clienteId: string, token?: string): Promise<{ clienteId: string }>;
  pause(id: string, days: number, token?: string): Promise<Prospect>;
  resume(id: string, token?: string): Promise<Prospect>;
  undo(id: string, token?: string): Promise<Prospect>;
}
