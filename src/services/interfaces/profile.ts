export interface AgentProfile {
  id: string;
  username: string;
  email: string;
  nombre: string;
  nombrePreferido: string | null;
  telefono: string | null;
  instagramHandle: string | null;
  bioCorta: string | null;
  fotoPerfilUrl: string | null;
}

export interface AgentProfileUpdate {
  nombre?: string | null;
  nombrePreferido?: string | null;
  telefono?: string | null;
  instagramHandle?: string | null;
  bioCorta?: string | null;
}

export interface ProfileService {
  get(token?: string): Promise<AgentProfile>;
  update(data: AgentProfileUpdate, token?: string): Promise<AgentProfile>;
  uploadPhoto(file: File, token?: string): Promise<AgentProfile>;
}
