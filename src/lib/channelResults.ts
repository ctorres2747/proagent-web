import type { ChannelResult } from "@/services/interfaces/publications";
import { formatDurationHms } from "@/lib/duration";

export const BOGOTA_TIMEZONE = "America/Bogota";

function elapsedSecondsFromStart(startedAt: string): number {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
  );
}

export function formatChannelDurationLine(result: ChannelResult): string | null {
  const inFlight =
    result.status === "publishing" || result.status === "pending";
  const finished =
    result.status === "published" || result.status === "failed";

  let seconds = result.durationSeconds ?? null;
  if (seconds == null && result.startedAt && inFlight) {
    seconds = elapsedSecondsFromStart(result.startedAt);
  }
  if (seconds == null) {
    return null;
  }

  const formatted = formatDurationHms(seconds);
  if (inFlight) {
    return `En proceso · ${formatted}`;
  }
  if (finished) {
    return `Tiempo de publicación ${formatted}`;
  }
  return null;
}

export function formatChannelPublishedMeta(
  publishedAt: string,
  options?: { republished?: boolean },
): string {
  const when = new Date(publishedAt).toLocaleString("es-CO", {
    timeZone: BOGOTA_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const label = options?.republished
    ? "Republicación exitosa"
    : "Publicación exitosa";
  return `${label} · ${when}`;
}

export function formatChannelResultMeta(
  result: ChannelResult,
  options?: { republished?: boolean },
): string {
  if (result.status === "failed") {
    return result.recommendedAction ?? "Revisa el error e inténtalo de nuevo";
  }
  if (result.status === "waiting") {
    return "Sin publicar en este canal";
  }
  if (result.status === "scheduled") {
    return "Pendiente de publicación programada";
  }
  if (result.status === "publishing" || result.status === "pending") {
    return "En proceso…";
  }
  if (result.publishedAt) {
    return formatChannelPublishedMeta(result.publishedAt, options);
  }
  if (result.externalRef) {
    return `Ref. ${result.externalRef}`;
  }
  return "Publicado";
}
