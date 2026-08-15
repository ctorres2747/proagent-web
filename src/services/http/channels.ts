import { apiFetch } from "./client";
import type {
  ChannelConnection,
  ChannelsService,
} from "@/services/interfaces/channels";
import type { ChannelId } from "@/design-system/channels";

interface RawConnection {
  channel_id: string;
  status: string;
  account_name?: string | null;
  issue?: string | null;
}

function mapConnection(raw: RawConnection): ChannelConnection {
  return {
    channelId: raw.channel_id as ChannelId,
    status: raw.status as ChannelConnection["status"],
    accountName: raw.account_name ?? raw.channel_id,
    issue: raw.issue ?? null,
  };
}

export const channelsService: ChannelsService = {
  async list(token) {
    const raw = await apiFetch<RawConnection[]>("/api/web/channels", { token });
    return Array.isArray(raw) ? raw.map(mapConnection) : [];
  },
};
