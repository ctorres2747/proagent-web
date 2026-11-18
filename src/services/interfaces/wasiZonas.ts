export interface WasiZonaItem {
  name: string;
  /** id_zone real de WASI cuando la zona viene de su catálogo (standar/
   * allied/own). Mandarlo al publicar evita que WASI cree una zona "own"
   * duplicada cada vez que se guarda la ficha (ver sesión 2026-11-17). */
  idZone: number | null;
}

export interface WasiZonasResult {
  municipio: string;
  zonas: string[];
  zonasDetalle: WasiZonaItem[];
}

export interface WasiZonasService {
  /** Zonas/barrios que WASI ya reconoce para un municipio — ayuda a escribir
   * "Barrio / zona / conjunto" con un valor que no rebote al sincronizar con
   * portales aliados. Best-effort: si el municipio no resuelve en WASI o el
   * servicio no responde, el caller debe seguir dejando el campo editable a
   * mano (nunca bloquear la ficha por esto).
   *
   * `localidad` (sesión 2026-11-17, ficha F-155): para ciudades con
   * localidades (Bogotá), el catálogo oficial de barrios vive por
   * localidad, no por ciudad completa — pasar la localidad elegida en el
   * combobox "Sector / Localidad" cuando exista. Omitirlo (o "") para
   * ciudades sin localidades, igual que antes. */
  list(municipio: string, localidad?: string, token?: string): Promise<WasiZonasResult>;
}
