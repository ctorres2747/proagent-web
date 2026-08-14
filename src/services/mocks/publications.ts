import type { ChannelId } from "@/design-system/channels";
import type {
  Publication,
  PublicationFilter,
  PublicationsService,
} from "@/services/interfaces/publications";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const now = () => new Date().toISOString();

const SEED_PUBLICATIONS: Publication[] = [
  {
    id: "pub-seed-draft",
    propertyId: "1",
    sharedTitle: "Apartamento en Envigado",
    sharedBody: "Borrador pendiente de revisión.",
    platformContent: [],
    selectedChannels: ["wasi", "web"],
    status: "draft",
    scheduledFor: null,
    timezone: null,
    channelResults: [],
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "pub-seed-scheduled",
    propertyId: "2",
    sharedTitle: "Casa en Sabaneta",
    sharedBody: "Programada para publicación automática.",
    platformContent: [],
    selectedChannels: ["wasi", "instagram", "web"],
    status: "scheduled",
    scheduledFor: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    timezone: "America/Bogota",
    channelResults: [
      { channelId: "wasi", status: "scheduled", publishedAt: null, externalRef: null, errorMessage: null, recommendedAction: null },
      { channelId: "instagram", status: "scheduled", publishedAt: null, externalRef: null, errorMessage: null, recommendedAction: null },
      { channelId: "web", status: "scheduled", publishedAt: null, externalRef: null, errorMessage: null, recommendedAction: null },
    ],
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "pub-seed-published",
    propertyId: "3",
    sharedTitle: "Local en Laureles",
    sharedBody: "Publicada en canales seleccionados.",
    platformContent: [],
    selectedChannels: ["wasi", "web"],
    status: "published",
    scheduledFor: null,
    timezone: null,
    channelResults: [
      { channelId: "wasi", status: "published", publishedAt: now(), externalRef: "mock-wasi-1", errorMessage: null, recommendedAction: null },
      { channelId: "web", status: "published", publishedAt: now(), externalRef: "mock-web-1", errorMessage: null, recommendedAction: null },
    ],
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "pub-seed-error",
    propertyId: "4",
    sharedTitle: "Apartamento en Belén",
    sharedBody: "Error en un canal.",
    platformContent: [],
    selectedChannels: ["wasi", "facebook"],
    status: "partial",
    scheduledFor: null,
    timezone: null,
    channelResults: [
      { channelId: "wasi", status: "published", publishedAt: now(), externalRef: "mock-wasi-2", errorMessage: null, recommendedAction: null },
      { channelId: "facebook", status: "failed", publishedAt: null, externalRef: null, errorMessage: "Error temporal de Marketplace", recommendedAction: "Reintentar" },
    ],
    createdAt: now(),
    updatedAt: now(),
  },
];

const store = new Map<string, Publication>(
  SEED_PUBLICATIONS.map((p) => [p.id, { ...p }]),
);

function matchesFilter(pub: Publication, filter: PublicationFilter): boolean {
  if (filter === "all") return true;
  if (filter === "error") return pub.status === "failed" || pub.status === "partial";
  if (filter === "published") return pub.status === "published" || pub.status === "partial";
  return pub.status === filter;
}

