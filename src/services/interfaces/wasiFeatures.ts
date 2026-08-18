export interface WasiFeature {
  id: number;
  nombre: string;
}

export interface WasiFeaturesCatalog {
  internal: WasiFeature[];
  external: WasiFeature[];
}

export interface WasiFeaturesService {
  list(token?: string): Promise<WasiFeaturesCatalog>;
}
