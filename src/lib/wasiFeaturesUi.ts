import type {
  WasiFeature,
  WasiFeaturesCatalog,
} from "@/services/interfaces/wasiFeatures";

export function featureNameMap(
  catalog: WasiFeaturesCatalog,
): Map<number, string> {
  const map = new Map<number, string>();
  for (const feat of [...catalog.internal, ...catalog.external]) {
    map.set(feat.id, feat.nombre);
  }
  return map;
}

export function formatWasiSelectionSummary(
  selectedIds: number[],
  catalog: WasiFeaturesCatalog | null,
  maxNames = 3,
): string {
  const count = selectedIds.length;
  if (count === 0) return "0 seleccionadas";
  if (!catalog) {
    return `${count} seleccionada${count === 1 ? "" : "s"}`;
  }
  const names = selectedIds
    .map((id) => featureNameMap(catalog).get(id))
    .filter((name): name is string => Boolean(name));
  const shown = names.slice(0, maxNames);
  const extra = names.length - shown.length;
  const prefix = `${count} seleccionada${count === 1 ? "" : "s"}`;
  if (shown.length === 0) return prefix;
  if (extra > 0) return `${prefix} · ${shown.join(", ")} +${extra}`;
  return `${prefix} · ${shown.join(", ")}`;
}

export function filterWasiFeatures(
  items: WasiFeature[],
  query: string,
): WasiFeature[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((feat) => feat.nombre.toLowerCase().includes(q));
}
