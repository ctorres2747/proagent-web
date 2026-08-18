"use client";

import { useMemo, useState } from "react";

import type { WasiFeaturesCatalog } from "@/services/interfaces/wasiFeatures";
import {
  filterWasiFeatures,
  formatWasiSelectionSummary,
} from "@/lib/wasiFeaturesUi";

function FeatureChip({
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
    <label
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        checked
          ? "border-[var(--pa-navy)] bg-[var(--pa-navy)] text-white"
          : "border-[var(--pa-border)] bg-[var(--pa-bg)] text-[#45525E] hover:border-[var(--pa-navy)]"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(id)}
        className="sr-only"
      />
      {nombre}
    </label>
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
        <div className="flex flex-wrap gap-2 border-t border-[var(--pa-border)] p-3">
          {items.map((feat) => (
            <FeatureChip
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
