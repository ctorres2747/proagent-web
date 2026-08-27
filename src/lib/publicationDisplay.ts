import { CHANNEL_META, type ChannelId } from "@/design-system/channels";
import type {
  ChannelResultStatus,
  Publication,
  PublicationStatus,
} from "@/services/interfaces/publications";
import type { Property } from "@/services/interfaces/properties";

export type PublicationStage =
  | "none"
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "partially_published"
  | "partial"
  | "failed";

export type ChannelIndicatorKind =
  | "published"
  | "pending"
  | "error"
  | "progress"
  | "scheduled";

export const PUBLICATION_STAGE_LABEL: Record<PublicationStage, string> = {
  none: "Sin publicar",
  draft: "Borrador",
  scheduled: "Programada",
  publishing: "Publicando",
  published: "Publicada",
  partially_published: "Parcialmente publicado",
  partial: "Parcial",
  failed: "Error",
};

export const PUBLICATION_STAGE_CLASS: Record<PublicationStage, string> = {
  none: "bg-[#F1EAFB] text-[#6D28D9]",
  draft: "bg-[var(--pa-info-bg)] text-[var(--pa-navy)]",
  scheduled: "bg-[#FEF3E2] text-[#B45309]",
  publishing: "bg-[#FEF3E2] text-[#B45309]",
  published: "bg-[#E6F4EE] text-[var(--pa-accent)]",
  partially_published: "bg-[#FEF3E2] text-[#B45309]",
  partial: "bg-[#FEF3E2] text-[#B45309]",
  failed: "bg-[#FCEAEA] text-[var(--pa-danger)]",
};

export const PUBLICATION_STAGE_SORT_ORDER: Record<PublicationStage, number> = {
  draft: 0,
  none: 1,
  failed: 2,
  partial: 3,
  partially_published: 4,
  scheduled: 5,
  publishing: 6,
  published: 7,
};

export const PUBLICATION_FILTER_OPTIONS = [
  { value: "Todos", label: "Todos" },
  { value: "Sin publicar", label: "Sin publicar" },
  { value: "Borrador", label: "Borrador" },
  { value: "Programada", label: "Programada" },
  { value: "Publicada", label: "Publicada" },
  { value: "Con error", label: "Con error" },
] as const;

export type PublicationFilterLabel =
  (typeof PUBLICATION_FILTER_OPTIONS)[number]["value"];

function channelResultMap(
  publication: Publication,
): Map<ChannelId, ChannelResultStatus> {
  return new Map(publication.channelResults.map((r) => [r.channelId, r.status]));
}

/** Etapa visible en lista — calculada desde selectedChannels + channelResults (Sprint 045). */
export function publicationAggregateStage(
  publication: Publication | undefined,
): PublicationStage {
  if (!publication) return "none";

  if (publication.status === "draft") return "draft";
  if (publication.status === "publishing") return "publishing";
  if (publication.status === "scheduled") return "scheduled";

  const selected = publication.selectedChannels ?? [];
  if (selected.length === 0) {
    return "none";
  }

  let published = 0;
  let pending = 0;
  let failed = 0;
  let inProgress = 0;
  let scheduled = 0;

  const byChannel = channelResultMap(publication);
  for (const ch of selected) {
    const s = byChannel.get(ch) ?? "waiting";
    if (s === "published") published += 1;
    else if (s === "failed" || s === "unavailable") failed += 1;
    else if (s === "waiting") pending += 1;
    else if (s === "publishing" || s === "pending") inProgress += 1;
    else if (s === "scheduled") scheduled += 1;
  }

  if (inProgress > 0) return "publishing";
  // Bug real (review 2026-08-27): exigir pending===0 acá dejaba una
  // publicación con, por ejemplo, WhatsApp programado + Instagram todavía
  // sin tocar (ninguno publicado/con error/en curso) cayendo al fallback
  // final ("none" / "Sin publicar") en vez de reflejar que sí hay algo
  // programado en curso.
  if (scheduled > 0 && published === 0 && failed === 0) {
    return "scheduled";
  }
  if (published > 0 && failed > 0) return "partial";
  if (published > 0 && pending > 0) return "partially_published";
  if (published === selected.length) return "published";
  if (failed === selected.length) return "failed";
  if (failed > 0) return "partial";
  if (publication.status === "failed") return "failed";
  return "none";
}

export function publicationStage(
  publication: Publication | undefined,
): PublicationStage {
  return publicationAggregateStage(publication);
}

export function stageFromStatus(status: PublicationStatus): PublicationStage {
  return status as PublicationStage;
}

export function stageLabel(stage: PublicationStage): string {
  return PUBLICATION_STAGE_LABEL[stage];
}

export function channelIndicatorForPublication(
  channelId: ChannelId,
  publication?: Publication,
): ChannelIndicatorKind | null {
  if (!publication?.selectedChannels?.includes(channelId)) return null;
  const status = channelResultMap(publication).get(channelId) ?? "waiting";
  if (status === "published") return "published";
  if (status === "failed" || status === "unavailable") return "error";
  if (status === "publishing" || status === "pending") return "progress";
  if (status === "scheduled") return "scheduled";
  return "pending";
}

export function channelIndicatorAriaLabel(
  channelId: ChannelId,
  kind: ChannelIndicatorKind,
): string {
  const name = CHANNEL_META[channelId].name;
  const text: Record<ChannelIndicatorKind, string> = {
    published: "publicado",
    pending: "pendiente",
    error: "error",
    progress: "en proceso",
    scheduled: "programado",
  };
  return `${name}: ${text[kind]}`;
}

export type PublicationShortcuts = {
  sinPublicar?: boolean;
  programadas?: boolean;
  conError?: boolean;
};

export function matchesPublicationShortcuts(
  stage: PublicationStage,
  shortcuts: PublicationShortcuts,
): boolean {
  if (shortcuts.sinPublicar && stage !== "none" && stage !== "draft") {
    return false;
  }
  if (
    shortcuts.programadas &&
    stage !== "scheduled" &&
    stage !== "publishing"
  ) {
    return false;
  }
  if (
    shortcuts.conError &&
    stage !== "failed" &&
    stage !== "partial"
  ) {
    return false;
  }
  return true;
}

export function matchesPublicationStageFilter(
  stage: PublicationStage,
  filter: PublicationFilterLabel,
): boolean {
  if (filter === "Todos") return true;
  if (filter === "Sin publicar") return stage === "none";
  if (filter === "Borrador") return stage === "draft";
  if (filter === "Programada") {
    return stage === "scheduled" || stage === "publishing";
  }
  // Solo filas con todos los canales seleccionados publicados (Sprint 045).
  // "Parcialmente publicado" y "Parcial" no entran aquí.
  if (filter === "Publicada") return stage === "published";
  if (filter === "Con error") return stage === "failed" || stage === "partial";
  return true;
}

export function indexPublicationsByProperty(
  publications: Publication[],
): Map<string, Publication> {
  const map = new Map<string, Publication>();
  for (const pub of publications) {
    const prev = map.get(pub.propertyId);
    if (!prev || pub.updatedAt > prev.updatedAt) {
      map.set(pub.propertyId, pub);
    }
  }
  return map;
}

export function publicationTitle(
  property: Property,
  publication?: Publication,
): string {
  return (
    publication?.sharedTitle?.trim() ||
    property.titulo ||
    `Propiedad ${property.code}`
  );
}
