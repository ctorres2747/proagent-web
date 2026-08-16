import type { ChannelId } from "@/design-system/channels";

export type PublicationStatus =
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "partial"
  | "failed";

export type ChannelResultStatus =
  | "waiting"
  | "pending"
  | "publishing"
  | "published"
  | "failed"
  | "scheduled"
  | "unavailable";

export interface ChannelResult {
  channelId: ChannelId;
  status: ChannelResultStatus;
  publishedAt: string | null;
  externalRef: string | null;
  errorMessage: string | null;
  recommendedAction: string | null;
}

export interface PlatformContent {
  channelId: ChannelId;
  title: string;
  body: string;
  isAiGenerated: boolean;
}

export type PublicationFilter =
  | "all"
  | "draft"
  | "scheduled"
  | "published"
  | "error";

export interface Publication {
  id: string;
  propertyId: string;
  sharedTitle: string;
  sharedBody: string;
  platformContent: PlatformContent[];
  selectedChannels: ChannelId[];
  status: PublicationStatus;
  scheduledFor: string | null;
  timezone: string | null;
  channelResults: ChannelResult[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicationsService {
  list(filter: PublicationFilter, token?: string): Promise<Publication[]>;
  createDraft(propertyId: string, token?: string): Promise<Publication>;
  get(id: string, token?: string): Promise<Publication>;
  patch(
    id: string,
    data: {
      sharedTitle?: string;
      sharedBody?: string;
      selectedChannels?: ChannelId[];
      platformContent?: PlatformContent;
      scheduledFor?: string | null;
      timezone?: string | null;
      status?: PublicationStatus;
    },
    token?: string,
  ): Promise<Publication>;
  publish(
    id: string,
    opts?: { scheduledFor?: string; timezone?: string },
    token?: string,
  ): Promise<Publication>;
  results(id: string, token?: string): Promise<ChannelResult[]>;
  retryChannel(
    id: string,
    channelId: ChannelId,
    token?: string,
  ): Promise<ChannelResult>;
  removeChannel(
    id: string,
    channelId: ChannelId,
    token?: string,
  ): Promise<ChannelResult>;
  republishChannel(
    id: string,
    channelId: ChannelId,
    token?: string,
  ): Promise<ChannelResult>;
  aiSuggest(
    id: string,
    action:
      | "generate"
      | "improve"
      | "shorten"
      | "professional"
      | "persuasive",
    token?: string,
  ): Promise<{ title: string; body: string }>;
}
