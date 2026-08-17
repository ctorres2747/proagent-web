/** Canonical property types for Captación filter (Sprint 028). */

const TIPO_ALIASES: Record<string, string> = {
  apartamento: "Apartamento",
  apto: "Apartamento",
  apartaestudio: "Apartamento",
  apartmento: "Apartamento",
  apartment: "Apartamento",
  casa: "Casa",
  lote: "Lote",
  local: "Local comercial",
  "local comercial": "Local comercial",
  finca: "Finca",
  oficina: "Oficina",
  bodega: "Bodega",
};

function tipoKey(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function canonicalTipo(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const key = tipoKey(raw);
  if (TIPO_ALIASES[key]) return TIPO_ALIASES[key];
  const titled = raw.trim();
  if (tipoKey(titled) === key) {
    return titled
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }
  return titled;
}

export function buildTipoFilterOptions(
  rawValues: (string | null | undefined)[],
): string[] {
  const seen = new Set<string>();
  const options: string[] = [];
  for (const raw of rawValues) {
    const canon = canonicalTipo(raw);
    if (!canon || seen.has(canon)) continue;
    seen.add(canon);
    options.push(canon);
  }
  return options.sort((a, b) => a.localeCompare(b, "es"));
}

export function leadMatchesTipo(
  leadTipo: string | null | undefined,
  selectedCanonical: string,
): boolean {
  return canonicalTipo(leadTipo) === selectedCanonical;
}
