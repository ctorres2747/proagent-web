"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { CAPTACION_NATIVE, CAPTACION_URL } from "@/config/env";
import { canAccessCaptacion } from "@/lib/agentDisplay";
import { formatPrice } from "@/lib/format";
import { fichasService, leadsService } from "@/services";
import type { Lead, LeadEstado } from "@/services/interfaces/leads";

const COLUMNS: LeadEstado[] = [
  "Pendiente",
  "En contacto",
  "Captado",
  "Descartado",
];

const ESTADO_OPTIONS: LeadEstado[] = [
  "Pendiente",
  "En contacto",
  "Captado",
  "Descartado",
];

function columnCount(leads: Lead[], estado: LeadEstado): number {
  return leads.filter((l) => l.estado === estado).length;
}

export default function CaptacionPage() {
  const { session, token } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const staff = canAccessCaptacion(session);

  useEffect(() => {
    if (!staff) {
      router.replace("/");
    }
  }, [staff, router]);

  const {
    data: leads,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["leads"],
    queryFn: () => leadsService.list(token ?? undefined),
    enabled: staff && CAPTACION_NATIVE,
  });

  const selected = useMemo(
    () => leads?.find((l) => l.id === selectedId) ?? null,
    [leads, selectedId],
  );

  const [draft, setDraft] = useState({
    estado: "Pendiente" as LeadEstado,
    telefono: "",
    nombrePublicador: "",
    notas: "",
    fechaRecontacto: "",
  });

  useEffect(() => {
    if (!selected) return;
    setDraft({
      estado: selected.estado,
      telefono: selected.telefono ?? "",
      nombrePublicador: selected.nombrePublicador ?? "",
      notas: selected.notas ?? "",
      fechaRecontacto: selected.fechaRecontacto?.slice(0, 10) ?? "",
    });
    setSaveError(null);
    setPublishError(null);
  }, [selected]);

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof leadsService.update>[1]) =>
      leadsService.update(selectedId!, payload, token ?? undefined),
    onSuccess: (updated) => {
      queryClient.setQueryData<Lead[]>(["leads"], (prev) =>
        prev?.map((l) => (l.id === updated.id ? updated : l)),
      );
      setSaveError(null);
    },
    onError: (err) => {
      setSaveError(
        err instanceof Error ? err.message : "No se pudo guardar el lead.",
      );
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => fichasService.createFromLead(selectedId!, token ?? undefined),
    onSuccess: (ficha) => {
      router.push(`/properties/${ficha.id}`);
    },
    onError: (err) => {
      setPublishError(
        err instanceof Error ? err.message : "No se pudo crear la ficha.",
      );
    },
  });

  if (!staff) {
    return null;
  }

  if (!CAPTACION_NATIVE) {
    return (
      <div className="px-6 py-10 md:px-10">
        <h1 className="text-[26px] font-extrabold text-[var(--pa-ink)]">
          Captación
        </h1>
        <p className="mt-2 max-w-xl text-[13px] text-[var(--pa-muted)]">
          La captación nativa en ProAgent Web está desactivada en este entorno.
          Usa el Kanban interno mientras el Owner activa el cutover.
        </p>
        <a
          href={CAPTACION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex rounded-[10px] bg-[var(--pa-navy)] px-5 py-2.5 text-[13px] font-bold text-white hover:opacity-90"
        >
          Abrir Kanban interno
        </a>
      </div>
    );
  }

  const handleSave = () => {
    if (!selectedId) return;
    updateMutation.mutate({
      estado: draft.estado,
      telefono: draft.telefono || null,
      nombrePublicador: draft.nombrePublicador || null,
      notas: draft.notas || null,
      fechaRecontacto: draft.fechaRecontacto || null,
    });
  };

  const canPublish =
    selected?.estado === "Captado" &&
    Boolean(draft.telefono.trim()) &&
    Boolean(draft.nombrePublicador.trim());

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col px-4 py-6 md:px-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-extrabold text-[var(--pa-ink)]">
            Captación
          </h1>
          <p className="mt-1 text-[13px] text-[var(--pa-muted)]">
            Leads de portales — seguimiento interno Proinversores.
          </p>
        </div>
        <p className="text-[12px] text-[var(--pa-faint)]">
          {leads?.length ?? 0} leads activos
        </p>
      </div>

      {isLoading && (
        <p className="text-sm text-[var(--pa-muted)]">Cargando leads…</p>
      )}

      {isError && (
        <div className="rounded-2xl border border-[var(--pa-danger)]/30 bg-[#FCEAEA] px-5 py-4 text-sm text-[var(--pa-danger)]">
          {error instanceof Error
            ? error.message
            : "No se pudieron cargar los leads."}
        </div>
      )}

      {!isLoading && !isError && (
        <div className="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row">
          <div className="grid min-h-[420px] flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((estado) => (
              <section
                key={estado}
                className="flex min-h-[320px] flex-col rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)]"
              >
                <header className="flex items-center justify-between border-b border-[var(--pa-border)] px-3 py-2.5">
                  <h2 className="text-[13px] font-bold text-[var(--pa-ink)]">
                    {estado}
                  </h2>
                  <span className="rounded-full bg-[var(--pa-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--pa-muted)]">
                    {columnCount(leads ?? [], estado)}
                  </span>
                </header>
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
                  {(leads ?? [])
                    .filter((l) => l.estado === estado)
                    .map((lead) => {
                      const active = lead.id === selectedId;
                      return (
                        <button
                          key={lead.id}
                          type="button"
                          onClick={() => setSelectedId(lead.id)}
                          className={`rounded-xl border p-3 text-left transition-colors ${
                            active
                              ? "border-[var(--pa-navy)] bg-[#E7EEF4]"
                              : "border-[var(--pa-border)] bg-[var(--pa-bg)] hover:border-[var(--pa-navy)]/40"
                          }`}
                        >
                          {lead.imagenUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={lead.imagenUrl}
                              alt=""
                              className="mb-2 h-20 w-full rounded-lg object-cover"
                            />
                          ) : (
                            <div className="mb-2 flex h-20 items-center justify-center rounded-lg bg-[var(--pa-bg-alt)] text-[11px] text-[var(--pa-faint)]">
                              Sin foto
                            </div>
                          )}
                          <p className="text-[12px] font-bold text-[var(--pa-ink)]">
                            {lead.tipoInmueble ?? "Inmueble"}
                            {lead.municipio ? ` · ${lead.municipio}` : ""}
                          </p>
                          <p className="mt-0.5 text-[12px] font-semibold text-[var(--pa-navy)]">
                            {lead.precio ??
                              formatPrice(lead.precioNum, (lead.precioNum ?? 0) < 5_000_000)}
                          </p>
                          <p className="mt-1 text-[11px] text-[var(--pa-muted)]">
                            {lead.portal}
                          </p>
                        </button>
                      );
                    })}
                  {columnCount(leads ?? [], estado) === 0 && (
                    <p className="px-2 py-6 text-center text-[12px] text-[var(--pa-faint)]">
                      Sin leads
                    </p>
                  )}
                </div>
              </section>
            ))}
          </div>

          <aside className="w-full shrink-0 rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] xl:w-[360px]">
            {!selected ? (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-6 py-10 text-center">
                <p className="text-[14px] font-bold text-[var(--pa-ink)]">
                  Selecciona un lead
                </p>
                <p className="mt-2 text-[13px] text-[var(--pa-muted)]">
                  Elige una tarjeta para ver teléfono, notas y cambiar estado.
                </p>
              </div>
            ) : (
              <div className="flex flex-col p-4">
                <div className="mb-4 border-b border-[var(--pa-border)] pb-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--pa-faint)]">
                    {selected.portal} · #{selected.id}
                  </p>
                  <h3 className="mt-1 text-[17px] font-extrabold text-[var(--pa-ink)]">
                    {selected.tipoInmueble ?? "Inmueble"}
                    {selected.municipio ? ` en ${selected.municipio}` : ""}
                  </h3>
                  <p className="mt-1 text-[14px] font-bold text-[var(--pa-navy)]">
                    {selected.precio ??
                      formatPrice(
                        selected.precioNum,
                        (selected.precioNum ?? 0) < 5_000_000,
                      )}
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
                    {selected.areaM2 ? (
                      <>
                        <dt className="text-[var(--pa-muted)]">Área</dt>
                        <dd>{selected.areaM2} m²</dd>
                      </>
                    ) : null}
                    {selected.habitaciones ? (
                      <>
                        <dt className="text-[var(--pa-muted)]">Habitaciones</dt>
                        <dd>{selected.habitaciones}</dd>
                      </>
                    ) : null}
                    {selected.banos ? (
                      <>
                        <dt className="text-[var(--pa-muted)]">Baños</dt>
                        <dd>{selected.banos}</dd>
                      </>
                    ) : null}
                  </dl>
                  {selected.linkPublicacion &&
                  !selected.linkPublicacion.startsWith("manual-") ? (
                    <a
                      href={selected.linkPublicacion}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-[12px] font-semibold text-[var(--pa-navy)] underline"
                    >
                      Ver publicación original
                    </a>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
                      Estado
                    </span>
                    <select
                      value={draft.estado}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          estado: e.target.value as LeadEstado,
                        }))
                      }
                      className="w-full rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 py-2 text-[13px]"
                    >
                      {ESTADO_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
                      Teléfono propietario
                    </span>
                    <input
                      type="tel"
                      value={draft.telefono}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, telefono: e.target.value }))
                      }
                      className="w-full rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 py-2 text-[13px]"
                      placeholder="300 123 4567"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
                      Nombre propietario
                    </span>
                    <input
                      type="text"
                      value={draft.nombrePublicador}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          nombrePublicador: e.target.value,
                        }))
                      }
                      className="w-full rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 py-2 text-[13px]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
                      Fecha recontacto
                    </span>
                    <input
                      type="date"
                      value={draft.fechaRecontacto}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          fechaRecontacto: e.target.value,
                        }))
                      }
                      className="w-full rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 py-2 text-[13px]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
                      Notas
                    </span>
                    <textarea
                      value={draft.notas}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, notas: e.target.value }))
                      }
                      rows={3}
                      className="w-full resize-y rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 py-2 text-[13px]"
                    />
                  </label>
                </div>

                {saveError ? (
                  <p className="mt-3 text-[12px] text-[var(--pa-danger)]">
                    {saveError}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="rounded-[10px] border border-[var(--pa-navy)] bg-[var(--pa-surface)] px-4 py-2.5 text-[13px] font-bold text-[var(--pa-navy)] hover:bg-[var(--pa-bg)] disabled:opacity-60"
                  >
                    {updateMutation.isPending ? "Guardando…" : "Guardar cambios"}
                  </button>

                  {draft.telefono.trim() ? (
                    <a
                      href={`https://wa.me/57${draft.telefono.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-[10px] border border-[var(--pa-border)] px-4 py-2.5 text-center text-[13px] font-semibold text-[var(--pa-accent)] hover:bg-[var(--pa-bg)]"
                    >
                      WhatsApp
                    </a>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => publishMutation.mutate()}
                    disabled={!canPublish || publishMutation.isPending}
                    title={
                      selected.estado !== "Captado"
                        ? "Disponible al pasar a Captado"
                        : undefined
                    }
                    className="rounded-[10px] bg-[var(--pa-navy)] px-4 py-2.5 text-[13px] font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {publishMutation.isPending
                      ? "Creando ficha…"
                      : "Publicar inmueble"}
                  </button>
                  {!canPublish && selected.estado !== "Captado" ? (
                    <p className="text-center text-[11px] text-[var(--pa-muted)]">
                      Disponible al pasar a Captado (con nombre y teléfono).
                    </p>
                  ) : null}
                  {publishError ? (
                    <p className="text-[12px] text-[var(--pa-danger)]">
                      {publishError}
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {!isLoading && !isError && (leads?.length ?? 0) === 0 && (
        <div className="mt-4 rounded-2xl border border-dashed border-[var(--pa-border)] bg-[var(--pa-surface)] px-8 py-12 text-center">
          <p className="text-[15px] font-bold text-[var(--pa-ink)]">
            Sin leads en el tablero
          </p>
          <p className="mt-2 text-[13px] text-[var(--pa-muted)]">
            Los scrapers siguen alimentando la misma base de datos del Kanban
            HTML.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-[13px] font-semibold text-[var(--pa-navy)]"
          >
            Volver al inicio
          </Link>
        </div>
      )}
    </div>
  );
}
