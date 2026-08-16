import type { ChannelResult } from "@/services/interfaces/publications";

export const BOGOTA_TIMEZONE = "America/Bogota";

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
