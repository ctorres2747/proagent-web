import type { DesempenoKpi } from "@/services/interfaces/dashboard";

export const MESES_LARGO = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export const MESES_ABBR = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

export function lastClosedMonth(d = new Date()): { anio: number; mes: number } {
  const y = d.getFullYear();
  const cm = d.getMonth() + 1;
  if (cm === 1) return { anio: y - 1, mes: 12 };
  return { anio: y, mes: cm - 1 };
}

export function pctOfMeta(actual: number, meta: number | null | undefined): number | null {
  if (meta == null) return null;
  if (meta === 0) return actual === 0 ? 100 : null;
  return Math.round((actual / meta) * 100);
}

export function pctForRing(pct: number | null): number {
  if (pct == null) return 0;
  return Math.min(100, Math.max(0, pct));
}

export function colorForPct(pct: number | null): string {
  if (pct == null) return "var(--pa-muted)";
  if (pct >= 100) return "#1E8E5A";
  if (pct >= 85) return "#0A3D62";
  return "#D97B2B";
}

export function globalAdvancePct(
  pcts: (number | null)[],
): number | null {
  const capped = pcts.filter((p): p is number => p != null).map((p) => Math.min(100, p));
  if (!capped.length) return null;
  return Math.round(capped.reduce((a, b) => a + b, 0) / capped.length);
}

export function formatInteger(n: number): string {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n);
}

export function formatConversion(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

export function kpiPct(kpi: DesempenoKpi): number | null {
  return pctOfMeta(Number(kpi.actual), kpi.meta);
}

export function monthLabel(mes: number): string {
  return MESES_LARGO[mes - 1] ?? String(mes);
}

export function monthAbbr(mes: number): string {
  return MESES_ABBR[mes - 1] ?? String(mes);
}

/** Unidad singular/plural por KPI para la frase de avance. */
const SUMMARY_UNITS: Record<string, [string, string]> = {
  captadas: ["propiedad captada", "propiedades captadas"],
  publicadas: ["propiedad publicada", "propiedades publicadas"],
  leads: ["lead", "leads"],
};

function joinEs(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

/**
 * Frase del bloque "Avance hacia la meta". Antes concatenaba el gap crudo
 * (`0.9000000000000004 conversións`), pluralizaba agregando "s" y decía
 * "Superaste la de…".
 */
export function buildAdvanceSummary(
  labels: { key: string; label: string; kpi: DesempenoKpi }[],
): string {
  const over: string[] = [];
  const under: string[] = [];
  for (const { key, label, kpi } of labels) {
    const pct = kpiPct(kpi);
    if (pct == null || kpi.meta == null) continue;
    const gap = Number(kpi.meta) - Number(kpi.actual);
    const name = label.toLowerCase();
    if (gap <= 0) {
      over.push(key === "leads" ? name : (SUMMARY_UNITS[key]?.[1] ?? name));
      continue;
    }
    if (key === "conversion") {
      under.push(`${formatConversion(gap)} pts de conversión`);
      continue;
    }
    const n = Math.ceil(gap);
    const [one, many] = SUMMARY_UNITS[key] ?? [name, name];
    under.push(`${formatInteger(n)} ${n === 1 ? one : many}`);
  }
  const parts: string[] = [];
  if (over.length) parts.push(`Superaste la meta de ${joinEs(over)}`);
  if (under.length) {
    const lead = over.length ? "te faltan" : "Te faltan";
    parts.push(`${lead} ${joinEs(under)}`);
  }
  if (!parts.length) return "Sigue avanzando hacia tus metas del periodo.";
  return parts.join("; ") + ".";
}
