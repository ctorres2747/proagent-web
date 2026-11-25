/**
 * Mocks de las integraciones "sueltas" (contadores del sidebar, worker de la
 * PC, conexión de Facebook, re-login de Marketplace). Antes las pantallas
 * importaban directo `services/http/*` y en modo mocks hacían fetch contra
 * una URL vacía (el sidebar lo repetía cada 60 s).
 */
import type {
  FacebookConnectResult,
  FacebookConnectStatus,
} from "@/services/http/facebookConnect";
import type { GoogleDriveEstado } from "@/services/http/googleDrive";
import type { MarketplaceLoginStatus } from "@/services/http/marketplaceLogin";
import type { NavCounts } from "@/services/http/navCounts";
import type { WorkerEnrollCode, WorkerStatus } from "@/services/http/workerEnroll";
import { propertiesService } from "./properties";

export const navCountsService = {
  async get(): Promise<NavCounts> {
    const all = await propertiesService.list();
    return {
      inventoryCount: all.length,
      captacionPending: 0,
      prospectsNew: 0,
      publicationErrors: 2,
    };
  },
};

export const workerService = {
  async createEnrollCode(): Promise<WorkerEnrollCode> {
    return { code: "MOCK-1234", expiraEnMinutos: 15 };
  },
  async getStatus(): Promise<WorkerStatus> {
    return {
      configurado: false,
      workerId: null,
      ultimoCheckin: null,
      conectado: false,
    };
  },
};

export const facebookConnectService = {
  async trigger(): Promise<FacebookConnectResult> {
    return { pendiente: false, message: "Modo demo: sin conexión real a Facebook." };
  },
  async getStatus(): Promise<FacebookConnectStatus> {
    return { estado: null, mensaje: null };
  },
};

export const googleDriveService = {
  async conectar(): Promise<{ url: string }> {
    throw new Error("Modo demo: sin conexión real a Google Drive.");
  },
  async desconectar(): Promise<GoogleDriveEstado> {
    return { oauth_propio: false };
  },
};

export const marketplaceLoginService = {
  async trigger(): Promise<{ message: string; pendiente: boolean }> {
    return { pendiente: false, message: "Modo demo: sin PC conectada." };
  },
  async getStatus(): Promise<MarketplaceLoginStatus> {
    return { estado: null, mensaje: null };
  },
};

/** Modo demo: el requisito de consentimiento de soporte está apagado. */
export const soporteService = {
  async getConsentimiento() {
    return {
      estado: "no_requerido" as const,
      version: "demo",
      titulo: "Soporte remoto de tu computador",
      texto: "Modo demo.",
      requiereAceptacion: false,
      venceAt: null,
      diasRestantes: null,
      aceptadoAt: null,
      accionesRemotas: true,
      tienePcInstalada: false,
      esOwnerSoporte: false,
    };
  },
  async aceptar() {
    return soporteService.getConsentimiento();
  },
  async setAccionesRemotas() {
    return soporteService.getConsentimiento();
  },
  async getFlota() {
    return [];
  },
  async listTokens() {
    return [];
  },
  async createToken(nombre: string) {
    return { id: 0, nombre, creadoAt: "", venceAt: "", revocadoAt: null, token: "sop_demo" };
  },
  async revokeToken() {},
  async listInvocaciones() {
    return [];
  },
  async getErrores() {
    return [];
  },
  async proponer(): Promise<never> {
    throw new Error("Modo demo: sin PCs reales.");
  },
  async aprobar(): Promise<never> {
    throw new Error("Modo demo: sin PCs reales.");
  },
  async rechazar(): Promise<never> {
    throw new Error("Modo demo: sin PCs reales.");
  },
};
