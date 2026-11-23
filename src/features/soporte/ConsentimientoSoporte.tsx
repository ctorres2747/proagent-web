"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { soporteService } from "@/services";
import type { ConsentimientoSoporte } from "@/services/http/soporte";

export const CONSENTIMIENTO_QUERY_KEY = ["soporte-consentimiento"] as const;

/** D9 — autorización de soporte remoto del worker de Marketplace. Se acepta
 * acá (Configuración → Canales), nunca en la PC del asesor. Mientras no se
 * acepte, "Instalar en esta PC" queda deshabilitado. */
export function ConsentimientoSoporteBox({
  consentimiento,
  token,
}: {
  consentimiento: ConsentimientoSoporte;
  token?: string;
}) {
  const queryClient = useQueryClient();
  const [leido, setLeido] = useState(false);

  const aceptar = useMutation({
    mutationFn: () => soporteService.aceptar(consentimiento.version, token),
    onSuccess: (data) => queryClient.setQueryData(CONSENTIMIENTO_QUERY_KEY, data),
  });
  const acciones = useMutation({
    mutationFn: (habilitadas: boolean) => soporteService.setAccionesRemotas(habilitadas, token),
    onSuccess: (data) => queryClient.setQueryData(CONSENTIMIENTO_QUERY_KEY, data),
  });

  if (consentimiento.estado === "no_requerido") return null;

  if (consentimiento.estado === "aceptado") {
    return (
      <div id="soporte" className="space-y-2 rounded-lg border border-[var(--pa-border)] bg-[var(--pa-bg)] p-3">
        <p className="text-[11px] text-[var(--pa-muted)]">
          Autorizaste el soporte remoto de tu computador
          {consentimiento.aceptadoAt ? ` el ${consentimiento.aceptadoAt.slice(0, 10)}` : ""}.
        </p>
        <label className="flex items-center justify-between gap-3 text-[12px] text-[var(--pa-ink)]">
          <span>
            Permitir acciones a distancia (reiniciar o actualizar el programa, siempre
            con aprobación previa de ProAgent)
          </span>
          <input
            type="checkbox"
            className="h-4 w-4 shrink-0"
            checked={consentimiento.accionesRemotas}
            disabled={acciones.isPending}
            onChange={(e) => acciones.mutate(e.target.checked)}
          />
        </label>
      </div>
    );
  }

  return (
    <div
      id="soporte"
      className="space-y-2.5 rounded-lg border border-[var(--pa-warning-ink)]/30 bg-[var(--pa-warning-bg)] p-3"
    >
      <p className="text-[12px] font-semibold text-[var(--pa-ink)]">{consentimiento.titulo}</p>
      {consentimiento.estado === "gracia" && consentimiento.diasRestantes != null ? (
        <p className="text-[11px] text-[var(--pa-warning-ink)]">
          Tienes {consentimiento.diasRestantes} día{consentimiento.diasRestantes === 1 ? "" : "s"}{" "}
          para aceptarla. Mientras tanto Marketplace sigue funcionando normal.
        </p>
      ) : null}
      {consentimiento.estado === "pendiente" && consentimiento.tienePcInstalada ? (
        <p className="text-[11px] font-semibold text-[var(--pa-danger)]">
          Marketplace está pausado en tu computador hasta que la aceptes.
        </p>
      ) : null}
      <div className="max-h-56 overflow-y-auto whitespace-pre-line rounded-md border border-[var(--pa-border)] bg-[var(--pa-bg)] p-3 text-[11px] leading-relaxed text-[var(--pa-ink)]">
        {consentimiento.texto}
      </div>
      <label className="flex items-center gap-2 text-[12px] text-[var(--pa-ink)]">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={leido}
          onChange={(e) => setLeido(e.target.checked)}
        />
        Leí y acepto la autorización de soporte remoto
      </label>
      <button
        type="button"
        disabled={!leido || aceptar.isPending}
        onClick={() => aceptar.mutate()}
        className="rounded-lg bg-[var(--pa-navy)] px-4 py-2 text-[12px] font-bold text-white disabled:opacity-60"
      >
        Aceptar
      </button>
      {aceptar.isError ? (
        <p className="text-[11px] text-[var(--pa-danger)]">
          No se pudo guardar. Recarga la página: el texto pudo haber cambiado.
        </p>
      ) : null}
    </div>
  );
}
