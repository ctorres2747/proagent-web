"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { soporteService } from "@/services";
import type { EstadoNota, MaquinaFlota, NotaSoporte, TipoNota } from "@/services/http/soporte";

/** Bitácora de soporte: notas que dejan los agentes (el Proyecto de
 * claude.ai, las sesiones de Claude Code) y el Owner. Los bugs se cierran con
 * el PR que los arregló. Backend: agente-inmobiliario backend/db/soporte_notas.py. */

const NOTAS_KEY = ["soporte-notas"] as const;

const TIPOS: { id: TipoNota; label: string }[] = [
  { id: "bug", label: "Bug" },
  { id: "diagnostico", label: "Diagnóstico" },
  { id: "leccion", label: "Lección" },
  { id: "aviso", label: "Aviso" },
];

const TIPO_CLASE: Record<TipoNota, string> = {
  bug: "bg-[var(--pa-danger-bg)] text-[var(--pa-danger)]",
  diagnostico: "bg-[var(--pa-bg-alt)] text-[var(--pa-ink)]",
  leccion: "bg-[var(--pa-success-bg)] text-[var(--pa-accent)]",
  aviso: "bg-[var(--pa-warning-bg)] text-[var(--pa-warning-ink)]",
};

function etiquetaTipo(tipo: TipoNota): string {
  return TIPOS.find((t) => t.id === tipo)?.label ?? tipo;
}

/** "agente:3:Conector claude.ai (Claude)" → "Conector claude.ai (Claude)";
 * "owner:usuario" → "Tú". */
function autorLegible(autor: string): string {
  if (autor.startsWith("owner:")) return "Tú";
  const partes = autor.split(":");
  return partes.length >= 3 ? partes.slice(2).join(":") : autor;
}

function mensajeError(err: unknown): string {
  return err instanceof Error ? err.message : "No se pudo completar";
}

const campo =
  "rounded-lg border border-[var(--pa-border)] bg-[var(--pa-surface)] px-2 py-1.5 text-[12px] text-[var(--pa-ink)]";

