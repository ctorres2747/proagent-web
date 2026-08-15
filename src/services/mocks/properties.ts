import type {
  PropertiesService,
  Property,
  PropertyChannel,
} from "@/services/interfaces/properties";
import type { ChannelId, ChannelStatus } from "@/design-system/channels";
import { CHANNEL_ORDER } from "@/design-system/channels";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Build the 5-channel status list from a compact map. */
function channels(map: Partial<Record<ChannelId, ChannelStatus>>): PropertyChannel[] {
  return CHANNEL_ORDER.map((id) => ({ id, status: map[id] ?? "none" }));
}

const MOCK_PROPERTIES: Property[] = [
  {
    id: "PI-1042",
    code: "PI-1042",
    titulo: "Apartamento de 3 alcobas en Envigado, cerca al parque principal",
    tipo: "Apartamento",
    intent: "Venta",
    municipio: "Envigado",
    barrio: "Zona 5 - Parque principal",
    direccion: "Cra 43A #35 Sur - 12",
    codigoPostal: "055422",
    precio: 380_000_000,
    esArriendo: false,
    alcobas: 3,
    banos: 2,
    parqueaderos: 1,
    estrato: 5,
    piso: 4,
    areaM2: 95,
    areaPrivada: 88,
    areaConstruida: 95,
    administracion: 320_000,
    anioConstruccion: 2018,
    condicion: "Usado",
    features: ["Balcón", "Parqueadero visitantes", "Piscina"],
    descripcion:
      "Amplio apartamento con acabados de alta calidad, ubicado a pocas cuadras del Parque de Envigado. Cocina integral, balcón y conjunto cerrado con parqueadero.",
    telefonoContacto: "3001112233",
    nombreContacto: "Contacto demo",
    completeness: 92,
    portadaUrl: null,
    fotos: [],
    ownerAgenteId: "mock-admin",
    ownerAgenteNombre: "Andreina Torres",
    channels: channels({
      wasi: "published",
      facebook: "published",
      instagram: "published",
      web: "published",
    }),
  },
  {
    id: "PI-0987",
    code: "PI-0987",
    titulo: "Casa de 4 alcobas en Sabaneta",
    tipo: "Casa",
    intent: "Venta",
    municipio: "Sabaneta",
    barrio: "Aves María",
    direccion: "Calle 68 Sur #45-20",
    codigoPostal: "055450",
    precio: 650_000_000,
    esArriendo: false,
    alcobas: 4,
    banos: 3,
    parqueaderos: 2,
    estrato: 4,
    piso: null,
    areaM2: 180,
    areaPrivada: 165,
    areaConstruida: 180,
    administracion: null,
    anioConstruccion: 2015,
    condicion: "Usado",
    features: ["Patio", "Zona BBQ"],
    descripcion: "Casa familiar amplia en conjunto cerrado con zonas comunes.",
    telefonoContacto: "3001112233",
    nombreContacto: "Contacto demo",
    completeness: 64,
    portadaUrl: null,
    fotos: [],
    ownerAgenteId: "mock-admin",
    ownerAgenteNombre: "Andreina Torres",
    channels: channels({ wasi: "progress" }),
  },
  {
    id: "PI-1103",
    code: "PI-1103",
    titulo: "Apartamento amplio en Laureles",
    tipo: "Apartamento",
    intent: "Arriendo",
    municipio: "Laureles",
    barrio: "Segundo Parque",
    direccion: "Cra 76 #C1-30",
    codigoPostal: "050031",
    precio: 2_300_000,
    esArriendo: true,
    alcobas: 3,
    banos: 2,
    parqueaderos: 1,
    estrato: 5,
    piso: 6,
    areaM2: 110,
    areaPrivada: 104,
    areaConstruida: 110,
    administracion: 480_000,
    anioConstruccion: 2012,
    condicion: "Usado",
    features: ["Ascensor", "Vigilancia 24h", "Balcón"],
    descripcion: "Apartamento luminoso a una cuadra del Segundo Parque de Laureles.",
    telefonoContacto: "3001112233",
    nombreContacto: "Contacto demo",
    completeness: 100,
    portadaUrl: null,
    fotos: [],
    ownerAgenteId: "mock-asesor",
    ownerAgenteNombre: "Laura Méndez",
    channels: channels({
      wasi: "published",
      facebook: "error",
      instagram: "published",
      web: "published",
    }),
  },
  {
    id: "PI-1187",
    code: "PI-1187",
    titulo: "Apartaestudio en Belén",
    tipo: "Apartaestudio",
    intent: "Venta",
    municipio: "Belén",
    barrio: "La Mota",
    direccion: null,
    codigoPostal: null,
    precio: 210_000_000,
    esArriendo: false,
    alcobas: 1,
    banos: 1,
    parqueaderos: 1,
    estrato: 4,
    piso: 3,
    areaM2: 42,
    areaPrivada: 40,
    areaConstruida: 42,
    administracion: 210_000,
    anioConstruccion: 2020,
    condicion: "Usado",
    features: [],
    descripcion: null,
    telefonoContacto: "3001112233",
    nombreContacto: "Contacto demo",
    completeness: 40,
    portadaUrl: null,
    fotos: [],
    ownerAgenteId: "mock-asesor",
    ownerAgenteNombre: "Laura Méndez",
    channels: channels({}),
  },
  {
    id: "PI-1201",
    code: "PI-1201",
    titulo: "Casa campestre en Rionegro",
    tipo: "Casa",
    intent: "Venta",
    municipio: "Rionegro",
    barrio: "Llanogrande",
    direccion: "Vía Llanogrande km 4",
    codigoPostal: "054040",
    precio: 920_000_000,
    esArriendo: false,
    alcobas: 4,
    banos: 4,
    parqueaderos: 4,
    estrato: 6,
    piso: null,
    areaM2: 320,
    areaPrivada: 300,
    areaConstruida: 320,
    administracion: null,
    anioConstruccion: 2019,
    condicion: "Usado",
    features: ["Piscina", "Zona BBQ", "Vigilancia 24h"],
    descripcion: "Casa campestre con amplios jardines y zonas sociales.",
    telefonoContacto: "3001112233",
    nombreContacto: "Contacto demo",
    completeness: 85,
    portadaUrl: null,
    fotos: [],
    ownerAgenteId: "mock-admin",
    ownerAgenteNombre: "Andreina Torres",
    channels: channels({
      wasi: "published",
      facebook: "published",
      instagram: "progress",
      whatsapp: "published",
      web: "published",
    }),
  },
  {
    id: "PI-1233",
    code: "PI-1233",
    titulo: "Oficina 60 m² en El Poblado",
    tipo: "Oficina",
    intent: "Arriendo",
    municipio: "El Poblado",
    barrio: "Ciudad del Río",
    direccion: "Cra 48 #10-45",
    codigoPostal: "050021",
    precio: 3_100_000,
    esArriendo: true,
    alcobas: null,
    banos: 1,
    parqueaderos: 1,
    estrato: 6,
    piso: 8,
    areaM2: 60,
    areaPrivada: 60,
    areaConstruida: 60,
    administracion: 600_000,
    anioConstruccion: 2016,
    condicion: "Usado",
    features: ["Ascensor", "Vigilancia 24h"],
    descripcion: "Oficina lista para estrenar en zona empresarial de El Poblado.",
    telefonoContacto: "3001112233",
    nombreContacto: "Contacto demo",
    completeness: 70,
    portadaUrl: null,
    fotos: [],
    ownerAgenteId: "mock-admin",
    ownerAgenteNombre: "Andreina Torres",
    channels: channels({ wasi: "published", web: "progress" }),
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
  async create(data): Promise<Property> {
    await delay(250);
    const id = `PI-${Math.floor(Math.random() * 9000) + 1000}`;
    const created: Property = {
      id,
      code: id,
      titulo: data.titulo ?? "(sin título)",
      tipo: data.tipo ?? "Apartamento",
      intent: "Venta",
      municipio: data.municipio ?? "Medellín",
      barrio: data.barrio ?? null,
      direccion: data.direccion ?? null,
      codigoPostal: data.codigoPostal ?? null,
      precio: data.precio ?? null,
      esArriendo: false,
      alcobas: data.alcobas ?? null,
      banos: data.banos ?? null,
      parqueaderos: data.parqueaderos ?? null,
      estrato: data.estrato ?? null,
      piso: data.piso ?? null,
      areaM2: data.areaM2 ?? null,
      areaPrivada: data.areaPrivada ?? null,
      areaConstruida: data.areaConstruida ?? null,
      administracion: data.administracion ?? null,
      anioConstruccion: data.anioConstruccion ?? null,
      condicion: data.condicion ?? null,
      features: [],
      descripcion: data.descripcion ?? null,
      telefonoContacto: data.telefonoContacto ?? null,
      nombreContacto: data.nombreContacto ?? null,
      completeness: 40,
      portadaUrl: null,
      fotos: [],
      ownerAgenteId: "mock-admin",
    ownerAgenteNombre: "Andreina Torres",
      channels: channels({}),
    };
    MOCK_PROPERTIES.unshift(created);
    return created;
  },
  async update(id, data): Promise<Property> {
    await delay(200);
    const idx = MOCK_PROPERTIES.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error(`Propiedad ${id} no encontrada`);
    const merged = { ...MOCK_PROPERTIES[idx], ...data, id };
    MOCK_PROPERTIES[idx] = merged;
    return merged;
  },
  async delete(id: string): Promise<void> {
    await delay(200 + Math.random() * 200);
    const idx = MOCK_PROPERTIES.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error(`Propiedad ${id} no encontrada`);
    MOCK_PROPERTIES.splice(idx, 1);
  },
  async uploadPhotos(id, files) {
    await delay(250);
    const idx = MOCK_PROPERTIES.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error(`Propiedad ${id} no encontrada`);
    const prop = MOCK_PROPERTIES[idx];
    const start = prop.fotos.length;
    const added = files.map((file, i) => ({
      id: `mock-photo-${Date.now()}-${i}`,
      url: URL.createObjectURL(file),
      orden: start + i,
      isCover: start + i === 0,
    }));
    const fotos = [...prop.fotos, ...added].map((f, i) => ({
      ...f,
      orden: i,
      isCover: i === 0,
    }));
    const next = {
      ...prop,
      fotos,
      portadaUrl: fotos[0]?.url ?? null,
      completeness: Math.min(100, prop.completeness + 5),
    };
    MOCK_PROPERTIES[idx] = next;
    return next;
  },
  async reorderPhotos(id, photoIds) {
    await delay(150);
    const idx = MOCK_PROPERTIES.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error(`Propiedad ${id} no encontrada`);
    const prop = MOCK_PROPERTIES[idx];
    const byId = new Map(prop.fotos.map((f) => [f.id, f]));
    const fotos = photoIds
      .map((pid) => byId.get(pid))
      .filter(Boolean)
      .map((f, i) => ({ ...f!, orden: i, isCover: i === 0 }));
    const next = { ...prop, fotos, portadaUrl: fotos[0]?.url ?? null };
    MOCK_PROPERTIES[idx] = next;
    return next;
  },
  async deletePhoto(id, photoId) {
    await delay(150);
    const idx = MOCK_PROPERTIES.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error(`Propiedad ${id} no encontrada`);
    const prop = MOCK_PROPERTIES[idx];
    const fotos = prop.fotos
      .filter((f) => f.id !== photoId)
      .map((f, i) => ({ ...f, orden: i, isCover: i === 0 }));
    const next = { ...prop, fotos, portadaUrl: fotos[0]?.url ?? null };
    MOCK_PROPERTIES[idx] = next;
    return next;
  },
};
