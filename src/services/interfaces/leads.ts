export type LeadEstado =
  | "Pendiente"
  | "En contacto"
  | "Captado"
  | "Descartado"
  | "Archivado";

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
}

export interface LeadUpdate {
  estado?: LeadEstado;
  notas?: string | null;
  telefono?: string | null;
  nombrePublicador?: string | null;
  fechaRecontacto?: string | null;
  barrio?: string | null;
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
}

export interface FichasService {
  createFromLead(leadId: number, token?: string): Promise<{ id: number }>;
}
