import type { ChannelId } from "@/design-system/channels";
import { apiFetch } from "./client";
import type {
  ChannelResult,
  Publication,
  PublicationFilter,
  PublicationStatus,
  PublicationsService,
} from "@/services/interfaces/publications";

const LIST_PATH = "/api/web/publications";
const detailPath = (id: string) => `/api/web/publications/${id}`;

interface RawChannelResult {
  channelId: string;
  status: string;
  publishedAt?: string | null;
  startedAt?: string | null;
  durationSeconds?: number | null;
  externalRef?: string | null;
  errorMessage?: string | null;
  statusNote?: string | null;
  recommendedAction?: string | null;
}

interface RawPublication {
  id: string | number;
  propertyId: string;
  sharedTitle?: string;
  sharedBody?: string;
  platformContent?: {
    channelId: string;
    title?: string;
    body?: string;
    isAiGenerated?: boolean;
  }[];
  selectedChannels?: string[];
  status: string;
  scheduledFor?: string | null;
  timezone?: string | null;
  channelResults?: RawChannelResult[];
  createdAt: string;
  updatedAt: string;
}

function mapResult(raw: RawChannelResult): ChannelResult {
  return {
    channelId: raw.channelId as ChannelId,
    status: raw.status as ChannelResult["status"],
    publishedAt: raw.publishedAt ?? null,
    startedAt: raw.startedAt ?? null,
    durationSeconds: raw.durationSeconds ?? null,
    externalRef: raw.externalRef ?? null,
    errorMessage: raw.errorMessage ?? null,
    statusNote: raw.statusNote ?? null,
    recommendedAction: raw.recommendedAction ?? null,
  };
}

function mapPub(raw: RawPublication & { property_id?: string }): Publication {
  return {
    id: String(raw.id),
    propertyId: String(raw.propertyId ?? raw.property_id ?? ""),
    sharedTitle: raw.sharedTitle ?? "",
    sharedBody: raw.sharedBody ?? "",
    platformContent: (raw.platformContent ?? []).map((pc) => ({
      channelId: pc.channelId as ChannelId,
      title: pc.title ?? "",
      body: pc.body ?? "",
      isAiGenerated: Boolean(pc.isAiGenerated),
    })),
    selectedChannels: (raw.selectedChannels ?? []) as ChannelId[],
    status: raw.status as PublicationStatus,
    scheduledFor: raw.scheduledFor ?? null,
    timezone: raw.timezone ?? null,
    channelResults: (raw.channelResults ?? []).map(mapResult),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export const publicationsService: PublicationsService = {
  async list(filter: PublicationFilter, token) {
    const raw = await apiFetch<RawPublication[]>(LIST_PATH, {
      token,
      query: { filter },
    });
    return Array.isArray(raw) ? raw.map(mapPub) : [];
  },

  async createDraft(propertyId, token) {
    const raw = await apiFetch<RawPublication>(LIST_PATH, {
      method: "POST",
      token,
      body: { property_id: propertyId },
    });
    return mapPub(raw);
  },

  async get(id, token) {
    const raw = await apiFetch<RawPublication>(detailPath(id), { token });
    return mapPub(raw);
  },

  async patch(id, data, token) {
    const body: Record<string, unknown> = {};
    if (data.sharedTitle !== undefined) body.shared_title = data.sharedTitle;
    if (data.sharedBody !== undefined) body.shared_body = data.sharedBody;
    if (data.selectedChannels !== undefined) {
      body.selected_channels = data.selectedChannels;
    }
    if (data.platformContent !== undefined) {
      body.platform_content = {
        channel_id: data.platformContent.channelId,
        title: data.platformContent.title,
        body: data.platformContent.body,
        is_ai_generated: data.platformContent.isAiGenerated,
      };
    }
    if (data.scheduledFor !== undefined) body.scheduled_for = data.scheduledFor;
    if (data.timezone !== undefined) body.timezone = data.timezone;
    if (data.status !== undefined) body.status = data.status;

    const raw = await apiFetch<RawPublication>(detailPath(id), {
      method: "PATCH",
      token,
      body,
    });
    return mapPub(raw);
  },

  async publish(id, opts, token) {
    const raw = await apiFetch<RawPublication>(`${detailPath(id)}/publish`, {
      method: "POST",
      token,
      body: {
        scheduled_for: opts?.scheduledFor,
        timezone: opts?.timezone,
      },
    });
    return mapPub(raw);
  },

  async results(id, token) {
    const raw = await apiFetch<RawChannelResult[]>(`${detailPath(id)}/results`, {
      token,
    });
    return Array.isArray(raw) ? raw.map(mapResult) : [];
  },

  async retryChannel(id, channelId, token) {
    const raw = await apiFetch<RawChannelResult>(
      `${detailPath(id)}/channels/${channelId}/retry`,
      { method: "POST", token },
    );
    return mapResult(raw);
  },

  async removeChannel(id, channelId, token) {
    const raw = await apiFetch<RawChannelResult>(
      `${detailPath(id)}/channels/${channelId}`,
      { method: "DELETE", token },
    );
    return mapResult(raw);
  },

  async republishChannel(id, channelId, token) {
    const raw = await apiFetch<RawChannelResult>(
      `${detailPath(id)}/channels/${channelId}/republish`,
      { method: "POST", token },
    );
    return mapResult(raw);
  },

  async aiSuggest(id, action, token) {
    return apiFetch<{ title: string; body: string }>(`${detailPath(id)}/ai`, {
      method: "POST",
      token,
      body: { action },
    });
  },
};
