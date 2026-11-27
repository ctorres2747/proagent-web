import type { ProximaActividad } from "@/services/interfaces/leads";

export const BOGOTA_TZ = "America/Bogota";

export type FollowUpTone = "empty" | "ok" | "soon" | "overdue";

export function bogotaYmd(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BOGOTA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function bogotaDayStart(ymd: string): Date {
  return new Date(`${ymd}T00:00:00-05:00`);
}

function bogotaDayEnd(ymd: string): Date {
  return new Date(`${ymd}T23:59:59.999-05:00`);
}

export function dueInstant(proxima: ProximaActividad): Date {
  const parsed = new Date(proxima.fechaHora);
  if (Number.isNaN(parsed.getTime())) {
    return parsed;
  }
  if (proxima.todoElDia) {
    return bogotaDayEnd(bogotaYmd(parsed));
  }
  return parsed;
}

export function calendarDayParts(proxima: ProximaActividad): {
  month: string;
  day: string;
} {
  const parsed = new Date(proxima.fechaHora);
  const month = new Intl.DateTimeFormat("es-CO", {
    timeZone: BOGOTA_TZ,
    month: "short",
  })
    .format(parsed)
    .replace(".", "")
    .slice(0, 3)
    .toUpperCase();
  const day = new Intl.DateTimeFormat("en-GB", {
    timeZone: BOGOTA_TZ,
    day: "numeric",
  }).format(parsed);
  return { month, day };
}

function weekdayLong(date: Date): string {
  const raw = new Intl.DateTimeFormat("es-CO", {
    timeZone: BOGOTA_TZ,
    weekday: "long",
  }).format(date);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function formatHoraBogota(date: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: BOGOTA_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function daysUntilDue(proxima: ProximaActividad, now: Date): number {
  const dueDay = bogotaDayStart(bogotaYmd(new Date(proxima.fechaHora)));
  const nowDay = bogotaDayStart(bogotaYmd(now));
  return Math.round((dueDay.getTime() - nowDay.getTime()) / 86_400_000);
}

export function followUpTone(
  proxima: ProximaActividad | null | undefined,
  now: Date,
): FollowUpTone {
  if (!proxima) return "empty";
  const due = dueInstant(proxima);
  if (due.getTime() < now.getTime()) return "overdue";
  const days = daysUntilDue(proxima, now);
  if (days === 0) return "soon";
  return "ok";
}

export type AgendaFilter = "Todos" | "vigente" | "vencida";

/** Filtro del tablero: solo leads con próxima actividad vigente o vencida. */
export function matchesAgendaFilter(
  proxima: ProximaActividad | null | undefined,
  filter: AgendaFilter,
  now: Date,
): boolean {
  if (filter === "Todos") return true;
  const tone = followUpTone(proxima, now);
  if (filter === "vencida") return tone === "overdue";
  return tone === "ok" || tone === "soon";
}

export function followUpRelativeLabel(
  proxima: ProximaActividad,
  now: Date,
): string {
  const due = new Date(proxima.fechaHora);
  const hora = proxima.todoElDia ? null : formatHoraBogota(due);
  const days = daysUntilDue(proxima, now);
  const overdue = dueInstant(proxima).getTime() < now.getTime();

  if (overdue) {
    return hora ? `Vencida · ${hora}` : "Vencida";
  }
  if (days === 0) {
    return hora ? `Hoy, ${hora}` : "Hoy";
  }
  if (days === 1) {
    return hora ? `Mañana, ${hora}` : "Mañana";
  }
  if (days < 7) {
    const weekday = weekdayLong(due);
    return hora ? `${weekday}, ${hora}` : weekday;
  }
  return "Programada";
}

export function followUpAriaLabel(
  proxima: ProximaActividad | null | undefined,
  now: Date,
): string {
  if (!proxima) return "Agendar seguimiento";
  return `Seguimiento: ${followUpRelativeLabel(proxima, now)}`;
}

/** Mañana 09:00 America/Bogota, en partes para inputs date/time. */
export function defaultAgendarParts(now = new Date()): {
  fecha: string;
  hora: string;
} {
  const today = bogotaYmd(now);
  const tomorrow = bogotaYmd(
    new Date(bogotaDayStart(today).getTime() + 86_400_000),
  );
  return { fecha: tomorrow, hora: "09:00" };
}

export function composeFechaHoraIso(fecha: string, hora: string): string {
  return `${fecha}T${hora}:00-05:00`;
}

export const TIPO_ACTIVIDAD_LABEL: Record<string, string> = {
  llamada: "Llamada",
  whatsapp: "WhatsApp",
  visita: "Visita",
  otro: "Otro",
};
