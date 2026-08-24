import type { ChannelId } from "@/design-system/channels";

export type ChannelConnectionStatus =
  | "connected"
  | "not_connected"
  | "needs_auth"
  | "unavailable";

export interface ChannelConnectionCredentials {
  wasiIdCompany?: string | null;
  wasiIdUser?: string | null;
  /** Últimos 4 caracteres del token guardado — nunca el valor completo. */
  wasiTokenLast4?: string | null;
  instagramAccount?: string | null;
  instagramBusinessId?: string | null;
  instagramTokenLast4?: string | null;
  catalogId?: string | null;
  catalogTokenLast4?: string | null;
  serviceAccountEmail?: string | null;
  driveParentFolderId?: string | null;
  driveParentFolderUrl?: string | null;
}

export interface ChannelConnection {
  channelId: ChannelId;
  status: ChannelConnectionStatus;
  accountName: string;
  issue?: string | null;
  /** "own" | "pool" | null (flag apagado, o canal "web" que no aplica). */
  mode?: "own" | "pool" | null;
  /** Campos no-secretos guardados, para precargar "Editar" — nunca trae el token. */
  credentials?: ChannelConnectionCredentials | null;
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
    instagramBusinessId?: string | null;
    instagramToken?: string | null;
    catalogId?: string | null;
    catalogToken?: string | null;
    driveParentFolderId?: string | null;
  };
}

export interface ChannelsService {
  list(token?: string): Promise<ChannelConnection[]>;
  patch(channelId: ChannelId, data: ChannelPatch, token?: string): Promise<ChannelConnection>;
}
