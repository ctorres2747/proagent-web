export type LeadEstado =
  | "Pendiente"
  | "En contacto"
  | "Captado"
  | "Descartado"
  | "Archivado";

export type LeadActivityType = "llamada" | "whatsapp" | "visita" | "otro";
export type LeadActivityStatus = "pendiente" | "completada" | "cancelada";

export interface ProximaActividad {
  id: number;
  tipo: LeadActivityType;
  titulo: string | null;
  fechaHora: string;
  todoElDia: boolean;
}

export interface LeadActivity extends ProximaActividad {
  estado: LeadActivityStatus;
  nota: string | null;
  agenteId: number | null;
  completadaAt: string | null;
  createdAt: string | null;
}

export interface LeadActivityCreate {
  tipo: LeadActivityType;
  titulo?: string | null;
  fechaHora: string;
  todoElDia?: boolean;
  nota?: string | null;
}

export interface LeadActivityPatch {
  estado?: LeadActivityStatus;
  fechaHora?: string;
  titulo?: string | null;
  nota?: string | null;
  todoElDia?: boolean;
}

export interface Lead {
  id: number;
  portal: string;
  municipio: string | null;
  barrio: string | null;
  tipoInmueble: string | null;
  precio: string | null;
  precioNum: number | null;
  areaM2: string | null;
  habitaciones: string | null;
  banos: string | null;
  telefono: string | null;
  nombrePublicador: string | null;
  linkPublicacion: string;
  imagenUrl: string | null;
  fechaCaptura: string;
  estado: LeadEstado;
  notas: string | null;
  fechaRecontacto: string | null;
  fechaActualizacion: string;
  ownerAgenteId: number | null;
  enRevision: boolean;
  proximaActividad: ProximaActividad | null;
}

export interface LeadUpdate {
  estado?: LeadEstado;
  notas?: string | null;
  telefono?: string | null;
  nombrePublicador?: string | null;
  fechaRecontacto?: string | null;
  barrio?: string | null;
  enRevision?: boolean;
}

export interface LeadCreate {
  municipio?: string | null;
  barrio?: string | null;
  tipoInmueble?: string | null;
  precio?: string | null;
  areaM2?: string | null;
  habitaciones?: string | null;
  banos?: string | null;
  telefono?: string | null;
  nombrePublicador?: string | null;
  linkPublicacion?: string | null;
  notas?: string | null;
  estado?: LeadEstado;
}

export interface LeadsService {
  list(token?: string): Promise<Lead[]>;
  get(id: number, token?: string): Promise<Lead>;
  update(id: number, data: LeadUpdate, token?: string): Promise<Lead>;
  create(data: LeadCreate, token?: string): Promise<Lead>;
  listActivities(leadId: number, token?: string): Promise<LeadActivity[]>;
  createActivity(
    leadId: number,
    data: LeadActivityCreate,
    token?: string,
  ): Promise<ProximaActividad | null>;
  patchActivity(
    leadId: number,
    activityId: number,
    data: LeadActivityPatch,
    token?: string,
  ): Promise<ProximaActividad | null>;
}

export interface FichasService {
  createFromLead(leadId: number, token?: string): Promise<{ id: number }>;
}
