export interface WasiZonasResult {
  municipio: string;
  zonas: string[];
}

export interface WasiZonasService {
  /** Zonas/barrios que WASI ya reconoce para un municipio — ayuda a escribir
   * "Barrio / zona / conjunto" con un valor que no rebote al sincronizar con
   * portales aliados. Best-effort: si el municipio no resuelve en WASI o el
   * servicio no responde, el caller debe seguir dejando el campo editable a
   * mano (nunca bloquear la ficha por esto). */
  list(municipio: string, token?: string): Promise<WasiZonasResult>;
}
