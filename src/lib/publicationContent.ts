import type { ChannelId } from "@/design-system/channels";
import type { PlatformContent } from "@/services/interfaces/publications";

export function isChannelPersonalized(
  sharedTitle: string,
  sharedBody: string,
  channel?: Pick<PlatformContent, "title" | "body"> | null,
): boolean {
  if (!channel) return false;
  const title = (channel.title || "").trim();
  const body = (channel.body || "").trim();
  const sharedT = (sharedTitle || "").trim();
  const sharedB = (sharedBody || "").trim();
  return (title !== "" && title !== sharedT) || (body !== "" && body !== sharedB);
}

export function platformContentForChannel(
  platformContent: PlatformContent[],
  channelId: ChannelId,
): PlatformContent | undefined {
  return platformContent.find((pc) => pc.channelId === channelId);
}
