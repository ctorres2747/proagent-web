import type { ClientChannel } from "@/services/interfaces/clients";

/**
 * Canal de origen de un cliente (Clientes/Kanban de compradores) —
 * independiente de `portals.ts` (portales de SCRAPE de Captación). Un
 * cliente puede llegar por un portal, un referido o un colega, no solo
 * por los 2 portales que el scraper vigila.
 *
 * TBD (handoff §0.2): Ciencuadras y Metrocuadrado no tienen logo oficial
 * en el repo todavía — usan respaldo de siglas hasta conseguir el SVG.
 */
export interface ClientChannelMeta {
  id: ClientChannel;
  label: string;
  /** Ruta del logo SVG, o null si todavía no hay (usa `fallback`). */
  logo: string | null;
  /** Siglas/ícono de respaldo mientras no haya logo oficial. */
  fallback: string;
}

export const CLIENT_CHANNEL_META: Record<ClientChannel, ClientChannelMeta> = {
  facebook: { id: "facebook", label: "Facebook", logo: "/channels/facebook.svg", fallback: "FB" },
  mercadolibre: {
    id: "mercadolibre",
    label: "MercadoLibre",
    logo: "/channels/mercadolibre.svg",
    fallback: "ML",
  },
  ciencuadras: { id: "ciencuadras", label: "Ciencuadras", logo: null, fallback: "CC" },
  metrocuadrado: { id: "metrocuadrado", label: "Metrocuadrado", logo: null, fallback: "M²" },
  referido: { id: "referido", label: "Referido", logo: null, fallback: "" },
  colegaje: { id: "colegaje", label: "Colegaje", logo: null, fallback: "" },
  otro: { id: "otro", label: "Otro", logo: null, fallback: "" },
};

export const CLIENT_CHANNEL_ORDER: ClientChannel[] = [
  "facebook",
  "mercadolibre",
  "ciencuadras",
  "metrocuadrado",
  "referido",
  "colegaje",
  "otro",
];
