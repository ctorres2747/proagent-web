"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useAgentView } from "@/features/agentView/AgentViewProvider";
import { useAuth } from "@/features/auth/AuthProvider";
import { propertiesService, publicationsService, channelsService } from "@/services";
import type { ChannelId } from "@/design-system/channels";
import type { Property } from "@/services/interfaces/properties";
import type { Publication } from "@/services/interfaces/publications";
import { PublicationChannelIndicators } from "@/components/PublicationChannelIndicators";
import { CoverImage } from "@/components/CoverImage";
import { FilterDropdown } from "@/components/FilterDropdown";
import {
  PaginationBar,
  PropertyListSkeleton,
  PropertySearchInput,
  ViewToggle,
} from "@/components/properties/PropertyListUi";
import { PAGE_SIZE_OPTIONS, usePagination } from "@/hooks/usePagination";
import {
  isPriceRangeActive,
  matchesPriceRange,
  PriceRangeFilter,
  type PriceRange,
} from "@/components/PriceRangeFilter";
import { formatPrice } from "@/lib/format";
import {
  buildMunicipioOptions,
  propertyMatchesMunicipio,
} from "@/lib/municipio";
import { matchesPropertySearch } from "@/lib/propertySearch";
import {
  indexPublicationsByProperty,
  matchesPublicationShortcuts,
  matchesPublicationStageFilter,
  PUBLICATION_FILTER_OPTIONS,
  publicationStage,
  publicationTitle,
  PUBLICATION_STAGE_CLASS,
  PUBLICATION_STAGE_SORT_ORDER,
  stageLabel,
  type PublicationFilterLabel,
} from "@/lib/publicationDisplay";
import { formatScheduledFor } from "@/lib/schedule";

const FILTER_TYPES = [
  "Todos",
  "Apartamento",
  "Casa",
  "Local",
  "Lote",
  "Oficina",
  "Finca",
];

type FilterKey = "tipo" | "municipio" | "estado" | "precio";

