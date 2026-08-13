import type { ChannelId } from "@/design-system/channels";
import type {
  Publication,
  PublicationsService,
} from "@/services/interfaces/publications";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const store = new Map<string, Publication>();

function now() {
  return new Date().toISOString();
}

export const publicationsService: PublicationsService = {
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
