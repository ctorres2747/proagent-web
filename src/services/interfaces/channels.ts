import type { ChannelId } from "@/design-system/channels";

export type ChannelConnectionStatus =
  | "connected"
  | "not_connected"
  | "needs_auth"
  | "unavailable";

export interface ChannelConnection {
  channelId: ChannelId;
  status: ChannelConnectionStatus;
  accountName: string;
  issue?: string | null;
}

export interface ChannelsService {
  list(token?: string): Promise<ChannelConnection[]>;
}
