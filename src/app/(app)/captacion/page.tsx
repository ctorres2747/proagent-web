"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { CAPTACION_NATIVE, CAPTACION_URL } from "@/config/env";
import { CaptacionDetailDrawer } from "@/features/captacion/CaptacionDetailDrawer";
import { LeadCard } from "@/features/captacion/LeadCard";
import { ScraperStatusBar } from "@/features/captacion/ScraperStatusBar";
import { canAccessCaptacion } from "@/lib/agentDisplay";
import { captacionSubtitle } from "@/lib/captacionSubtitle";
import { FilterDropdown } from "@/components/FilterDropdown";
import {
  isPriceRangeActive,
  matchesPriceRange,
  PriceRangeFilter,
  type PriceRange,
} from "@/components/PriceRangeFilter";
import { Toast } from "@/components/Toast";
import { fichasService, leadsService, scraperService } from "@/services";
import type { Lead, LeadEstado } from "@/services/interfaces/leads";

const COLUMNS: LeadEstado[] = [
  "Pendiente",
  "En contacto",
  "Captado",
  "Descartado",
];

type FilterKey = "municipio" | "tipo" | "portal" | "estado" | "precio";

function columnCount(leads: Lead[], estado: LeadEstado): number {
  return leads.filter((l) => l.estado === estado).length;
}

function matchesOwnerSearch(lead: Lead, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const tel = (lead.telefono ?? "").replace(/\D/g, "");
  const name = (lead.nombrePublicador ?? "").toLowerCase();
  const qDigits = q.replace(/\D/g, "");
  return name.includes(q) || (qDigits.length > 0 && tel.includes(qDigits));
}

function KpiCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-[var(--pa-border)] bg-[var(--pa-surface)] px-4 py-3">
      <p className="text-[22px] font-extrabold text-[var(--pa-ink)]">{value}</p>
      <p className="text-[11px] font-semibold text-[var(--pa-muted)]">{label}</p>
    </div>
  );
}

