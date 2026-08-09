import type { ChannelId, ChannelStatus } from "@/design-system/channels";

export type Intent = "Venta" | "Arriendo";
export type Condition = "Nuevo" | "Usado" | "Proyecto" | "En construcción";

export interface PropertyChannel {
  id: ChannelId;
  status: ChannelStatus;
}

/**
 * Property DTO for the web UI. Sourced from the shared `fichas` table via the
 * backend. Same data as the internal captación Kanban — different surface.
 * Rich fields power the desktop inventory + publish wizard; most are optional
 * so the HTTP bridge can map whatever the backend currently exposes.
 */
export interface Property {
  id: string;
  /** Human reference code, e.g. PI-1042. */
  code: string;
  titulo: string;
  tipo: string;
  intent: Intent;
  municipio: string;
  barrio: string | null;
  direccion: string | null;
  codigoPostal: string | null;
  /** Numeric price (COP). For arriendo, monthly. */
  precio: number | null;
  /** Whether the price is a monthly rent (affects formatting). */
  esArriendo: boolean;
  alcobas: number | null;
  banos: number | null;
  parqueaderos: number | null;
  estrato: number | null;
  piso: number | null;
  areaM2: number | null;
  areaPrivada: number | null;
  areaConstruida: number | null;
  administracion: number | null;
  anioConstruccion: number | null;
  condicion: Condition | null;
  features: string[];
  descripcion: string | null;
  /** 0..100 completeness indicator (mirrors mobile). */
  completeness: number;
  portadaUrl: string | null;
  /** Owning agent id (ownership: an agent sees only their own). */
  ownerAgenteId: string | null;
  channels: PropertyChannel[];
}

export interface PropertiesService {
  list(token?: string): Promise<Property[]>;
  get(id: string, token?: string): Promise<Property>;
}
