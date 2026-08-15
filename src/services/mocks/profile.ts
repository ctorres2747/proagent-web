import type {
  AgentProfile,
  AgentProfileUpdate,
  ProfileService,
} from "@/services/interfaces/profile";

let mockProfile: AgentProfile = {
  id: "mock-1",
  username: "andreina@proinversores.com",
  email: "andreina@proinversores.com",
  nombre: "Andreina Torres",
  nombrePreferido: "Andreina",
  telefono: "3005551234",
  instagramHandle: "@andreina.inmo",
  bioCorta: "Asesora inmobiliaria en el Valle de Aburrá",
  fotoPerfilUrl: null,
};

export const profileService: ProfileService = {
  async get() {
    await new Promise((r) => setTimeout(r, 300));
    return { ...mockProfile };
  },

  async update(data) {
    await new Promise((r) => setTimeout(r, 400));
    mockProfile = {
      ...mockProfile,
      nombre: data.nombre ?? mockProfile.nombre,
      nombrePreferido:
        data.nombrePreferido !== undefined
          ? data.nombrePreferido
          : mockProfile.nombrePreferido,
      telefono:
        data.telefono !== undefined ? data.telefono : mockProfile.telefono,
      instagramHandle:
        data.instagramHandle !== undefined
          ? data.instagramHandle
          : mockProfile.instagramHandle,
      bioCorta:
        data.bioCorta !== undefined ? data.bioCorta : mockProfile.bioCorta,
    };
    return { ...mockProfile };
  },

  async uploadPhoto(file) {
    await new Promise((r) => setTimeout(r, 500));
    mockProfile = {
      ...mockProfile,
      fotoPerfilUrl: URL.createObjectURL(file),
    };
    return { ...mockProfile };
  },
};
