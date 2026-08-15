import { apiFetch } from "./client";
import type {
  ChannelConnection,
  ChannelsService,
} from "@/services/interfaces/channels";
import type { ChannelId } from "@/design-system/channels";

interface RawConnection {
  channelId: string;
  status: string;
  accountName?: string;
  issue?: string | null;
}

function mapConnection(raw: RawConnection): ChannelConnection {
  return {
    channelId: raw.channelId as ChannelId,
    status: raw.status as ChannelConnection["status"],
    accountName: raw.accountName ?? raw.channelId,
    issue: raw.issue ?? null,
  };
}

export const channelsService: ChannelsService = {
  async list(token) {
    const raw = await apiFetch<RawConnection[]>("/api/web/channels", { token });
    return Array.isArray(raw) ? raw.map(mapConnection) : [];
  },
};
