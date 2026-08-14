const DEFAULT_TIMEZONE = "America/Bogota";

export { DEFAULT_TIMEZONE };

export function tomorrowDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Build ISO string from local date (YYYY-MM-DD) and time (HH:mm). */
export function buildScheduleIso(date: string, time: string): string | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!dateMatch || !timeMatch) return null;
  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  const local = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (Number.isNaN(local.getTime())) return null;
  return local.toISOString();
}

export function isFutureSchedule(iso: string): boolean {
  const when = new Date(iso);
  return !Number.isNaN(when.getTime()) && when.getTime() > Date.now();
}

export function formatScheduledFor(
  iso: string | null | undefined,
  timezone?: string | null,
): string {
  if (!iso) return "";
  try {
    const formatted = new Date(iso).toLocaleString("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    return timezone ? `${formatted} (${timezone})` : formatted;
  } catch {
    return iso;
  }
}

export function scheduleValidationError(date: string, time: string): string | null {
  const iso = buildScheduleIso(date, time);
  if (!iso) {
    return "Usa fecha AAAA-MM-DD y hora HH:mm (ej. 2026-08-15 y 17:00).";
  }
  if (!isFutureSchedule(iso)) {
    return "La fecha y hora deben ser futuras.";
  }
  return null;
}
