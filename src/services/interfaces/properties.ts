import type { ChannelId, ChannelStatus } from "@/design-system/channels";

export type Intent = "Venta" | "Arriendo";
export type Condition = "Nuevo" | "Usado" | "Proyecto" | "En construcción";

export interface PropertyChannel {
  id: ChannelId;
  status: ChannelStatus;
}

export interface PropertyPhoto {
  id: string;
  url: string;
  orden: number;
  isCover: boolean;
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
  /** WASI feature IDs (`fichas.features_ids`). */
  featureIds: number[];
  features: string[];
  descripcion: string | null;
  /** Teléfono de contacto del propietario (persistido en ficha). */
  telefonoContacto: string | null;
  nombreContacto: string | null;
  /** 0..100 completeness indicator (mirrors mobile). */
  completeness: number;
  /** Required fields still missing (mobile keys: title, photos, …). */
  missingFields: string[];
  /** Drive (Entrega Inmobiliaria) completeness — Sprint 046. */
  completenessDrive: { isComplete: boolean; missingFields: string[] };
  predial: string | null;
  afectacionesInmueble: string | null;
  afectacionesDetalle: string | null;
  observacionesInmueble: string | null;
  precioMinimoCliente: string | null;
  puntosFavorablesExternos: string | null;
  detalleParqueadero: string | null;
  frenteFondoM: string | null;
  portadaUrl: string | null;
  fotos: PropertyPhoto[];
  /** Owning agent id (ownership: an agent sees only their own). */
  ownerAgenteId: string | null;
  /** Display name of owning agent (admin inventory filter). */
  ownerAgenteNombre: string | null;
  channels: PropertyChannel[];
  /** ISO datetime when linked lead was captured by scraper; null for manual alta. */
  capturedAt?: string | null;
}

export interface PropertiesService {
  list(token?: string): Promise<Property[]>;
  get(id: string, token?: string): Promise<Property>;
  create(
    data: Partial<
      Pick<
        Property,
        | "titulo"
        | "descripcion"
        | "tipo"
        | "municipio"
        | "barrio"
        | "direccion"
        | "codigoPostal"
        | "precio"
        | "alcobas"
        | "banos"
        | "parqueaderos"
        | "estrato"
        | "piso"
        | "areaM2"
        | "areaPrivada"
        | "areaConstruida"
        | "administracion"
        | "anioConstruccion"
        | "condicion"
        | "featureIds"
        | "telefonoContacto"
        | "nombreContacto"
        | "predial"
        | "afectacionesInmueble"
        | "afectacionesDetalle"
        | "observacionesInmueble"
        | "precioMinimoCliente"
        | "puntosFavorablesExternos"
        | "detalleParqueadero"
        | "frenteFondoM"
      >
    >,
    token?: string,
  ): Promise<Property>;
  update(
    id: string,
    data: Partial<
      Pick<
        Property,
        | "titulo"
        | "descripcion"
        | "tipo"
        | "municipio"
        | "barrio"
        | "direccion"
        | "codigoPostal"
        | "precio"
        | "alcobas"
        | "banos"
        | "parqueaderos"
        | "estrato"
        | "piso"
        | "areaM2"
        | "areaPrivada"
        | "areaConstruida"
        | "administracion"
        | "anioConstruccion"
        | "condicion"
        | "featureIds"
        | "telefonoContacto"
        | "nombreContacto"
        | "predial"
        | "afectacionesInmueble"
        | "afectacionesDetalle"
        | "observacionesInmueble"
        | "precioMinimoCliente"
        | "puntosFavorablesExternos"
        | "detalleParqueadero"
        | "frenteFondoM"
      >
    >,
    token?: string,
  ): Promise<Property>;
  delete(id: string, token?: string): Promise<void>;
  uploadPhotos(id: string, files: File[], token?: string): Promise<Property>;
  reorderPhotos(
    id: string,
    photoIds: string[],
    token?: string,
  ): Promise<Property>;
  deletePhoto(id: string, photoId: string, token?: string): Promise<Property>;
}