export default function PublicationsPage() {
  const { token } = useAuth();
  const { viewAgenteId } = useAgentView();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"table" | "cards">("table");
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("Todos");
  const [municipioFilter, setMunicipioFilter] = useState("Todos");
  const [estadoFilter, setEstadoFilter] = useState<PublicationFilterLabel>(
    "Todos",
  );
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: "", max: "" });
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const [shortcutSinPublicar, setShortcutSinPublicar] = useState(false);
  const [shortcutError, setShortcutError] = useState(false);
  const [shortcutProgramadas, setShortcutProgramadas] = useState(false);

  const { data: properties, isLoading, isError } = useQuery({
    queryKey: ["properties"],
    queryFn: () => propertiesService.list(token ?? undefined),
  });

  const { data: publications } = useQuery({
    queryKey: ["publications", "all"],
    queryFn: () => publicationsService.list("all", token ?? undefined),
  });

  const { data: channelConnections } = useQuery({
    queryKey: ["channel-connections"],
    queryFn: () => channelsService.list(token ?? undefined),
  });

  // Bug real (review 2026-08-29): `channelConnections ?? []` convertía
  // "todavía cargando" (o el query fallido) en "cero canales conectados" —
  // indistinguible de un asesor sin canales reales. Como
  // resolveDisplayChannels solo usa el fallback de "todos los motores"
  // cuando el valor es exactamente `undefined`, un `[]` de carga hacía que
  // TODA la lista mostrara "Sin publicar" un instante (o para siempre si
  // la query fallaba), sin importar el estado real de cada publicación.
  const connectedChannelIds = useMemo(
    () =>
      channelConnections === undefined
        ? undefined
        : channelConnections
            .filter((c) => c.status === "connected")
            .map((c) => c.channelId as ChannelId),
    [channelConnections],
  );

  const pubByPropertyId = useMemo(
    () => indexPublicationsByProperty(publications ?? []),
    [publications],
  );

  const municipioOptions = useMemo(
    () => buildMunicipioOptions((properties ?? []).map((p) => p.municipio)),
    [properties],
  );

  const filtered = useMemo(() => {
    const municipioKey =
      municipioFilter === "Todos" ? null : municipioFilter;
    return (properties ?? []).filter((p) => {
      const pub = pubByPropertyId.get(p.id);
      const stage = publicationStage(pub, connectedChannelIds);

      if (tipoFilter !== "Todos" && p.tipo !== tipoFilter) return false;
      if (!propertyMatchesMunicipio(p.municipio, municipioKey)) return false;
      if (!matchesPublicationStageFilter(stage, estadoFilter)) return false;
      if (
        !matchesPublicationShortcuts(stage, {
          sinPublicar: shortcutSinPublicar,
          programadas: shortcutProgramadas,
          conError: shortcutError,
        })
      ) {
        return false;
      }
      if (!matchesPriceRange(p.precio, priceRange)) return false;
      if (viewAgenteId && p.ownerAgenteId !== viewAgenteId) return false;
      return matchesPropertySearch(p, search);
    });
  }, [
    properties,
    pubByPropertyId,
    search,
    tipoFilter,
    municipioFilter,
    estadoFilter,
    priceRange,
    viewAgenteId,
    shortcutSinPublicar,
    shortcutError,
    shortcutProgramadas,
    connectedChannelIds,
  ]);

  // Menor completitud primero — son las que más urge completar.
  // Primero lo que hay que trabajar (borrador, sin publicar), luego lo que
  // necesita atención (error/parcial), programadas, y publicadas al final.
  // Dentro de una misma etapa, menor completitud primero.
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const stageA = publicationStage(
        pubByPropertyId.get(a.id),
        connectedChannelIds,
      );
      const stageB = publicationStage(
        pubByPropertyId.get(b.id),
        connectedChannelIds,
      );
      const stageDiff =
        PUBLICATION_STAGE_SORT_ORDER[stageA] - PUBLICATION_STAGE_SORT_ORDER[stageB];
      if (stageDiff !== 0) return stageDiff;
      return a.completeness - b.completeness;
    });
  }, [filtered, pubByPropertyId, connectedChannelIds]);

  const { page, setPage, totalPages, pageSize, setPageSize, offset } =
    usePagination(sorted.length, "proagent.publications.pageSize");
  const pageItems = useMemo(
    () => sorted.slice(offset, offset + pageSize),
    [sorted, offset, pageSize],
  );

  const hasActiveFilters =
    tipoFilter !== "Todos" ||
    municipioFilter !== "Todos" ||
    estadoFilter !== "Todos" ||
    isPriceRangeActive(priceRange) ||
    search.trim().length > 0 ||
    shortcutSinPublicar ||
    shortcutError ||
    shortcutProgramadas;

  const clearFilters = () => {
    setTipoFilter("Todos");
    setMunicipioFilter("Todos");
    setEstadoFilter("Todos");
    setPriceRange({ min: "", max: "" });
    setSearch("");
    setShortcutSinPublicar(false);
    setShortcutError(false);
    setShortcutProgramadas(false);
    setOpenFilter(null);
  };

  const createMutation = useMutation({
    mutationFn: () =>
      propertiesService.create(
        { titulo: "Nueva propiedad", municipio: "Medellín" },
        token ?? undefined,
      ),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ["properties"] });
      router.push(`/properties/${created.id}`);
    },
  });

  const open = (p: Property) => router.push(`/properties/${p.id}`);

  return (
    <div className="px-6 py-8 md:px-10 md:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold text-[var(--pa-ink)]">
            Publicación
          </h1>
          <p className="mt-1 text-[13px] text-[var(--pa-muted)]">
            {isLoading
              ? "Cargando propiedades…"
              : `${filtered.length} de ${properties?.length ?? 0} inmuebles · estado por canal`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-[var(--pa-navy)] px-4 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Plus size={14} strokeWidth={2.4} aria-hidden />
            {createMutation.isPending ? "Creando…" : "Nueva propiedad"}
          </button>
          <ViewToggle view={view} onView={setView} />
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-[#E4E8EC] bg-[var(--pa-surface)] p-3">
        <div className="mb-3">
          <PropertySearchInput value={search} onChange={setSearch} />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => setShortcutSinPublicar((v) => !v)}
          className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
            shortcutSinPublicar
              ? "bg-[var(--pa-navy)] text-white"
              : "border border-[var(--pa-border)] bg-[var(--pa-surface)] text-[#45525E] hover:border-[var(--pa-navy)]"
          }`}
        >
          Sin publicar
        </button>
        <button
          type="button"
          onClick={() => setShortcutProgramadas((v) => !v)}
          className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
            shortcutProgramadas
              ? "bg-[#B45309] text-white"
              : "border border-[var(--pa-border)] bg-[var(--pa-surface)] text-[#45525E] hover:border-[#B45309]"
          }`}
        >
          Programadas
        </button>
        <button
          type="button"
          onClick={() => setShortcutError((v) => !v)}
          className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
            shortcutError
              ? "bg-[var(--pa-danger)] text-white"
              : "border border-[var(--pa-border)] bg-[var(--pa-surface)] text-[#45525E] hover:border-[var(--pa-danger)]"
          }`}
        >
          Con error
        </button>
        <FilterDropdown
          label={`Tipo${tipoFilter !== "Todos" ? `: ${tipoFilter}` : ""}`}
          active={tipoFilter !== "Todos"}
          open={openFilter === "tipo"}
          onToggle={() =>
            setOpenFilter((f) => (f === "tipo" ? null : "tipo"))
          }
          onClose={() => setOpenFilter(null)}
          options={FILTER_TYPES.map((v) => ({ value: v, label: v }))}
          selected={tipoFilter}
          onSelect={setTipoFilter}
        />
        <FilterDropdown
          label={`Municipio${
            municipioFilter !== "Todos"
              ? `: ${municipioOptions.find((m) => m.key === municipioFilter)?.label ?? municipioFilter}`
              : ""
          }`}
          active={municipioFilter !== "Todos"}
          open={openFilter === "municipio"}
          onToggle={() =>
            setOpenFilter((f) => (f === "municipio" ? null : "municipio"))
          }
          onClose={() => setOpenFilter(null)}
          options={[
            { value: "Todos", label: "Todos" },
            ...municipioOptions.map((m) => ({
              value: m.key,
              label: m.label,
            })),
          ]}
          selected={municipioFilter}
          onSelect={setMunicipioFilter}
        />
        <FilterDropdown
          label={`Estado${estadoFilter !== "Todos" ? `: ${estadoFilter}` : ""}`}
          active={estadoFilter !== "Todos"}
          open={openFilter === "estado"}
          onToggle={() =>
            setOpenFilter((f) => (f === "estado" ? null : "estado"))
          }
          onClose={() => setOpenFilter(null)}
          options={PUBLICATION_FILTER_OPTIONS.map((o) => ({
            value: o.value,
            label: o.label,
          }))}
          selected={estadoFilter}
          onSelect={(v) => setEstadoFilter(v as PublicationFilterLabel)}
        />
        <PriceRangeFilter
          range={priceRange}
          onChange={setPriceRange}
          open={openFilter === "precio"}
          onToggle={() =>
            setOpenFilter((f) => (f === "precio" ? null : "precio"))
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

      {createMutation.isError && (
        <p className="mb-4 text-sm text-[var(--pa-danger)]">
          No se pudo crear la propiedad.
        </p>
      )}

      {isLoading && <PropertyListSkeleton />}
      {isError && (
        <p className="text-sm text-[var(--pa-danger)]">
          No se pudieron cargar las propiedades.
        </p>
      )}

      {properties && properties.length === 0 && (
        <EmptyState
          onCreate={() => createMutation.mutate()}
          creating={createMutation.isPending}
        />
      )}

      {properties && properties.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-[var(--pa-muted)]">
          Ningún inmueble coincide con los filtros.
        </p>
      )}

      {filtered.length > 0 && view === "cards" && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
          {pageItems.map((p) => (
            <PublicationCard
              key={p.id}
              property={p}
              publication={pubByPropertyId.get(p.id)}
              connectedChannelIds={connectedChannelIds}
              onClick={() => open(p)}
            />
          ))}
        </div>
      )}

      {filtered.length > 0 && view === "table" && (
        <PublicationTable
          properties={pageItems}
          startIndex={offset}
          pubByPropertyId={pubByPropertyId}
          connectedChannelIds={connectedChannelIds}
          onOpen={open}
        />
      )}

      {filtered.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--pa-border)]">
          <PaginationBar
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            total={filtered.length}
          />
        </div>
      )}
    </div>
  );
}

function PublicationStatusBadge({
  publication,
  connectedChannelIds,
}: {
  publication?: Publication;
  connectedChannelIds?: ChannelId[];
}) {
  const stage = publicationStage(publication, connectedChannelIds);
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold ${PUBLICATION_STAGE_CLASS[stage]}`}
    >
      {stageLabel(stage)}
    </span>
  );
}

