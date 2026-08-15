import type {
  CriteriosCaptacion,
  CriteriosCaptacionUpdate,
  CriteriosService,
} from "@/services/interfaces/criterios";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let store: CriteriosCaptacion = {
  agenteId: "mock-admin",
  precioMin: null,
  precioMax: null,
  tipoInmueble: [],
  metrajeMin: null,
  metrajeMax: null,
  parqueadero: null,
};

export const criteriosService: CriteriosService = {
  async get() {
    await delay(200);
    return { ...store, tipoInmueble: [...store.tipoInmueble] };
  },

  async update(data: CriteriosCaptacionUpdate) {
    await delay(300);
    store = {
      ...store,
      precioMin: data.precioMin ?? null,
      precioMax: data.precioMax ?? null,
      tipoInmueble: data.tipoInmueble ?? [],
      metrajeMin: data.metrajeMin ?? null,
      metrajeMax: data.metrajeMax ?? null,
      parqueadero: data.parqueadero ?? null,
    };
    return { ...store, tipoInmueble: [...store.tipoInmueble] };
  },
};