export function BitacoraSoporte({ token, maquinas }: { token?: string; maquinas?: MaquinaFlota[] }) {
  const queryClient = useQueryClient();
  const [estado, setEstado] = useState<EstadoNota | "">("abierta");
  const [tipo, setTipo] = useState<TipoNota | "">("");
  const [abierta, setAbierta] = useState<number | null>(null);
  const [cerrando, setCerrando] = useState<number | null>(null);
  const [cierre, setCierre] = useState("");
  const [nueva, setNueva] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: notas, isLoading } = useQuery({
    queryKey: [...NOTAS_KEY, estado, tipo],
    queryFn: () =>
      soporteService.listNotas({ estado: estado || undefined, tipo: tipo || undefined, limit: 50 }, token),
    refetchInterval: 30_000,
  });

  const refrescar = () => void queryClient.invalidateQueries({ queryKey: NOTAS_KEY });

  const cerrarMutation = useMutation({
    mutationFn: ({ id, texto }: { id: number; texto: string }) => soporteService.cerrarNota(id, texto, token),
    onSuccess: () => {
      setCerrando(null);
      setCierre("");
      setError(null);
      refrescar();
    },
    onError: (err) => setError(mensajeError(err)),
  });

  return (
    <section className="mt-8 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold text-[var(--pa-ink)]">Bitácora de soporte</h2>
        <button
          type="button"
          onClick={() => setNueva((v) => !v)}
          className="rounded-lg border border-[var(--pa-navy)] px-3 py-1.5 text-[12px] font-semibold text-[var(--pa-navy)]"
        >
          {nueva ? "Cancelar" : "Nueva nota"}
        </button>
      </div>
      <p className="text-[12px] text-[var(--pa-muted)]">
        Lo que dejan los agentes de soporte (el Proyecto de claude.ai, las sesiones de Claude Code) y tú.
        Los bugs se cierran con el PR que los arregló.
      </p>

      {nueva ? (
        <NuevaNotaForm
          token={token}
          maquinas={maquinas}
          onCreada={() => {
            setNueva(false);
            refrescar();
          }}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <select
          className={campo}
          value={estado}
          onChange={(e) => setEstado(e.target.value as EstadoNota | "")}
          aria-label="Estado"
        >
          <option value="abierta">Abiertas</option>
          <option value="cerrada">Cerradas</option>
          <option value="">Todas</option>
        </select>
        <select
          className={campo}
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoNota | "")}
          aria-label="Tipo"
        >
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="text-[12px] text-[var(--pa-danger)]">{error}</p> : null}

      {isLoading ? (
        <p className="text-[12px] text-[var(--pa-muted)]">Cargando…</p>
      ) : !notas?.length ? (
        <p className="text-[12px] text-[var(--pa-muted)]">
          {estado === "abierta" ? "No hay notas abiertas." : "No hay notas."}
        </p>
      ) : (
        <ul className="divide-y divide-[var(--pa-border)] rounded-xl border border-[var(--pa-border)] bg-[var(--pa-surface)]">
          {notas.map((nota: NotaSoporte) => (
            <li key={nota.id} className="px-3 py-2 text-[12px]">
              <button
                type="button"
                className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
                onClick={() => setAbierta(abierta === nota.id ? null : nota.id)}
              >
                <span className="flex flex-wrap items-center gap-2 text-[var(--pa-ink)]">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${TIPO_CLASE[nota.tipo]}`}>
                    {etiquetaTipo(nota.tipo)}
                  </span>
                  <span>
                    #{nota.id} · {nota.titulo}
                  </span>
                </span>
                <span
                  className={
                    nota.estado === "abierta"
                      ? "font-semibold text-[var(--pa-warning-ink)]"
                      : "font-semibold text-[var(--pa-accent)]"
                  }
                >
                  {nota.estado === "abierta" ? "Abierta" : "Cerrada"}
                </span>
              </button>
              {abierta === nota.id ? (
                <div className="mt-2 space-y-2 text-[var(--pa-muted)]">
                  <p>
                    {autorLegible(nota.autor)} · {nota.creadoAt} UTC
                    {nota.workerId ? ` · PC ${nota.workerId}` : ""}
                    {nota.fichaId ? ` · Ficha ${nota.fichaId}` : ""}
                  </p>
                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-[var(--pa-bg)] p-2 font-sans text-[12px] text-[var(--pa-ink)]">
                    {nota.texto}
                  </pre>
                  {nota.estado === "cerrada" ? (
                    <p>
                      Cerrada por {autorLegible(nota.cerradoPor ?? "")} · {nota.cerradoAt} UTC
                      {nota.cierre ? ` · ${nota.cierre}` : ""}
                    </p>
                  ) : cerrando === nota.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        className={`${campo} min-w-0 flex-1`}
                        placeholder="Cómo se resolvió (p. ej. PR #600, era la PC apagada)"
                        value={cierre}
                        onChange={(e) => setCierre(e.target.value)}
                        maxLength={5000}
                      />
                      <button
                        type="button"
                        disabled={!cierre.trim() || cerrarMutation.isPending}
                        onClick={() => cerrarMutation.mutate({ id: nota.id, texto: cierre.trim() })}
                        className="rounded-lg bg-[var(--pa-navy)] px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-60"
                      >
                        Cerrar nota
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCerrando(null);
                          setCierre("");
                        }}
                        className="text-[12px] text-[var(--pa-muted)] underline"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setCerrando(nota.id);
                        setCierre("");
                      }}
                      className="rounded-lg border border-[var(--pa-border)] px-3 py-1.5 text-[12px] font-semibold text-[var(--pa-ink)]"
                    >
                      Cerrar…
                    </button>
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function NuevaNotaForm({
  token,
  maquinas,
  onCreada,
}: {
  token?: string;
  maquinas?: MaquinaFlota[];
  onCreada: () => void;
}) {
  const [tipo, setTipo] = useState<TipoNota>("aviso");
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [workerId, setWorkerId] = useState("");
  const crear = useMutation({
    mutationFn: () =>
      soporteService.crearNota(
        { tipo, titulo: titulo.trim(), texto: texto.trim(), workerId: workerId || null },
        token,
      ),
    onSuccess: onCreada,
  });

  return (
    <div className="space-y-2 rounded-xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-3">
      <div className="flex flex-wrap gap-2">
        <select className={campo} value={tipo} onChange={(e) => setTipo(e.target.value as TipoNota)} aria-label="Tipo de nota">
          {TIPOS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <select className={campo} value={workerId} onChange={(e) => setWorkerId(e.target.value)} aria-label="PC">
          <option value="">Sin PC</option>
          {maquinas?.map((m) => (
            <option key={m.workerId} value={m.workerId}>
              {m.workerId}
            </option>
          ))}
        </select>
      </div>
      <input
        className={`${campo} w-full`}
        placeholder="Título"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        maxLength={200}
      />
      <textarea
        className={`${campo} min-h-24 w-full`}
        placeholder="Qué pasa (p. ej. 'La PC de Andreina estará apagada hasta el lunes')"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        maxLength={20000}
      />
      {crear.isError ? <p className="text-[12px] text-[var(--pa-danger)]">{mensajeError(crear.error)}</p> : null}
      <button
        type="button"
        disabled={!titulo.trim() || !texto.trim() || crear.isPending}
        onClick={() => crear.mutate()}
        className="rounded-lg bg-[var(--pa-navy)] px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-60"
      >
        Guardar nota
      </button>
    </div>
  );
}
