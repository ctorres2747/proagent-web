"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useAuth } from "@/features/auth/AuthProvider";
import { CONSENTIMIENTO_QUERY_KEY } from "@/features/soporte/ConsentimientoSoporte";
import { soporteService } from "@/services";
import type { ConexionPc, MaquinaFlota } from "@/services/http/soporte";

/** Panel de la flota de workers (soporte remoto, fase 1 — D3c). Solo la
 * cuenta Owner de soporte (`SOPORTE_OWNER_USERNAME` en el backend). */

const CONEXION: Record<ConexionPc, { label: string; className: string }> = {
  en_linea: { label: "En línea", className: "bg-[var(--pa-success-bg)] text-[var(--pa-accent)]" },
  servicio_caido: {
    label: "Servicio caído",
    className: "bg-[var(--pa-warning-bg)] text-[var(--pa-warning-ink)]",
  },
  apagada: { label: "Apagada", className: "bg-[var(--pa-bg-alt)] text-[var(--pa-muted)]" },
  sin_datos: { label: "Sin datos", className: "bg-[var(--pa-bg-alt)] text-[var(--pa-muted)]" },
};

function fecha(valor: string | null): string {
  return valor ? `${valor.slice(0, 16).replace("T", " ")} UTC` : "—";
}

function consentimientoTexto(m: MaquinaFlota): string {
  const c = m.consentimiento;
  switch (c.estado) {
    case "aceptado":
      return "Aceptado";
    case "gracia":
      return `Gracia (vence ${c.venceAt?.slice(0, 10) ?? "—"})`;
    case "pendiente":
      return c.venceAt ? `Vencido el ${c.venceAt.slice(0, 10)} — MP pausado` : "Pendiente";
    case "exento":
      return "Exento (clave global)";
    default:
      return "No requerido";
  }
}

function FilaMaquina({ m }: { m: MaquinaFlota }) {
  const conexion = CONEXION[m.conexion];
  return (
    <tr className="border-t border-[var(--pa-border)] align-top">
      <td className="px-3 py-2">
        <p className="font-mono text-[12px] text-[var(--pa-ink)]">{m.workerId}</p>
        <p className="text-[11px] text-[var(--pa-muted)]">
          Atiende a: {m.atiendeA.map((a) => a.nombre || a.username).join(", ") || "—"}
        </p>
      </td>
      <td className="px-3 py-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${conexion.className}`}>
          {conexion.label}
        </span>
        <p className="mt-1 text-[11px] text-[var(--pa-muted)]">Check-in: {fecha(m.ultimoCheckin)}</p>
        <p className="text-[11px] text-[var(--pa-muted)]">Presencia: {fecha(m.ultimaPresencia)}</p>
      </td>
      <td className="px-3 py-2 text-[11px] text-[var(--pa-muted)]">
        <p className="font-mono">{m.codigoEtag ?? "—"}</p>
        <p>{fecha(m.codigoActualizadoAt)}</p>
        {m.codigoError ? <p className="text-[var(--pa-danger)]">{m.codigoError}</p> : null}
      </td>
      <td className="max-w-[260px] px-3 py-2 text-[11px] text-[var(--pa-muted)]">
        {m.ultimoError ? (
          <>
            <p>
              {fecha(m.ultimoError.fecha)} · {m.ultimoError.componente}
            </p>
            <p className="line-clamp-3 break-words text-[var(--pa-ink)]">{m.ultimoError.mensaje}</p>
          </>
        ) : (
          "—"
        )}
      </td>
      <td className="px-3 py-2 text-center text-[12px]">
        {m.marketplaceAtascados > 0 ? (
          <span className="font-bold text-[var(--pa-danger)]">{m.marketplaceAtascados}</span>
        ) : (
          "0"
        )}
      </td>
      <td className="px-3 py-2 text-[11px] text-[var(--pa-ink)]">{consentimientoTexto(m)}</td>
    </tr>
  );
}

