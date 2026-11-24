"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { soporteService } from "@/services";
import type { EstadoInvocacion, InvocacionSoporte, MaquinaFlota } from "@/services/http/soporte";

/** Soporte remoto, fases 2–3 (diseño en agente-inmobiliario
 * docs/inventario-agente-soporte-pc.md). Las lecturas llegan a la PC sin
 * aprobación; las acciones esperan acá a que el Owner las apruebe. La
 * categoría la decide el backend, nunca esta pantalla. */

const INVOCACIONES_KEY = ["soporte-invocaciones"] as const;

export const HERRAMIENTAS: { tool: string; label: string; accion: boolean }[] = [
  { tool: "pc_health_snapshot", label: "Salud de la PC", accion: false },
  { tool: "pc_log_tail", label: "Últimas líneas de un log", accion: false },
  { tool: "pc_process_worker", label: "Procesos del programa", accion: false },
  { tool: "pc_network_probe", label: "Prueba de red", accion: false },
  { tool: "pc_telemetry_flush", label: "Resultados de Marketplace sin subir", accion: false },
  { tool: "pc_service_restart", label: "Reiniciar el servicio (acción)", accion: true },
  { tool: "pc_update_run", label: "Actualizar el programa ya (acción)", accion: true },
];

const LOGS = ["backend", "actualizar-worker", "presencia", "supervisor"];

const ESTADO: Record<EstadoInvocacion, string> = {
  pendiente: "Esperando a la PC",
  pendiente_aprobacion: "Espera tu aprobación",
  aprobada: "Aprobada, esperando a la PC",
  en_proceso: "En curso",
  ok: "Terminada",
  error: "Error",
  rechazada: "Rechazada",
  expirada: "Vencida",
};

function etiqueta(tool: string): string {
  return HERRAMIENTAS.find((h) => h.tool === tool)?.label ?? tool;
}

function nombrePc(workerId: string, maquinas: MaquinaFlota[] | undefined): string {
  const m = maquinas?.find((x) => x.workerId === workerId);
  const quien = m?.atiendeA.map((a) => a.nombre || a.username).join(", ");
  return quien ? `${workerId} (${quien})` : workerId;
}

function mensajeError(err: unknown): string {
  return err instanceof Error ? err.message : "No se pudo completar";
}

