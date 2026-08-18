"use client";

import type { WasiFeaturesCatalog } from "@/services/interfaces/wasiFeatures";

function FeatureList({
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
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[var(--pa-muted)]">
        {title}
      </div>
      <div className="max-h-[180px] overflow-y-auto rounded-lg border border-[var(--pa-border)] bg-[var(--pa-bg)] p-2">
        {items.map((feat) => {
          const checked = selectedIds.includes(feat.id);
          return (
            <label
              key={feat.id}
              className="mb-1 flex cursor-pointer items-center gap-2 text-xs text-[#45525E] last:mb-0"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(feat.id)}
                className="h-3.5 w-3.5 accent-[var(--pa-navy)]"
              />
              {feat.nombre}
            </label>
          );
        })}
      </div>
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
  const toggle = (id: number) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    onChange(next);
  };

  if (loading) {
    return (
      <p className="text-xs text-[var(--pa-muted)]">Cargando catálogo WASI…</p>
    );
  }

  if (error) {
    return <p className="text-xs text-[var(--pa-warning)]">{error}</p>;
  }

  if (!catalog) return null;

  const hasItems =
    catalog.internal.length > 0 || catalog.external.length > 0;

  if (!hasItems) {
    return (
      <p className="text-xs text-[var(--pa-muted)]">
        No hay características disponibles (WASI no configurado).
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <FeatureList
        title="Internas"
        items={catalog.internal}
        selectedIds={selectedIds}
        onToggle={toggle}
      />
      <FeatureList
        title="Externas"
        items={catalog.external}
        selectedIds={selectedIds}
        onToggle={toggle}
      />
    </div>
  );
}
