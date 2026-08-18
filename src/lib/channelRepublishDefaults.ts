import type { ChannelId } from "@/design-system/channels";
import type { Property } from "@/services/interfaces/properties";

/** Channels that default OFF when already published (Kanban parity). */
export const REPUBLISH_OPT_IN_CHANNELS: ChannelId[] = ["facebook", "instagram"];

export function publishedOptInChannelsFromProperty(
  property: Property,
): ChannelId[] {
  return (property.channels ?? [])
    .filter(
      (c) =>
        c.status === "published" &&
        REPUBLISH_OPT_IN_CHANNELS.includes(c.id),
    )
    .map((c) => c.id);
}

export function applyToggleRepublishDefaults(
  toggles: Record<ChannelId, boolean>,
  publishedIds: Iterable<ChannelId>,
): Record<ChannelId, boolean> {
  const published = new Set(publishedIds);
  const out = { ...toggles };
  for (const id of REPUBLISH_OPT_IN_CHANNELS) {
    if (published.has(id)) out[id] = false;
  }
  return out;
}
