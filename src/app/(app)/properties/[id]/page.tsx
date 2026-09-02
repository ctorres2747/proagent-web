"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { propertiesService, publicationsService, channelsService, wasiFeaturesService } from "@/services";
import type {
  Condition,
  Intent,
  Property,
} from "@/services/interfaces/properties";
import { applyIntentToTitle } from "@/lib/intent";
import {
  applyToggleRepublishDefaults,
  publishedOptInChannelsFromProperty,
} from "@/lib/channelRepublishDefaults";
import type {
  ChannelResult,
  ChannelResultStatus,
  PlatformContent,
  Publication,
} from "@/services/interfaces/publications";
import type { ChannelConnection } from "@/services/interfaces/channels";
import {
  CHANNEL_META,
  CHANNEL_ORDER,
  STATUS_META,
  type ChannelId,
  type ChannelStatus,
} from "@/design-system/channels";
import { ChannelLogo } from "@/components/ChannelLogo";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Spinner } from "@/components/Spinner";
import { WasiFeaturesCheckboxes } from "@/components/properties/WasiFeaturesCheckboxes";
import { DeletePropertyDialog } from "@/components/DeletePropertyDialog";
import { formatPrice } from "@/lib/format";
import { capturedAtLabel } from "@/lib/formatCapturedAt";
import {
  checklistForTipo,
  formatDriveMissingFields,
  formatMissingFields,
  isDrivePublishReady,
  isFieldComplete,
  isResidentialTipo,
  isWasiPublishReady,
  missingFieldsFromDraft,
  DRIVE_PUBLISH_HINT,
  WASI_PUBLISH_HINT,
} from "@/lib/completeness";
import {
  validateWasiTitle,
  wasiTitleCounterTone,
  wasiTitleLength,
  WASI_TITLE_MAX_LENGTH,
} from "@/lib/wasiTitle";
import {
  DRIVE_PARKING_OPTIONS,
  DRIVE_PROPERTY_LIENS_OPTIONS,
} from "@/lib/driveFieldOptions";
import { driveFieldOptionsService } from "@/services/http/driveFieldOptions";
import {
  DEFAULT_TIMEZONE,
  buildScheduleIso,
  formatScheduledFor,
  scheduleValidationError,
  tomorrowDateString,
} from "@/lib/schedule";
import {
  initialWizardStep,
  pickCanonicalPublication,
} from "@/lib/publicationResolve";
import { ApiError } from "@/services/http/client";
import {
  getMarketplaceLoginStatus,
  triggerMarketplaceLogin,
} from "@/services/http/marketplaceLogin";
import { formatChannelDurationLine, formatChannelResultMeta } from "@/lib/channelResults";
import {
  isChannelPersonalized,
  platformContentForChannel,
} from "@/lib/publicationContent";
import { usePublicationPoll } from "@/hooks/usePublicationPoll";

type StepId =
  | "content"
  | "photos"
  | "channels"
  | "customize"
  | "preview"
  | "results";

const STEPS: { id: StepId; label: string }[] = [
  { id: "content", label: "Contenido" },
  { id: "photos", label: "Fotos" },
  { id: "channels", label: "Canales" },
  { id: "customize", label: "Personalizar" },
  { id: "preview", label: "Vista previa" },
  { id: "results", label: "Resultados" },
];

const label = "mb-1.5 text-xs font-bold text-[var(--pa-muted)]";
const input =
  "w-full rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3.5 py-2.5 text-[13px] font-semibold text-[var(--pa-ink)] outline-none focus:border-[var(--pa-navy)]";

// Estrato socioeconómico colombiano: 1 a 6, sin excepciones por tipo de
// inmueble (mismo criterio que WASI/backend/completeness.py).
const ESTRATO_OPTIONS = ["1", "2", "3", "4", "5", "6"];

function mapResultStatus(status: ChannelResultStatus): ChannelStatus {
  if (status === "published") return "published";
  if (status === "failed") return "error";
  if (status === "publishing" || status === "pending") return "progress";
  if (status === "scheduled") return "progress";
  if (status === "waiting" || status === "unavailable") return "none";
  return "none";
}

function channelResultChipLabel(
  apiStatus: ChannelResultStatus,
  uiStatus: ChannelStatus,
): string {
  if (apiStatus === "scheduled") return "Programado";
  if (apiStatus === "publishing" || apiStatus === "pending") {
    return "En proceso";
  }
  return STATUS_META[uiStatus].label;
}

type ContentFormSnapshot = {
  titulo: string;
  descripcion: string;
  telefonoContacto: string;
  nombreContacto: string;
  municipio: string;
  barrio: string;
  tipo: string;
  intent: Intent;
  condicion: Condition | null;
  precio: string;
  alcobas: string;
  banos: string;
  parqueaderos: string;
  estrato: string;
  piso: string;
  areaM2: string;
  areaPrivada: string;
  areaConstruida: string;
  administracion: string;
  anioConstruccion: string;
  direccion: string;
  codigoPostal: string;
  featureIds: number[];
  predial: string;
  afectacionesInmueble: string;
  afectacionesDetalle: string;
  observacionesInmueble: string;
  precioMinimoCliente: string;
  puntosFavorablesExternos: string;
  detalleParqueadero: string;
  frenteFondoM: string;
};

function emptyContentForm(): ContentFormSnapshot {
  return {
    titulo: "",
    descripcion: "",
    telefonoContacto: "",
    nombreContacto: "",
    municipio: "",
    barrio: "",
    tipo: "",
    intent: "Venta",
    condicion: null,
    precio: "",
    alcobas: "",
    banos: "",
    parqueaderos: "",
    estrato: "",
    piso: "",
    areaM2: "",
    areaPrivada: "",
    areaConstruida: "",
    administracion: "",
    anioConstruccion: "",
    direccion: "",
    codigoPostal: "",
    featureIds: [],
    predial: "",
    afectacionesInmueble: "",
    afectacionesDetalle: "",
    observacionesInmueble: "",
    precioMinimoCliente: "",
    puntosFavorablesExternos: "",
    detalleParqueadero: "",
    frenteFondoM: "",
  };
}

function snapshotFromProperty(property: Property): ContentFormSnapshot {
  return {
    titulo: property.titulo ?? "",
    descripcion: property.descripcion ?? "",
    telefonoContacto: property.telefonoContacto ?? "",
    nombreContacto: property.nombreContacto ?? "",
    municipio: property.municipio ?? "",
    barrio: property.barrio ?? "",
    tipo: property.tipo ?? "",
    intent: property.intent,
    condicion: property.condicion,
    precio: property.precio != null ? String(property.precio) : "",
    alcobas: property.alcobas != null ? String(property.alcobas) : "",
    banos: property.banos != null ? String(property.banos) : "",
    parqueaderos:
      property.parqueaderos != null ? String(property.parqueaderos) : "",
    estrato: property.estrato != null ? String(property.estrato) : "",
    piso: property.piso != null ? String(property.piso) : "",
    areaM2: property.areaM2 != null ? String(property.areaM2) : "",
    areaPrivada:
      property.areaPrivada != null ? String(property.areaPrivada) : "",
    areaConstruida:
      property.areaConstruida != null ? String(property.areaConstruida) : "",
    administracion:
      property.administracion != null ? String(property.administracion) : "",
    anioConstruccion:
      property.anioConstruccion != null ? String(property.anioConstruccion) : "",
    direccion: property.direccion ?? "",
    codigoPostal: property.codigoPostal ?? "",
    featureIds: [...(property.featureIds ?? [])],
    predial: property.predial ?? "",
    afectacionesInmueble: property.afectacionesInmueble ?? "",
    afectacionesDetalle: property.afectacionesDetalle ?? "",
    observacionesInmueble: property.observacionesInmueble ?? "",
    precioMinimoCliente: property.precioMinimoCliente ?? "",
    puntosFavorablesExternos: property.puntosFavorablesExternos ?? "",
    detalleParqueadero: property.detalleParqueadero ?? "",
    frenteFondoM: property.frenteFondoM ?? "",
  };
}