export const publicationsService: PublicationsService = {
  async list(filter) {
    await delay(200);
    return [...store.values()]
      .filter((p) => matchesFilter(p, filter))
      .map((p) => ({ ...p, channelResults: [...p.channelResults] }));
  },

  async createDraft(propertyId) {
    await delay(200);
    const id = `pub-${Date.now()}`;
    const pub: Publication = {
      id,
      propertyId,
      sharedTitle: "",
      sharedBody: "",
      platformContent: [],
      selectedChannels: ["wasi", "instagram", "facebook"],
      status: "draft",
      scheduledFor: null,
      timezone: null,
      channelResults: [],
      createdAt: now(),
      updatedAt: now(),
    };
    store.set(id, pub);
    return { ...pub };
  },

  async get(id) {
    await delay(150);
    const pub = store.get(id);
    if (!pub) throw new Error(`Publicación ${id} no encontrada`);
    return { ...pub };
  },

  async patch(id, data) {
    await delay(200);
    const current = store.get(id);
    if (!current) throw new Error(`Publicación ${id} no encontrada`);
    const next: Publication = {
      ...current,
      sharedTitle: data.sharedTitle ?? current.sharedTitle,
      sharedBody: data.sharedBody ?? current.sharedBody,
      selectedChannels: data.selectedChannels ?? current.selectedChannels,
      scheduledFor:
        data.scheduledFor !== undefined ? data.scheduledFor : current.scheduledFor,
      timezone: data.timezone !== undefined ? data.timezone : current.timezone,
      status: data.status ?? current.status,
      updatedAt: now(),
      platformContent: current.platformContent,
      channelResults:
        data.status === "draft" && data.scheduledFor === null
          ? []
          : current.channelResults,
    };
    if (data.platformContent) {
      const others = next.platformContent.filter(
        (p) => p.channelId !== data.platformContent!.channelId,
      );
      next.platformContent = [...others, data.platformContent];
    }
    store.set(id, next);
    return { ...next };
  },

  async publish(id, opts) {
    await delay(400);
    const current = store.get(id);
    if (!current) throw new Error(`Publicación ${id} no encontrada`);
    if (opts?.scheduledFor) {
      const next: Publication = {
        ...current,
        status: "scheduled",
        scheduledFor: opts.scheduledFor,
        timezone: opts.timezone ?? "America/Bogota",
        updatedAt: now(),
        channelResults: current.selectedChannels.map((channelId) => ({
          channelId,
          status: "scheduled" as const,
          publishedAt: null,
          externalRef: null,
          errorMessage: null,
          recommendedAction: null,
        })),
      };
      store.set(id, next);
      return { ...next };
    }
    const channels: ChannelId[] =
      current.selectedChannels.length > 0
        ? current.selectedChannels
        : (["wasi", "instagram"] as ChannelId[]);
    const next: Publication = {
      ...current,
      status: "published",
      updatedAt: now(),
      channelResults: channels.map((channelId) => ({
        channelId,
        status: channelId === "facebook" ? "failed" : "published",
        publishedAt: now(),
        externalRef: channelId === "facebook" ? null : `mock-${channelId}`,
        errorMessage:
          channelId === "facebook"
            ? "La página de Facebook no tiene permisos de publicación."
            : null,
        recommendedAction: channelId === "facebook" ? "Reintentar" : null,
      })),
    };
    store.set(id, next);
    return { ...next };
  },

  async results(id) {
    await delay(100);
    const pub = store.get(id);
    if (!pub) throw new Error(`Publicación ${id} no encontrada`);
    return [...pub.channelResults];
  },

  async retryChannel(id, channelId) {
    await delay(350 + Math.random() * 400);
    const current = store.get(id);
    if (!current) throw new Error(`Publicación ${id} no encontrada`);
    const fail = Math.random() < 0.35;
    const result = {
      channelId,
      status: fail ? ("failed" as const) : ("published" as const),
      publishedAt: fail ? null : now(),
      externalRef: fail ? null : `mock-retry-${channelId}`,
      errorMessage: fail
        ? "Reintento falló (simulado). Vuelve a intentar."
        : null,
      recommendedAction: fail ? "Reintentar" : null,
    };
    const others = current.channelResults.filter((r) => r.channelId !== channelId);
    const next = {
      ...current,
      channelResults: [...others, result],
      updatedAt: now(),
    };
    store.set(id, next);
    return result;
  },

  async aiSuggest(_id, action) {
    await delay(300);
    const variants: Record<string, { title: string; body: string }> = {
      generate: {
        title: "Apartamento en excelente ubicación",
        body: "Propiedad lista para habitar. Agenda tu visita con Proinversores.",
      },
      improve: {
        title: "Oportunidad única — inmueble en zona de alta valorización",
        body: "Diseño funcional y buena ubicación. Contáctanos para más detalles.",
      },
      shorten: {
        title: "Propiedad en el Valle de Aburrá",
        body: "Agenda visita con Proinversores.",
      },
      professional: {
        title: "Inmueble en excelente estado",
        body: "Presentamos una propiedad con características competitivas de mercado.",
      },
      persuasive: {
        title: "No dejes pasar esta oportunidad",
        body: "Pocos interesados pueden verla esta semana. Escribe ahora.",
      },
    };
    return variants[action] ?? variants.generate;
  },
};