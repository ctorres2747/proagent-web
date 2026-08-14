"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { propertiesService } from "@/services";
import type { Property } from "@/services/interfaces/properties";
import { ChannelChips } from "@/components/ChannelChips";
import { CompletenessBar } from "@/components/CompletenessBar";
import { formatPrice } from "@/lib/format";

const FILTER_TYPES = ["Todos", "Apartamento", "Casa", "Local", "Lote", "Oficina", "Finca"];
const FILTER_ESTADOS = ["Todos", "Incompleto", "Casi listo", "Completo"];

export default function PropertiesPage() {
  const { token } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"table" | "cards">("table");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("Todos");
  const [ciudadFilter, setCiudadFilter] = useState("Todos");
  const [estadoFilter, setEstadoFilter] = useState("Todos");
  const [openFilter, setOpenFilter] = useState<"tipo" | "ciudad" | "estado" | null>(
    null,
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["properties"],
    queryFn: () => propertiesService.list(token ?? undefined),
  });

  const ciudades = useMemo(() => {
    const set = new Set((data ?? []).map((p) => p.municipio).filter(Boolean));
    return ["Todos", ...Array.from(set).sort()];
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((p) => {
      if (tipoFilter !== "Todos" && p.tipo !== tipoFilter) return false;
      if (ciudadFilter !== "Todos" && p.municipio !== ciudadFilter) return false;
      if (estadoFilter === "Incompleto" && p.completeness >= 70) return false;
      if (estadoFilter === "Casi listo" && (p.completeness < 70 || p.completeness >= 100))
        return false;
      if (estadoFilter === "Completo" && p.completeness < 100) return false;
      if (!q) return true;
      return (
        p.titulo.toLowerCase().includes(q) ||
        p.municipio.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.barrio?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [data, search, tipoFilter, ciudadFilter, estadoFilter]);

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
            Propiedades
          </h1>
          <p className="mt-1 text-[13px] text-[var(--pa-muted)]">
            {isLoading
              ? "Cargando inventario…"
              : `${filtered.length} de ${data?.length ?? 0} inmuebles`}
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
          <div className="flex rounded-[10px] bg-[var(--pa-bg-alt)] p-[3px]">
            <SegBtn active={view === "cards"} onClick={() => setView("cards")}>
              Tarjetas
            </SegBtn>
            <SegBtn active={view === "table"} onClick={() => setView("table")}>
              Tabla
            </SegBtn>
          </div>
        </div>
      </div>

      {/* Search + filter chips */}
      <div className="mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título, municipio o código…"
          className="w-full max-w-md rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-surface)] px-4 py-2.5 text-[13px] text-[var(--pa-ink)] outline-none focus:border-[var(--pa-navy)]"
        />
      </div>
      <div className="relative mb-6 flex flex-wrap gap-2.5">
        <FilterChip
          label={`Tipo${tipoFilter !== "Todos" ? `: ${tipoFilter}` : ""}`}
          active={openFilter === "tipo"}
          onClick={() =>
            setOpenFilter((f) => (f === "tipo" ? null : "tipo"))
          }
        />
        <FilterChip
          label={`Ciudad${ciudadFilter !== "Todos" ? `: ${ciudadFilter}` : ""}`}
          active={openFilter === "ciudad"}
          onClick={() =>
            setOpenFilter((f) => (f === "ciudad" ? null : "ciudad"))
          }
        />
        <FilterChip
          label={`Estado${estadoFilter !== "Todos" ? `: ${estadoFilter}` : ""}`}
          active={openFilter === "estado"}
          onClick={() =>
            setOpenFilter((f) => (f === "estado" ? null : "estado"))
          }
        />
        {openFilter === "tipo" && (
          <FilterMenu
            options={FILTER_TYPES}
            selected={tipoFilter}
            onSelect={(v) => {
              setTipoFilter(v);
              setOpenFilter(null);
            }}
          />
        )}
        {openFilter === "ciudad" && (
          <FilterMenu
            options={ciudades}
            selected={ciudadFilter}
            onSelect={(v) => {
              setCiudadFilter(v);
              setOpenFilter(null);
            }}
          />
        )}
        {openFilter === "estado" && (
          <FilterMenu
            options={FILTER_ESTADOS}
            selected={estadoFilter}
            onSelect={(v) => {
              setEstadoFilter(v);
              setOpenFilter(null);
            }}
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

      {isLoading && <SkeletonGrid />}
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

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
        active
          ? "border-[var(--pa-navy)] bg-[var(--pa-navy)] text-white"
          : "border-[var(--pa-border)] bg-[var(--pa-surface)] text-[#45525E] hover:border-[var(--pa-navy)]"
      }`}
    >
      {label} ▾
    </button>
  );
}

function FilterMenu({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="absolute left-0 top-full z-20 mt-1 min-w-[180px] rounded-xl border border-[var(--pa-border)] bg-[var(--pa-surface)] py-1 shadow-lg">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onSelect(opt)}
          className={`block w-full px-4 py-2 text-left text-[13px] hover:bg-[var(--pa-bg)] ${
            opt === selected
              ? "font-bold text-[var(--pa-navy)]"
              : "text-[var(--pa-ink)]"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function SegBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-xs transition-colors ${
        active
          ? "bg-[var(--pa-surface)] font-bold text-[var(--pa-navy)] shadow-sm"
          : "font-semibold text-[var(--pa-muted)]"
      }`}
    >
      {children}
    </button>
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
        <div className="relative mb-3.5 flex h-[150px] items-center justify-center rounded-xl bg-[repeating-linear-gradient(45deg,#E4E8EC,#E4E8EC_10px,#EDEFF2_10px,#EDEFF2_20px)]">
          <span className="font-mono text-[11px] text-[#8B98A5]">foto portada</span>
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
            className="h-11 w-11 rounded-lg bg-[repeating-linear-gradient(45deg,#E4E8EC,#E4E8EC_6px,#EDEFF2_6px,#EDEFF2_12px)]"
            aria-label={`Abrir ${p.titulo}`}
          />
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

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-4"
        >
          <div className="mb-3.5 h-[150px] animate-pulse rounded-xl bg-[var(--pa-border)]" />
          <div className="mb-2 h-3.5 w-[70%] animate-pulse rounded bg-[var(--pa-border)]" />
          <div className="mb-3.5 h-3 w-[45%] animate-pulse rounded bg-[var(--pa-border)]" />
          <div className="h-2 w-full animate-pulse rounded bg-[var(--pa-border)]" />
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