function PublicationCard({
  property,
  publication,
  connectedChannelIds,
  onClick,
}: {
  property: Property;
  publication?: Publication;
  connectedChannelIds?: ChannelId[];
  onClick: () => void;
}) {
  const stage = publicationStage(publication, connectedChannelIds);
  const title = publicationTitle(property, publication);

  return (
    <div className="flex flex-col rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-3.5 text-left transition-shadow hover:shadow-sm">
      <button type="button" onClick={onClick} className="text-left">
        <div className="relative mb-3.5 h-[150px] overflow-hidden rounded-xl">
          <CoverImage
            url={property.portadaUrl}
            alt={title}
            className="h-full w-full"
            placeholderClassName="h-full w-full"
          />
          <span className="absolute left-2.5 top-2.5 rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[var(--pa-ink)]">
            {property.code}
          </span>
          <span className="absolute right-2.5 top-2.5">
            <PublicationStatusBadge
              publication={publication}
              connectedChannelIds={connectedChannelIds}
            />
          </span>
        </div>
        <div className="mb-1 line-clamp-1 text-sm font-bold text-[var(--pa-ink)]">
          {title}
        </div>
        <div className="mb-2.5 text-xs text-[var(--pa-muted)]">
          {property.tipo} · {property.municipio}
          {property.nombreContacto ? ` · ${property.nombreContacto}` : ""}
        </div>
        <div className="mb-3 text-[15px] font-extrabold text-[var(--pa-navy)]">
          {formatPrice(property.precio, property.esArriendo)}
        </div>
        {stage === "scheduled" && publication?.scheduledFor ? (
          <div className="mb-3 text-[11px] font-semibold text-[#B45309]">
            {formatScheduledFor(
              publication.scheduledFor,
              publication.timezone,
            )}
          </div>
        ) : null}
        <PublicationChannelIndicators
          publication={publication}
          connectedChannelIds={connectedChannelIds}
        />
      </button>
    </div>
  );
}

