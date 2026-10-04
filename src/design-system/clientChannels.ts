import type { ClientChannel } from "@/services/interfaces/clients";

/**
 * Canal de origen de un cliente (Clientes/Kanban de compradores) —
 * independiente de `portals.ts` (portales de SCRAPE de Captación). Un
 * cliente puede llegar por un portal, un referido o un colega, no solo
 * por los 2 portales que el scraper vigila.
 *
 * Los 4 logos (Facebook, MercadoLibre, Ciencuadras, Metrocuadrado) son los
 * oficiales, bajados directo de ciencuadras.com y metrocuadrado.com
 * (handoff §0.2, resuelto — ya no hace falta el respaldo de siglas para
 * esos 4; `fallback` queda solo como red de seguridad si un logo no carga).
 */
export interface ClientChannelMeta {
  id: ClientChannel;
  label: string;
  /** Ruta del logo SVG, o null si no aplica (usa `fallback`). */
  logo: string | null;
  /** Siglas/ícono de respaldo si el logo no existe o no carga. */
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
  ciencuadras: {
    id: "ciencuadras",
    label: "Ciencuadras",
    logo: "/channels/ciencuadras.svg",
    fallback: "CC",
  },
  metrocuadrado: {
    id: "metrocuadrado",
    label: "Metrocuadrado",
    logo: "/channels/metrocuadrado.svg",
    fallback: "M²",
  },
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
