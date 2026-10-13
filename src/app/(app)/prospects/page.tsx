"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Phone } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { ChannelBadge } from "@/features/clients/ChannelBadge";
import { TemperatureChip } from "@/features/clients/TemperatureChip";
import type { ClientChannel, ClientTemperature } from "@/services/interfaces/clients";
import type { Prospect, ProspectTab } from "@/services/interfaces/prospects";
import { clientsService, prospectsService } from "@/services";
import {
  formatProspectRelativeTime,
  prospectPriorityBand,
  prospectRelativeTimeStyle,
} from "@/lib/formatRelativeTime";
import { Toast } from "@/components/Toast";

const TABS: { id: ProspectTab; label: string }[] = [
  { id: "new", label: "Sin revisar" },
  { id: "contacted", label: "Contactados" },
  { id: "paused", label: "En pausa" },
  { id: "all", label: "Todos" },
];

const CHANNELS = [
  { id: "all", label: "Todos" },
  { id: "facebook", label: "FB" },
  { id: "mercadolibre", label: "ML" },
  { id: "ciencuadras", label: "CC" },
  { id: "metrocuadrado", label: "M²" },
];

const DISCARD_REASONS = [
  { id: "no_comprador", label: "No es comprador" },
  { id: "sin_presupuesto", label: "Sin presupuesto" },
  { id: "no_responde", label: "No responde" },
  { id: "spam", label: "Spam" },
  { id: "otro", label: "Otro" },
];

const BAND_META: Record<string, { title: string; border: string; headerBg: string; headerText: string }> = {
  "48": { title: "Más de 48 h", border: "#C23B2B", headerBg: "#FBE7E4", headerText: "#C23B2B" },
  "24": { title: "24–48 h", border: "#D97B2B", headerBg: "#FCEEE0", headerText: "#8A4E12" },
  fresh: { title: "Menos de 24 h", border: "#1E8E5A", headerBg: "#E6F5EE", headerText: "#1E8E5A" },
  paused: { title: "En pausa", border: "#C9D0D7", headerBg: "#F1F3F5", headerText: "#5B6B79" },
};

