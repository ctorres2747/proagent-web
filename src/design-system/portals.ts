/** Portales de captación (scrape) — distintos de canales de publicación. */

export type ScrapePortalId = "facebook" | "mercadolibre";

export interface PortalMeta {
  id: ScrapePortalId;
  name: string;
  logo: string;
}

const PORTAL_META: Record<ScrapePortalId, PortalMeta> = {
  facebook: {
    id: "facebook",
    name: "Facebook",
    logo: "/channels/facebook.svg",
  },
  mercadolibre: {
    id: "mercadolibre",
    name: "MercadoLibre",
    logo: "/channels/mercadolibre.svg",
  },
};

/** Normaliza el string `portal` del lead (API/scraper) a un id conocido. */
export function resolveScrapePortal(portal: string): PortalMeta | null {
  const p = portal.trim().toLowerCase();
  if (!p) return null;
  if (p.includes("facebook") || p === "fb" || p === "marketplace") {
    return PORTAL_META.facebook;
  }
  if (
    p.includes("mercado") ||
    p.includes("meli") ||
    p === "ml" ||
    p.includes("mercadolibre")
  ) {
    return PORTAL_META.mercadolibre;
  }
  return null;
}
