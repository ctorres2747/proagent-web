"use client";

import { useMemo, useState } from "react";

import type { WasiFeaturesCatalog } from "@/services/interfaces/wasiFeatures";
import {
  filterWasiFeatures,
  formatWasiSelectionSummary,
  resolvePopularFeatures,
} from "@/lib/wasiFeaturesUi";

function FeatureRow({
  id,
  nombre,
  checked,
  onToggle,
}: {
  id: number;
  nombre: string;
  checked: boolean;
  onToggle: (id: number) => void;
}) {
  return (
    <label className="flex min-w-0 cursor-pointer items-start gap-2 rounded-lg px-1.5 py-1.5 hover:bg-[var(--pa-bg)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(id)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--pa-border)] text-[var(--pa-navy)] focus:ring-[var(--pa-navy)]"
      />
      <span className="text-xs leading-snug text-[var(--pa-ink)]">{nombre}</span>
    </label>
  );
}

function PopularFeatures({
  items,
  selectedIds,
  onToggle,
}: {
  items: { id: number; nombre: string }[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--pa-muted)]">
        Más usadas
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((feat) => {
          const checked = selectedIds.includes(feat.id);
          return (
            <label
              key={feat.id}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                checked
                  ? "border-[var(--pa-navy)] bg-[var(--pa-navy)] text-white"
                  : "border-[var(--pa-border)] bg-[var(--pa-bg)] text-[#45525E] hover:border-[var(--pa-navy)]"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(feat.id)}
                className="sr-only"
              />
              {feat.nombre}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function CollapsibleGroup({
  title,
  items,
  selectedIds,
  onToggle,
}: {
  title: string;
  items: WasiFeaturesCatalog["internal"];
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  const [open, setOpen] = useState(true);
  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--pa-border)] bg-[var(--pa-surface)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-[var(--pa-ink)]"
      >
        <span>
          {title} ({items.length})
        </span>
        <span className="text-[var(--pa-muted)]">{open ? "▾" : "▸"}</span>
      </button>
      {open ? (
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 border-t border-[var(--pa-border)] p-2 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((feat) => (
            <FeatureRow
              key={feat.id}
              id={feat.id}
              nombre={feat.nombre}
              checked={selectedIds.includes(feat.id)}
              onToggle={onToggle}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function WasiFeaturesCheckboxes({
  catalog,
  selectedIds,
  onChange,
  loading,
  error,
}: {
  catalog: WasiFeaturesCatalog | null;
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  loading?: boolean;
  error?: string | null;
}) {
  const [query, setQuery] = useState("");

  const toggle = (id: number) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );
  };

  const filtered = useMemo(() => {
    if (!catalog) return { internal: [], external: [] };
    return {
      internal: filterWasiFeatures(catalog.internal, query),
      external: filterWasiFeatures(catalog.external, query),
    };
  }, [catalog, query]);

  const summary = formatWasiSelectionSummary(selectedIds, catalog);

  const popularItems = useMemo(() => {
    if (!catalog) return [];
    const items = resolvePopularFeatures(catalog, catalog.popularIds ?? []);
    return filterWasiFeatures(items, query);
  }, [catalog, query]);

  if (loading) {
    return (
      <p className="text-sm text-[var(--pa-muted)]">Cargando catálogo WASI…</p>
    );
  }

  if (error) {
    return (
      <p className="text-sm font-medium text-[var(--pa-warning)]">{error}</p>
    );
  }

  if (!catalog) return null;

  const hasCatalog =
    catalog.internal.length > 0 || catalog.external.length > 0;

  if (!hasCatalog) {
    return (
      <p className="text-sm text-[var(--pa-muted)]">
        No hay características disponibles (WASI no configurado).
      </p>
    );
  }

  const hasMatches =
    filtered.internal.length > 0 || filtered.external.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-[var(--pa-ink)]">{summary}</p>
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--pa-muted)]">
          Filtrar características
        </label>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrar características…"
          className="w-full rounded-xl border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3.5 py-2.5 text-sm text-[var(--pa-ink)] outline-none focus:border-[var(--pa-navy)]"
        />
      </div>
      <p className="text-xs text-[var(--pa-muted)]">
        Se envían a WASI al publicar (y de ahí a portales asociados).
      </p>
      {hasMatches ? (
        <div className="flex flex-col gap-3">
          <PopularFeatures
            items={popularItems}
            selectedIds={selectedIds}
            onToggle={toggle}
          />
          <CollapsibleGroup
            title="Internas"
            items={filtered.internal}
            selectedIds={selectedIds}
            onToggle={toggle}
          />
          <CollapsibleGroup
            title="Externas"
            items={filtered.external}
            selectedIds={selectedIds}
            onToggle={toggle}
          />
        </div>
      ) : (
        <p className="text-sm text-[var(--pa-muted)]">
          Ninguna característica coincide con el filtro.
        </p>
      )}
    </div>
  );
}
