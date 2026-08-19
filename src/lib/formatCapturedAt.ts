/** Locale-aware label for scraper capture datetime (America/Bogota). */
export function formatCapturedAt(
  iso: string | null | undefined,
): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function capturedAtLabel(
  iso: string | null | undefined,
): string | null {
  const formatted = formatCapturedAt(iso);
  return formatted ? `Capturado: ${formatted}` : null;
}