function TokensSoporte({ token }: { token?: string }) {
  const queryClient = useQueryClient();
  const [nuevo, setNuevo] = useState<string | null>(null);
  const { data: tokens } = useQuery({
    queryKey: ["soporte-tokens"],
    queryFn: () => soporteService.listTokens(token),
  });
  const crear = useMutation({
    mutationFn: () => soporteService.createToken("agente-soporte", token),
    onSuccess: (data) => {
      setNuevo(data.token);
      queryClient.invalidateQueries({ queryKey: ["soporte-tokens"] });
    },
  });
  const revocar = useMutation({
    mutationFn: (id: number) => soporteService.revokeToken(id, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["soporte-tokens"] }),
  });

  return (
    <section className="mt-8 space-y-3">
      <h2 className="text-[15px] font-bold text-[var(--pa-ink)]">Tokens del agente de soporte</h2>
      <p className="text-[12px] text-[var(--pa-muted)]">
        Solo sirven para leer la API de soporte (<code>/api/soporte</code>); no abren el resto
        de ProAgent ni pueden aprobar nada. Vencen solos.
      </p>
      <button
        type="button"
        disabled={crear.isPending}
        onClick={() => crear.mutate()}
        className="rounded-lg bg-[var(--pa-navy)] px-4 py-2 text-[12px] font-bold text-white disabled:opacity-60"
      >
        Crear token
      </button>
      {nuevo ? (
        <div className="rounded-lg border border-dashed border-[var(--pa-border)] bg-[var(--pa-bg)] p-3">
          <p className="text-[11px] text-[var(--pa-muted)]">Cópialo ahora: no se vuelve a mostrar.</p>
          <p className="break-all font-mono text-[12px] text-[var(--pa-ink)]">{nuevo}</p>
        </div>
      ) : null}
      <ul className="space-y-1.5">
        {(tokens ?? []).map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-3 text-[12px]">
            <span className="text-[var(--pa-ink)]">
              #{t.id} {t.nombre} · vence {fecha(t.venceAt)}
              {t.revocadoAt ? " · revocado" : ""}
            </span>
            {!t.revocadoAt ? (
              <button
                type="button"
                onClick={() => revocar.mutate(t.id)}
                className="text-[11px] font-semibold text-[var(--pa-danger)]"
              >
                Revocar
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function SoportePage() {
  const { token } = useAuth();
  const tk = token ?? undefined;
  const { data: consentimiento } = useQuery({
    queryKey: CONSENTIMIENTO_QUERY_KEY,
    queryFn: () => soporteService.getConsentimiento(tk),
  });
  const esOwner = consentimiento?.esOwnerSoporte === true;
  const { data: maquinas, isLoading, isError } = useQuery({
    queryKey: ["soporte-flota"],
    queryFn: () => soporteService.getFlota(tk),
    enabled: esOwner,
    refetchInterval: 60_000,
  });

  if (consentimiento && !esOwner) {
    return <p className="text-[13px] text-[var(--pa-muted)]">Esta sección es solo para la cuenta de soporte.</p>;
  }

  return (
    <div className="w-full">
      <header className="mb-6">
        <h1 className="text-[22px] font-extrabold text-[var(--pa-ink)]">Soporte · Flota de PCs</h1>
        <p className="mt-1 text-[13px] text-[var(--pa-muted)]">
          Estado del programa de Marketplace en el computador de cada asesor.
        </p>
      </header>
      {isLoading || !consentimiento ? (
        <p className="text-[13px] text-[var(--pa-muted)]">Cargando…</p>
      ) : isError ? (
        <p className="text-[13px] text-[var(--pa-danger)]">No se pudo cargar la flota.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--pa-border)] bg-[var(--pa-surface)]">
          <table className="w-full text-left">
            <thead className="bg-[var(--pa-bg-alt)] text-[11px] font-semibold text-[var(--pa-muted)]">
              <tr>
                <th className="px-3 py-2">PC</th>
                <th className="px-3 py-2">Conexión</th>
                <th className="px-3 py-2">Versión</th>
                <th className="px-3 py-2">Último error</th>
                <th className="px-3 py-2">MP atascados</th>
                <th className="px-3 py-2">Consentimiento</th>
              </tr>
            </thead>
            <tbody>
              {(maquinas ?? []).map((m) => (
                <FilaMaquina key={m.workerId} m={m} />
              ))}
              {maquinas && maquinas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-[12px] text-[var(--pa-muted)]">
                    Todavía no hay PCs registradas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
      {esOwner ? <TokensSoporte token={tk} /> : null}
    </div>
  );
}
