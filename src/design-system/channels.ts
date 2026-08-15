/** Publishing channels shared across the ProAgent suite. */
export type ChannelId = "wasi" | "facebook" | "instagram" | "whatsapp" | "web";

/** Per-channel publication status. */
export type ChannelStatus = "published" | "progress" | "error" | "none";

export const CHANNEL_ORDER: ChannelId[] = [
  "wasi",
  "facebook",
  "instagram",
  "whatsapp",
  "web",
];

export const CHANNEL_META: Record<
  ChannelId,
  { name: string; short: string; logo: string; account: string }
> = {
  wasi: {
    name: "WASI",
    short: "W",
    logo: "/channels/wasi.svg",
    account: "proinversores.wasi",
  },
  facebook: {
    name: "Facebook Marketplace",
    short: "F",
    logo: "/channels/facebook.svg",
    account: "Proinversores Medellín",
  },
  instagram: {
    name: "Instagram",
    short: "I",
    logo: "/channels/instagram.svg",
    account: "@proinversores.co",
  },
  whatsapp: {
    name: "WhatsApp (catálogo)",
    short: "Wa",
    logo: "/channels/whatsapp.svg",
    account: "No conectado",
  },
  web: {
    name: "Sitio web",
    short: "Web",
    logo: "/channels/web.svg",
    account: "proinversores.com.co",
  },
};

/** Status label + Tailwind classes (never color-only — always a text label). */
export const STATUS_META: Record<
  ChannelStatus,
  { label: string; chip: string }
> = {
  published: {
    label: "Publicado",
    chip: "bg-[var(--pa-success-bg)] text-[var(--pa-accent)]",
  },
  progress: {
    label: "En proceso",
    chip: "bg-[var(--pa-warning-bg)] text-[var(--pa-warning-ink)]",
  },
  error: {
    label: "Error",
    chip: "bg-[var(--pa-danger-bg)] text-[var(--pa-danger)]",
  },
  none: {
    label: "Sin publicar",
    chip: "bg-[var(--pa-bg-alt)] text-[var(--pa-faint)]",
  },
};