export function AprobacionesSoporte({ token, maquinas }: { token?: string; maquinas?: MaquinaFlota[] }) {
  const queryClient = useQueryClient();
  const [porAprobar, setPorAprobar] = useState<InvocacionSoporte | null>(null);
  const { data: pendientes } = useQuery({
    queryKey: [...INVOCACIONES_KEY, "pendiente_aprobacion"],
    queryFn: () => soporteService.listInvocaciones({ estado: "pendiente_aprobacion" }, token),
    refetchInterval: 15_000,
  });
  const refrescar = () => queryClient.invalidateQueries({ queryKey: INVOCACIONES_KEY });
  const aprobar = useMutation({
    mutationFn: (id: number) => soporteService.aprobar(id, token),
    onSuccess: () => {
      setPorAprobar(null);
      refrescar();
    },
  });
  const rechazar = useMutation({
    mutationFn: (id: number) => soporteService.rechazar(id, token),
    onSuccess: refrescar,
  });

  return (
    <section className="mt-8 space-y-3">
      <h2 className="text-[15px] font-bold text-[var(--pa-ink)]">
        Aprobaciones{pendientes?.length ? ` (${pendientes.length})` : ""}
      </h2>
      <p className="text-[12px] text-[var(--pa-muted)]">
        Acciones propuestas para ejecutarse en la PC de un asesor. Nada se ejecuta sin tu aprobación;
        una aprobación vence a los 20 minutos si la PC no la toma, y no se ejecuta mientras esa PC
        esté publicando en Marketplace.
      </p>
      {!pendientes?.length ? (
        <p className="text-[12px] text-[var(--pa-muted)]">No hay acciones esperando aprobación.</p>
      ) : (
        <ul className="space-y-2">
          {pendientes.map((inv) => (
            <li
              key={inv.id}
              className="flex flex-col gap-2 rounded-lg border border-[var(--pa-warning-ink)]/30 bg-[var(--pa-warning-bg)] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="text-[12px] text-[var(--pa-ink)]">
                <p className="font-semibold">
                  #{inv.id} · {etiqueta(inv.tool)}
                </p>
                <p className="text-[var(--pa-muted)]">PC: {nombrePc(inv.workerId, maquinas)}</p>
                <p className="text-[var(--pa-muted)]">Pedida por: {inv.solicitadoPor}</p>
                {inv.motivo ? <p>Motivo: {inv.motivo}</p> : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setPorAprobar(inv)}
                  className="rounded-lg bg-[var(--pa-navy)] px-3 py-1.5 text-[12px] font-bold text-white"
                >
                  Aprobar
                </button>
                <button
                  type="button"
                  disabled={rechazar.isPending}
                  onClick={() => rechazar.mutate(inv.id)}
                  className="rounded-lg border border-[var(--pa-border)] bg-white px-3 py-1.5 text-[12px] font-semibold text-[var(--pa-danger)]"
                >
                  Rechazar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {aprobar.isError ? (
        <p className="text-[12px] text-[var(--pa-danger)]">{mensajeError(aprobar.error)}</p>
      ) : null}
      <ConfirmDialog
        open={porAprobar !== null}
        title="Aprobar acción"
        message={
          porAprobar
            ? `Se va a ejecutar "${etiqueta(porAprobar.tool)}" en la PC ${nombrePc(porAprobar.workerId, maquinas)}. ` +
              "Si la PC está publicando en Marketplace, espera a que termine."
            : ""
        }
        confirmLabel="Aprobar"
        busy={aprobar.isPending}
        onCancel={() => setPorAprobar(null)}
        onConfirm={() => porAprobar && aprobar.mutate(porAprobar.id)}
      />
    </section>
  );
}

export function PedirInvocacion({ token, maquinas }: { token?: string; maquinas?: MaquinaFlota[] }) {
  const queryClient = useQueryClient();
  const [workerId, setWorkerId] = useState("");
  const [tool, setTool] = useState(HERRAMIENTAS[0].tool);
  const [archivo, setArchivo] = useState(LOGS[0]);
  const [lineas, setLineas] = useState(100);
  const [motivo, setMotivo] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);

  const pedir = useMutation({
    mutationFn: () =>
      soporteService.proponer(
        {
          workerId,
          tool,
          args: tool === "pc_log_tail" ? { archivo, lineas } : {},
          motivo: motivo || undefined,
        },
        token,
      ),
    onSuccess: (inv) => {
      setAviso(
        inv.estado === "pendiente_aprobacion"
          ? `#${inv.id} creada: es una acción, apruébala arriba para que se ejecute.`
          : `#${inv.id} enviada a la PC. El resultado aparece abajo en unos segundos.`,
      );
      setMotivo("");
      queryClient.invalidateQueries({ queryKey: INVOCACIONES_KEY });
    },
  });

  const campo =
    "rounded-lg border border-[var(--pa-border)] bg-white px-2 py-1.5 text-[12px] text-[var(--pa-ink)]";

  return (
    <section className="mt-8 space-y-3">
      <h2 className="text-[15px] font-bold text-[var(--pa-ink)]">Revisar una PC</h2>
      <p className="text-[12px] text-[var(--pa-muted)]">
        Solo las PCs del piloto (SOPORTE_SUPERVISOR_WORKERS en el servidor) reciben pedidos.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <select className={campo} value={workerId} onChange={(e) => setWorkerId(e.target.value)}>
          <option value="">Elige una PC…</option>
          {(maquinas ?? []).filter((m) => m.dueno).map((m) => (
            <option key={m.workerId} value={m.workerId}>
              {nombrePc(m.workerId, maquinas)}
            </option>
          ))}
        </select>
        <select className={campo} value={tool} onChange={(e) => setTool(e.target.value)}>
          {HERRAMIENTAS.map((h) => (
            <option key={h.tool} value={h.tool}>
              {h.label}
            </option>
          ))}
        </select>
        {tool === "pc_log_tail" ? (
          <>
            <select className={campo} value={archivo} onChange={(e) => setArchivo(e.target.value)}>
              {LOGS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={300}
              className={`${campo} w-20`}
              value={lineas}
              onChange={(e) => setLineas(Math.max(1, Math.min(300, Number(e.target.value) || 1)))}
            />
          </>
        ) : null}
        <input
          className={`${campo} min-w-[180px] flex-1`}
          placeholder="Motivo (queda en la auditoría)"
          value={motivo}
          maxLength={1000}
          onChange={(e) => setMotivo(e.target.value)}
        />
        <button
          type="button"
          disabled={!workerId || pedir.isPending}
          onClick={() => pedir.mutate()}
          className="rounded-lg bg-[var(--pa-navy)] px-4 py-2 text-[12px] font-bold text-white disabled:opacity-60"
        >
          Pedir
        </button>
      </div>
      {aviso ? <p className="text-[12px] text-[var(--pa-accent)]">{aviso}</p> : null}
      {pedir.isError ? <p className="text-[12px] text-[var(--pa-danger)]">{mensajeError(pedir.error)}</p> : null}
    </section>
  );
}

export function HistorialInvocaciones({ token, maquinas }: { token?: string; maquinas?: MaquinaFlota[] }) {
  const [abierta, setAbierta] = useState<number | null>(null);
  const { data: invocaciones } = useQuery({
    queryKey: [...INVOCACIONES_KEY, "historial"],
    queryFn: () => soporteService.listInvocaciones({ limit: 30 }, token),
    refetchInterval: 5_000,
  });

  return (
    <section className="mt-8 space-y-3">
      <h2 className="text-[15px] font-bold text-[var(--pa-ink)]">Historial de pedidos</h2>
      {!invocaciones?.length ? (
        <p className="text-[12px] text-[var(--pa-muted)]">Todavía no hay pedidos.</p>
      ) : (
        <ul className="divide-y divide-[var(--pa-border)] rounded-xl border border-[var(--pa-border)] bg-[var(--pa-surface)]">
          {invocaciones.map((inv) => (
            <li key={inv.id} className="px-3 py-2 text-[12px]">
              <button
                type="button"
                className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
                onClick={() => setAbierta(abierta === inv.id ? null : inv.id)}
              >
                <span className="text-[var(--pa-ink)]">
                  #{inv.id} · {etiqueta(inv.tool)} · {nombrePc(inv.workerId, maquinas)}
                </span>
                <span
                  className={
                    inv.estado === "error" || inv.estado === "expirada" || inv.estado === "rechazada"
                      ? "font-semibold text-[var(--pa-danger)]"
                      : inv.estado === "ok"
                        ? "font-semibold text-[var(--pa-accent)]"
                        : "font-semibold text-[var(--pa-warning-ink)]"
                  }
                >
                  {ESTADO[inv.estado]}
                </span>
              </button>
              {abierta === inv.id ? (
                <div className="mt-2 space-y-1 text-[var(--pa-muted)]">
                  <p>
                    Pedida por {inv.solicitadoPor} · {inv.creadoAt} UTC
                    {inv.motivo ? ` · Motivo: ${inv.motivo}` : ""}
                  </p>
                  {inv.error ? <p className="text-[var(--pa-danger)]">{inv.error}</p> : null}
                  {inv.salida ? (
                    <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-[var(--pa-bg)] p-2 font-mono text-[11px] text-[var(--pa-ink)]">
                      {inv.salida}
                    </pre>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