function digits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export default function ProspectsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ProspectTab>("new");
  const [channel, setChannel] = useState("all");
  const [search, setSearch] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [qualifyTarget, setQualifyTarget] = useState<Prospect | null>(null);
  const [discardTarget, setDiscardTarget] = useState<Prospect | null>(null);
  const [mergeTarget, setMergeTarget] = useState<Prospect | null>(null);
  const [undo, setUndo] = useState<{ id: string; label: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [temp, setTemp] = useState<ClientTemperature>("warm");
  const [presMin, setPresMin] = useState("");
  const [presMax, setPresMax] = useState("");
  const [zonas, setZonas] = useState("");
  const [tipos, setTipos] = useState("");
  const [formaPago, setFormaPago] = useState<"contado" | "credito" | "mixto">("credito");

  const { data: counts } = useQuery({
    queryKey: ["prospect-counts"],
    queryFn: () => prospectsService.counts(token ?? undefined),
    enabled: Boolean(token),
  });

  const { data: prospects = [], isLoading } = useQuery({
    queryKey: ["prospects", tab, channel, search],
    queryFn: () =>
      prospectsService.list(
        { status: tab, channel, q: search },
        token ?? undefined,
      ),
    enabled: Boolean(token),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-merge"],
    queryFn: () => clientsService.list({}, token ?? undefined),
    enabled: Boolean(token) && mergeTarget != null,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["prospects"] });
    void queryClient.invalidateQueries({ queryKey: ["prospect-counts"] });
    void queryClient.invalidateQueries({ queryKey: ["nav-counts"] });
  };

  const removeOptimistic = (id: string) => {
    queryClient.setQueryData<Prospect[]>(
      ["prospects", tab, channel, search],
      (old) => (old ?? []).filter((p) => p.id !== id),
    );
  };

  const qualifyMutation = useMutation({
    mutationFn: (p: Prospect) =>
      prospectsService.qualify(
        p.id,
        {
          temperatura: temp,
          presupuestoMin: Number(presMin),
          presupuestoMax: Number(presMax),
          zonas: zonas.split(",").map((z) => z.trim()).filter(Boolean),
          tiposInmueble: tipos.split(",").map((t) => t.trim()).filter(Boolean),
          formaPago,
        },
        token ?? undefined,
      ),
    onMutate: (p) => removeOptimistic(p.id),
    onSuccess: (_res, p) => {
      setQualifyTarget(null);
      setToast(`${p.nombre} pasó a Clientes · Calificado`);
      invalidate();
    },
    onError: () => invalidate(),
  });

  const discardMutation = useMutation({
    mutationFn: ({ p, reason }: { p: Prospect; reason: string }) =>
      prospectsService.discard(p.id, reason, token ?? undefined),
    onMutate: ({ p }) => removeOptimistic(p.id),
    onSuccess: () => {
      setDiscardTarget(null);
      invalidate();
    },
    onError: () => invalidate(),
  });

  const grouped = useMemo(() => {
    const bands: Record<string, Prospect[]> = { "48": [], "24": [], fresh: [], paused: [] };
    for (const p of prospects) {
      const key = prospectPriorityBand(p.lastInteractionAt, p.estado);
      bands[key].push(p);
    }
    return bands;
  }, [prospects]);

  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 6000);
    return () => clearTimeout(t);
  }, [undo]);

  const openQualify = (p: Prospect) => {
    setTemp("warm");
    setPresMin("");
    setPresMax("");
    setZonas(p.propertyTitle ? "" : "");
    setTipos("");
    setFormaPago("credito");
    setQualifyTarget(p);
  };

  const qualifyValid =
    presMin.trim() &&
    presMax.trim() &&
    Number(presMin) <= Number(presMax) &&
    zonas.trim() &&
    tipos.trim();

  return (
    <div className="px-6 py-8 md:px-10">
      <h1 className="text-[24px] font-extrabold text-[var(--pa-ink)]">Prospectos</h1>
      <p className="mt-1 text-[13px] text-[var(--pa-muted)]">
        Llegan automáticamente desde los portales. Califícalos para pasarlos a Clientes.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const n =
            t.id === "new"
              ? counts?.new
              : t.id === "contacted"
                ? counts?.contacted
                : t.id === "paused"
                  ? counts?.paused
                  : counts?.all;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-2 text-[13px] font-semibold ${
                tab === t.id
                  ? "bg-[var(--pa-navy)] text-white"
                  : "bg-[var(--pa-surface)] text-[var(--pa-muted)] ring-1 ring-[var(--pa-border)]"
              }`}
            >
              {t.label}
              {n != null ? ` (${n})` : ""}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-3">
        <input
          type="search"
          placeholder="Buscar por nombre, teléfono o código de inmueble"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 w-full rounded-lg border border-[var(--pa-border)] px-3 py-2 text-[13px]"
        />
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setChannel(c.id)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                channel === c.id
                  ? "bg-[#E7EEF4] text-[var(--pa-navy)]"
                  : "text-[var(--pa-muted)]"
              }`}
            >
              {c.label}
              {c.id !== "all" && counts?.byChannel[c.id]
                ? ` ${counts.byChannel[c.id]}`
                : ""}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-[var(--pa-muted)]">Cargando bandeja…</p>
      ) : prospects.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--pa-muted)]">No hay prospectos en esta vista.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {(["48", "24", "fresh", "paused"] as const).map((band) => {
            const rows = grouped[band];
            if (!rows.length) return null;
            const meta = BAND_META[band];
            return (
              <section key={band}>
                <div
                  className="rounded-t-lg px-4 py-2 text-[11px] font-bold uppercase tracking-wide"
                  style={{ background: meta.headerBg, color: meta.headerText }}
                >
                  {meta.title}
                </div>
                <div className="overflow-hidden rounded-b-lg border border-t-0 border-[var(--pa-border)]">
                  {rows.map((p) => {
                    const rel = prospectRelativeTimeStyle(p.lastInteractionAt);
                    return (
                      <div
                        key={p.id}
                        className="grid grid-cols-1 items-center gap-2 border-t border-[#EEF0F3] bg-white px-5 py-3 md:grid-cols-[1.2fr_40px_2fr_92px_186px]"
                        style={{ boxShadow: `inset 3px 0 0 ${meta.border}` }}
                      >
                        <div>
                          <div className="text-[12.5px] font-bold">{p.nombre}</div>
                          <div className="text-[11px] text-[#5B6B79]">{p.telefono}</div>
                          {p.possibleDuplicateClienteId ? (
                            <span className="mt-1 inline-block rounded bg-[#FCEEE0] px-2 py-0.5 text-[10px] font-bold text-[#8A4E12]">
                              Duplicado
                            </span>
                          ) : null}
                        </div>
                        <ChannelBadge channel={p.canal as ClientChannel} />
                        <div className="min-w-0 text-[12px] text-[var(--pa-muted)]">
                          {p.propertyCode ? (
                            <span className="mr-2 rounded bg-[#E7EEF4] px-1.5 py-0.5 font-semibold text-[var(--pa-navy)]">
                              {p.propertyCode}
                            </span>
                          ) : null}
                          <span className="truncate">{p.mensaje ?? "—"}</span>
                        </div>
                        <div>
                          <div className="text-[12px]" style={{ color: rel.color, fontWeight: rel.fontWeight }}>
                            {p.estado === "paused" && p.pausedUntil
                              ? `Hasta ${p.pausedUntil}`
                              : formatProspectRelativeTime(p.lastInteractionAt)}
                          </div>
                          <div className="text-[10.5px] text-[#9AA6B2]">{p.lastInteractionType}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:+57${digits(p.telefono)}`}
                            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-[#E4E8EC]"
                            onClick={() => {
                              void prospectsService.interaction(p.id, "call", token ?? undefined).then(invalidate);
                            }}
                          >
                            <Phone size={14} />
                          </a>
                          <a
                            href={`https://wa.me/57${digits(p.telefono)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-[#E4E8EC] text-[11px] font-bold"
                            onClick={() => {
                              void prospectsService.interaction(p.id, "whatsapp", token ?? undefined).then(invalidate);
                            }}
                          >
                            WA
                          </a>
                          <button
                            type="button"
                            className="rounded-lg bg-[var(--pa-navy)] px-3 py-1.5 text-[11px] font-bold text-white"
                            onClick={() => openQualify(p)}
                          >
                            Calificar
                          </button>
                          <button
                            type="button"
                            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-[#E4E8EC]"
                            onClick={() => setMenuId(menuId === p.id ? null : p.id)}
                          >
                            <MoreHorizontal size={14} />
                          </button>
                          {menuId === p.id ? (
                            <div className="absolute right-8 z-10 mt-24 w-56 rounded-xl border bg-white p-2 shadow-lg">
                              {[3, 7, 30].map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  className="block w-full rounded-lg px-3 py-2 text-left text-[12px] hover:bg-[#F6F7F9]"
                                  onClick={() => {
                                    void prospectsService.pause(p.id, d, token ?? undefined).then(() => {
                                      setMenuId(null);
                                      invalidate();
                                    });
                                  }}
                                >
                                  Pausar {d} días
                                </button>
                              ))}
                              {p.estado === "paused" ? (
                                <button
                                  type="button"
                                  className="block w-full rounded-lg px-3 py-2 text-left text-[12px]"
                                  onClick={() => {
                                    void prospectsService.resume(p.id, token ?? undefined).then(invalidate);
                                    setMenuId(null);
                                  }}
                                >
                                  Reanudar
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className="block w-full rounded-lg px-3 py-2 text-left text-[12px]"
                                onClick={() => {
                                  setMergeTarget(p);
                                  setMenuId(null);
                                }}
                              >
                                Marcar duplicado
                              </button>
                              <button
                                type="button"
                                className="block w-full rounded-lg px-3 py-2 text-left text-[12px] text-[var(--pa-danger)]"
                                onClick={() => {
                                  setDiscardTarget(p);
                                  setMenuId(null);
                                }}
                              >
                                Descartar
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {qualifyTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-[640px] rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-extrabold">Calificar — {qualifyTarget.nombre}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {(["hot", "warm", "cold"] as ClientTemperature[]).map((t) => (
                <TemperatureChip
                  key={t}
                  value={t}
                  active={temp === t}
                  onClick={() => setTemp(t)}
                />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <input
                placeholder="Presupuesto min (millones)"
                value={presMin}
                onChange={(e) => setPresMin(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm"
              />
              <input
                placeholder="Presupuesto max (millones)"
                value={presMax}
                onChange={(e) => setPresMax(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <input
              placeholder="Zonas (separadas por coma)"
              value={zonas}
              onChange={(e) => setZonas(e.target.value)}
              className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
            />
            <input
              placeholder="Tipos inmueble (separados por coma)"
              value={tipos}
              onChange={(e) => setTipos(e.target.value)}
              className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
            />
            <div className="mt-3 flex gap-2">
              {(["contado", "credito", "mixto"] as const).map((fp) => (
                <button
                  key={fp}
                  type="button"
                  onClick={() => setFormaPago(fp)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    formaPago === fp ? "bg-[var(--pa-navy)] text-white" : "bg-[#F1F3F5]"
                  }`}
                >
                  {fp}
                </button>
              ))}
            </div>
            {!qualifyValid ? (
              <p className="mt-3 text-[12px] font-semibold text-[#8A4E12]">
                Falta completar presupuesto, zonas y tipos de inmueble.
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setQualifyTarget(null)} className="px-4 py-2 text-sm">
                Cancelar
              </button>
              <button
                type="button"
                disabled={!qualifyValid || qualifyMutation.isPending}
                onClick={() => qualifyMutation.mutate(qualifyTarget)}
                className="rounded-lg bg-[var(--pa-navy)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Convertir en cliente
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {discardTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-[520px] rounded-2xl bg-white p-6">
            <h2 className="font-extrabold">Descartar prospecto</h2>
            <div className="mt-4 space-y-2">
              {DISCARD_REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="block w-full rounded-lg border px-3 py-2 text-left text-sm hover:bg-[#F6F7F9]"
                  onClick={() => discardMutation.mutate({ p: discardTarget, reason: r.id })}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button type="button" className="mt-4 text-sm" onClick={() => setDiscardTarget(null)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {mergeTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-[520px] rounded-2xl bg-white p-6">
            <h2 className="font-extrabold">Unir con cliente existente</h2>
            <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {clients.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="w-full rounded-lg border px-3 py-2 text-left text-sm hover:bg-[#F6F7F9]"
                    onClick={() => {
                      removeOptimistic(mergeTarget.id);
                      void prospectsService
                        .merge(mergeTarget.id, c.id, token ?? undefined)
                        .then(() => {
                          setMergeTarget(null);
                          invalidate();
                        });
                    }}
                  >
                    {c.nombre} · {c.telefono}
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="mt-4 text-sm" onClick={() => setMergeTarget(null)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {undo ? (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl bg-[#16212B] px-5 py-3 text-sm text-white shadow-lg">
          <span>{undo.label}</span>
          <button
            type="button"
            className="font-bold text-[#7FE3B8]"
            onClick={() => {
              void prospectsService.undo(undo.id, token ?? undefined).then(() => {
                setUndo(null);
                invalidate();
              });
            }}
          >
            Deshacer
          </button>
        </div>
      ) : null}

      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </div>
  );
}
