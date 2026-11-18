export interface WasiLocalidadesResult {
  municipio: string;
  localidades: string[];
}

export interface WasiLocalidadesService {
  /** Localidades/sectores oficiales de WASI para un municipio (ej. Bogotá
   * D.C. → Usaquén, Chapinero, Engativá...). Lista vacía = la ciudad no
   * tiene localidades en WASI (la mayoría de municipios del Valle de
   * Aburrá) — el combobox "Sector / Localidad" debe ocultarse en ese caso,
   * no mostrarse vacío. Best-effort, igual que wasiZonasService/wasiCiudadesService. */
  list(municipio: string, token?: string): Promise<WasiLocalidadesResult>;
}
