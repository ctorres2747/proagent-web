import type { ChannelConnection, ChannelPatch } from "@/services/interfaces/channels";

let mockConnections: ChannelConnection[] = [
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
    channelId: "entrega",
    status: "connected",
    accountName: "Entrega Inmobiliaria (Drive)",
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
    return mockConnections.map((c) => ({ ...c }));
  },

  async patch(channelId: ChannelConnection["channelId"], data: ChannelPatch) {
    await new Promise((r) => setTimeout(r, 400));
    mockConnections = mockConnections.map((c) => {
      if (c.channelId !== channelId) return c;
      const next: ChannelConnection = { ...c };
      if (data.status === "not_connected") {
        next.status = "not_connected";
        next.issue = null;
      } else if (data.status === "connected") {
        next.status = "connected";
        next.issue = null;
        if (data.mode === "pool") {
          next.accountName = `${c.accountName} (pool)`;
        }
      }
      return next;
    });
    const found = mockConnections.find((c) => c.channelId === channelId);
    if (!found) throw new Error("Canal no encontrado");
    return { ...found };
  },
};
