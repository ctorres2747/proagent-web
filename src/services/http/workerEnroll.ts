import { apiFetch } from "./client";

export interface WorkerEnrollCode {
  code: string;
  expiraEnMinutos: number;
}

export interface WorkerStatus {
  configurado: boolean;
  workerId: string | null;
  ultimoCheckin: string | null;
  conectado: boolean;
}

interface RawWorkerEnrollCode {
  code: string;
  expira_en_minutos: number;
}

interface RawWorkerStatus {
  configurado: boolean;
  worker_id: string | null;
  ultimo_checkin: string | null;
  conectado: boolean;
}

export async function createWorkerEnrollCode(token?: string): Promise<WorkerEnrollCode> {
  const raw = await apiFetch<RawWorkerEnrollCode>("/api/web/me/worker/enroll-code", {
    method: "POST",
    token,
  });
  return { code: raw.code, expiraEnMinutos: raw.expira_en_minutos };
}

export async function getWorkerStatus(token?: string): Promise<WorkerStatus> {
  const raw = await apiFetch<RawWorkerStatus>("/api/web/me/worker/status", { token });
  return {
    configurado: raw.configurado,
    workerId: raw.worker_id,
    ultimoCheckin: raw.ultimo_checkin,
    conectado: raw.conectado,
  };
}
