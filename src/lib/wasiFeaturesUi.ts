import type {
  WasiFeature,
  WasiFeaturesCatalog,
} from "@/services/interfaces/wasiFeatures";

function featureLabel(feat: WasiFeature): string {
  return feat.nombre?.trim() ?? "";
}

export function featureNameMap(
  catalog: WasiFeaturesCatalog,
): Map<number, string> {
  const map = new Map<number, string>();
  for (const feat of [...catalog.internal, ...catalog.external]) {
    const label = featureLabel(feat);
    if (label) {
      map.set(feat.id, label);
    }
  }
  return map;
}

export function formatWasiSelectionSummary(
  selectedIds: number[] | null | undefined,
  catalog: WasiFeaturesCatalog | null,
  maxNames = 3,
): string {
  const ids = selectedIds ?? [];
  const count = ids.length;
  if (count === 0) return "0 seleccionadas";
  if (!catalog) {
    return `${count} seleccionada${count === 1 ? "" : "s"}`;
  }
  const names = ids
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
  return items.filter((feat) => featureLabel(feat).toLowerCase().includes(q));
}

export function resolvePopularFeatures(
  catalog: WasiFeaturesCatalog,
  popularIds: number[] | null | undefined,
): WasiFeature[] {
  const byId = new Map<number, WasiFeature>();
  for (const feat of [...catalog.internal, ...catalog.external]) {
    byId.set(feat.id, feat);
  }
  return (popularIds ?? [])
    .map((id) => byId.get(id))
    .filter((feat): feat is WasiFeature => Boolean(feat));
}
