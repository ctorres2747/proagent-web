import { apiFetch } from "./client";

export interface FacebookConnectResult {
  pendiente: boolean;
  message: string;
}

export interface FacebookConnectStatus {
  estado: "pendiente" | "completado" | "error" | null;
  mensaje: string | null;
}

export async function triggerFacebookConnect(token?: string): Promise<FacebookConnectResult> {
  return apiFetch("/api/web/me/channels/facebook/connect", { method: "POST", token });
}

export async function getFacebookConnectStatus(token?: string): Promise<FacebookConnectStatus> {
  return apiFetch("/api/web/me/channels/facebook/connect/status", { token });
}
