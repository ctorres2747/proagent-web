import { apiFetch } from "./client";

/** Soporte remoto de la flota de workers (fases 0/1 — diseño en
 * agente-inmobiliario/docs/inventario-agente-soporte-pc.md). */

export type EstadoConsentimiento = "no_requerido" | "aceptado" | "gracia" | "pendiente";

export interface ConsentimientoSoporte {
  estado: EstadoConsentimiento;
  version: string;
  titulo: string;
  texto: string;
  requiereAceptacion: boolean;
  venceAt: string | null;
  diasRestantes: number | null;
  aceptadoAt: string | null;
  accionesRemotas: boolean;
  tienePcInstalada: boolean;
  esOwnerSoporte: boolean;
}

interface RawConsentimiento {
  estado: EstadoConsentimiento;
  version: string;
  titulo: string;
  texto: string;
  requiere_aceptacion: boolean;
  vence_at: string | null;
  dias_restantes: number | null;
  aceptado_at: string | null;
  acciones_remotas: boolean;
  tiene_pc_instalada: boolean;
  es_owner_soporte: boolean;
}

function mapConsentimiento(raw: RawConsentimiento): ConsentimientoSoporte {
  return {
    estado: raw.estado,
    version: raw.version,
    titulo: raw.titulo,
    texto: raw.texto,
    requiereAceptacion: raw.requiere_aceptacion,
    venceAt: raw.vence_at,
    diasRestantes: raw.dias_restantes,
    aceptadoAt: raw.aceptado_at,
    accionesRemotas: raw.acciones_remotas,
    tienePcInstalada: raw.tiene_pc_instalada,
    esOwnerSoporte: raw.es_owner_soporte,
  };
}

export type ConexionPc = "en_linea" | "servicio_caido" | "apagada" | "sin_datos";

export interface AsesorAtendido {
  agenteId: number;
  username: string;
  nombre: string | null;
}

export interface MaquinaFlota {
  workerId: string;
  dueno: AsesorAtendido | null;
  atiendeA: AsesorAtendido[];
  conexion: ConexionPc;
  ultimoCheckin: string | null;
  ultimaPresencia: string | null;
  servicioOk: boolean | null;
  codigoEtag: string | null;
  codigoActualizadoAt: string | null;
  codigoError: string | null;
  ultimoError: { fecha: string; componente: string; mensaje: string } | null;
  marketplaceAtascados: number;
  consentimiento: {
    estado: EstadoConsentimiento | "exento";
    venceAt: string | null;
    diasRestantes?: number | null;
  };
}

interface RawAsesor {
  agente_id: number;
  username: string;
  nombre: string | null;
}

interface RawMaquina {
  worker_id: string;
  dueno: RawAsesor | null;
  atiende_a: RawAsesor[];
  conexion: ConexionPc;
  ultimo_checkin: string | null;
  ultima_presencia: string | null;
  servicio_ok: boolean | null;
  codigo_etag: string | null;
  codigo_actualizado_at: string | null;
  codigo_error: string | null;
  ultimo_error: { fecha: string; componente: string; mensaje: string } | null;
  marketplace_atascados: number;
  consentimiento: {
    estado: EstadoConsentimiento | "exento";
    vence_at: string | null;
    dias_restantes?: number | null;
  };
}

const mapAsesor = (a: RawAsesor): AsesorAtendido => ({
  agenteId: a.agente_id,
  username: a.username,
  nombre: a.nombre,
});

function mapMaquina(raw: RawMaquina): MaquinaFlota {
  return {
    workerId: raw.worker_id,
    dueno: raw.dueno ? mapAsesor(raw.dueno) : null,
    atiendeA: raw.atiende_a.map(mapAsesor),
    conexion: raw.conexion,
    ultimoCheckin: raw.ultimo_checkin,
    ultimaPresencia: raw.ultima_presencia,
    servicioOk: raw.servicio_ok,
    codigoEtag: raw.codigo_etag,
    codigoActualizadoAt: raw.codigo_actualizado_at,
    codigoError: raw.codigo_error,
    ultimoError: raw.ultimo_error,
    marketplaceAtascados: raw.marketplace_atascados,
    consentimiento: {
      estado: raw.consentimiento.estado,
      venceAt: raw.consentimiento.vence_at,
      diasRestantes: raw.consentimiento.dias_restantes,
    },
  };
}

export interface TokenSoporte {
  id: number;
  nombre: string;
  creadoAt: string;
  venceAt: string;
  revocadoAt: string | null;
}

interface RawToken {
  id: number;
  nombre: string;
  creado_at: string;
  vence_at: string;
  revocado_at: string | null;
}

const mapToken = (t: RawToken): TokenSoporte => ({
  id: t.id,
  nombre: t.nombre,
  creadoAt: t.creado_at,
  venceAt: t.vence_at,
  revocadoAt: t.revocado_at,
});

