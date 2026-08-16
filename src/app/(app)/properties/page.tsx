"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { propertiesService } from "@/services";
import type { Property } from "@/services/interfaces/properties";
import { ChannelChips } from "@/components/ChannelChips";
import { CompletenessBar } from "@/components/CompletenessBar";
import { CoverImage } from "@/components/CoverImage";
import { FilterDropdown } from "@/components/FilterDropdown";
import {
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
  PropertyListSkeleton,
  PropertySearchInput,
  ViewToggle,
} from "@/components/properties/PropertyListUi";

const FILTER_TYPES = ["Todos", "Apartamento", "Casa", "Local", "Lote", "Oficina", "Finca"];
const FILTER_ESTADOS = ["Todos", "Incompleto", "Casi listo", "Completo"];

type FilterKey = "tipo" | "municipio" | "estado" | "precio" | "propietario";

export default function PropertiesPage() {
  const { session, token } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"table" | "cards">("table");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("Todos");
  const [municipioFilter, setMunicipioFilter] = useState("Todos");
  const [estadoFilter, setEstadoFilter] = useState("Todos");
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: "", max: "" });
  const [propietarioFilter, setPropietarioFilter] = useState("Todos");
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const [shortcutFaltanDatos, setShortcutFaltanDatos] = useState(false);
  const [shortcutErrorCanales, setShortcutErrorCanales] = useState(false);

  const isAdmin = session?.role === "admin";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["properties"],
    queryFn: () => propertiesService.list(token ?? undefined),
  });

  const municipioOptions = useMemo(
    () => buildMunicipioOptions((data ?? []).map((p) => p.municipio)),
    [data],
  );

  const propietarioOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of data ?? []) {
      if (!p.ownerAgenteId) continue;
      map.set(
        p.ownerAgenteId,
        p.ownerAgenteNombre ?? `Agente ${p.ownerAgenteId}`,
      );
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [data]);

  const showPropietarioFilter = isAdmin && propietarioOptions.length > 1;

  const filtered = useMemo(() => {
    const municipioKey =
      municipioFilter === "Todos" ? null : municipioFilter;
    return (data ?? []).filter((p) => {
      if (tipoFilter !== "Todos" && p.tipo !== tipoFilter) return false;
      if (!propertyMatchesMunicipio(p.municipio, municipioKey)) return false;
      if (estadoFilter === "Incompleto" && p.completeness >= 70) return false;
      if (estadoFilter === "Casi listo" && (p.completeness < 70 || p.completeness >= 100))
        return false;
      if (estadoFilter === "Completo" && p.completeness < 100) return false;
      if (!matchesPriceRange(p.precio, priceRange)) return false;
      if (
        propietarioFilter !== "Todos" &&
        p.ownerAgenteId !== propietarioFilter
      ) {
        return false;
      }
      if (shortcutFaltanDatos && p.completeness >= 100) return false;
      if (
        shortcutErrorCanales &&
        !p.channels.some((c) => c.status === "error")
      ) {
        return false;
      }
      return matchesPropertySearch(p, search);
    });
  }, [
    data,
    search,
    tipoFilter,
    municipioFilter,
    estadoFilter,
    priceRange,
    propietarioFilter,
    shortcutFaltanDatos,
    shortcutErrorCanales,
  ]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => propertiesService.delete(id, token ?? undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
    onSettled: () => setDeletingId(null),
  });

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

  const onDelete = (p: Property) => {
    const ok = window.confirm(
      `¿Eliminar «${p.titulo}»? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;
    setDeletingId(p.id);
    deleteMutation.mutate(p.id);
  };

  const onCreate = () => createMutation.mutate();

  return (
    <div className="px-6 py-8 md:px-10 md:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold text-[var(--pa-ink)]">
            Inventario
          </h1>
          <p className="mt-1 text-[13px] text-[var(--pa-muted)]">
            {isLoading
              ? "Cargando inventario…"
              : `${filtered.length} de ${data?.length ?? 0} inmuebles · datos y completitud`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onCreate}
            disabled={createMutation.isPending}
            className="rounded-[10px] bg-[var(--pa-navy)] px-4 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {createMutation.isPending ? "Creando…" : "Nueva propiedad"}
          </button>
          <ViewToggle view={view} onView={setView} />
        </div>
      </div>

      <div className="mb-4">
        <PropertySearchInput value={search} onChange={setSearch} />
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShortcutFaltanDatos((v) => !v)}
          className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
            shortcutFaltanDatos
              ? "bg-[var(--pa-navy)] text-white"
              : "border border-[var(--pa-border)] bg-[var(--pa-surface)] text-[#45525E] hover:border-[var(--pa-navy)]"
          }`}
        >
          Faltan datos
        </button>
        <button
          type="button"
          onClick={() => setShortcutErrorCanales((v) => !v)}
          className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
            shortcutErrorCanales
              ? "bg-[var(--pa-danger)] text-white"
              : "border border-[var(--pa-border)] bg-[var(--pa-surface)] text-[#45525E] hover:border-[var(--pa-danger)]"
          }`}
        >
          Error en canales
        </button>
      </div>
      <div className="mb-6 flex flex-wrap gap-2.5">
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
          options={FILTER_ESTADOS.map((v) => ({ value: v, label: v }))}
          selected={estadoFilter}
          onSelect={setEstadoFilter}
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
        {showPropietarioFilter && (
          <FilterDropdown
            label={`Propietario${
              propietarioFilter !== "Todos"
                ? `: ${propietarioOptions.find((o) => o.id === propietarioFilter)?.label ?? ""}`
                : ""
            }`}
            active={propietarioFilter !== "Todos"}
            open={openFilter === "propietario"}
            onToggle={() =>
              setOpenFilter((f) => (f === "propietario" ? null : "propietario"))
            }
            onClose={() => setOpenFilter(null)}
            options={[
              { value: "Todos", label: "Todos" },
              ...propietarioOptions.map((o) => ({
                value: o.id,
                label: o.label,
              })),
            ]}
            selected={propietarioFilter}
            onSelect={setPropietarioFilter}
          />
        )}
      </div>

      {deleteMutation.isError && (
        <p className="mb-4 text-sm text-[var(--pa-danger)]">
          No se pudo eliminar la propiedad.
        </p>
      )}
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

      {data && data.length === 0 && (
        <EmptyState
          onCreate={onCreate}
          creating={createMutation.isPending}
        />
      )}

      {data && data.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-[var(--pa-muted)]">
          Ningún inmueble coincide con los filtros.
        </p>
      )}

      {filtered.length > 0 && view === "cards" && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
          {filtered.map((p) => (
            <PropertyCard
              key={p.id}
              p={p}
              onClick={() => open(p)}
              onDelete={() => onDelete(p)}
              deleting={deletingId === p.id}
            />
          ))}
        </div>
      )}

      {filtered.length > 0 && view === "table" && (
        <PropertyTable
          properties={filtered}
          onOpen={open}
          onDelete={onDelete}
          deletingId={deletingId}
        />
      )}
    </div>
  );
}

function PropertyCard({
  p,
  onClick,
  onDelete,
  deleting,
}: {
  p: Property;
  onClick: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-3.5 text-left transition-shadow hover:shadow-sm">
      <button type="button" onClick={onClick} className="text-left">
        <div className="relative mb-3.5 h-[150px] overflow-hidden rounded-xl">
          <CoverImage
            url={p.portadaUrl}
            alt={p.titulo}
            className="h-full w-full"
            placeholderClassName="h-full w-full"
          />
          <span className="absolute left-2.5 top-2.5 rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[var(--pa-ink)]">
            {p.code}
          </span>
        </div>
        <div className="mb-1 line-clamp-1 text-sm font-bold text-[var(--pa-ink)]">
          {p.titulo}
        </div>
        <div className="mb-2.5 text-xs text-[var(--pa-muted)]">
          {p.tipo} · {p.intent} · {p.municipio}
        </div>
        <div className="mb-3 text-[15px] font-extrabold text-[var(--pa-navy)]">
          {formatPrice(p.precio, p.esArriendo)}
        </div>
        <div className="mb-3">
          <CompletenessBar value={p.completeness} />
        </div>
        <ChannelChips channels={p.channels} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="mt-3 self-start text-xs font-bold text-[var(--pa-danger)] hover:underline disabled:opacity-50"
      >
        {deleting ? "Eliminando…" : "Eliminar"}
      </button>
    </div>
  );
}

function PropertyTable({
  properties,
  onOpen,
  onDelete,
  deletingId,
}: {
  properties: Property[];
  onOpen: (p: Property) => void;
  onDelete: (p: Property) => void;
  deletingId: string | null;
}) {
  const cols =
    "grid-cols-[64px_2fr_1.2fr_1fr_1.2fr_1.1fr_1.6fr_72px]";
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)]">
      <div
        className={`grid ${cols} gap-3 border-b border-[var(--pa-border)] bg-[var(--pa-bg)] px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-[var(--pa-muted)]`}
      >
        <div />
        <div>Título</div>
        <div>Tipo</div>
        <div>Precio</div>
        <div>Ubicación</div>
        <div>Completitud</div>
        <div>Canales</div>
        <div />
      </div>
      {properties.map((p) => (
        <div
          key={p.id}
          className={`grid w-full ${cols} items-center gap-3 border-b border-[var(--pa-bg-alt)] px-5 py-3 last:border-b-0 hover:bg-[var(--pa-bg)]`}
        >
          <button
            type="button"
            onClick={() => onOpen(p)}
            className="h-11 w-11 overflow-hidden rounded-lg"
            aria-label={`Abrir ${p.titulo}`}
          >
            <CoverImage
              url={p.portadaUrl}
              alt=""
              className="h-full w-full"
              placeholderClassName="h-11 w-11"
            />
          </button>
          <button type="button" onClick={() => onOpen(p)} className="min-w-0 text-left">
            <div className="line-clamp-1 text-[13px] font-bold text-[var(--pa-ink)]">
              {p.titulo}
            </div>
            <div className="text-[11px] text-[var(--pa-faint)]">{p.code}</div>
          </button>
          <button type="button" onClick={() => onOpen(p)} className="text-left text-xs text-[var(--pa-muted)]">
            {p.tipo} · {p.intent}
          </button>
          <button type="button" onClick={() => onOpen(p)} className="text-left text-[13px] font-bold text-[var(--pa-navy)]">
            {formatPrice(p.precio, p.esArriendo)}
          </button>
          <button type="button" onClick={() => onOpen(p)} className="text-left text-xs text-[var(--pa-muted)]">
            {p.municipio}
          </button>
          <button type="button" onClick={() => onOpen(p)} className="text-left">
            <CompletenessBar value={p.completeness} showLabel={false} />
            <span className="text-[11px] font-bold text-[var(--pa-muted)]">
              {p.completeness}%
            </span>
          </button>
          <button type="button" onClick={() => onOpen(p)} className="text-left">
            <ChannelChips channels={p.channels} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(p)}
            disabled={deletingId === p.id}
            className="justify-self-end text-[11px] font-bold text-[var(--pa-danger)] hover:underline disabled:opacity-50"
          >
            {deletingId === p.id ? "…" : "Eliminar"}
          </button>
        </div>
      ))}
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
        Aún no tienes inmuebles captados
      </div>
      <div className="mb-6 max-w-[340px] text-[13px] text-[var(--pa-muted)]">
        Registra tu primer inmueble para empezar a publicarlo en tus canales.
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
