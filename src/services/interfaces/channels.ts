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

export interface ChannelPatch {
  status?: "connected" | "not_connected";
  mode?: "own" | "pool";
  accountName?: string | null;
  credentials?: {
    wasiIdCompany?: string | null;
    wasiToken?: string | null;
    wasiIdUser?: string | null;
    instagramAccount?: string | null;
    catalogId?: string | null;
  };
}

export interface ChannelsService {
  list(token?: string): Promise<ChannelConnection[]>;
  patch(channelId: ChannelId, data: ChannelPatch, token?: string): Promise<ChannelConnection>;
}
