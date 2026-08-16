import type { Publication, PublicationStatus } from "@/services/interfaces/publications";
import type { Property } from "@/services/interfaces/properties";

export type PublicationStage =
  | "none"
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "partial"
  | "failed";

export const PUBLICATION_STAGE_LABEL: Record<PublicationStage, string> = {
  none: "Sin publicar",
  draft: "Borrador",
  scheduled: "Programada",
  publishing: "Publicando",
  published: "Publicada",
  partial: "Parcial",
  failed: "Error",
};

export const PUBLICATION_STAGE_CLASS: Record<PublicationStage, string> = {
  none: "bg-[var(--pa-bg-alt)] text-[var(--pa-muted)]",
  draft: "bg-[var(--pa-bg-alt)] text-[var(--pa-muted)]",
  scheduled: "bg-[#FEF3E2] text-[#B45309]",
  publishing: "bg-[#FEF3E2] text-[#B45309]",
  published: "bg-[#E6F4EE] text-[var(--pa-accent)]",
  partial: "bg-[#FEF3E2] text-[#B45309]",
  failed: "bg-[#FCEAEA] text-[var(--pa-danger)]",
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

export function publicationStage(
  publication: Publication | undefined,
): PublicationStage {
  if (!publication) return "none";
  return publication.status as PublicationStage;
}

export function stageFromStatus(status: PublicationStatus): PublicationStage {
  return status as PublicationStage;
}

export function stageLabel(stage: PublicationStage): string {
  return PUBLICATION_STAGE_LABEL[stage];
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
  if (shortcuts.conError && stage !== "failed" && stage !== "partial") {
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
  if (filter === "Programada") return stage === "scheduled" || stage === "publishing";
  if (filter === "Publicada") {
    return stage === "published" || stage === "partial";
  }
  if (filter === "Con error") return stage === "failed" || stage === "partial";
  return true;
}

/** Última publicación por propiedad (más reciente por updatedAt). */
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