export default function CaptacionPage() {
  const { session, token } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: "error" } | null>(
    null,
  );

  const [municipioFilter, setMunicipioFilter] = useState("Todos");
  const [tipoFilter, setTipoFilter] = useState("Todos");
  const [portalFilter, setPortalFilter] = useState("Todos");
  const [estadoFilter, setEstadoFilter] = useState("Todos");
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: "", max: "" });
  const [ownerSearch, setOwnerSearch] = useState("");
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);

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

  const { data: scraperStatus } = useQuery({
    queryKey: ["scraper-status"],
    queryFn: () => scraperService.status(token ?? undefined),
    enabled: staff && CAPTACION_NATIVE,
    refetchInterval: (q) =>
      q.state.data?.running || q.state.data?.queueStatus ? 5000 : 60000,
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

  const municipios = useMemo(
    () =>
      [...new Set((leads ?? []).map((l) => l.municipio).filter(Boolean) as string[])].sort(),
    [leads],
  );
  const tipos = useMemo(
    () =>
      [...new Set((leads ?? []).map((l) => l.tipoInmueble).filter(Boolean) as string[])].sort(),
    [leads],
  );
  const portales = useMemo(
    () => [...new Set((leads ?? []).map((l) => l.portal))].sort(),
    [leads],
  );

  const filteredLeads = useMemo(() => {
    return (leads ?? []).filter((lead) => {
      if (municipioFilter !== "Todos" && lead.municipio !== municipioFilter) {
        return false;
      }
      if (tipoFilter !== "Todos" && lead.tipoInmueble !== tipoFilter) {
        return false;
      }
      if (portalFilter !== "Todos" && lead.portal !== portalFilter) {
        return false;
      }
      if (estadoFilter !== "Todos" && lead.estado !== estadoFilter) {
        return false;
      }
      if (!matchesPriceRange(lead.precioNum, priceRange)) return false;
      if (!matchesOwnerSearch(lead, ownerSearch)) return false;
      return true;
    });
  }, [
    leads,
    municipioFilter,
    tipoFilter,
    portalFilter,
    estadoFilter,
    priceRange,
    ownerSearch,
  ]);

  const hasActiveFilters =
    municipioFilter !== "Todos" ||
    tipoFilter !== "Todos" ||
    portalFilter !== "Todos" ||
    estadoFilter !== "Todos" ||
    isPriceRangeActive(priceRange) ||
    ownerSearch.trim().length > 0;

  const clearFilters = () => {
    setMunicipioFilter("Todos");
    setTipoFilter("Todos");
    setPortalFilter("Todos");
    setEstadoFilter("Todos");
    setPriceRange({ min: "", max: "" });
    setOwnerSearch("");
    setOpenFilter(null);
  };

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof leadsService.update>[1]) =>
      leadsService.update(selectedId!, payload, token ?? undefined),
    onSuccess: (updated, variables) => {
      queryClient.setQueryData<Lead[]>(["leads"], (prev) =>
        prev?.map((l) => (l.id === updated.id ? updated : l)),
      );
      setSaveError(null);
      if (variables.estado && selected && variables.estado !== selected.estado) {
        setToast({ message: `Lead movido a "${variables.estado}"` });
      }
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

  const dismissToast = useCallback(() => setToast(null), []);

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

  const stats = scraperStatus?.stats ?? {};
  const totalKpi = stats.total ?? leads?.length ?? 0;
  const hoyKpi = stats.hoy ?? 0;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col px-6 py-8 md:px-10 md:py-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-extrabold text-[var(--pa-ink)]">
            Captación
          </h1>
          <p className="mt-1 text-[13px] text-[var(--pa-muted)]">
            {captacionSubtitle(session)}
          </p>
        </div>
        <p className="text-[12px] text-[var(--pa-faint)]">
          {filteredLeads.length} de {leads?.length ?? 0} leads
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard value={totalKpi} label="Total leads" />
        <KpiCard value={hoyKpi} label="Nuevos hoy" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Municipio"
          active={municipioFilter !== "Todos"}
          open={openFilter === "municipio"}
          onToggle={() =>
            setOpenFilter((k) => (k === "municipio" ? null : "municipio"))
          }
          onClose={() => setOpenFilter(null)}
          options={[
            { value: "Todos", label: "Todos" },
            ...municipios.map((m) => ({ value: m, label: m })),
          ]}
          selected={municipioFilter}
          onSelect={setMunicipioFilter}
        />
        <FilterDropdown
          label="Tipo"
          active={tipoFilter !== "Todos"}
          open={openFilter === "tipo"}
          onToggle={() => setOpenFilter((k) => (k === "tipo" ? null : "tipo"))}
          onClose={() => setOpenFilter(null)}
          options={[
            { value: "Todos", label: "Todos" },
            ...tipos.map((t) => ({ value: t, label: t })),
          ]}
          selected={tipoFilter}
          onSelect={setTipoFilter}
        />
        <FilterDropdown
          label="Portal"
          active={portalFilter !== "Todos"}
          open={openFilter === "portal"}
          onToggle={() =>
            setOpenFilter((k) => (k === "portal" ? null : "portal"))
          }
          onClose={() => setOpenFilter(null)}
          options={[
            { value: "Todos", label: "Todos" },
            ...portales.map((p) => ({ value: p, label: p })),
          ]}
          selected={portalFilter}
          onSelect={setPortalFilter}
        />
        <FilterDropdown
          label="Estado"
          active={estadoFilter !== "Todos"}
          open={openFilter === "estado"}
          onToggle={() =>
            setOpenFilter((k) => (k === "estado" ? null : "estado"))
          }
          onClose={() => setOpenFilter(null)}
          options={[
            { value: "Todos", label: "Todos" },
            ...COLUMNS.map((e) => ({ value: e, label: e })),
          ]}
          selected={estadoFilter}
          onSelect={setEstadoFilter}
        />
        <PriceRangeFilter
          range={priceRange}
          onChange={setPriceRange}
          open={openFilter === "precio"}
          onToggle={() =>
            setOpenFilter((k) => (k === "precio" ? null : "precio"))
          }
          onClose={() => setOpenFilter(null)}
        />
        <input
          type="search"
          value={ownerSearch}
          onChange={(e) => setOwnerSearch(e.target.value)}
          placeholder="Propietario / teléfono"
          className="min-w-[160px] rounded-full border border-[var(--pa-border)] bg-[var(--pa-surface)] px-4 py-2 text-[13px] font-semibold text-[#45525E] placeholder:font-normal placeholder:text-[var(--pa-faint)]"
        />
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="text-[13px] font-semibold text-[var(--pa-navy)] underline"
          >
            Limpiar filtros
          </button>
        ) : null}
      </div>

      {scraperStatus ? <ScraperStatusBar status={scraperStatus} /> : null}

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
        <div className="min-h-0 flex-1">
          <div className="grid min-h-[420px] min-w-0 grid-cols-4 gap-3">
            {COLUMNS.map((estado) => (
              <section
                key={estado}
                className="flex min-h-[320px] min-w-0 flex-col rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)]"
              >
                <header className="flex items-center justify-between border-b border-[var(--pa-border)] px-2.5 py-2">
                  <h2 className="text-[12px] font-bold text-[var(--pa-ink)]">
                    {estado}
                  </h2>
                  <span className="rounded-full bg-[var(--pa-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--pa-muted)]">
                    {columnCount(filteredLeads, estado)}
                  </span>
                </header>
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
                  {filteredLeads
                    .filter((l) => l.estado === estado)
                    .map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        active={lead.id === selectedId}
                        onClick={() => setSelectedId(lead.id)}
                      />
                    ))}
                  {columnCount(filteredLeads, estado) === 0 && (
                    <p className="px-2 py-6 text-center text-[12px] text-[var(--pa-faint)]">
                      Sin leads
                    </p>
                  )}
                </div>
              </section>
            ))}
          </div>
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

      {selected ? (
        <CaptacionDetailDrawer
          lead={selected}
          draft={draft}
          onDraftChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          onClose={() => setSelectedId(null)}
          onSave={handleSave}
          onPublish={() => publishMutation.mutate()}
          savePending={updateMutation.isPending}
          publishPending={publishMutation.isPending}
          saveError={saveError}
          publishError={publishError}
          canPublish={canPublish}
        />
      ) : null}

      {toast ? (
        <Toast message={toast.message} type={toast.type} onClose={dismissToast} />
      ) : null}
    </div>
  );
}
