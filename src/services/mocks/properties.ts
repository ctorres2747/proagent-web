import type {
  PropertiesService,
  Property,
} from "@/services/interfaces/properties";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MOCK_PROPERTIES: Property[] = [
  {
    id: "pub-001",
    titulo: "Apartamento moderno en El Poblado",
    municipio: "Medellín",
    tipo: "Apartamento",
    precio: 780_000_000,
    habitaciones: 3,
    banos: 2,
    areaM2: 98,
    completeness: 100,
    portadaUrl: null,
    ownerAgenteId: "mock-admin",
  },
  {
    id: "pub-002",
    titulo: "Casa familiar en Envigado con patio",
    municipio: "Envigado",
    tipo: "Casa",
    precio: 950_000_000,
    habitaciones: 4,
    banos: 3,
    areaM2: 180,
    completeness: 80,
    portadaUrl: null,
    ownerAgenteId: "mock-admin",
  },
  {
    id: "pub-003",
    titulo: "Apartaestudio en Sabaneta cerca al metro",
    municipio: "Sabaneta",
    tipo: "Apartamento",
    precio: 320_000_000,
    habitaciones: 1,
    banos: 1,
    areaM2: 45,
    completeness: 60,
    portadaUrl: null,
    ownerAgenteId: "mock-asesor",
  },
  {
    id: "pub-004",
    titulo: "Local comercial en Laureles",
    municipio: "Medellín",
    tipo: "Local comercial",
    precio: 410_000_000,
    habitaciones: null,
    banos: 1,
    areaM2: 72,
    completeness: 45,
    portadaUrl: null,
    ownerAgenteId: "mock-asesor",
  },
];

export const propertiesService: PropertiesService = {
  async list(): Promise<Property[]> {
    await delay(300 + Math.random() * 400);
    return [...MOCK_PROPERTIES];
  },
  async get(id: string): Promise<Property> {
    await delay(200 + Math.random() * 300);
    const found = MOCK_PROPERTIES.find((p) => p.id === id);
    if (!found) throw new Error(`Propiedad ${id} no encontrada`);
    return found;
  },
};
