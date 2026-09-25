export interface WasiCiudad {
  name: string;
  region: string;
}

export interface WasiCiudadesResult {
  ciudades: WasiCiudad[];
}

export interface WasiCiudadResolveResult {
  canonical: string | null;
}

export interface WasiCiudadesService {
  search(q: string, token?: string): Promise<WasiCiudadesResult>;
  resolve(municipio: string, token?: string): Promise<WasiCiudadResolveResult>;
}
