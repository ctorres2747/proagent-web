import { apiFetch } from "./client";

/** Entrega Drive con la cuenta de Google propia del asesor independiente
 * (backend: agente-inmobiliario `backend/web/google_drive.py`). */
export interface GoogleDriveEstado {
  oauth_propio: boolean;
  google_email?: string | null;
  reconectar?: boolean;
  disponible?: boolean;
}

/** URL de Google a la que hay que llevar al asesor. */
export async function conectarGoogleDrive(token?: string): Promise<{ url: string }> {
  return apiFetch("/api/web/me/google-drive/conectar", { method: "POST", token });
}

export async function desconectarGoogleDrive(token?: string): Promise<GoogleDriveEstado> {
  return apiFetch("/api/web/me/google-drive/desconectar", { method: "POST", token });
}

export const googleDriveService = {
  conectar: conectarGoogleDrive,
  desconectar: desconectarGoogleDrive,
};
