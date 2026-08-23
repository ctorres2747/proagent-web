import type {
  FichasService,
  Lead,
  LeadEstado,
  LeadsService,
} from "@/services/interfaces/leads";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const BOARD_ESTADOS: LeadEstado[] = [
  "Pendiente",
  "En contacto",
  "Captado",
  "Descartado",
];

const mockLeads: Lead[] = [
  {
    id: 101,
    portal: "MercadoLibre",
    municipio: "Envigado",
    barrio: "Zúñiga",
    tipoInmueble: "Apartamento",
    precio: "$ 420.000.000",
    precioNum: 420_000_000,
    areaM2: "92",
    habitaciones: "3",
    banos: "2",
    telefono: null,
    nombrePublicador: null,
    linkPublicacion: "https://mercadolibre.com.co/mock-101",
    imagenUrl: null,
    fechaCaptura: "2026-08-14T10:00:00",
    estado: "Pendiente",
    notas: null,
    fechaRecontacto: null,
    fechaActualizacion: "2026-08-14T10:00:00",
    ownerAgenteId: 1,
  },
  {
    id: 102,
    portal: "Facebook",
    municipio: "Sabaneta",
    barrio: "Conjunto Portobelo",
    tipoInmueble: "Casa",
    precio: "$ 680.000.000",
    precioNum: 680_000_000,
    areaM2: "140",
    habitaciones: "4",
    banos: "3",
    telefono: "3001112233",
    nombrePublicador: "María López",
    linkPublicacion: "https://facebook.com/marketplace/mock-102",
    imagenUrl: null,
    fechaCaptura: "2026-08-13T15:30:00",
    estado: "En contacto",
    notas: "Interesada en visita el sábado",
    fechaRecontacto: "2026-08-16",
    fechaActualizacion: "2026-08-14T09:00:00",
    ownerAgenteId: 1,
  },
  {
    id: 103,
    portal: "MercadoLibre",
    municipio: "El Poblado",
    barrio: null,
    tipoInmueble: "Apartamento",
    precio: "$ 890.000.000",
    precioNum: 890_000_000,
    areaM2: "110",
    habitaciones: "3",
    banos: "2",
    telefono: "3015558877",
    nombrePublicador: "Carlos Ruiz",
    linkPublicacion: "https://mercadolibre.com.co/mock-103",
    imagenUrl: null,
    fechaCaptura: "2026-08-12T08:00:00",
    estado: "Captado",
    notas: "Listo para publicar",
    fechaRecontacto: null,
    fechaActualizacion: "2026-08-14T11:00:00",
    ownerAgenteId: 1,
  },
  {
    id: 104,
    portal: "Manual",
    municipio: "Laureles",
    barrio: null,
    tipoInmueble: "Local",
    precio: "$ 2.500.000/mes",
    precioNum: 2_500_000,
    areaM2: "45",
    habitaciones: null,
    banos: "1",
    telefono: "3029991122",
    nombrePublicador: "Pedro Gómez",
    linkPublicacion: "manual-mock-104",
    imagenUrl: null,
    fechaCaptura: "2026-08-10T12:00:00",
    estado: "Descartado",
    notas: "Ya vendió por otro lado",
    fechaRecontacto: null,
    fechaActualizacion: "2026-08-11T16:00:00",
    ownerAgenteId: 1,
  },
];

function touch(lead: Lead): Lead {
  return {
    ...lead,
    fechaActualizacion: new Date().toISOString(),
  };
}

export const leadsService: LeadsService = {
  async list() {
    await delay(300 + Math.random() * 400);
    return mockLeads.filter((l) => BOARD_ESTADOS.includes(l.estado));
  },

  async get(id) {
    await delay(200);
    const lead = mockLeads.find((l) => l.id === id);
    if (!lead) throw new Error("Lead no encontrado");
    return lead;
  },

  async update(id, data) {
    await delay(250 + Math.random() * 200);
    const idx = mockLeads.findIndex((l) => l.id === id);
    if (idx < 0) throw new Error("Lead no encontrado");
    const current = mockLeads[idx];
    if (data.estado === "Captado") {
      const telefono = data.telefono ?? current.telefono;
      const nombre = data.nombrePublicador ?? current.nombrePublicador;
      if (!telefono?.trim() || !nombre?.trim()) {
        throw new Error(
          "Para pasar a Captado se requieren nombre y teléfono del propietario",
        );
      }
    }
    const updated = touch({
      ...current,
      ...data,
      estado: data.estado ?? current.estado,
    });
    mockLeads[idx] = updated;
    return updated;
  },
};

let nextMockFichaId = 9001;

export const fichasService: FichasService = {
  async createFromLead(leadId) {
    await delay(400);
    const lead = mockLeads.find((l) => l.id === leadId);
    if (!lead) throw new Error("Lead no encontrado");
    if (lead.estado !== "Captado") {
      throw new Error("Solo leads Captado pueden publicarse");
    }
    return { id: nextMockFichaId++ };
  },
};
