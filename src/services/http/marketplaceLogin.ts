import { apiFetch } from "./client";

/**
 * Re-login de Marketplace (Facebook): cuando la sesión de Andreina guardada
 * en la PC se cae ("Sesión de Andreina no activa"), esto encola/dispara que
 * la PC abra un navegador VISIBLE para que alguien la reinicie a mano —
 * reemplaza tener que correr `python -m backend.marketplace_publisher --login`
 * por SSH/AnyDesk. Ver backend/main.py (POST /api/marketplace/login) en el
 * repo agente-inmobiliario.
 */

export type MarketplaceLoginState = "pendiente" | "completado" | "error" | null;

export interface MarketplaceLoginStatus {
  estado: MarketplaceLoginState;
  mensaje: string | null;
}

export async function triggerMarketplaceLogin(
  token?: string,
): Promise<{ message: string; pendiente: boolean }> {
  return apiFetch("/api/marketplace/login", { method: "POST", token });
}

export async function getMarketplaceLoginStatus(
  token?: string,
): Promise<MarketplaceLoginStatus> {
  return apiFetch("/api/marketplace/login/status", { token });
}
