import type {
  Publication,
  PublicationStatus,
} from "@/services/interfaces/publications";

const ACTIVE_STATUSES = new Set<PublicationStatus>([
  "published",
  "partial",
  "failed",
  "publishing",
  "scheduled",
]);

export function pickCanonicalPublication(
  publications: Publication[],
  propertyId: string,
): Publication | undefined {
  const forProperty = publications.filter((p) => p.propertyId === propertyId);
  if (forProperty.length === 0) return undefined;

  const sorted = [...forProperty].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  const active = sorted.find((p) => ACTIVE_STATUSES.has(p.status));
  return active ?? sorted[0];
}

export function shouldOpenResultsStep(publication: Publication): boolean {
  if (ACTIVE_STATUSES.has(publication.status)) return true;
  return (publication.channelResults ?? []).some((r) =>
    ["published", "failed", "scheduled", "publishing"].includes(r.status),
  );
}

export type PublicationWizardStep = "content" | "results";

export function initialWizardStep(
  publication: Publication,
): PublicationWizardStep {
  return shouldOpenResultsStep(publication) ? "results" : "content";
}
