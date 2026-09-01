import { apiFetch } from "./client";
import type {
  ChannelConnection,
  ChannelPatch,
  ChannelsService,
} from "@/services/interfaces/channels";
import type { ChannelId } from "@/design-system/channels";

interface RawConnection {
  channel_id: string;
  status: string;
  account_name?: string | null;
  issue?: string | null;
  mode?: "own" | "pool" | null;
  credentials?: {
    wasi_id_company?: string | null;
    wasi_id_user?: string | null;
    wasi_token_last4?: string | null;
    instagram_account?: string | null;
    instagram_business_id?: string | null;
    instagram_token_last4?: string | null;
    catalog_id?: string | null;
    catalog_token_last4?: string | null;
    drive_parent_folder_id?: string | null;
    drive_parent_folder_url?: string | null;
  } | null;
  marketplace_per_agent_enabled?: boolean | null;
}

function mapConnection(raw: RawConnection): ChannelConnection {
  return {
    channelId: raw.channel_id as ChannelId,
    status: raw.status as ChannelConnection["status"],
    accountName: raw.account_name ?? raw.channel_id,
    issue: raw.issue ?? null,
    mode: raw.mode ?? null,
    credentials: raw.credentials
      ? {
          wasiIdCompany: raw.credentials.wasi_id_company ?? null,
          wasiIdUser: raw.credentials.wasi_id_user ?? null,
          wasiTokenLast4: raw.credentials.wasi_token_last4 ?? null,
          instagramAccount: raw.credentials.instagram_account ?? null,
          instagramBusinessId: raw.credentials.instagram_business_id ?? null,
          instagramTokenLast4: raw.credentials.instagram_token_last4 ?? null,
          catalogId: raw.credentials.catalog_id ?? null,
          catalogTokenLast4: raw.credentials.catalog_token_last4 ?? null,
          driveParentFolderId: raw.credentials.drive_parent_folder_id ?? null,
        driveParentFolderUrl: raw.credentials.drive_parent_folder_url ?? null,
      }
      : null,
    marketplacePerAgentEnabled: raw.marketplace_per_agent_enabled ?? null,
  };
}

function toRawPatch(data: ChannelPatch): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.status !== undefined) out.status = data.status;
  if (data.mode !== undefined) out.mode = data.mode;
  if (data.accountName !== undefined) out.account_name = data.accountName;
  if (data.credentials) {
    const c = data.credentials;
    out.credentials = {
      wasi_id_company: c.wasiIdCompany ?? undefined,
      wasi_token: c.wasiToken ?? undefined,
      wasi_id_user: c.wasiIdUser ?? undefined,
      instagram_account: c.instagramAccount ?? undefined,
      instagram_business_id: c.instagramBusinessId ?? undefined,
      instagram_token: c.instagramToken ?? undefined,
      catalog_id: c.catalogId ?? undefined,
      catalog_token: c.catalogToken ?? undefined,
      drive_parent_folder_id: c.driveParentFolderId ?? undefined,
    };
  }
  return out;
}

export const channelsService: ChannelsService = {
  async list(token) {
    const raw = await apiFetch<RawConnection[]>("/api/web/channels", { token });
    return Array.isArray(raw) ? raw.map(mapConnection) : [];
  },

  async patch(channelId, data, token) {
    const raw = await apiFetch<RawConnection>(
      `/api/web/me/channels/${channelId}`,
      {
        method: "PATCH",
        token,
        body: toRawPatch(data),
      },
    );
    return mapConnection(raw);
  },
};
