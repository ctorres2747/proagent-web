/** Normalize municipio for grouping filter options (Itagüí / ITAGUI → same key). */
export function municipioKey(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/** Pick a display label for a group of raw municipio strings. */
export function municipioDisplayLabel(variants: string[]): string {
  const sorted = [...variants].sort((a, b) => a.localeCompare(b, "es"));
  const titled = sorted.find((v) => /[a-záéíóúñ]/.test(v) && /[A-ZÁÉÍÓÚÑ]/.test(v));
  if (titled) return titled;
  const first = sorted[0] ?? "";
  if (!first) return "";
  return first
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function buildMunicipioOptions(
  rawValues: string[],
): { key: string; label: string }[] {
  const groups = new Map<string, string[]>();
  for (const raw of rawValues) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = municipioKey(trimmed);
    const list = groups.get(key) ?? [];
    list.push(trimmed);
    groups.set(key, list);
  }
  return Array.from(groups.entries())
    .map(([key, variants]) => ({
      key,
      label: municipioDisplayLabel(variants),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
}

export function propertyMatchesMunicipio(
  municipio: string,
  selectedKey: string | null,
): boolean {
  if (!selectedKey) return true;
  return municipioKey(municipio) === selectedKey;
}