function parsePrecioInput(v: string): number | null {
  const t = v.replace(/\./g, "").replace(/,/g, "").trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function parseIntInput(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t.replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function featureIdsEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

function contentFormsEqual(a: ContentFormSnapshot, b: ContentFormSnapshot): boolean {
  return (
    a.titulo === b.titulo &&
    a.descripcion === b.descripcion &&
    a.telefonoContacto === b.telefonoContacto &&
    a.nombreContacto === b.nombreContacto &&
    a.municipio === b.municipio &&
    a.barrio === b.barrio &&
    a.tipo === b.tipo &&
    a.intent === b.intent &&
    a.condicion === b.condicion &&
    a.precio === b.precio &&
    a.alcobas === b.alcobas &&
    a.banos === b.banos &&
    a.parqueaderos === b.parqueaderos &&
    a.estrato === b.estrato &&
    a.piso === b.piso &&
    a.areaM2 === b.areaM2 &&
    a.areaPrivada === b.areaPrivada &&
    a.areaConstruida === b.areaConstruida &&
    a.administracion === b.administracion &&
    a.anioConstruccion === b.anioConstruccion &&
    a.direccion === b.direccion &&
    a.codigoPostal === b.codigoPostal &&
    featureIdsEqual(a.featureIds, b.featureIds) &&
    a.predial === b.predial &&
    a.afectacionesInmueble === b.afectacionesInmueble &&
    a.afectacionesDetalle === b.afectacionesDetalle &&
    a.observacionesInmueble === b.observacionesInmueble &&
    a.precioMinimoCliente === b.precioMinimoCliente &&
    a.puntosFavorablesExternos === b.puntosFavorablesExternos &&
    a.detalleParqueadero === b.detalleParqueadero &&
    a.frenteFondoM === b.frenteFondoM
  );
}

function formatActionError(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message) return err.message;
  return fallback;
}

export default function PublishWizardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const [step, setStep] = useState<StepId>("content");
  const [publication, setPublication] = useState<Publication | null>(null);
  const [draftBusy, setDraftBusy] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProperty, setDeletingProperty] = useState(false);

  // Content form
  const [contentForm, setContentForm] = useState<ContentFormSnapshot>(emptyContentForm);
  const patchContent = (patch: Partial<ContentFormSnapshot>) =>
    setContentForm((prev) => ({ ...prev, ...patch }));
  const [savedContent, setSavedContent] = useState<ContentFormSnapshot | null>(
    null,
  );

  // Customize form
  const [sharedTitle, setSharedTitle] = useState("");
  const [sharedBody, setSharedBody] = useState("");
  const [platformContent, setPlatformContent] = useState<
    Partial<Record<ChannelId, { title: string; body: string }>>
  >({});

  // Channels
  const [selectedChannels, setSelectedChannels] = useState<
    Record<ChannelId, boolean>
  >({
    wasi: true,
    facebook: true,
    instagram: true,
    whatsapp: false,
    entrega: false,
    web: false,
  });
  const [savedSelectedChannels, setSavedSelectedChannels] = useState<
    Record<ChannelId, boolean> | null
  >(null);
  const [savedCustomizeSnapshot, setSavedCustomizeSnapshot] = useState<{
    sharedTitle: string;
    sharedBody: string;
    platformContent: Partial<Record<ChannelId, { title: string; body: string }>>;
  } | null>(null);
  const [republishedChannelIds, setRepublishedChannelIds] = useState<
    Set<ChannelId>
  >(() => new Set());

  const { data: channelConnections } = useQuery({
    queryKey: ["channel-connections"],
    queryFn: () => channelsService.list(token ?? undefined),
  });

  const {
    data: property,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["property", params.id],
    queryFn: () => propertiesService.get(params.id, token ?? undefined),
    enabled: Boolean(params.id),
  });

  // Seed form from property when loaded
  useEffect(() => {
    if (!property) return;
    const snapshot = snapshotFromProperty(property);
    setContentForm(snapshot);
    setSavedContent(snapshot);
  }, [property]);

  // Create draft when property id is available; deps omit full property
  // object so query invalidation does not recreate the draft mid-wizard.
  useEffect(() => {
    if (!property) return;
    const propId = property.id;
    const seedTitle = property.titulo;
    const seedBody = property.descripcion;
    let cancelled = false;
    setPublication(null);
    setDraftBusy(true);
    setDraftError(null);

    publicationsService
      .list("all", token ?? undefined)
      .then(async (all) => {
        if (cancelled) return;
        let pub = pickCanonicalPublication(all, propId);
        if (!pub) {
          pub = await publicationsService.createDraft(propId, token ?? undefined);
        } else {
          pub = await publicationsService.get(pub.id, token ?? undefined);
        }
        if (cancelled) return;
        setPublication(pub);

        // Pedido de Cristhian (2026-09-02): se elimina la sugerencia
        // automática de título/descripción (Sprint 049) — pisaba con texto
        // de plantilla (placeholders tipo "[barrio]", "[XX] Millones COP")
        // aun cuando la ficha SÍ tenía una descripción real, cada vez que
        // sharedTitle/sharedBody del borrador coincidían con el seed de la
        // ficha — que es el caso normal, tanto si la ficha está vacía como
        // si el agente ya la escribió y nunca la volvió a tocar desde el
        // borrador. sharedTitle/sharedBody ahora siempre reflejan lo que de
        // verdad hay en la ficha (o lo que el agente ya guardó en el
        // borrador): si está vacío, se queda vacío y el chequeo de
        // completitud lo marca como obligatorio, en vez de disfrazarlo.
        const realTitle = pub.sharedTitle || seedTitle || "";
        const realBody = pub.sharedBody || seedBody || "";

        setSharedTitle(realTitle);
        setSharedBody(realBody);
        const contentMap: Partial<
          Record<ChannelId, { title: string; body: string }>
        > = {};
        for (const pc of pub.platformContent ?? []) {
          contentMap[pc.channelId] = { title: pc.title, body: pc.body };
        }
        setPlatformContent(contentMap);
        if (pub.selectedChannels.length === 0) {
          const wasiReady = isWasiPublishReady(property.missingFields);
          const toggles = applyToggleRepublishDefaults(
            {
              wasi: wasiReady,
              facebook: true,
              instagram: true,
              whatsapp: false,
              entrega: false,
              web: false,
            },
            publishedOptInChannelsFromProperty(property),
          );
          setSelectedChannels(toggles);
          setSavedSelectedChannels(toggles);
        } else {
          const toggles = applyToggleRepublishDefaults(
            Object.fromEntries(
              CHANNEL_ORDER.map((id) => [
                id,
                pub.selectedChannels.includes(id),
              ]),
            ) as Record<ChannelId, boolean>,
            publishedOptInChannelsFromProperty(property),
          );
          if (!isWasiPublishReady(property.missingFields)) {
            toggles.wasi = false;
          }
          setSelectedChannels(toggles);
          setSavedSelectedChannels(toggles);
          setSavedCustomizeSnapshot({
            sharedTitle: pub.sharedTitle || seedTitle || "",
            sharedBody: pub.sharedBody || seedBody || "",
            platformContent: contentMap,
          });
        }
        setStep(initialWizardStep(pub));
      })
      .catch(() => {
        if (!cancelled) {
          setDraftError("No se pudo crear el borrador de publicación.");
        }
      })
      .finally(() => {
        if (!cancelled) setDraftBusy(false);
      });

    return () => {
      cancelled = true;
    };
    // Solo re-crear borrador al cambiar de propiedad (no en cada refetch).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- property?.id
  }, [property?.id, token]);

  const enabledChannels = useMemo(
    () => CHANNEL_ORDER.filter((id) => selectedChannels[id]),
    [selectedChannels],
  );

  const connectionById = useMemo(() => {
    const map = new Map<ChannelId, ChannelConnection>();
    for (const c of channelConnections ?? []) {
      map.set(c.channelId, c);
    }
    return map;
  }, [channelConnections]);

  const currentContent = useMemo<ContentFormSnapshot>(
    () => contentForm,
    [contentForm],
  );

  const isContentDirty = useMemo(() => {
    if (!savedContent) return false;
    return !contentFormsEqual(currentContent, savedContent);
  }, [currentContent, savedContent]);

  const isChannelsDirty = useMemo(() => {
    if (!savedSelectedChannels) return false;
    return CHANNEL_ORDER.some(
      (id) => selectedChannels[id] !== savedSelectedChannels[id],
    );
  }, [savedSelectedChannels, selectedChannels]);

  const isCustomizeDirty = useMemo(() => {
    if (!savedCustomizeSnapshot) return false;
    if (
      sharedTitle !== savedCustomizeSnapshot.sharedTitle ||
      sharedBody !== savedCustomizeSnapshot.sharedBody
    ) {
      return true;
    }
    for (const id of enabledChannels) {
      const current = platformContent[id] ?? {
        title: sharedTitle,
        body: sharedBody,
      };
      const saved = savedCustomizeSnapshot.platformContent[id] ?? {
        title: savedCustomizeSnapshot.sharedTitle,
        body: savedCustomizeSnapshot.sharedBody,
      };
      if (
        current.title !== saved.title ||
        current.body !== saved.body
      ) {
        return true;
      }
    }
    return false;
  }, [
    enabledChannels,
    platformContent,
    savedCustomizeSnapshot,
    sharedBody,
    sharedTitle,
  ]);

  const wasiPublishReady = property
    ? isWasiPublishReady(property.missingFields)
    : true;
  const drivePublishReady = property
    ? isDrivePublishReady(property.completenessDrive?.missingFields ?? [])
    : true;

  const channelSelectable = (id: ChannelId): boolean => {
    if (id === "wasi" && !wasiPublishReady) return false;
    if (id === "entrega" && !drivePublishReady) return false;
    const conn = connectionById.get(id);
    if (!conn) return id !== "web";
    return conn.status === "connected" || conn.status === "needs_auth";
  };

  const channelToggleHint = (id: ChannelId): string | undefined => {
    if (id === "wasi" && !wasiPublishReady) return WASI_PUBLISH_HINT;
    if (id === "entrega" && !drivePublishReady) {
      const missing = property?.completenessDrive?.missingFields ?? [];
      return missing.length
        ? `${DRIVE_PUBLISH_HINT}: ${formatMissingFields(missing)}`
        : DRIVE_PUBLISH_HINT;
    }
    const conn = connectionById.get(id);
    if (!channelSelectable(id) && conn?.issue) return conn.issue;
    return undefined;
  };

  useEffect(() => {
    if (!property || wasiPublishReady) return;
    setSelectedChannels((prev) => {
      if (!prev.wasi) return prev;
      return { ...prev, wasi: false };
    });
  }, [property?.id, wasiPublishReady]);

  useEffect(() => {
    if (!property || drivePublishReady) return;
    setSelectedChannels((prev) => {
      if (!prev.entrega) return prev;
      return { ...prev, entrega: false };
    });
  }, [property?.id, drivePublishReady]);

  const saveContentChanges = async (options?: { advance?: boolean }) => {
    if (!property || !publication) return;
    const wasiTitleError = validateWasiTitle(contentForm.titulo);
    if (wasiTitleError) {
      setActionError(wasiTitleError);
      return;
    }
    setActionBusy(true);
    setActionError(null);
    try {
      await propertiesService.update(
        property.id,
        {
          titulo: contentForm.titulo,
          descripcion: contentForm.descripcion,
          telefonoContacto: contentForm.telefonoContacto,
          nombreContacto: contentForm.nombreContacto,
          municipio: contentForm.municipio,
          barrio: contentForm.barrio || null,
          tipo: contentForm.tipo || undefined,
          condicion: contentForm.condicion ?? undefined,
          precio: parsePrecioInput(contentForm.precio),
          alcobas: parseIntInput(contentForm.alcobas),
          banos: parseIntInput(contentForm.banos),
          parqueaderos: parseIntInput(contentForm.parqueaderos),
          estrato: parseIntInput(contentForm.estrato),
          piso: parseIntInput(contentForm.piso),
          areaM2: parseIntInput(contentForm.areaM2),
          areaPrivada: parseIntInput(contentForm.areaPrivada),
          areaConstruida: parseIntInput(contentForm.areaConstruida),
          administracion: parsePrecioInput(contentForm.administracion),
          anioConstruccion: parseIntInput(contentForm.anioConstruccion),
          direccion: contentForm.direccion || null,
          codigoPostal: contentForm.codigoPostal || null,
          featureIds: contentForm.featureIds,
          predial: contentForm.predial || null,
          afectacionesInmueble: contentForm.afectacionesInmueble || null,
          afectacionesDetalle: contentForm.afectacionesDetalle || null,
          observacionesInmueble: contentForm.observacionesInmueble || null,
          precioMinimoCliente: contentForm.precioMinimoCliente || null,
          puntosFavorablesExternos: contentForm.puntosFavorablesExternos || null,
          detalleParqueadero: contentForm.detalleParqueadero || null,
          frenteFondoM: contentForm.frenteFondoM || null,
        },
        token ?? undefined,
      );
      const pub = await publicationsService.patch(
        publication.id,
        {
          sharedTitle: contentForm.titulo,
          sharedBody: contentForm.descripcion,
        },
        token ?? undefined,
      );
      setPublication(pub);
      setSharedTitle(pub.sharedTitle || contentForm.titulo);
      setSharedBody(pub.sharedBody || contentForm.descripcion);
      setSavedContent(currentContent);
      await queryClient.invalidateQueries({
        queryKey: ["property", params.id],
      });
      if (options?.advance) setStep("photos");
    } catch {
      setActionError("No se pudo guardar el contenido.");
    } finally {
      setActionBusy(false);
    }
  };

  const onContentContinue = async () => {
    await saveContentChanges({ advance: true });
  };

  const onChannelsContinue = async () => {
    await saveChannelsChanges({ advance: true });
  };

  const saveChannelsChanges = async (options?: { advance?: boolean }) => {
    if (!publication) return;
    setActionBusy(true);
    setActionError(null);
    try {
      const pub = await publicationsService.patch(
        publication.id,
        { selectedChannels: enabledChannels },
        token ?? undefined,
      );
      setPublication(pub);
      const toggles = Object.fromEntries(
        CHANNEL_ORDER.map((id) => [id, enabledChannels.includes(id)]),
      ) as Record<ChannelId, boolean>;
      setSavedSelectedChannels(toggles);
      if (options?.advance) setStep("customize");
    } catch {
      setActionError("No se pudieron guardar los canales.");
    } finally {
      setActionBusy(false);
    }
  };

  const saveCustomizeChanges = async (options?: { advance?: boolean }) => {
    if (!publication) return;
    setActionBusy(true);
    setActionError(null);
    try {
      let pub = await publicationsService.patch(
        publication.id,
        { sharedTitle, sharedBody },
        token ?? undefined,
      );
      for (const channelId of enabledChannels) {
        const draft = platformContent[channelId] ?? {
          title: sharedTitle,
          body: sharedBody,
        };
        pub = await publicationsService.patch(
          publication.id,
          {
            platformContent: {
              channelId,
              title: draft.title,
              body: draft.body,
              isAiGenerated: false,
            },
          },
          token ?? undefined,
        );
      }
      setPublication(pub);
      setSavedCustomizeSnapshot({
        sharedTitle,
        sharedBody,
        platformContent: { ...platformContent },
      });
      if (options?.advance) setStep("preview");
    } catch {
      setActionError("No se pudo guardar la personalización.");
    } finally {
      setActionBusy(false);
    }
  };

  const onCustomizeContinue = async () => {
    await saveCustomizeChanges({ advance: true });
  };

  const publishWithChannels = async (
    channels: ChannelId[],
    opts?: { scheduledFor?: string; timezone?: string },
  ) => {
    if (!publication) return;
    if (channels.length === 0) {
      setActionError("Selecciona al menos un canal para publicar.");
      return;
    }
    setActionBusy(true);
    setActionError(null);
    try {
      const pub = await publicationsService.publish(
        publication.id,
        { ...opts, channelIds: channels },
        token ?? undefined,
      );
      setPublication(pub);
      setStep("results");
    } catch (err) {
      setActionError(
        formatActionError(err, "No se pudo completar la publicación."),
      );
    } finally {
      setActionBusy(false);
    }
  };

  const onPublishNow = async (channels?: ChannelId[]) => {
    await publishWithChannels(channels ?? enabledChannels);
  };

  const onSchedulePublish = async (
    date: string,
    time: string,
    channels?: ChannelId[],
  ) => {
    if (!publication) return;
    const validation = scheduleValidationError(date, time);
    if (validation) {
      setActionError(validation);
      return;
    }
    const scheduledFor = buildScheduleIso(date, time);
    if (!scheduledFor) {
      setActionError("Fecha u hora inválida.");
      return;
    }
    await publishWithChannels(channels ?? enabledChannels, {
      scheduledFor,
      timezone: DEFAULT_TIMEZONE,
    });
  };

  const [cancelScheduleOpen, setCancelScheduleOpen] = useState(false);

  const requestCancelSchedule = () => {
    if (!publication) return;
    setCancelScheduleOpen(true);
  };

  const onCancelSchedule = async () => {
    if (!publication) return;
    setActionBusy(true);
    setActionError(null);
    try {
      const pub = await publicationsService.patch(
        publication.id,
        { status: "draft", scheduledFor: null, timezone: null },
        token ?? undefined,
      );
      setPublication(pub);
      setCancelScheduleOpen(false);
      setStep("preview");
    } catch {
      setActionError("No se pudo cancelar la programación.");
    } finally {
      setActionBusy(false);
    }
  };

  const onSaveDraft = async () => {
    if (!publication) return;
    setActionBusy(true);
    setActionError(null);
    try {
      const pub = await publicationsService.patch(
        publication.id,
        { status: "draft" },
        token ?? undefined,
      );
      setPublication(pub);
      router.push("/publications");
    } catch {
      setActionError("No se pudo guardar el borrador.");
    } finally {
      setActionBusy(false);
    }
  };

  if (isLoading || draftBusy) {
    return (
      <div className="px-6 py-10 text-sm text-[var(--pa-muted)] md:px-10">
        Cargando propiedad…
      </div>
    );
  }
  if (isError || !property) {
    return (
      <div className="px-6 py-10 md:px-10">
        <button
          onClick={() => router.push("/publications")}
          className="text-sm text-[var(--pa-muted)] hover:underline"
        >
          ← Publicación
        </button>
        <p className="mt-4 text-sm text-[var(--pa-danger)]">
          No se pudo cargar la propiedad.
        </p>
      </div>
    );
  }
  if (draftError || !publication) {
    return (
      <div className="px-6 py-10 md:px-10">
        <button
          onClick={() => router.push("/publications")}
          className="text-sm text-[var(--pa-muted)] hover:underline"
        >
          ← Publicación
        </button>
        <p className="mt-4 text-sm text-[var(--pa-danger)]">
          {draftError ?? "No se pudo crear el borrador de publicación."}
        </p>
      </div>
    );
  }

  // Display property with local edits overlaid for preview
  const displayProperty: Property = {
    ...property,
    titulo: sharedTitle || contentForm.titulo || property.titulo,
    descripcion: sharedBody || contentForm.descripcion || property.descripcion,
    telefonoContacto: contentForm.telefonoContacto || property.telefonoContacto,
    nombreContacto: contentForm.nombreContacto || property.nombreContacto,
    municipio: contentForm.municipio || property.municipio,
    barrio: contentForm.barrio || property.barrio,
    tipo: contentForm.tipo || property.tipo,
    intent: contentForm.intent,
    condicion: contentForm.condicion ?? property.condicion,
    precio: parsePrecioInput(contentForm.precio) ?? property.precio,
    alcobas: parseIntInput(contentForm.alcobas) ?? property.alcobas,
    banos: parseIntInput(contentForm.banos) ?? property.banos,
    parqueaderos:
      parseIntInput(contentForm.parqueaderos) ?? property.parqueaderos,
    estrato: parseIntInput(contentForm.estrato) ?? property.estrato,
    piso: parseIntInput(contentForm.piso) ?? property.piso,
    areaM2: parseIntInput(contentForm.areaM2) ?? property.areaM2,
    areaPrivada: parseIntInput(contentForm.areaPrivada) ?? property.areaPrivada,
    areaConstruida:
      parseIntInput(contentForm.areaConstruida) ?? property.areaConstruida,
    administracion:
      parsePrecioInput(contentForm.administracion) ?? property.administracion,
    anioConstruccion:
      parseIntInput(contentForm.anioConstruccion) ?? property.anioConstruccion,
    direccion: contentForm.direccion || property.direccion,
    codigoPostal: contentForm.codigoPostal || property.codigoPostal,
    featureIds: contentForm.featureIds,
  };

  return (
    <div className="px-6 py-8 md:px-10">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[13px] font-semibold text-[var(--pa-faint)]">
            {property.titulo} · {property.code}
          </div>
          {capturedAtLabel(property.capturedAt) ? (
            <div className="mt-0.5 text-[12px] text-[var(--pa-muted)]">
              {capturedAtLabel(property.capturedAt)}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setDeleteDialogOpen(true)}
          className="text-xs font-bold text-[var(--pa-danger)] hover:underline"
        >
          Eliminar propiedad
        </button>
      </div>

      <DeletePropertyDialog
        open={deleteDialogOpen}
        titulo={property.titulo}
        busy={deletingProperty}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          void (async () => {
            setDeletingProperty(true);
            try {
              await propertiesService.delete(property.id, token ?? undefined);
              router.push("/publications");
            } catch {
              window.alert("No se pudo eliminar la propiedad.");
            } finally {
              setDeletingProperty(false);
              setDeleteDialogOpen(false);
            }
          })();
        }}
      />

      <ConfirmDialog
        open={cancelScheduleOpen}
        title="¿Cancelar la publicación programada?"
        message="La publicación volverá a borrador. Podrás programarla o publicarla de nuevo cuando quieras."
        confirmLabel="Cancelar programación"
        tone="danger"
        busy={actionBusy}
        onCancel={() => {
          if (actionBusy) return;
          setCancelScheduleOpen(false);
        }}
        onConfirm={() => void onCancelSchedule()}
      />

      {/* Stepper */}
      <div className="mb-7 flex items-center gap-1 overflow-x-auto">
        {STEPS.map((st, i) => (
          <div key={st.id} className="flex items-center">
            <button
              type="button"
              onClick={() => setStep(st.id)}
              className={`whitespace-nowrap rounded-[9px] px-4 py-2 text-xs transition-colors ${
                step === st.id
                  ? "bg-white font-bold text-[var(--pa-navy)] shadow-sm"
                  : "font-semibold text-[var(--pa-muted)] hover:bg-white/60"
              }`}
            >
              {st.label}
            </button>
            {i < STEPS.length - 1 && (
              <span className="px-1 text-sm text-[#C9D1D8]">›</span>
            )}
          </div>
        ))}
      </div>

      {actionError && (
        <p className="mb-4 text-sm text-[var(--pa-danger)]">{actionError}</p>
      )}

      {step === "content" && (
        <ContentStep
          property={property}
          form={contentForm}
          onPatch={patchContent}
          token={token ?? undefined}
          busy={actionBusy}
          isDirty={isContentDirty}
          onSave={() => void saveContentChanges()}
          onNext={() => void onContentContinue()}
        />
      )}
      {step === "photos" && (
        <PhotosStep
          property={property}
          token={token ?? undefined}
          onPropertyUpdated={() =>
            void queryClient.invalidateQueries({
              queryKey: ["property", params.id],
            })
          }
          onNext={() => setStep("channels")}
        />
      )}
      {step === "channels" && (
        <ChannelsStep
          toggles={selectedChannels}
          connections={channelConnections ?? []}
          channelSelectable={channelSelectable}
          channelToggleHint={channelToggleHint}
          onToggle={(id) => {
            if (!channelSelectable(id)) return;
            setSelectedChannels((t) => ({ ...t, [id]: !t[id] }));
          }}
          publicationId={publication.id}
          token={token ?? undefined}
          onAiApplied={(title, body) => {
            setSharedTitle(title);
            setSharedBody(body);
          }}
          busy={actionBusy}
          isDirty={isChannelsDirty}
          onSave={() => void saveChannelsChanges()}
          onNext={() => void onChannelsContinue()}
        />
      )}
      {step === "customize" && (
        <CustomizeStep
          selectedChannels={enabledChannels}
          sharedTitle={sharedTitle}
          sharedBody={sharedBody}
          platformContent={platformContent}
          portadaUrl={property.portadaUrl}
          onPlatformContentChange={(channelId, title, body) => {
            setPlatformContent((prev) => ({
              ...prev,
              [channelId]: { title, body },
            }));
            if (channelId === enabledChannels[0]) {
              setSharedTitle(title);
              setSharedBody(body);
            }
          }}
          busy={actionBusy}
          isDirty={isCustomizeDirty}
          onSave={() => void saveCustomizeChanges()}
          onNext={() => void onCustomizeContinue()}
        />
      )}
      {step === "preview" && publication && (
        <PreviewStep
          property={displayProperty}
          publication={publication}
          connections={channelConnections ?? []}
          channelSelectable={channelSelectable}
          channelToggleHint={channelToggleHint}
          selectedChannels={selectedChannels}
          onToggleChannel={(id) => {
            if (!channelSelectable(id)) return;
            setSelectedChannels((t) => ({ ...t, [id]: !t[id] }));
          }}
          busy={actionBusy}
          actionError={actionError}
          onPublishNow={(channels) => void onPublishNow(channels)}
          onSchedule={(date, time, channels) =>
            void onSchedulePublish(date, time, channels)
          }
          onDraft={() => void onSaveDraft()}
          onCancelSchedule={requestCancelSchedule}
        />
      )}
      {step === "results" && publication && (
        <ResultsStep
          property={displayProperty}
          publication={publication}
          publicationId={publication.id}
          channelResults={publication.channelResults}
          sharedTitle={publication.sharedTitle}
          sharedBody={publication.sharedBody}
          platformContent={publication.platformContent}
          republishedChannelIds={republishedChannelIds}
          token={token ?? undefined}
          busy={actionBusy}
          actionError={actionError}
          onCancelSchedule={requestCancelSchedule}
          onReprogram={() => setStep("preview")}
          onRepublished={(channelId) =>
            setRepublishedChannelIds((prev) => new Set(prev).add(channelId))
          }
          onResultUpdated={(result) => {
            setPublication((prev) => {
              if (!prev) return prev;
              const others = prev.channelResults.filter(
                (r) => r.channelId !== result.channelId,
              );
              return {
                ...prev,
                channelResults: [...others, result],
              };
            });
          }}
          onPublicationRefresh={(pub) => setPublication(pub)}
        />
      )}
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-6">
      {title && (
        <div className="mb-4 text-[13px] font-extrabold uppercase tracking-wide text-[var(--pa-ink)]">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const className = `rounded-full px-3.5 py-2 text-xs font-semibold ${
    active
      ? "bg-[var(--pa-navy)] text-white"
      : "border border-[var(--pa-border)] bg-[var(--pa-bg)] text-[#45525E]"
  }`;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {children}
      </button>
    );
  }
  return <span className={className}>{children}</span>;
}