export type EstadoInvocacion =
  | "pendiente"
  | "pendiente_aprobacion"
  | "aprobada"
  | "en_proceso"
  | "ok"
  | "error"
  | "rechazada"
  | "expirada";

export interface InvocacionSoporte {
  id: number;
  workerId: string;
  tool: string;
  categoria: "lectura" | "accion";
  args: Record<string, unknown>;
  estado: EstadoInvocacion;
  motivo: string | null;
  solicitadoPor: string;
  creadoAt: string;
  aprobadoAt: string | null;
  terminadoAt: string | null;
  salida: string | null;
  error: string | null;
}

interface RawInvocacion {
  id: number;
  worker_id: string;
  tool: string;
  categoria: "lectura" | "accion";
  args: Record<string, unknown>;
  estado: EstadoInvocacion;
  motivo: string | null;
  solicitado_por: string;
  creado_at: string;
  aprobado_at: string | null;
  terminado_at: string | null;
  salida: string | null;
  error: string | null;
}

const mapInvocacion = (r: RawInvocacion): InvocacionSoporte => ({
  id: r.id,
  workerId: r.worker_id,
  tool: r.tool,
  categoria: r.categoria,
  args: r.args,
  estado: r.estado,
  motivo: r.motivo,
  solicitadoPor: r.solicitado_por,
  creadoAt: r.creado_at,
  aprobadoAt: r.aprobado_at,
  terminadoAt: r.terminado_at,
  salida: r.salida,
  error: r.error,
});

export const soporteService = {
  async getConsentimiento(token?: string): Promise<ConsentimientoSoporte> {
    return mapConsentimiento(
      await apiFetch<RawConsentimiento>("/api/web/me/soporte/consentimiento", { token }),
    );
  },
  async aceptar(version: string, token?: string): Promise<ConsentimientoSoporte> {
    return mapConsentimiento(
      await apiFetch<RawConsentimiento>("/api/web/me/soporte/consentimiento", {
        method: "POST",
        token,
        body: { version },
      }),
    );
  },
  async setAccionesRemotas(habilitadas: boolean, token?: string): Promise<ConsentimientoSoporte> {
    return mapConsentimiento(
      await apiFetch<RawConsentimiento>("/api/web/me/soporte/acciones-remotas", {
        method: "POST",
        token,
        body: { habilitadas },
      }),
    );
  },
  async getFlota(token?: string): Promise<MaquinaFlota[]> {
    const raw = await apiFetch<{ maquinas: RawMaquina[] }>("/api/web/soporte/flota", { token });
    return raw.maquinas.map(mapMaquina);
  },
  async listTokens(token?: string): Promise<TokenSoporte[]> {
    const raw = await apiFetch<{ tokens: RawToken[] }>("/api/web/soporte/tokens", { token });
    return raw.tokens.map(mapToken);
  },
  async createToken(nombre: string, token?: string): Promise<TokenSoporte & { token: string }> {
    const raw = await apiFetch<RawToken & { token: string }>("/api/web/soporte/tokens", {
      method: "POST",
      token,
      body: { nombre },
    });
    return { ...mapToken(raw), token: raw.token };
  },
  async revokeToken(id: number, token?: string): Promise<void> {
    await apiFetch(`/api/web/soporte/tokens/${id}`, { method: "DELETE", token });
  },
  async listInvocaciones(
    filtro: { estado?: EstadoInvocacion; workerId?: string; limit?: number },
    token?: string,
  ): Promise<InvocacionSoporte[]> {
    const raw = await apiFetch<{ invocaciones: RawInvocacion[] }>("/api/web/soporte/invocaciones", {
      token,
      query: { estado: filtro.estado, worker_id: filtro.workerId, limit: filtro.limit },
    });
    return raw.invocaciones.map(mapInvocacion);
  },
  async proponer(
    datos: { workerId: string; tool: string; args: Record<string, unknown>; motivo?: string },
    token?: string,
  ): Promise<InvocacionSoporte> {
    return mapInvocacion(
      await apiFetch<RawInvocacion>("/api/web/soporte/invocaciones", {
        method: "POST",
        token,
        body: { worker_id: datos.workerId, tool: datos.tool, args: datos.args, motivo: datos.motivo },
      }),
    );
  },
  async aprobar(id: number, token?: string): Promise<InvocacionSoporte> {
    return mapInvocacion(
      await apiFetch<RawInvocacion>(`/api/web/soporte/invocaciones/${id}/aprobar`, { method: "POST", token }),
    );
  },
  async rechazar(id: number, token?: string): Promise<InvocacionSoporte> {
    return mapInvocacion(
      await apiFetch<RawInvocacion>(`/api/web/soporte/invocaciones/${id}/rechazar`, { method: "POST", token }),
    );
  },
};
