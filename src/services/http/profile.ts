import type {
  AgentProfile,
  AgentProfileUpdate,
  ProfileService,
} from "@/services/interfaces/profile";
import { apiFetch, apiUploadForm } from "./client";

const PATH = "/api/web/me/profile";
const PHOTO_PATH = "/api/web/me/profile/photo";

interface RawProfile {
  id: string;
  username: string;
  email: string;
  nombre: string;
  nombre_preferido?: string | null;
  telefono?: string | null;
  instagram_handle?: string | null;
  bio_corta?: string | null;
  foto_perfil_url?: string | null;
}

function mapProfile(raw: RawProfile): AgentProfile {
  return {
    id: raw.id,
    username: raw.username,
    email: raw.email,
    nombre: raw.nombre,
    nombrePreferido: raw.nombre_preferido ?? null,
    telefono: raw.telefono ?? null,
    instagramHandle: raw.instagram_handle ?? null,
    bioCorta: raw.bio_corta ?? null,
    fotoPerfilUrl: raw.foto_perfil_url ?? null,
  };
}

function toRawUpdate(data: AgentProfileUpdate): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.nombre !== undefined) out.nombre = data.nombre;
  if (data.nombrePreferido !== undefined) out.nombre_preferido = data.nombrePreferido;
  if (data.telefono !== undefined) out.telefono = data.telefono;
  if (data.instagramHandle !== undefined) out.instagram_handle = data.instagramHandle;
  if (data.bioCorta !== undefined) out.bio_corta = data.bioCorta;
  return out;
}

export const profileService: ProfileService = {
  async get(token) {
    const raw = await apiFetch<RawProfile>(PATH, { token });
    return mapProfile(raw);
  },

  async update(data, token) {
    const raw = await apiFetch<RawProfile>(PATH, {
      method: "PATCH",
      token,
      body: toRawUpdate(data),
    });
    return mapProfile(raw);
  },

  async uploadPhoto(file, token) {
    const form = new FormData();
    form.append("file", file);
    const raw = await apiUploadForm<RawProfile>(PHOTO_PATH, form, token);
    return mapProfile(raw);
  },
};
