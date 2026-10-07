import type {
  Client,
  ClientChannelCount,
  ClientListFilters,
  ClientsService,
  ClientWrite,
} from "@/services/interfaces/clients";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const now = new Date().toISOString();

const MOCK_CLIENTS: Client[] = [
  {
    id: "1",
    ownerAgenteId: "mock-admin",
    ownerAgenteNombre: "Andreina Torres",
    nombre: "Laura Gómez",
    telefono: "3001112233",
    canal: "facebook",
    canalOtro: null,
    temperatura: "hot",
    estado: "calificando",
    motivoDescarte: null,
    presupuestoMin: 350,
    presupuestoMax: 450,
    zonas: ["Envigado", "Sabaneta"],
    tiposInmueble: ["Apartamento"],
    formaPago: "credito",
    notas: "",
    proximaCita: null,
    linkedProperties: [],
    events: [{ estadoAnterior: null, estadoNuevo: "calificando", fecha: now }],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "2",
    ownerAgenteId: "mock-admin",
    ownerAgenteNombre: "Andreina Torres",
    nombre: "Jorge Iván Mejía",
    telefono: "3002223344",
    canal: "ciencuadras",
    canalOtro: null,
    temperatura: "hot",
    estado: "calificando",
    motivoDescarte: null,
    presupuestoMin: 900,
    presupuestoMax: 1300,
    zonas: ["Envigado"],
    tiposInmueble: ["Casa"],
    formaPago: "contado",
    notas: "",
    proximaCita: null,
    linkedProperties: [{ id: "71", titulo: "Casa en Envigado", precio: 1_100_000_000, portadaUrl: null }],
    events: [{ estadoAnterior: null, estadoNuevo: "calificando", fecha: now }],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "3",
    ownerAgenteId: "mock-admin",
    ownerAgenteNombre: "Andreina Torres",
    nombre: "Mariana Zapata",
    telefono: "3003334455",
    canal: "facebook",
    canalOtro: null,
    temperatura: "warm",
    estado: "visitas",
    motivoDescarte: null,
    presupuestoMin: 450,
    presupuestoMax: 520,
    zonas: ["La Estrella"],
    tiposInmueble: ["Apartamento"],
    formaPago: "credito",
    notas: "",
    proximaCita: null,
    linkedProperties: [],
    events: [
      { estadoAnterior: "calificando", estadoNuevo: "visitas", fecha: now },
      { estadoAnterior: null, estadoNuevo: "calificando", fecha: now },
    ],
    createdAt: now,
    updatedAt: now,
  },
];

let seq = MOCK_CLIENTS.length + 1;

function matches(c: Client, filters?: ClientListFilters): boolean {
  if (!filters) return c.estado !== "descartado";
  if (!filters.includeDiscarded && c.estado === "descartado") return false;
  if (filters.channel && c.canal !== filters.channel) return false;
  if (filters.temp?.length && !filters.temp.includes(c.temperatura)) return false;
  if (filters.q) {
    const q = filters.q.toLowerCase();
    const digits = filters.q.replace(/\D/g, "");
    const matchesName = c.nombre.toLowerCase().includes(q);
    const matchesPhone = digits && c.telefono.replace(/\D/g, "").includes(digits);
    if (!matchesName && !matchesPhone) return false;
  }
  return true;
}

export const clientsService: ClientsService = {
  async list(filters?: ClientListFilters): Promise<Client[]> {
    await delay(150);
    return MOCK_CLIENTS.filter((c) => matches(c, filters));
  },
  async channelCounts(): Promise<ClientChannelCount[]> {
    await delay(100);
    const counts = new Map<string, number>();
    for (const c of MOCK_CLIENTS) {
      counts.set(c.canal, (counts.get(c.canal) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([canal, total]) => ({
      canal: canal as ClientChannelCount["canal"],
      total,
    }));
  },
  async get(id: string): Promise<Client> {
    await delay(100);
    const found = MOCK_CLIENTS.find((c) => c.id === id);
    if (!found) throw new Error(`Cliente ${id} no encontrado`);
    return found;
  },
  async create(data: ClientWrite): Promise<Client> {
    await delay(200);
    const created: Client = {
      id: String(seq++),
      ownerAgenteId: "mock-admin",
      ownerAgenteNombre: "Andreina Torres",
      nombre: data.nombre ?? "(sin nombre)",
      telefono: data.telefono ?? "",
      canal: data.canal ?? "referido",
      canalOtro: data.canalOtro ?? null,
      temperatura: data.temperatura ?? "warm",
      estado: data.estado ?? "nuevo",
      motivoDescarte: null,
      presupuestoMin: data.presupuestoMin ?? null,
      presupuestoMax: data.presupuestoMax ?? null,
      zonas: data.zonas ?? [],
      tiposInmueble: data.tiposInmueble ?? [],
      formaPago: data.formaPago ?? null,
      notas: data.notas ?? null,
      proximaCita: data.proximaCita ?? null,
      linkedProperties: [],
      events: [{ estadoAnterior: null, estadoNuevo: data.estado ?? "nuevo", fecha: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_CLIENTS.unshift(created);
    return created;
  },
  async update(id: string, data: ClientWrite): Promise<Client> {
    await delay(150);
    const idx = MOCK_CLIENTS.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error(`Cliente ${id} no encontrado`);
    if (data.estado === "descartado" && !data.motivoDescarte && !MOCK_CLIENTS[idx].motivoDescarte) {
      throw new Error("motivo_descarte es obligatorio para descartar un cliente");
    }
    const merged: Client = {
      ...MOCK_CLIENTS[idx],
      ...data,
      canalOtro: data.canalOtro ?? MOCK_CLIENTS[idx].canalOtro,
      motivoDescarte:
        data.estado === "descartado"
          ? data.motivoDescarte ?? MOCK_CLIENTS[idx].motivoDescarte
          : data.estado
            ? null
            : MOCK_CLIENTS[idx].motivoDescarte,
      events:
        data.estado && data.estado !== MOCK_CLIENTS[idx].estado
          ? [
              { estadoAnterior: MOCK_CLIENTS[idx].estado, estadoNuevo: data.estado, fecha: new Date().toISOString() },
              ...MOCK_CLIENTS[idx].events,
            ]
          : MOCK_CLIENTS[idx].events,
      updatedAt: new Date().toISOString(),
    };
    MOCK_CLIENTS[idx] = merged;
    return merged;
  },
  async linkProperty(id: string, propertyId: string): Promise<Client> {
    await delay(150);
    const idx = MOCK_CLIENTS.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error(`Cliente ${id} no encontrado`);
    const already = MOCK_CLIENTS[idx].linkedProperties.some((p) => p.id === propertyId);
    if (!already) {
      MOCK_CLIENTS[idx] = {
        ...MOCK_CLIENTS[idx],
        linkedProperties: [
          ...MOCK_CLIENTS[idx].linkedProperties,
          { id: propertyId, titulo: `Ficha ${propertyId}`, precio: null, portadaUrl: null },
        ],
      };
    }
    return MOCK_CLIENTS[idx];
  },
  async unlinkProperty(id: string, propertyId: string): Promise<Client> {
    await delay(150);
    const idx = MOCK_CLIENTS.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error(`Cliente ${id} no encontrado`);
    MOCK_CLIENTS[idx] = {
      ...MOCK_CLIENTS[idx],
      linkedProperties: MOCK_CLIENTS[idx].linkedProperties.filter((p) => p.id !== propertyId),
    };
    return MOCK_CLIENTS[idx];
  },
};
