import type {
  AdminAsesorDashboard,
  AdminMetrica,
  AdminPubCanal,
} from "@/services/interfaces/adminDashboard";
import { monthAbbr } from "./kpiMath";

export const ASESOR_PALETTE = [
  { bg: "#0A3D62", ink: "#FFFFFF" },
  { bg: "#2FC98A", ink: "#06331F" },
  { bg: "#D97B2B", ink: "#2B1400" },
  { bg: "#5F86A6", ink: "#FFFFFF" },
  { bg: "#7C3AED", ink: "#FFFFFF" },
] as const;

export const CANAL_LABEL: Record<AdminPubCanal, string> = {
  whatsapp: "WhatsApp",
  marketplace: "Marketplace",
  wasi: "WASI",
  instagram: "Instagram",
};

export const METRICA_LABEL: Record<AdminMetrica, string> = {
  leads: "Leads recibidos",
  en_contacto: "En contacto",
  captadas: "Captadas",
  descartadas: "Descartadas",
  cerrados: "Clientes cerrados",
};

export function colorAsesor(index: number) {
  return ASESOR_PALETTE[index % ASESOR_PALETTE.length];
}

export function formatDecimal(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

export function formatPct(n: number): string {
  return `${formatDecimal(n)}%`;
}

export function shortName(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return nombre;
  return `${parts[0]} ${parts[1][0]}.`;
}

export function conversionPct(captadas: number, recibidos: number): number | null {
  if (!recibidos) return null;
  return (captadas / recibidos) * 100;
}

export function metricValue(asesor: AdminAsesorDashboard, metrica: AdminMetrica, prev: boolean): number {
  if (metrica === "leads") return prev ? asesor.leadsAnt.recibidos : asesor.leads.recibidos;
  if (metrica === "en_contacto") return prev ? asesor.leadsAnt.enContacto : asesor.leads.enContacto;
  if (metrica === "captadas") return prev ? asesor.leadsAnt.captadas : asesor.leads.captadas;
  if (metrica === "descartadas") return prev ? asesor.leadsAnt.descartadas : asesor.leads.descartadas;
  return prev ? asesor.clientes.cerradosAnt : asesor.clientes.cerrados;
}

export function upIsGood(metrica: AdminMetrica): boolean | null {
  if (metrica === "descartadas") return null;
  return true;
}

export function chipTone(
  diff: number,
  upGood: boolean | null,
): "good" | "bad" | "neutral" {
  if (diff === 0 || upGood == null) return "neutral";
  if (upGood) return diff > 0 ? "good" : "bad";
  return diff > 0 ? "bad" : "good";
}

export function chipClass(tone: "good" | "bad" | "neutral"): string {
  if (tone === "good") return "bg-[#E6F5EE] text-[#16774A]";
  if (tone === "bad") return "bg-[#FBE7E4] text-[#A3271A]";
  return "bg-[#F1F3F5] text-[#45525E]";
}

export function chipText(diff: number, prevMes: number, withVs: boolean): string {
  const vs = withVs ? ` vs. ${monthAbbr(prevMes)}` : "";
  if (diff === 0) return withVs ? `= ${monthAbbr(prevMes)}` : "=";
  const arrow = diff > 0 ? "▲" : "▼";
  return `${arrow} ${Math.abs(diff)}${vs}`;
}

export function failCellStyle(fallos: number, intentos: number) {
  if (intentos === 0) {
    return { bg: "#F1F3F5", fg: "#45525E", empty: true };
  }
  if (fallos === 0) return { bg: "#F1F3F5", fg: "#45525E", empty: false };
  if (fallos <= 2) return { bg: "#F7D9B9", fg: "#5C3108", empty: false };
  return { bg: "#C23B2B", fg: "#FFFFFF", empty: false };
}

export function formatShortDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
  }).format(d);
  const month = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    month: "short",
  })
    .format(d)
    .replace(".", "");
  return `${day} ${month}`;
}

export function formatWhen(iso: string | null, todayIso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const dayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  const time = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(d)
    .replace(/\s*(a\.?\s*m\.?)/i, " a. m.")
    .replace(/\s*(p\.?\s*m\.?)/i, " p. m.");
  if (dayKey === todayIso) return `hoy ${time}`;
  return `${formatShortDate(iso)} ${time}`;
}

export function dayKeyBogota(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
