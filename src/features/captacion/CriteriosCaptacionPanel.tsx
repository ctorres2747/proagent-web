"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AgentSession } from "@/features/auth/types";
import type { ParqueaderoPreferencia } from "@/services/interfaces/criterios";
import { criteriosService } from "@/services";

const TIPOS = ["Casa", "Apartamento"] as const;

interface FormState {
  precioMin: string;
  precioMax: string;
  metrajeMin: string;
  metrajeMax: string;
  tipoInmueble: string[];
  parqueadero: "" | ParqueaderoPreferencia;
}

function toForm(
  data: Awaited<ReturnType<typeof criteriosService.get>>,
): FormState {
  return {
    precioMin: data.precioMin != null ? String(data.precioMin) : "",
    precioMax: data.precioMax != null ? String(data.precioMax) : "",
    metrajeMin: data.metrajeMin != null ? String(data.metrajeMin) : "",
    metrajeMax: data.metrajeMax != null ? String(data.metrajeMax) : "",
    tipoInmueble: data.tipoInmueble ?? [],
    parqueadero: data.parqueadero ?? "",
  };
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function CriteriosCaptacionPanel({
  session,
  token,
  onClose,
  onSaved,
  onError,
}: {
  session: AgentSession | null;
  token?: string;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const municipiosLabel =
    session?.role === "admin"
      ? "Vista combinada (admin)"
      : session?.municipios && session.municipios.length > 0
        ? session.municipios.join(", ")
        : "Sin zona asignada";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["criterios-captacion"],
    queryFn: () => criteriosService.get(token),
  });

  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    if (data) setForm(toForm(data));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      criteriosService.update(
        {
          precioMin: parseOptionalNumber(form?.precioMin ?? ""),
          precioMax: parseOptionalNumber(form?.precioMax ?? ""),
          metrajeMin: parseOptionalNumber(form?.metrajeMin ?? ""),
          metrajeMax: parseOptionalNumber(form?.metrajeMax ?? ""),
          tipoInmueble: form?.tipoInmueble ?? [],
          parqueadero: form?.parqueadero || null,
        },
        token,
      ),
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (err) => {
      onError(
        err instanceof Error ? err.message : "No se pudieron guardar los criterios.",
      );
    },
  });

  const toggleTipo = (tipo: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const has = prev.tipoInmueble.includes(tipo);
      return {
        ...prev,
        tipoInmueble: has
          ? prev.tipoInmueble.filter((t) => t !== tipo)
          : [...prev.tipoInmueble, tipo],
      };
    });
  };

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar criterios"
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-l border-[var(--pa-border)] bg-[var(--pa-surface)] shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--pa-border)] px-4 py-3">
          <p className="text-[15px] font-bold text-[var(--pa-ink)]">
            Mis criterios de captación
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-[18px] leading-none text-[var(--pa-muted)] hover:bg-[var(--pa-bg)]"
          >
            ×
          </button>
        </header>

        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          {isLoading || !form ? (
            <p className="text-sm text-[var(--pa-muted)]">Cargando criterios…</p>
          ) : isError ? (
            <p className="text-sm text-[var(--pa-danger)]">
              No se pudieron cargar los criterios.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-[12px] font-semibold text-[var(--pa-muted)]">
                  Zona (municipios)
                </p>
                <p className="mt-1 text-[13px] text-[var(--pa-ink)]">
                  {municipiosLabel}
                </p>
                <p className="mt-1 text-[11px] text-[var(--pa-faint)]">
                  La zona la asigna un administrador — no se edita desde acá.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
                    Precio mín. (COP)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={5_000_000}
                    value={form.precioMin}
                    onChange={(e) =>
                      setForm((f) => f && { ...f, precioMin: e.target.value })
                    }
                    placeholder="Sin mínimo"
                    className="w-full rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 py-2 text-[13px]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
                    Precio máx. (COP)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={5_000_000}
                    value={form.precioMax}
                    onChange={(e) =>
                      setForm((f) => f && { ...f, precioMax: e.target.value })
                    }
                    placeholder="Sin máximo"
                    className="w-full rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 py-2 text-[13px]"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
                    Metraje mín. (m²)
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={form.metrajeMin}
                    onChange={(e) =>
                      setForm((f) => f && { ...f, metrajeMin: e.target.value })
                    }
                    placeholder="Sin mínimo"
                    className="w-full rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 py-2 text-[13px]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
                    Metraje máx. (m²)
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={form.metrajeMax}
                    onChange={(e) =>
                      setForm((f) => f && { ...f, metrajeMax: e.target.value })
                    }
                    placeholder="Sin máximo"
                    className="w-full rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 py-2 text-[13px]"
                  />
                </label>
              </div>

              <div>
                <p className="mb-2 text-[12px] font-semibold text-[var(--pa-muted)]">
                  Tipo de inmueble
                </p>
                <div className="flex flex-wrap gap-4">
                  {TIPOS.map((tipo) => (
                    <label
                      key={tipo}
                      className="flex cursor-pointer items-center gap-2 text-[13px]"
                    >
                      <input
                        type="checkbox"
                        checked={form.tipoInmueble.includes(tipo)}
                        onChange={() => toggleTipo(tipo)}
                        className="h-4 w-4 accent-[var(--pa-navy)]"
                      />
                      {tipo}
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-[var(--pa-faint)]">
                  Sin ninguno marcado = cualquier tipo.
                </p>
              </div>

              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
                  Parqueadero
                </span>
                <select
                  value={form.parqueadero}
                  onChange={(e) =>
                    setForm(
                      (f) =>
                        f && {
                          ...f,
                          parqueadero: e.target.value as FormState["parqueadero"],
                        },
                    )
                  }
                  className="w-full rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 py-2 text-[13px]"
                >
                  <option value="">Sin preferencia</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                  <option value="indiferente">Indiferente</option>
                </select>
                <p className="mt-1 text-[11px] text-[var(--pa-faint)]">
                  Solo informativo — no descarta publicaciones automáticamente.
                </p>
              </label>
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-[var(--pa-border)] p-4">
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || isLoading || !form}
            className="w-full rounded-[10px] bg-[var(--pa-navy)] px-4 py-2.5 text-[13px] font-bold text-white hover:opacity-90 disabled:opacity-60"
          >
            {saveMutation.isPending ? "Guardando…" : "Guardar criterios"}
          </button>
        </footer>
      </aside>
    </>
  );
}
