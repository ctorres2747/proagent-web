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
  if (meta == null || meta <= 0) return null;
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

export function buildAdvanceSummary(
  labels: { key: string; label: string; kpi: DesempenoKpi }[],
): string {
  const over: string[] = [];
  const under: string[] = [];
  for (const { label, kpi } of labels) {
    const pct = kpiPct(kpi);
    if (pct == null || kpi.meta == null) continue;
    const gap = Number(kpi.meta) - Number(kpi.actual);
    if (gap <= 0) over.push(label.toLowerCase());
    else if (gap > 0) under.push(`${gap} ${label.toLowerCase().replace(/s$/, "")}${gap === 1 ? "" : "s"}`);
  }
  const parts: string[] = [];
  if (over.length) parts.push(`Superaste la de ${over.join(" y ")}`);
  if (under.length) parts.push(`te faltan ${under.join(" y ")}`);
  if (!parts.length) return "Sigue avanzando hacia tus metas del periodo.";
  return parts.join("; ") + ".";
}
