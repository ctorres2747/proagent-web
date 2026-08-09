/**
 * Property DTO for the web UI. Sourced from the shared `fichas` table via the
 * backend. Same data as the internal captación Kanban — different surface.
 */
export interface Property {
  id: string;
  titulo: string;
  municipio: string;
  tipo: string;
  precio: number | null;
  habitaciones: number | null;
  banos: number | null;
  areaM2: number | null;
  /** 0..100 completeness indicator (mirrors mobile). */
  completeness: number;
  portadaUrl: string | null;
  /** Owning agent id (ownership: an agent sees only their own). */
  ownerAgenteId: string | null;
}

export interface PropertiesService {
  list(token?: string): Promise<Property[]>;
  get(id: string, token?: string): Promise<Property>;
}
