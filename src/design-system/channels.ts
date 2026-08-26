/** Publishing channels shared across the ProAgent suite. */
export type ChannelId = "wasi" | "facebook" | "instagram" | "whatsapp" | "web" | "entrega";

/** Per-channel publication status. */
export type ChannelStatus = "published" | "progress" | "error" | "none";

export const CHANNEL_ORDER: ChannelId[] = [
  "wasi",
  "facebook",
  "instagram",
  "whatsapp",
  "entrega",
  "web",
];

export const CHANNEL_META: Record<
  ChannelId,
  {
    name: string;
    /** Línea secundaria en cards (Marketplace, Catálogo…). Vacío = no mostrar. */
    subtitle: string;
    short: string;
    logo: string;
  }
> = {
  wasi: {
    name: "WASI",
    subtitle: "",
    short: "W",
    logo: "/channels/wasi.svg",
  },
  facebook: {
    name: "Facebook",
    subtitle: "Marketplace",
    short: "F",
    logo: "/channels/facebook.svg",
  },
  instagram: {
    name: "Instagram",
    subtitle: "",
    short: "I",
    logo: "/channels/instagram.svg",
  },
  whatsapp: {
    name: "WhatsApp",
    subtitle: "Catálogo",
    short: "Wa",
    logo: "/channels/whatsapp.svg",
  },
  entrega: {
    name: "Google Drive",
    subtitle: "",
    short: "GD",
    logo: "/channels/entrega.svg",
  },
  web: {
    name: "Sitio web",
    subtitle: "",
    short: "Web",
    logo: "/channels/web.svg",
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
