import type {
  ChannelResult,
  Publication,
  PublicationStatus,
} from "@/services/interfaces/publications";

export const PUBLICATION_POLL_INTERVAL_MS = 2500;
export const PUBLICATION_POLL_TIMEOUT_MS = 5 * 60 * 1000;

export function publicationHasInFlightChannels(
  publication: Pick<Publication, "status" | "channelResults">,
): boolean {
  if (publication.status === "publishing") return true;
  return publication.channelResults.some(
    (r) => r.status === "publishing" || r.status === "pending",
  );
}

export function mergeChannelResult(
  results: ChannelResult[],
  updated: ChannelResult,
): ChannelResult[] {
  const others = results.filter((r) => r.channelId !== updated.channelId);
  return [...others, updated];
}

export function publicationStatusFromResults(
  results: ChannelResult[],
  fallback: PublicationStatus,
): PublicationStatus {
  if (results.some((r) => r.status === "publishing" || r.status === "pending")) {
    return "publishing";
  }
  if (results.length === 0) return fallback;
  const statuses = new Set(results.map((r) => r.status));
  if (statuses.has("failed") && (statuses.has("published") || statuses.has("scheduled"))) {
    return "partial";
  }
  if (statuses.size === 1 && statuses.has("failed")) return "failed";
  if (statuses.has("published") || statuses.has("scheduled")) return "published";
  return fallback;
}