function PublicationTable({
  properties,
  startIndex = 0,
  pubByPropertyId,
  connectedChannelIds,
  onOpen,
}: {
  properties: Property[];
  startIndex?: number;
  pubByPropertyId: Map<string, Publication>;
  connectedChannelIds?: ChannelId[];
  onOpen: (p: Property) => void;
}) {
  const cols =
    "grid-cols-[36px_64px_2fr_1fr_1fr_1.1fr_2fr]";
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)]">
      <div
        className={`grid ${cols} gap-3 border-b border-[var(--pa-border)] bg-[var(--pa-bg)] px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-[var(--pa-muted)]`}
      >
        <div>#</div>
        <div />
        <div>Título</div>
        <div>Tipo</div>
        <div>Precio</div>
        <div>Estado</div>
        <div>Canales</div>
      </div>
      {properties.map((p, index) => {
        const pub = pubByPropertyId.get(p.id);
        const title = publicationTitle(p, pub);
        return (
          <div
            key={p.id}
            className={`grid w-full ${cols} items-center gap-3 border-b border-[var(--pa-bg-alt)] px-5 py-3 last:border-b-0 hover:bg-[var(--pa-bg)]`}
          >
            <div className="text-[12px] font-bold tabular-nums text-[var(--pa-faint)]">
              {startIndex + index + 1}
            </div>
            <button
              type="button"
              onClick={() => onOpen(p)}
              className="h-11 w-11 overflow-hidden rounded-lg"
              aria-label={`Abrir ${title}`}
            >
              <CoverImage
                url={p.portadaUrl}
                alt=""
                className="h-full w-full"
                placeholderClassName="h-11 w-11"
              />
            </button>
            <button
              type="button"
              onClick={() => onOpen(p)}
              className="min-w-0 text-left"
            >
              <div className="line-clamp-1 text-[13px] font-bold text-[var(--pa-ink)]">
                {title}
              </div>
              <div className="text-[11px] text-[var(--pa-faint)]">{p.code}</div>
            </button>
            <button
              type="button"
              onClick={() => onOpen(p)}
              className="text-left text-xs text-[var(--pa-muted)]"
            >
              {p.tipo}
            </button>
            <button
              type="button"
              onClick={() => onOpen(p)}
              className="text-left text-[13px] font-bold text-[var(--pa-navy)]"
            >
              {formatPrice(p.precio, p.esArriendo)}
            </button>
            <button type="button" onClick={() => onOpen(p)} className="text-left">
              <PublicationStatusBadge
                publication={pub}
                connectedChannelIds={connectedChannelIds}
              />
            </button>
            <button type="button" onClick={() => onOpen(p)} className="text-left">
              <PublicationChannelIndicators
                publication={pub}
                connectedChannelIds={connectedChannelIds}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({
  onCreate,
  creating,
}: {
  onCreate: () => void;
  creating?: boolean;
}) {
  return (
    <div className="flex flex-col items-center rounded-[20px] border border-dashed border-[#D7DCE1] bg-[var(--pa-surface)] px-10 py-20 text-center">
      <div className="mb-5 h-16 w-16 rounded-2xl bg-[var(--pa-bg-alt)]" />
      <div className="mb-2 text-[17px] font-extrabold text-[var(--pa-ink)]">
        Aún no tienes propiedades para publicar
      </div>
      <div className="mb-6 max-w-[340px] text-[13px] text-[var(--pa-muted)]">
        Crea una propiedad y publícala en tus canales. Aparecerá también en
        Inventario.
      </div>
      <button
        type="button"
        onClick={onCreate}
        disabled={creating}
        className="rounded-[10px] bg-[var(--pa-navy)] px-5 py-3 text-[13px] font-bold text-white disabled:opacity-50"
      >
        {creating ? "Creando…" : "Registrar el primero"}
      </button>
    </div>
  );
}
