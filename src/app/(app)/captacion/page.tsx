"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useAgentView } from "@/features/agentView/AgentViewProvider";
import { useAuth } from "@/features/auth/AuthProvider";
import { CAPTACION_NATIVE, CAPTACION_URL } from "@/config/env";
import { CaptacionDetailDrawer } from "@/features/captacion/CaptacionDetailDrawer";
import { CriteriosCaptacionPanel } from "@/features/captacion/CriteriosCaptacionPanel";
import { LeadCard } from "@/features/captacion/LeadCard";
import { NewLeadModal } from "@/features/captacion/NewLeadModal";
import { ScraperStatusBar } from "@/features/captacion/ScraperStatusBar";
import { canAccessCaptacion } from "@/lib/agentDisplay";
import { captacionSubtitle } from "@/lib/captacionSubtitle";
import { buildMunicipioOptions, leadMatchesMunicipio } from "@/lib/municipio";
import { buildTipoFilterOptions, leadMatchesTipo } from "@/lib/tipoInmueble";
import { FilterDropdown } from "@/components/FilterDropdown";
import {
  DateRangeFilter,
  isDateRangeActive,
  matchesDateRange,
  type DateRange,
} from "@/components/DateRangeFilter";
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

type FilterKey = "municipio" | "tipo" | "portal" | "estado" | "precio" | "fecha";

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
  const { viewAgenteId, agentesList } = useAgentView();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [estadoBlocked, setEstadoBlocked] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: "error" } | null>(
    null,
  );

  const [municipioFilter, setMunicipioFilter] = useState("Todos");
  const [tipoFilter, setTipoFilter] = useState("Todos");
  const [portalFilter, setPortalFilter] = useState("Todos");
  const [estadoFilter, setEstadoFilter] = useState("Todos");
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: "", max: "" });
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });
  const [ownerSearch, setOwnerSearch] = useState("");
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const [criteriosOpen, setCriteriosOpen] = useState(false);
  const [newLeadOpen, setNewLeadOpen] = useState(false);

  const staff = canAccessCaptacion(session);
  const isAdmin = session?.role === "admin";

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

  const runScraperMutation = useMutation({
    mutationFn: () =>
      scraperService.run(
        { agenteId: viewAgenteId ? Number(viewAgenteId) : undefined },
        token ?? undefined,
      ),
    onSuccess: (result) => {
      setToast({ message: result.message });
      queryClient.invalidateQueries({ queryKey: ["scraper-status"] });
    },
    onError: (err) => {
      setToast({
        message: err instanceof Error ? err.message : "No se pudo iniciar el scraper.",
        type: "error",
      });
    },
  });

  const selected = useMemo(
    () => leads?.find((l) => l.id === selectedId) ?? null,
    [leads, selectedId],
  );

  const [draft, setDraft] = useState({
    estado: "Pendiente" as LeadEstado,
    telefono: "",
    nombrePublicador: "",
    barrio: "",
    notas: "",
    fechaRecontacto: "",
  });

  useEffect(() => {
    if (!selected) return;
    setDraft({
      estado: selected.estado,
      telefono: selected.telefono ?? "",
      nombrePublicador: selected.nombrePublicador ?? "",
      barrio: selected.barrio ?? "",
      notas: selected.notas ?? "",
      fechaRecontacto: selected.fechaRecontacto?.slice(0, 10) ?? "",
    });
    setSaveError(null);
    setPublishError(null);
    setEstadoBlocked(false);
  }, [selected]);

  const municipioOptions = useMemo(
    () =>
      buildMunicipioOptions(
        (leads ?? [])
          .map((l) => l.municipio)
          .filter((m): m is string => Boolean(m)),
      ),
    [leads],
  );
  const tipos = useMemo(
    () => buildTipoFilterOptions((leads ?? []).map((l) => l.tipoInmueble)),
    [leads],
  );
  const portales = useMemo(
    () => [...new Set((leads ?? []).map((l) => l.portal))].sort(),
    [leads],
  );

  const filteredLeads = useMemo(() => {
    return (leads ?? []).filter((lead) => {
      if (
        !leadMatchesMunicipio(
          lead.municipio ?? "",
          municipioFilter === "Todos" ? null : municipioFilter,
        )
      ) {
        return false;
      }
      if (tipoFilter !== "Todos" && !leadMatchesTipo(lead.tipoInmueble, tipoFilter)) {
        return false;
      }
      if (portalFilter !== "Todos" && lead.portal !== portalFilter) {
        return false;
      }
      if (estadoFilter !== "Todos" && lead.estado !== estadoFilter) {
        return false;
      }
      if (viewAgenteId && lead.ownerAgenteId !== Number(viewAgenteId)) {
        return false;
      }
      if (!matchesPriceRange(lead.precioNum, priceRange)) return false;
      if (!matchesDateRange(lead.fechaCaptura, dateRange)) return false;
      if (!matchesOwnerSearch(lead, ownerSearch)) return false;
      return true;
    });
  }, [
    leads,
    municipioFilter,
    tipoFilter,
    portalFilter,
    estadoFilter,
    viewAgenteId,
    priceRange,
    dateRange,
    ownerSearch,
  ]);

  const hasActiveFilters =
    municipioFilter !== "Todos" ||
    tipoFilter !== "Todos" ||
    portalFilter !== "Todos" ||
    estadoFilter !== "Todos" ||
    isPriceRangeActive(priceRange) ||
    isDateRangeActive(dateRange) ||
    ownerSearch.trim().length > 0;

  const clearFilters = () => {
    setMunicipioFilter("Todos");
    setTipoFilter("Todos");
    setPortalFilter("Todos");
    setEstadoFilter("Todos");
    setPriceRange({ min: "", max: "" });
    setDateRange({ from: "", to: "" });
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
    setEstadoBlocked(false);
    updateMutation.mutate({
      estado: draft.estado,
      telefono: draft.telefono || null,
      nombrePublicador: draft.nombrePublicador || null,
      barrio: draft.barrio || null,
      notas: draft.notas || null,
      fechaRecontacto: draft.fechaRecontacto || null,
    });
  };

  // Cambiar el estado desde el selector mueve la tarjeta al instante, sin
  // esperar a "Guardar cambios" — mismo criterio que el Kanban HTML (PR #74).
  // Única excepción: pasar a Captado exige nombre + teléfono ya cargados (el
  // backend rechaza el cambio si el lead quedara sin contacto); si faltan,
  // se deja el estado elegido en el draft pero no se guarda todavía — el
  // asesor completa el contacto y usa "Guardar cambios" para captar.
  const handleEstadoChange = (nuevoEstado: LeadEstado) => {
    if (!selectedId) return;
    setDraft((d) => ({ ...d, estado: nuevoEstado }));
    if (nuevoEstado === "Captado") {
      const tieneContacto =
        Boolean(draft.telefono.trim()) && Boolean(draft.nombrePublicador.trim());
      if (!tieneContacto) {
        setEstadoBlocked(true);
        return;
      }
      setEstadoBlocked(false);
      updateMutation.mutate({
        estado: nuevoEstado,
        telefono: draft.telefono,
        nombrePublicador: draft.nombrePublicador,
      });
      return;
    }
    setEstadoBlocked(false);
    updateMutation.mutate({ estado: nuevoEstado });
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
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setNewLeadOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-[var(--pa-navy)] px-4 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
          >
            <Plus size={14} strokeWidth={2.4} aria-hidden />
            Nuevo lead
          </button>
          <button
            type="button"
            onClick={() => setCriteriosOpen(true)}
            className="rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-surface)] px-4 py-2 text-[13px] font-semibold text-[var(--pa-navy)] hover:bg-[var(--pa-bg)]"
          >
            Mis criterios de captación
          </button>
          <p className="text-[12px] text-[var(--pa-faint)]">
            {filteredLeads.length} de {leads?.length ?? 0} leads
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-[#E4E8EC] bg-[var(--pa-surface)] p-3">
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard value={totalKpi} label="Total leads" />
          <KpiCard value={hoyKpi} label="Nuevos hoy" />
        </div>
        <div className="mb-3 flex w-full items-center gap-2 rounded-[9px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 py-2.5 focus-within:border-[var(--pa-navy)]">
          <Search
            size={15}
            strokeWidth={2.1}
            className="shrink-0 text-[var(--pa-text-muted)]"
            aria-hidden
          />
          <input
            type="search"
            value={ownerSearch}
            onChange={(e) => setOwnerSearch(e.target.value)}
            placeholder="Propietario / teléfono"
            className="w-full bg-transparent text-[13px] text-[var(--pa-ink)] outline-none placeholder:text-[var(--pa-text-muted)]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          label={`Municipio${
            municipioFilter !== "Todos"
              ? `: ${municipioOptions.find((m) => m.key === municipioFilter)?.label ?? municipioFilter}`
              : ""
          }`}
          active={municipioFilter !== "Todos"}
          open={openFilter === "municipio"}
          onToggle={() =>
            setOpenFilter((k) => (k === "municipio" ? null : "municipio"))
          }
          onClose={() => setOpenFilter(null)}
          options={[
            { value: "Todos", label: "Todos" },
            ...municipioOptions.map((m) => ({ value: m.key, label: m.label })),
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
        <DateRangeFilter
          range={dateRange}
          onChange={setDateRange}
          open={openFilter === "fecha"}
          onToggle={() =>
            setOpenFilter((k) => (k === "fecha" ? null : "fecha"))
          }
          onClose={() => setOpenFilter(null)}
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
      </div>

      {isAdmin ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => runScraperMutation.mutate()}
            disabled={
              runScraperMutation.isPending ||
              Boolean(scraperStatus?.running) ||
              Boolean(scraperStatus?.queueStatus)
            }
            title={
              viewAgenteId
                ? 'Corre el scraper SOLO para la zona del asesor elegido en "Viendo como"'
                : 'Corre el scraper para todas las zonas combinadas'
            }
            className="rounded-[10px] bg-[var(--pa-navy)] px-4 py-2 text-[13px] font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {runScraperMutation.isPending ||
            scraperStatus?.running ||
            scraperStatus?.queueStatus
              ? "⏳ Scrapeando…"
              : viewAgenteId
                ? `▶ Ejecutar scraper (${
                    agentesList.find((a) => String(a.id) === viewAgenteId)
                      ?.nombrePreferido ?? "asesor"
                  })`
                : "▶ Ejecutar scraper"}
          </button>
        </div>
      ) : null}

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
          onEstadoChange={handleEstadoChange}
          estadoBlockedMessage={
            estadoBlocked
              ? "Para captar el lead completa el nombre y el teléfono del propietario."
              : null
          }
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

      {criteriosOpen ? (
        <CriteriosCaptacionPanel
          session={session}
          token={token ?? undefined}
          onClose={() => setCriteriosOpen(false)}
          onSaved={() =>
            setToast({ message: "Criterios de captación guardados" })
          }
          onError={(message) => setToast({ message, type: "error" })}
        />
      ) : null}

      {newLeadOpen ? (
        <NewLeadModal
          token={token ?? undefined}
          onClose={() => setNewLeadOpen(false)}
          onCreated={(leadId) => {
            void queryClient.invalidateQueries({ queryKey: ["leads"] });
            void queryClient.invalidateQueries({ queryKey: ["nav-counts"] });
            setSelectedId(leadId);
            setToast({ message: "Lead creado" });
          }}
        />
      ) : null}

      {toast ? (
        <Toast message={toast.message} type={toast.type} onClose={dismissToast} />
      ) : null}
    </div>
  );
}
