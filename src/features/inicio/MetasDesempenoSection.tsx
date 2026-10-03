"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { agentesService, metasService } from "@/services";
import type { MetaMes } from "@/services/interfaces/metas";
import { MESES_ABBR } from "./kpiMath";

function emptyYear(): MetaMes[] {
  return Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    captadas: 0,
    publicadas: 0,
    leads: 0,
    conversionPct: 0,
  }));
}

function mergeMetas(existing: MetaMes[]): MetaMes[] {
  const base = emptyYear();
  for (const row of existing) {
    const idx = row.mes - 1;
    if (idx >= 0 && idx < 12) base[idx] = { ...row };
  }
  return base;
}

export function MetasDesempenoSection({
  token,
  onFeedback,
}: {
  token?: string;
  onFeedback?: (message: string, type?: "error") => void;
}) {
  const { session } = useAuth();
  const qc = useQueryClient();
  const isAdmin = session?.role === "admin";
  const currentYear = new Date().getFullYear();

  const [anio, setAnio] = useState(currentYear);
  const [agenteId, setAgenteId] = useState<number | undefined>(
    session?.id ? Number(session.id) : undefined,
  );

  const { data: agentes } = useQuery({
    queryKey: ["agentes-list"],
    queryFn: () => agentesService.list(token),
    enabled: isAdmin && Boolean(token),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["metas", anio, agenteId, token],
    queryFn: () => metasService.get(anio, agenteId, token),
    enabled: Boolean(token) && (isAdmin ? agenteId != null : true),
  });

  const [rows, setRows] = useState<MetaMes[]>(emptyYear());
  const [touchedMeses, setTouchedMeses] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    if (data) {
      setRows(mergeMetas(data.meses));
      setTouchedMeses(new Set());
    }
  }, [data]);

  const markTouched = (mes: number) => {
    setTouchedMeses((prev) => new Set(prev).add(mes));
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const persisted = new Set((data?.meses ?? []).map((m) => m.mes));
      const mesesToSave = rows.filter(
        (row) => touchedMeses.has(row.mes) || persisted.has(row.mes),
      );
      if (!mesesToSave.length) {
        throw new Error("No hay cambios para guardar.");
      }
      return metasService.put({ anio, agenteId, meses: mesesToSave }, token);
    },
    onSuccess: () => {
      setTouchedMeses(new Set());
      qc.invalidateQueries({ queryKey: ["metas"] });
      qc.invalidateQueries({ queryKey: ["dashboard-desempeno"] });
      onFeedback?.("Metas guardadas");
    },
    onError: (err) => {
      onFeedback?.(
        err instanceof Error ? err.message : "No se pudieron guardar las metas",
        "error",
      );
    },
  });

  const agentOptions = useMemo(() => agentes ?? [], [agentes]);

  useEffect(() => {
    if (isAdmin && agentOptions.length && agenteId == null) {
      setAgenteId(agentOptions[0].id);
    }
  }, [isAdmin, agentOptions, agenteId]);

  if (!token) return null;

  return (
    <section className="mt-10 border-t border-[var(--pa-border)] pt-8">
      <h2 className="text-[15px] font-extrabold text-[var(--pa-ink)]">Metas de desempeño</h2>
      {!isAdmin ? (
        <p className="mt-1 text-[12.5px] text-[var(--pa-muted)]">
          Las metas las define coordinación. Aquí puedes consultarlas en solo lectura.
        </p>
      ) : (
        <p className="mt-1 text-[12.5px] text-[var(--pa-muted)]">
          Define metas mensuales por asesor. Se reflejan en el panel de Inicio.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {isAdmin ? (
          <label className="flex flex-col gap-1 text-[12px] font-semibold text-[var(--pa-muted)]">
            Asesor
            <select
              value={agenteId ?? ""}
              onChange={(e) => setAgenteId(Number(e.target.value))}
              className="rounded-lg border border-[var(--pa-border)] bg-white px-3 py-2 text-[13px] font-normal text-[var(--pa-ink)]"
            >
              {agentOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombrePreferido ?? a.nombre ?? `Agente ${a.id}`}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-[var(--pa-muted)]">
          Año
          <select
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            disabled={!isAdmin}
            className="rounded-lg border border-[var(--pa-border)] bg-white px-3 py-2 text-[13px] font-normal text-[var(--pa-ink)] disabled:opacity-70"
          >
            {[currentYear, currentYear - 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <p className="mt-4 text-[13px] text-[var(--pa-muted)]">Cargando metas…</p>
      ) : isError ? (
        <p className="mt-4 text-[13px] text-[var(--pa-danger)]">No se pudieron cargar las metas.</p>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[12px]">
              <thead>
                <tr className="text-left text-[var(--pa-muted)]">
                  <th className="pb-2 pr-2 font-semibold">Mes</th>
                  <th className="pb-2 px-2 font-semibold">Captadas</th>
                  <th className="pb-2 px-2 font-semibold">Publicadas</th>
                  <th className="pb-2 px-2 font-semibold">Leads</th>
                  <th className="pb-2 pl-2 font-semibold">Conv. %</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.mes} className="border-t border-[var(--pa-border)]">
                    <td className="py-2 pr-2 font-bold capitalize">{MESES_ABBR[row.mes - 1]}</td>
                    {(["captadas", "publicadas", "leads"] as const).map((field) => (
                      <td key={field} className="px-2 py-2">
                        <input
                          type="number"
                          min={0}
                          readOnly={!isAdmin}
                          value={row[field]}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            markTouched(row.mes);
                            setRows((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], [field]: Number.isFinite(v) ? v : 0 };
                              return next;
                            });
                          }}
                          className="w-full rounded border border-[var(--pa-border)] px-2 py-1 read-only:bg-[var(--pa-bg)]"
                        />
                      </td>
                    ))}
                    <td className="py-2 pl-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        readOnly={!isAdmin}
                        value={row.conversionPct}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          markTouched(row.mes);
                          setRows((prev) => {
                            const next = [...prev];
                            next[idx] = {
                              ...next[idx],
                              conversionPct: Number.isFinite(v) ? v : 0,
                            };
                            return next;
                          });
                        }}
                        className="w-full rounded border border-[var(--pa-border)] px-2 py-1 read-only:bg-[var(--pa-bg)]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isAdmin ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  const template = rows[0];
                  setRows((prev) =>
                    prev.map((r) => ({
                      ...r,
                      captadas: template.captadas,
                      publicadas: template.publicadas,
                      leads: template.leads,
                      conversionPct: template.conversionPct,
                    })),
                  );
                  setTouchedMeses(new Set(rows.map((r) => r.mes)));
                }}
                className="rounded-lg border border-[var(--pa-border)] px-3 py-2 text-[12px] font-bold text-[var(--pa-navy)]"
              >
                Mismas metas todo el año
              </button>
              <button
                type="button"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
                className="rounded-lg bg-[var(--pa-navy)] px-4 py-2 text-[12px] font-bold text-white disabled:opacity-50"
              >
                {saveMutation.isPending ? "Guardando…" : "Guardar metas"}
              </button>
              {saveMutation.isError ? (
                <span className="self-center text-[12px] text-[var(--pa-danger)]">
                  Error al guardar
                </span>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