/** "280000000" -> "280.000.000" (formato COP, sin obligar al agente a tipear los puntos). */
function formatThousands(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("es-CO");
}

function ControlledField({
  label: l,
  value,
  onChange,
  missing = false,
  thousands = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  missing?: boolean;
  /** Formatea con puntos de mil mientras se escribe (precio, administración,
   * etc.) — el valor guardado ya incluye los puntos; parsePrecioInput los
   * quita antes de mandar el número al backend, así que no cambia nada del
   * lado del guardado. */
  thousands?: boolean;
}) {
  return (
    <div>
      <div
        className={`mb-1.5 text-xs font-bold ${missing ? "text-[var(--pa-danger)]" : "text-[var(--pa-muted)]"}`}
      >
        {l}
      </div>
      <input
        inputMode={thousands ? "numeric" : undefined}
        className={`${input} ${missing ? "border-[var(--pa-danger)] focus:border-[var(--pa-danger)]" : ""}`}
        value={thousands ? formatThousands(value) : value}
        onChange={(e) =>
          onChange(thousands ? formatThousands(e.target.value) : e.target.value)
        }
      />
    </div>
  );
}

function ReadOnlyField({
  label: l,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div>
      <div className={label}>{l}</div>
      <input className={input} defaultValue={value ?? ""} readOnly />
    </div>
  );
}

