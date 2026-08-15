import type { ChannelConnection } from "@/services/interfaces/channels";

const MOCK_CONNECTIONS: ChannelConnection[] = [
  {
    channelId: "wasi",
    status: "connected",
    accountName: "WASI",
  },
  {
    channelId: "facebook",
    status: "connected",
    accountName: "Facebook Marketplace",
  },
  {
    channelId: "instagram",
    status: "connected",
    accountName: "Instagram",
  },
  {
    channelId: "whatsapp",
    status: "not_connected",
    accountName: "WhatsApp Catalog",
    issue:
      "Catálogo Meta no configurado (META_CATALOG_ID / META_CATALOG_TOKEN en VPS)",
  },
  {
    channelId: "web",
    status: "unavailable",
    accountName: "Sitio web",
    issue: "Publicación web aún no implementada en el motor",
  },
];

export const channelsService = {
  async list(): Promise<ChannelConnection[]> {
    return MOCK_CONNECTIONS;
  },
};