function PrimaryBlock({
  children,
  onClick,
  className = "",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl bg-[var(--pa-navy)] px-6 py-3.5 text-center text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

const PROPERTY_TYPES = ["Apartamento", "Casa", "Apartaestudio", "Oficina", "Local"];
const INTENTS = ["Venta", "Arriendo"] as const satisfies readonly Intent[];
const CONDITIONS = [
  "Nuevo",
  "Usado",
  "Proyecto",
  "En construcción",
] as const satisfies readonly Condition[];

function ContentStep({
  property,
  form,
  onPatch,
  token,
  busy,
  isDirty,
  onSave,
  onNext,
}: {
  property: Property;
  form: ContentFormSnapshot;
  onPatch: (patch: Partial<ContentFormSnapshot>) => void;
  token?: string;
  busy: boolean;
  isDirty: boolean;
  onSave: () => void;
  onNext: () => void;
}) {
  const {
    data: wasiCatalog,
    isLoading: wasiCatalogLoading,
    isError: wasiCatalogError,
  } = useQuery({
    queryKey: ["wasi-features"],
    queryFn: () => wasiFeaturesService.list(token),
  });
  const {
    data: driveFieldOptions,
    isLoading: driveOptionsLoading,
  } = useQuery({
    queryKey: ["drive-field-options"],
    queryFn: () => driveFieldOptionsService.list(token),
  });
  const parkingOptions =
    driveFieldOptions?.parkingDetail?.length
      ? driveFieldOptions.parkingDetail
      : DRIVE_PARKING_OPTIONS;
  const liensOptions =
    driveFieldOptions?.propertyLiens?.length
      ? driveFieldOptions.propertyLiens
      : DRIVE_PROPERTY_LIENS_OPTIONS;
  const tipoActual = form.tipo || property.tipo;
  const esResidencial = isResidentialTipo(tipoActual);
  const driveMissing = property.completenessDrive?.missingFields ?? [];
  const driveMissingSummary = formatDriveMissingFields(driveMissing);
  const driveReady = isDrivePublishReady(driveMissing);
  const liveMissing = missingFieldsFromDraft({
    titulo: form.titulo,
    descripcion: form.descripcion,
    tipo: form.tipo,
    intent: form.intent,
    precio: form.precio,
    municipio: form.municipio,
    barrio: form.barrio,
    telefonoContacto: form.telefonoContacto,
    alcobas: form.alcobas,
    banos: form.banos,
    areaM2: form.areaM2,
    areaPrivada: form.areaPrivada,
    areaConstruida: form.areaConstruida,
    direccion: form.direccion,
    codigoPostal: form.codigoPostal,
    anioConstruccion: form.anioConstruccion,
    estrato: form.estrato,
    photoCount: property.fotos.length,
  });
  const fieldMissing = (key: string) => liveMissing.includes(key);
  const wasiTitleLen = wasiTitleLength(form.titulo);
  const wasiTitleError = validateWasiTitle(form.titulo);
  const wasiTitleTone = wasiTitleCounterTone(wasiTitleLen);
  const titleBlocked = Boolean(wasiTitleError);
  const checklist = checklistForTipo(form.tipo || property.tipo).map((item) => ({
    label: item.label,
    done: isFieldComplete(item.key, liveMissing),
  }));
  const missingSummary = formatMissingFields(liveMissing);
  const completenessPct =
    checklist.length > 0
      ? Math.round(
          (checklist.filter((c) => c.done).length / checklist.length) * 100,
        )
      : 0;
  return (
    <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[1fr_300px]">
      <div className="flex min-w-0 flex-col gap-6">
        <Card title="Básicos">
          <div className="grid gap-4">
            <div>
              <div
                className={`mb-1.5 text-xs font-bold ${
                  fieldMissing("title") || titleBlocked
                    ? "text-[var(--pa-danger)]"
                    : "text-[var(--pa-muted)]"
                }`}
              >
                Título *
              </div>
              <input
                className={`${input} ${
                  fieldMissing("title") || titleBlocked
                    ? "border-[var(--pa-danger)] focus:border-[var(--pa-danger)]"
                    : ""
                }`}
                value={form.titulo}
                onChange={(e) => onPatch({ titulo: e.target.value })}
              />
              <div className="mt-1 flex flex-col gap-1">
                <span
                  className={`text-[11px] font-semibold ${
                    wasiTitleTone === "error"
                      ? "text-[var(--pa-danger)]"
                      : wasiTitleTone === "warn"
                        ? "text-[var(--pa-warning)]"
                        : "text-[var(--pa-muted)]"
                  }`}
                >
                  {wasiTitleLen}/{WASI_TITLE_MAX_LENGTH}
                </span>
                {wasiTitleError ? (
                  <p className="text-xs font-semibold text-[var(--pa-danger)]">
                    {wasiTitleError}
                  </p>
                ) : null}
              </div>
            </div>
            <div>
              <div
                className={`mb-1.5 text-xs font-bold ${fieldMissing("description") ? "text-[var(--pa-danger)]" : "text-[var(--pa-muted)]"}`}
              >
                Descripción *
              </div>
              <textarea
                className={`${input} min-h-[88px] font-normal leading-relaxed text-[#45525E] ${fieldMissing("description") ? "border-[var(--pa-danger)]" : ""}`}
                value={form.descripcion}
                onChange={(e) => onPatch({ descripcion: e.target.value })}
                placeholder="Usa líneas que empiecen con «- » para viñetas en WASI"
              />
              <p className="mt-1 text-[11px] text-[var(--pa-muted)]">
                Tip: cada línea con «- » se convierte en viñeta al publicar en WASI.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-4">
              <div>
                <div
                  className={`mb-1.5 text-xs font-bold ${fieldMissing("type") ? "text-[var(--pa-danger)]" : "text-[var(--pa-muted)]"}`}
                >
                  Tipo
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PROPERTY_TYPES.map((t) => (
                    <Chip
                      key={t}
                      active={t === (form.tipo || property.tipo)}
                      onClick={() => onPatch({ tipo: t })}
                    >
                      {t}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <div className={label}>Intención</div>
                <div className="flex gap-1.5">
                  {INTENTS.map((it) => (
                    <Chip
                      key={it}
                      active={it === form.intent}
                      onClick={() =>
                        onPatch({
                          intent: it,
                          titulo: applyIntentToTitle(form.titulo, it),
                        })
                      }
                    >
                      {it}
                    </Chip>
                  ))}
                </div>
              </div>
              <ControlledField
                label="Precio a Publicar (COP) *"
                value={form.precio}
                onChange={(v) => onPatch({ precio: v })}
                missing={fieldMissing("price")}
                thousands
              />
              <ControlledField
                label="Precio mínimo para cliente *"
                value={form.precioMinimoCliente}
                onChange={(v) => onPatch({ precioMinimoCliente: v })}
                thousands
              />
            </div>
          </div>
        </Card>

        <Card title="Ubicación">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <ControlledField
              label="Ciudad"
              value={form.municipio}
              onChange={(v) => onPatch({ municipio: v })}
              missing={fieldMissing("city")}
            />
            <ControlledField
              label="Barrio / zona / conjunto *"
              value={form.barrio}
              onChange={(v) => onPatch({ barrio: v })}
              missing={fieldMissing("neighborhood")}
            />
            <ControlledField
              label="Dirección *"
              value={form.direccion}
              onChange={(v) => onPatch({ direccion: v })}
              missing={fieldMissing("address")}
            />
            <ControlledField
              label="Código postal *"
              value={form.codigoPostal}
              onChange={(v) => onPatch({ codigoPostal: v })}
              missing={fieldMissing("postalCode")}
            />
          </div>
        </Card>

        <Card title="Detalles">
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            <ControlledField
              label="Alcobas"
              value={form.alcobas}
              onChange={(v) => onPatch({ alcobas: v })}
              missing={fieldMissing("bedrooms")}
            />
            <ControlledField
              label="Baños"
              value={form.banos}
              onChange={(v) => onPatch({ banos: v })}
              missing={fieldMissing("bathrooms")}
            />
            <ControlledField
              label="Parqueaderos"
              value={form.parqueaderos}
              onChange={(v) => onPatch({ parqueaderos: v })}
            />
            <div>
              <div
                className={`mb-1.5 text-xs font-bold ${fieldMissing("stratum") ? "text-[var(--pa-danger)]" : "text-[var(--pa-muted)]"}`}
              >
                Estrato *
              </div>
              <select
                className={`${input} ${fieldMissing("stratum") ? "border-[var(--pa-danger)] focus:border-[var(--pa-danger)]" : ""}`}
                value={form.estrato}
                onChange={(e) => onPatch({ estrato: e.target.value })}
              >
                <option value="">Seleccionar…</option>
                {ESTRATO_OPTIONS.map((e) => (
                  <option key={e} value={e}>
                    Estrato {e}
                  </option>
                ))}
              </select>
            </div>
            <ControlledField
              label="Piso"
              value={form.piso}
              onChange={(v) => onPatch({ piso: v })}
            />
            <ControlledField
              label="Área (m²) *"
              value={form.areaM2}
              onChange={(v) => onPatch({ areaM2: v })}
              missing={fieldMissing("areaM2")}
            />
            <ControlledField
              label="Área privada *"
              value={form.areaPrivada}
              onChange={(v) => onPatch({ areaPrivada: v })}
              missing={fieldMissing("privateAreaM2")}
            />
            <ControlledField
              label="Área construida *"
              value={form.areaConstruida}
              onChange={(v) => onPatch({ areaConstruida: v })}
              missing={fieldMissing("builtAreaM2")}
            />
            <ControlledField
              label="Administración (COP)"
              value={form.administracion}
              onChange={(v) => onPatch({ administracion: v })}
              thousands
            />
            <ControlledField
              label="Año de construcción"
              value={form.anioConstruccion}
              onChange={(v) => onPatch({ anioConstruccion: v })}
              missing={fieldMissing("buildingYear")}
            />
            <div className="col-span-2">
              <div className={label}>Estado</div>
              <div className="flex flex-wrap gap-1.5">
                {CONDITIONS.map((c) => (
                  <Chip
                    key={c}
                    active={c === form.condicion}
                    onClick={() => onPatch({ condicion: c })}
                  >
                    {c}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Google Drive (Entrega)">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <ControlledField
              label="Predial *"
              value={form.predial}
              onChange={(v) => onPatch({ predial: v })}
            />
            <div className="sm:col-span-2">
              <div className={label}>Afectaciones *</div>
              <select
                className={input}
                value={form.afectacionesInmueble}
                onChange={(e) =>
                  onPatch({ afectacionesInmueble: e.target.value })
                }
              >
                <option value="">Seleccionar…</option>
                {liensOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {form.afectacionesInmueble && form.afectacionesInmueble !== "ninguna" ? (
              <ControlledField
                label="Detalle afectación"
                value={form.afectacionesDetalle}
                onChange={(v) => onPatch({ afectacionesDetalle: v })}
              />
            ) : null}
            {esResidencial ? (
              <div className="sm:col-span-2">
                <div className={label}>Parqueadero *</div>
                <select
                  className={input}
                  value={form.detalleParqueadero}
                  onChange={(e) =>
                    onPatch({ detalleParqueadero: e.target.value })
                  }
                  disabled={driveOptionsLoading}
                >
                  <option value="">Seleccionar…</option>
                  {parkingOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <ControlledField
              label="Frente × fondo"
              value={form.frenteFondoM}
              onChange={(v) => onPatch({ frenteFondoM: v })}
            />
            <div className="sm:col-span-3">
              <div className={label}>Puntos favorables externos *</div>
              <textarea
                className={`${input} min-h-[48px] resize-y`}
                value={form.puntosFavorablesExternos}
                onChange={(e) =>
                  onPatch({ puntosFavorablesExternos: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-3">
              <div className={label}>Observaciones inmueble *</div>
              <textarea
                className={`${input} min-h-[48px] resize-y`}
                value={form.observacionesInmueble}
                onChange={(e) =>
                  onPatch({ observacionesInmueble: e.target.value })
                }
              />
            </div>
          </div>
        </Card>

        <Card title="Contacto">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <ControlledField
              label="Nombre"
              value={form.nombreContacto}
              onChange={(v) => onPatch({ nombreContacto: v })}
            />
            <ControlledField
              label="Teléfono *"
              value={form.telefonoContacto}
              onChange={(v) => onPatch({ telefonoContacto: v })}
              missing={fieldMissing("contactPhone")}
            />
          </div>
        </Card>

        <Card title="Características WASI">
          <WasiFeaturesCheckboxes
            catalog={wasiCatalog ?? null}
            selectedIds={form.featureIds}
            onChange={(featureIds) => onPatch({ featureIds })}
            loading={wasiCatalogLoading}
            error={
              wasiCatalogError
                ? "No se pudo cargar el catálogo WASI."
                : null
            }
          />
        </Card>
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-6">
        <Card>
          <div className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--pa-muted)]">
            Completitud
          </div>
          <div className="mb-2.5 text-[28px] font-extrabold text-[var(--pa-navy)]">
            {completenessPct}%
          </div>
          <div className="mb-3.5 h-2 overflow-hidden rounded bg-[var(--pa-bg-alt)]">
            <div
              className="h-full rounded bg-[var(--pa-accent)]"
              style={{ width: `${completenessPct}%` }}
            />
          </div>
          <ul className="space-y-1 text-xs text-[var(--pa-muted)]">
            {checklist.map((c) => (
              <li key={c.label} className={c.done ? "" : "text-[var(--pa-warning)]"}>
                {c.done ? "✓" : "Falta"} {c.label}
              </li>
            ))}
          </ul>
          {missingSummary ? (
            <p className="mt-3 text-xs font-semibold text-[var(--pa-warning)]">
              Falta: {missingSummary}
            </p>
          ) : (
            <p className="mt-3 text-xs font-semibold text-[var(--pa-success)]">
              ✓ Información completa
            </p>
          )}
          {fieldMissing("photos") ? (
            <p className="mt-2 text-xs font-semibold text-[var(--pa-danger)]">
              Fotos: se gestionan en el siguiente paso. Campo obligatorio.
            </p>
          ) : null}
        </Card>
        <Card>
          <div className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--pa-muted)]">
            Google Drive
          </div>
          {driveReady ? (
            <p className="text-xs font-semibold text-[var(--pa-success)]">
              ✓ Listo para publicar en Drive
            </p>
          ) : (
            <p className="text-xs font-semibold text-[var(--pa-warning)]">
              Falta: {driveMissingSummary || "completar campos Entrega"}
            </p>
          )}
        </Card>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={!isDirty || busy || titleBlocked}
            className="rounded-xl border border-[var(--pa-navy)] bg-[var(--pa-surface)] px-6 py-3.5 text-center text-[13px] font-bold text-[var(--pa-navy)] transition-opacity hover:bg-[var(--pa-bg)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Guardando…" : "Guardar cambios"}
          </button>
          <PrimaryBlock onClick={onNext} disabled={busy || titleBlocked}>
            {busy ? "Guardando…" : "Continuar a fotos"}
          </PrimaryBlock>
        </div>
      </div>
    </div>
  );
}

function PhotosStep({
  property,
  token,
  onPropertyUpdated,
  onNext,
}: {
  property: Property;
  token?: string;
  onPropertyUpdated: () => void;
  onNext: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const fotos = property.fotos ?? [];

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onPropertyUpdated();
    } catch {
      setError("No se pudo actualizar las fotos.");
    } finally {
      setBusy(false);
    }
  };

  const onUpload = (files: FileList | null) => {
    if (!files?.length) return;
    void run(async () => {
      await propertiesService.uploadPhotos(
        property.id,
        Array.from(files),
        token,
      );
    });
  };

  const onDelete = (photoId: string) => {
    void run(async () => {
      await propertiesService.deletePhoto(property.id, photoId, token);
    });
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= fotos.length) return;
    const ids = fotos.map((f) => f.id);
    const tmp = ids[index];
    ids[index] = ids[next];
    ids[next] = tmp;
    void run(async () => {
      await propertiesService.reorderPhotos(property.id, ids, token);
    });
  };

  // Arrastrar y soltar: saca la foto de `from` y la inserta en `to` — permite
  // llevar cualquier foto a cualquier posición (ej. la última a primera) en
  // un solo movimiento, en vez de ir de a una con las flechas.
  const moveToIndex = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= fotos.length || to >= fotos.length) {
      return;
    }
    const ids = fotos.map((f) => f.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    void run(async () => {
      await propertiesService.reorderPhotos(property.id, ids, token);
    });
  };

  const handleDrop = (targetIndex: number) => {
    if (dragIndex !== null) moveToIndex(dragIndex, targetIndex);
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="max-w-[920px]">
      <div className="mb-4 text-[13px] text-[var(--pa-muted)]">
        La primera foto es la portada. Arrastra una foto y suéltala donde
        quieras (o usa las flechas). Facebook Marketplace e Instagram usan
        como máximo 10 fotos por publicación.
      </div>
      {error && (
        <p className="mb-3 text-sm text-[var(--pa-danger)]">{error}</p>
      )}
      <div className="mb-5 grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5">
        {fotos.map((p, i) => (
          <div
            key={p.id}
            draggable={!busy}
            onDragStart={(e) => {
              setDragIndex(i);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragEnter={() => {
              if (dragIndex !== null) setOverIndex(i);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(i);
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            className={`relative cursor-grab overflow-hidden rounded-xl bg-[var(--pa-bg-alt)] transition-opacity active:cursor-grabbing ${
              dragIndex === i ? "opacity-40" : ""
            } ${overIndex === i && dragIndex !== null && dragIndex !== i ? "ring-2 ring-[var(--pa-accent)]" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt=""
              draggable={false}
              className="aspect-[4/3] w-full object-cover"
            />
            {i === 0 && (
              <span className="absolute left-2 top-2 rounded-md bg-[var(--pa-navy)] px-2 py-0.5 text-[10px] font-bold text-white">
                ★ Portada
              </span>
            )}
            <span className="absolute bottom-2 right-2 flex h-[22px] w-[22px] items-center justify-center rounded-md bg-[rgba(22,33,43,0.6)] text-[11px] font-bold text-white">
              {i + 1}
            </span>
            <div className="absolute left-2 bottom-2 flex gap-1">
              <button
                type="button"
                disabled={busy || i === 0}
                onClick={() => move(i, -1)}
                className="rounded bg-[rgba(22,33,43,0.7)] px-1.5 py-0.5 text-[10px] font-bold text-white disabled:opacity-40"
              >
                ←
              </button>
              <button
                type="button"
                disabled={busy || i === fotos.length - 1}
                onClick={() => move(i, 1)}
                className="rounded bg-[rgba(22,33,43,0.7)] px-1.5 py-0.5 text-[10px] font-bold text-white disabled:opacity-40"
              >
                →
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onDelete(p.id)}
                className="rounded bg-[rgba(194,59,43,0.9)] px-1.5 py-0.5 text-[10px] font-bold text-white disabled:opacity-40"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-[#C9D1D8] p-2.5 text-center text-xs text-[var(--pa-faint)]">
          <span className="text-[22px]">+</span>
          {busy ? "Subiendo…" : "Haz clic para subir"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              onUpload(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <PrimaryBlock onClick={onNext} disabled={busy} className="w-[220px]">
        Continuar a canales
      </PrimaryBlock>
    </div>
  );
}

const AI_ACTIONS: {
  label: string;
  action: "generate" | "improve" | "shorten" | "professional" | "persuasive";
}[] = [
  { label: "Sugerir", action: "generate" },
  { label: "Mejorar", action: "improve" },
  { label: "Acortar", action: "shorten" },
  { label: "Más profesional", action: "professional" },
  { label: "Más persuasivo", action: "persuasive" },
];

function connectionBadge(conn: ChannelConnection | undefined): {
  label: string;
  className: string;
  hint?: string;
} {
  if (!conn) {
    return {
      label: "Sin datos",
      className: "bg-[var(--pa-bg-alt)] text-[var(--pa-faint)]",
    };
  }
  if (conn.status === "connected") {
    return {
      label: "Conectado",
      className: "bg-[var(--pa-success-bg)] text-[var(--pa-accent)]",
    };
  }
  if (conn.status === "unavailable") {
    return {
      label: "No disponible",
      className: "bg-[var(--pa-bg-alt)] text-[var(--pa-muted)]",
      hint: conn.issue ?? "Próximamente",
    };
  }
  if (conn.status === "needs_auth") {
    return {
      label: "Requiere autorización",
      className: "bg-[var(--pa-warning-bg)] text-[var(--pa-warning-ink)]",
      hint: conn.issue ?? undefined,
    };
  }
  return {
    label: "No configurado",
    className: "bg-[var(--pa-warning-bg)] text-[var(--pa-warning-ink)]",
    hint: conn.issue ?? "Revisa la configuración en el VPS",
  };
}

function ChannelsStep({
  toggles,
  connections,
  channelSelectable,
  channelToggleHint,
  onToggle,
  publicationId,
  token,
  onAiApplied,
  busy,
  isDirty,
  onSave,
  onNext,
}: {
  toggles: Record<ChannelId, boolean>;
  connections: ChannelConnection[];
  channelSelectable: (id: ChannelId) => boolean;
  channelToggleHint: (id: ChannelId) => string | undefined;
  onToggle: (id: ChannelId) => void;
  publicationId: string;
  token?: string;
  onAiApplied: (title: string, body: string) => void;
  busy: boolean;
  isDirty: boolean;
  onSave: () => void;
  onNext: () => void;
}) {
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string>("generate");

  const runAi = async (
    action: (typeof AI_ACTIONS)[number]["action"],
  ) => {
    setAiBusy(true);
    setAiError(null);
    setLastAction(action);
    try {
      const suggestion = await publicationsService.aiSuggest(
        publicationId,
        action,
        token,
      );
      onAiApplied(suggestion.title, suggestion.body);
      await publicationsService.patch(
        publicationId,
        {
          sharedTitle: suggestion.title,
          sharedBody: suggestion.body,
        },
        token,
      );
    } catch {
      setAiError("No se pudo generar la sugerencia de IA.");
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div className="max-w-[920px]">
      <div className="mb-1 text-xl font-extrabold text-[var(--pa-ink)]">
        ¿Dónde publicar?
      </div>
      <div className="mb-6 text-[13px] text-[var(--pa-muted)]">
        Activa los canales conectados para esta propiedad.
      </div>
      <div className="mb-8 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {CHANNEL_ORDER.map((id) => {
          const meta = CHANNEL_META[id];
          const on = toggles[id];
          const conn = connections.find((c) => c.channelId === id);
          const badge = connectionBadge(conn);
          const selectable = channelSelectable(id);
          const toggleHint = channelToggleHint(id);
          return (
            <div
              key={id}
              className={`rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-[18px] ${
                !selectable ? "opacity-80" : ""
              }`}
            >
              <div className="mb-3 flex items-start gap-3">
                <ChannelLogo channelId={id} size={40} />
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="text-sm font-bold leading-snug text-[var(--pa-ink)]">
                    {meta.name}
                  </div>
                  {meta.subtitle ? (
                    <div className="text-[11px] leading-snug text-[var(--pa-muted)]">
                      {meta.subtitle}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label={`Alternar ${meta.name}`}
                  disabled={!selectable}
                  onClick={() => onToggle(id)}
                  className={`relative mt-1 h-[22px] w-10 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    on ? "bg-[var(--pa-navy)]" : "bg-[var(--pa-border)]"
                  }`}
                >
                  <span
                    className="absolute top-[3px] h-4 w-4 rounded-full bg-white transition-all"
                    style={{ left: on ? 21 : 3 }}
                  />
                </button>
              </div>
              <span
                className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-bold ${badge.className}`}
              >
                {badge.label}
              </span>
              {badge.hint && (
                <p className="mt-2 text-[11px] leading-snug text-[var(--pa-muted)]">
                  {badge.hint}
                </p>
              )}
              {toggleHint ? (
                <p className="mt-2 text-[11px] leading-snug text-[var(--pa-muted)]">
                  {toggleHint}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mb-6 rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] px-6 py-5">
        <div className="mb-3.5 flex items-center gap-2">
          <span className="rounded-md bg-[var(--pa-info-bg)] px-2 py-0.5 text-[11px] font-bold text-[#47586A]">
            IA
          </span>
          <span className="text-[13px] font-bold text-[var(--pa-ink)]">
            Contenido con IA
          </span>
        </div>
        {aiError && (
          <p className="mb-2 text-xs text-[var(--pa-danger)]">{aiError}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {AI_ACTIONS.map((a) => (
            <button
              key={a.action}
              type="button"
              disabled={aiBusy || busy}
              onClick={() => void runAi(a.action)}
              className={`rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-50 ${
                lastAction === a.action
                  ? "bg-[var(--pa-navy)] text-white"
                  : "border border-[var(--pa-border)] text-[#45525E]"
              }`}
            >
              {aiBusy && lastAction === a.action ? "Generando…" : a.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-[var(--pa-faint)]">
          La IA sugiere; siempre revisas y apruebas antes de publicar.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onSave}
          disabled={!isDirty || busy}
          className="rounded-xl border border-[var(--pa-navy)] bg-[var(--pa-surface)] px-6 py-3.5 text-center text-[13px] font-bold text-[var(--pa-navy)] transition-opacity hover:bg-[var(--pa-bg)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Guardando…" : "Guardar cambios"}
        </button>
        <PrimaryBlock onClick={onNext} disabled={busy || aiBusy} className="w-[240px]">
          {busy ? "Guardando…" : "Continuar a personalizar"}
        </PrimaryBlock>
      </div>
    </div>
  );
}

const PLATFORM_LIMITS: Record<string, number> = {
  wasi: 1000,
  facebook: 500,
  instagram: 2200,
  whatsapp: 300,
};

function CustomizeStep({
  selectedChannels,
  sharedTitle,
  sharedBody,
  platformContent,
  portadaUrl,
  onPlatformContentChange,
  busy,
  isDirty,
  onSave,
  onNext,
}: {
  selectedChannels: ChannelId[];
  sharedTitle: string;
  sharedBody: string;
  platformContent: Partial<Record<ChannelId, { title: string; body: string }>>;
  portadaUrl: string | null;
  onPlatformContentChange: (
    channelId: ChannelId,
    title: string,
    body: string,
  ) => void;
  busy: boolean;
  isDirty: boolean;
  onSave: () => void;
  onNext: () => void;
}) {
  const platforms = selectedChannels.map((id) => ({
    id,
    label: CHANNEL_META[id].name,
  }));
  const [active, setActive] = useState<ChannelId>(
    selectedChannels[0] ?? "wasi",
  );

  const activeContent = platformContent[active] ?? {
    title: sharedTitle,
    body: sharedBody,
  };
  const limit = PLATFORM_LIMITS[active] ?? 1000;

  const switchChannel = (next: ChannelId) => {
    setActive(next);
  };

  return (
    <div className="max-w-[960px]">
      <div className="mb-1 text-xl font-extrabold text-[var(--pa-ink)]">
        Personalizar por canal
      </div>
      <p className="mb-6 text-[13px] text-[var(--pa-muted)]">
        Ajusta título y descripción para cada canal seleccionado.
      </p>
      <div className="mb-6 flex w-fit max-w-full flex-wrap gap-1.5 rounded-xl bg-[var(--pa-bg-alt)] p-1">
        {platforms.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => switchChannel(p.id)}
            className={`rounded-[9px] px-[18px] py-2.5 text-xs transition-colors ${
              active === p.id
                ? "bg-white font-bold text-[var(--pa-navy)] shadow-sm"
                : "font-semibold text-[var(--pa-muted)]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1fr_340px]">
        <Card>
          <div className={label}>Título ({CHANNEL_META[active].name})</div>
          <input
            className={`${input} mb-4`}
            value={activeContent.title}
            onChange={(e) =>
              onPlatformContentChange(active, e.target.value, activeContent.body)
            }
          />
          <div className="mb-1.5 flex items-center justify-between">
            <div className={label}>Descripción</div>
            <span className="text-[11px] text-[var(--pa-faint)]">
              {activeContent.body.length}/{limit}
            </span>
          </div>
          <textarea
            className={`${input} min-h-[140px] font-normal leading-relaxed text-[#45525E]`}
            value={activeContent.body}
            onChange={(e) =>
              onPlatformContentChange(
                active,
                activeContent.title,
                e.target.value,
              )
            }
          />
        </Card>
        <div>
          <div className="mb-2.5 text-[11px] font-bold uppercase text-[var(--pa-faint)]">
            Vista previa
          </div>
          <div className="overflow-hidden rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)]">
            {portadaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={portadaUrl}
                alt=""
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="aspect-[4/3] w-full bg-[repeating-linear-gradient(45deg,#E4E8EC,#E4E8EC_10px,#EDEFF2_10px,#EDEFF2_20px)]" />
            )}
            <div className="p-3.5">
              <div className="mb-1 text-[13px] font-bold text-[var(--pa-ink)]">
                {activeContent.title}
              </div>
              <div className="line-clamp-4 text-xs leading-relaxed text-[#45525E]">
                {activeContent.body}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onSave}
          disabled={!isDirty || busy}
          className="rounded-xl border border-[var(--pa-navy)] bg-[var(--pa-surface)] px-6 py-3.5 text-center text-[13px] font-bold text-[var(--pa-navy)] transition-opacity hover:bg-[var(--pa-bg)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Guardando…" : "Guardar cambios"}
        </button>
        <PrimaryBlock onClick={onNext} disabled={busy} className="w-[220px]">
          {busy ? "Guardando…" : "Ir a vista previa"}
        </PrimaryBlock>
      </div>
    </div>
  );
}

function PreviewStep({
  property,
  publication,
  connections,
  channelSelectable,
  channelToggleHint,
  selectedChannels,
  onToggleChannel,
  busy,
  actionError,
  onPublishNow,
  onSchedule,
  onDraft,
  onCancelSchedule,
}: {
  property: Property;
  publication: Publication;
  connections: ChannelConnection[];
  channelSelectable: (id: ChannelId) => boolean;
  channelToggleHint: (id: ChannelId) => string | undefined;
  selectedChannels: Record<ChannelId, boolean>;
  onToggleChannel: (id: ChannelId) => void;
  busy: boolean;
  actionError: string | null;
  onPublishNow: (channels: ChannelId[]) => void;
  onSchedule: (date: string, time: string, channels: ChannelId[]) => void;
  onDraft: () => void;
  onCancelSchedule: () => void;
}) {
  const [scheduling, setScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(tomorrowDateString());
  const [scheduleTime, setScheduleTime] = useState("17:00");
  const isScheduled = publication.status === "scheduled";
  const activeChannels = useMemo(
    () => CHANNEL_ORDER.filter((id) => selectedChannels[id]),
    [selectedChannels],
  );
  const facts = [
    property.alcobas !== null ? `${property.alcobas} alcobas` : null,
    property.banos !== null ? `${property.banos} baños` : null,
    property.parqueaderos !== null ? `${property.parqueaderos} parqueadero` : null,
    property.areaM2 !== null ? `${property.areaM2} m²` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="grid max-w-[1100px] grid-cols-1 gap-7 lg:grid-cols-[1fr_340px]">
      <div className="overflow-hidden rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)]">
        {property.portadaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.portadaUrl}
            alt=""
            className="h-[280px] w-full object-cover"
          />
        ) : (
          <div className="h-[280px] w-full bg-[repeating-linear-gradient(45deg,#E4E8EC,#E4E8EC_12px,#EDEFF2_12px,#EDEFF2_24px)]" />
        )}
        <div className="p-[22px]">
          <div className="mb-1.5 text-[19px] font-extrabold text-[var(--pa-ink)]">
            {property.titulo}
          </div>
          <div className="mb-2.5 text-xl font-extrabold text-[var(--pa-navy)]">
            {formatPrice(property.precio, property.esArriendo)}
          </div>
          <div className="mb-3.5 flex flex-wrap gap-4 text-[13px] text-[var(--pa-muted)]">
            {facts.map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
          <div className="text-[13px] leading-relaxed text-[#45525E]">
            {property.descripcion ??
              `${property.tipo} en ${property.municipio}, ${property.barrio ?? ""}.`}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Card>
          <div className="mb-3 text-xs font-bold uppercase text-[var(--pa-muted)]">
            Canales a publicar
          </div>
          <div className="space-y-2">
            {CHANNEL_ORDER.map((id) => {
              const meta = CHANNEL_META[id];
              const conn = connections.find((c) => c.channelId === id);
              const selectable = channelSelectable(id);
              const toggleHint = channelToggleHint(id);
              const on = selectedChannels[id];
              return (
                <div
                  key={id}
                  className={`flex items-center gap-3 rounded-xl border border-[var(--pa-border)] px-3 py-2.5 ${
                    !selectable ? "opacity-70" : ""
                  }`}
                >
                  <ChannelLogo channelId={id} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-[var(--pa-ink)]">
                      {meta.name}
                    </div>
                    {!selectable && toggleHint ? (
                      <div className="text-[10px] text-[var(--pa-muted)]">
                        {toggleHint}
                      </div>
                    ) : null}
                    {busy && on ? (
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--pa-warning-ink)]">
                        <Spinner size={12} />
                        Publicando…
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label={`Alternar ${meta.name}`}
                    disabled={!selectable || busy}
                    onClick={() => onToggleChannel(id)}
                    className={`relative h-[22px] w-10 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      on ? "bg-[var(--pa-navy)]" : "bg-[var(--pa-border)]"
                    }`}
                  >
                    <span
                      className="absolute top-[3px] h-4 w-4 rounded-full bg-white transition-all"
                      style={{ left: on ? 21 : 3 }}
                    />
                  </button>
                </div>
              );
            })}
          </div>
          {activeChannels.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--pa-danger)]">
              Activa al menos un canal para publicar.
            </p>
          ) : null}
        </Card>
        <Card>
          <div className="mb-3 text-xs font-bold uppercase text-[var(--pa-muted)]">
            Checklist
          </div>
          <div className="space-y-1.5 text-[13px] text-[var(--pa-ink)]">
            <div>✓ Fotos completas</div>
            <div>✓ Precio definido</div>
            <div>✓ Canales conectados</div>
            <div>○ Contenido revisado</div>
          </div>
        </Card>
        {actionError && (
          <p className="text-sm text-[var(--pa-danger)]">{actionError}</p>
        )}
        {isScheduled ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--pa-warning)]/40 bg-[var(--pa-surface)] p-[18px]">
            <div className="text-[13px] font-bold text-[var(--pa-ink)]">
              Publicación programada
            </div>
            <div className="text-xs text-[var(--pa-muted)]">
              {formatScheduledFor(publication.scheduledFor, publication.timezone)}
            </div>
            <PrimaryBlock onClick={() => setScheduling(true)} disabled={busy}>
              Reprogramar
            </PrimaryBlock>
            <button
              type="button"
              onClick={onCancelSchedule}
              disabled={busy}
              className="rounded-xl border border-[var(--pa-danger)] px-6 py-3 text-center text-[13px] font-bold text-[var(--pa-danger)] disabled:opacity-50"
            >
              {busy ? "Cancelando…" : "Cancelar programación"}
            </button>
          </div>
        ) : !scheduling ? (
          <>
            <PrimaryBlock
              onClick={() => onPublishNow(activeChannels)}
              disabled={busy || activeChannels.length === 0}
            >
              {busy ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Spinner size={14} className="text-white" />
                  Publicando…
                </span>
              ) : (
                "Publicar ahora"
              )}
            </PrimaryBlock>
            <button
              type="button"
              onClick={() => setScheduling(true)}
              disabled={busy || activeChannels.length === 0}
              className="rounded-xl border border-[var(--pa-border)] px-6 py-3 text-center text-[13px] font-bold text-[var(--pa-ink)] disabled:opacity-50"
            >
              Programar…
            </button>
            <button
              type="button"
              onClick={onDraft}
              disabled={busy}
              className="py-1.5 text-center text-[13px] font-bold text-[var(--pa-muted)] disabled:opacity-50"
            >
              Guardar como borrador
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-[18px]">
            <div>
              <div className={label}>Fecha</div>
              <input
                className={input}
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
            <div>
              <div className={label}>Hora</div>
              <input
                className={input}
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
            <PrimaryBlock
              onClick={() => onSchedule(scheduleDate, scheduleTime, activeChannels)}
              disabled={busy || activeChannels.length === 0}
            >
              {busy ? "Programando…" : "Confirmar programación"}
            </PrimaryBlock>
            <button
              type="button"
              onClick={() => setScheduling(false)}
              disabled={busy}
              className="py-1.5 text-center text-[13px] font-bold text-[var(--pa-muted)]"
            >
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultsStep({
  property,
  publication,
  publicationId,
  channelResults,
  sharedTitle,
  sharedBody,
  platformContent,
  republishedChannelIds,
  token,
  busy,
  actionError,
  onCancelSchedule,
  onReprogram,
  onRepublished,
  onResultUpdated,
  onPublicationRefresh,
}: {
  property: Property;
  publication: Publication;
  publicationId: string;
  channelResults: ChannelResult[];
  sharedTitle: string;
  sharedBody: string;
  platformContent: PlatformContent[];
  republishedChannelIds: Set<ChannelId>;
  token?: string;
  busy: boolean;
  actionError: string | null;
  onCancelSchedule: () => void;
  onReprogram: () => void;
  onRepublished: (channelId: ChannelId) => void;
  onResultUpdated: (result: ChannelResult) => void;
  onPublicationRefresh: (publication: Publication) => void;
}) {
  const { session } = useAuth();
  const isAdmin = session?.role === "admin";
  const [retrying, setRetrying] = useState<ChannelId | null>(null);
  const [republishing, setRepublishing] = useState<ChannelId | null>(null);
  const [removing, setRemoving] = useState<ChannelId | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [republishError, setRepublishError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  // Re-login de Marketplace: cuando falla "Sesión de Andreina no activa" en
  // el resultado de Facebook, se ofrece un botón que dispara/encola que la
  // PC abra el navegador de login — en vez de tener que correr el comando
  // por SSH/AnyDesk. Ver POST /api/marketplace/login (backend compartido).
  const [mpLoginState, setMpLoginState] = useState<
    "idle" | "pending" | "done" | "error"
  >("idle");
  const [mpLoginMessage, setMpLoginMessage] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    kind: "remove" | "republish";
    channelId: ChannelId;
  } | null>(null);

  const { pollTimedOut } = usePublicationPoll(
    publicationId,
    publication,
    onPublicationRefresh,
    token,
  );

  const pendingChannelName = pendingConfirm
    ? CHANNEL_META[pendingConfirm.channelId].name
    : "";

  const results = CHANNEL_ORDER.map((id) => {
    const found = channelResults.find((r) => r.channelId === id);
    if (!found) {
      return {
        id,
        status: "none" as ChannelStatus,
        meta: "No se intentó publicar",
        error: null as string | null,
        note: null as string | null,
        personalized: false,
        canRetry: false,
        canRemove: false,
        canRepublish: false,
        inFlight: false,
        apiStatus: null as ChannelResultStatus | null,
        durationLine: null as string | null,
      };
    }
    const uiStatus = mapResultStatus(found.status);
    const isPublished = found.status === "published";
    const inFlight =
      found.status === "publishing" || found.status === "pending";
    const channelPc = platformContentForChannel(platformContent, id);
    return {
      id,
      status: uiStatus,
      apiStatus: found.status,
      inFlight,
      meta: formatChannelResultMeta(found, {
        republished: republishedChannelIds.has(id),
      }),
      error: found.status === "failed" ? found.errorMessage : null,
      note: isPublished ? found.statusNote : null,
      personalized: isChannelPersonalized(sharedTitle, sharedBody, channelPc),
      canRetry: found.status === "failed",
      canRemove: isPublished,
      canRepublish: isPublished,
      durationLine: formatChannelDurationLine(found),
    };
  });
  const publishedCount = results.filter((r) => r.status === "published").length;
  const scheduledCount = results.filter(
    (r) => r.status === "progress" && channelResults.find((c) => c.channelId === r.id)?.status === "scheduled",
  ).length;
  const isScheduled = publication.status === "scheduled";
  const actionBusy = retrying !== null || republishing !== null || removing !== null;
  const pct =
    results.length === 0
      ? 0
      : Math.round((publishedCount / results.length) * 100);

  const mpLoginPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    return () => {
      if (mpLoginPollRef.current) clearInterval(mpLoginPollRef.current);
    };
  }, []);

  const onMarketplaceLogin = async () => {
    setMpLoginState("pending");
    setMpLoginMessage(null);
    try {
      await triggerMarketplaceLogin(token);
    } catch (err) {
      setMpLoginState("error");
      setMpLoginMessage(
        err instanceof ApiError
          ? err.message
          : "No se pudo iniciar el re-login de Marketplace.",
      );
      return;
    }
    if (mpLoginPollRef.current) clearInterval(mpLoginPollRef.current);
    mpLoginPollRef.current = setInterval(async () => {
      try {
        const status = await getMarketplaceLoginStatus(token);
        if (status.estado === "pendiente" || status.estado === null) return;
        if (mpLoginPollRef.current) {
          clearInterval(mpLoginPollRef.current);
          mpLoginPollRef.current = null;
        }
        setMpLoginState(status.estado === "completado" ? "done" : "error");
        setMpLoginMessage(status.mensaje);
      } catch {
        // Red momentánea -- se reintenta en el próximo tick, no se corta el poll.
      }
    }, 5000);
  };

  const onRetry = async (channelId: ChannelId) => {
    setRetrying(channelId);
    setRetryError(null);
    try {
      const result = await publicationsService.retryChannel(
        publicationId,
        channelId,
        token,
      );
      onResultUpdated(result);
      const refreshed = await publicationsService.get(publicationId, token);
      onPublicationRefresh(refreshed);
    } catch {
      setRetryError(
        `No se pudo reintentar la publicación de ${CHANNEL_META[channelId].name}.`,
      );
    } finally {
      setRetrying(null);
    }
  };

  const runConfirmedChannelAction = async () => {
    if (!pendingConfirm) return;
    const { kind, channelId } = pendingConfirm;
    if (kind === "republish") {
      setRepublishing(channelId);
      setRepublishError(null);
      try {
        const result = await publicationsService.republishChannel(
          publicationId,
          channelId,
          token,
        );
        onResultUpdated(result);
        const refreshed = await publicationsService.get(publicationId, token);
        onPublicationRefresh(refreshed);
        onRepublished(channelId);
        setPendingConfirm(null);
      } catch {
        setRepublishError(
          `No se pudo republicar en ${CHANNEL_META[channelId].name}.`,
        );
      } finally {
        setRepublishing(null);
      }
      return;
    }
    setRemoving(channelId);
    setRemoveError(null);
    try {
      const result = await publicationsService.removeChannel(
        publicationId,
        channelId,
        token,
      );
      onResultUpdated(result);
      const refreshed = await publicationsService.get(publicationId, token);
      onPublicationRefresh(refreshed);
      setPendingConfirm(null);
    } catch {
      setRemoveError(
        `No se pudo quitar la publicación de ${CHANNEL_META[channelId].name}.`,
      );
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="max-w-[760px]">
      {isScheduled && (
        <div className="mb-5 rounded-2xl border border-[var(--pa-warning)]/40 bg-[var(--pa-surface)] px-6 py-5">
          <div className="mb-1 text-[13px] font-bold text-[var(--pa-ink)]">
            Publicación programada
          </div>
          <div className="mb-4 text-xs text-[var(--pa-muted)]">
            {formatScheduledFor(publication.scheduledFor, publication.timezone)}
            {scheduledCount > 0
              ? ` · ${scheduledCount} canal${scheduledCount === 1 ? "" : "es"} pendiente${scheduledCount === 1 ? "" : "s"}`
              : ""}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onReprogram}
              disabled={busy}
              className="rounded-[10px] bg-[var(--pa-navy)] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              Reprogramar
            </button>
            <button
              type="button"
              onClick={onCancelSchedule}
              disabled={busy}
              className="rounded-[10px] border border-[var(--pa-danger)] px-4 py-2 text-xs font-bold text-[var(--pa-danger)] disabled:opacity-50"
            >
              {busy ? "Cancelando…" : "Cancelar programación"}
            </button>
          </div>
        </div>
      )}
      <div className="mb-5 rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] px-6 py-5">
        <div className="mb-2.5 text-[13px] font-bold text-[var(--pa-ink)]">
          {isScheduled
            ? `${scheduledCount || results.length} canal${(scheduledCount || results.length) === 1 ? "" : "es"} programado${(scheduledCount || results.length) === 1 ? "" : "s"}`
            : `${publishedCount} de ${results.length} canales publicados`}{" "}
          · {property.titulo}
        </div>
        <div className="h-2 overflow-hidden rounded bg-[var(--pa-bg-alt)]">
          <div
            className="h-full bg-[var(--pa-accent)]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {actionError && (
        <p className="mb-3 text-sm text-[var(--pa-danger)]">{actionError}</p>
      )}
      {retryError && (
        <p className="mb-3 text-sm text-[var(--pa-danger)]">{retryError}</p>
      )}
      {removeError && (
        <p className="mb-3 text-sm text-[var(--pa-danger)]">{removeError}</p>
      )}
      {republishError && (
        <p className="mb-3 text-sm text-[var(--pa-danger)]">{republishError}</p>
      )}
      {pollTimedOut && (
        <p className="mb-3 text-sm text-[var(--pa-muted)]">
          La publicación sigue en proceso. Puedes esperar un poco más o refrescar
          la página para ver el resultado.
        </p>
      )}
      {results.map((r) => (
        <div
          key={r.id}
          className="mb-3 flex items-center gap-3.5 rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] px-5 py-4"
        >
          <ChannelLogo channelId={r.id} size={36} />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-[var(--pa-ink)]">
              {CHANNEL_META[r.id].name}
            </div>
            <div className="text-[11px] text-[var(--pa-faint)]">{r.meta}</div>
            {r.durationLine ? (
              <div className="text-[10px] text-[var(--pa-muted)]">{r.durationLine}</div>
            ) : null}
            {r.personalized ? (
              <div className="mt-1 inline-block rounded-md bg-[var(--pa-info-bg)] px-2 py-0.5 text-[10px] font-bold text-[#47586A]">
                Publicación personalizada
              </div>
            ) : null}
            {r.error ? (
              <div className="mt-1 text-xs text-[var(--pa-danger)]">{r.error}</div>
            ) : null}
            {r.note ? (
              <div className="mt-1 text-xs text-[var(--pa-muted)]">{r.note}</div>
            ) : null}
            {r.id === "facebook" && mpLoginState === "done" ? (
              <div className="mt-1 text-xs text-[var(--pa-success)]">
                ✅ Sesión de Marketplace reiniciada — reintenta la publicación.
              </div>
            ) : null}
            {r.id === "facebook" && mpLoginState === "error" && mpLoginMessage ? (
              <div className="mt-1 text-xs text-[var(--pa-danger)]">
                No se pudo reiniciar la sesión: {mpLoginMessage}
              </div>
            ) : null}
          </div>
          <span
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-[10px] font-bold ${STATUS_META[r.status].chip}`}
          >
            {r.inFlight ? <Spinner size={10} /> : null}
            {retrying === r.id
              ? "Reintentando…"
              : republishing === r.id
                ? "Republicando…"
                : r.apiStatus
                  ? channelResultChipLabel(r.apiStatus, r.status)
                  : STATUS_META[r.status].label}
          </span>
          {r.canRetry && (
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => void onRetry(r.id)}
              className="whitespace-nowrap rounded-lg border border-[var(--pa-border)] px-3.5 py-1.5 text-[11px] font-bold text-[var(--pa-ink)] disabled:opacity-50"
            >
              {retrying === r.id ? "Reintentando…" : "Reintentar"}
            </button>
          )}
          {isAdmin &&
            r.id === "facebook" &&
            r.error?.includes("Sesión de Andreina no activa") && (
              <button
                type="button"
                disabled={actionBusy || mpLoginState === "pending"}
                onClick={() => void onMarketplaceLogin()}
                title="Abre un navegador en la PC para que alguien reinicie la sesión de Facebook a mano"
                className="whitespace-nowrap rounded-lg border border-[var(--pa-warning-ink)] px-3.5 py-1.5 text-[11px] font-bold text-[var(--pa-warning-ink)] disabled:opacity-50"
              >
                {mpLoginState === "pending" ? "Abriendo sesión…" : "🔑 Reintentar login"}
              </button>
            )}
          {r.canRepublish && (
            <button
              type="button"
              disabled={actionBusy}
              onClick={() =>
                setPendingConfirm({ kind: "republish", channelId: r.id })
              }
              className="whitespace-nowrap rounded-lg border border-[var(--pa-navy)] px-3.5 py-1.5 text-[11px] font-bold text-[var(--pa-navy)] disabled:opacity-50"
            >
              {republishing === r.id ? "Republicando…" : "Republicar"}
            </button>
          )}
          {r.canRemove && (
            <button
              type="button"
              disabled={actionBusy}
              onClick={() =>
                setPendingConfirm({ kind: "remove", channelId: r.id })
              }
              className="whitespace-nowrap rounded-lg border border-[var(--pa-danger)] px-3.5 py-1.5 text-[11px] font-bold text-[var(--pa-danger)] disabled:opacity-50"
            >
              {removing === r.id ? "Quitando…" : "Quitar"}
            </button>
          )}
        </div>
      ))}

      <ConfirmDialog
        open={pendingConfirm !== null}
        title={
          pendingConfirm?.kind === "remove"
            ? `¿Quitar de ${pendingChannelName}?`
            : `¿Republicar en ${pendingChannelName}?`
        }
        message={
          pendingConfirm?.kind === "remove"
            ? "El anuncio se ocultará o eliminará en ese canal. Podrás republicar después si lo necesitas."
            : "Se actualizará el anuncio con el título, descripción y fotos actuales de esta publicación."
        }
        confirmLabel={
          pendingConfirm?.kind === "remove" ? "Quitar" : "Republicar"
        }
        tone={pendingConfirm?.kind === "remove" ? "danger" : "primary"}
        busy={republishing !== null || removing !== null}
        onCancel={() => {
          if (republishing !== null || removing !== null) return;
          setPendingConfirm(null);
        }}
        onConfirm={() => void runConfirmedChannelAction()}
      />
    </div>
  );
}
