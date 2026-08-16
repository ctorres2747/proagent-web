"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { propertiesService, publicationsService, channelsService } from "@/services";
import type { Property } from "@/services/interfaces/properties";
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
import { DeletePropertyDialog } from "@/components/DeletePropertyDialog";
import { formatPrice } from "@/lib/format";
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
import { formatChannelResultMeta } from "@/lib/channelResults";
import {
  isChannelPersonalized,
  platformContentForChannel,
} from "@/lib/publicationContent";

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

function mapResultStatus(status: ChannelResultStatus): ChannelStatus {
  if (status === "published") return "published";
  if (status === "failed") return "error";
  if (status === "unavailable") return "none";
  return "progress";
}

type ContentFormSnapshot = {
  titulo: string;
  descripcion: string;
  telefonoContacto: string;
  nombreContacto: string;
  municipio: string;
  barrio: string;
};

function snapshotFromProperty(property: Property): ContentFormSnapshot {
  return {
    titulo: property.titulo ?? "",
    descripcion: property.descripcion ?? "",
    telefonoContacto: property.telefonoContacto ?? "",
    nombreContacto: property.nombreContacto ?? "",
    municipio: property.municipio ?? "",
    barrio: property.barrio ?? "",
  };
}

function contentFormsEqual(a: ContentFormSnapshot, b: ContentFormSnapshot): boolean {
  return (
    a.titulo === b.titulo &&
    a.descripcion === b.descripcion &&
    a.telefonoContacto === b.telefonoContacto &&
    a.nombreContacto === b.nombreContacto &&
    a.municipio === b.municipio &&
    a.barrio === b.barrio
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
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [telefonoContacto, setTelefonoContacto] = useState("");
  const [nombreContacto, setNombreContacto] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [barrio, setBarrio] = useState("");
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
    setTitulo(snapshot.titulo);
    setDescripcion(snapshot.descripcion);
    setTelefonoContacto(snapshot.telefonoContacto);
    setNombreContacto(snapshot.nombreContacto);
    setMunicipio(snapshot.municipio);
    setBarrio(snapshot.barrio);
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
        setSharedTitle(pub.sharedTitle || seedTitle || "");
        setSharedBody(pub.sharedBody || seedBody || "");
        const contentMap: Partial<
          Record<ChannelId, { title: string; body: string }>
        > = {};
        for (const pc of pub.platformContent ?? []) {
          contentMap[pc.channelId] = { title: pc.title, body: pc.body };
        }
        setPlatformContent(contentMap);
        if (pub.selectedChannels.length === 0) {
          setSelectedChannels({
            wasi: true,
            facebook: true,
            instagram: true,
            whatsapp: false,
            web: false,
          });
        } else {
          const toggles = Object.fromEntries(
            CHANNEL_ORDER.map((id) => [
              id,
              pub.selectedChannels.includes(id),
            ]),
          ) as Record<ChannelId, boolean>;
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
    () => ({
      titulo,
      descripcion,
      telefonoContacto,
      nombreContacto,
      municipio,
      barrio,
    }),
    [titulo, descripcion, telefonoContacto, nombreContacto, municipio, barrio],
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

  const channelSelectable = (id: ChannelId): boolean => {
    const conn = connectionById.get(id);
    if (!conn) return id !== "web";
    return conn.status === "connected" || conn.status === "needs_auth";
  };

  const saveContentChanges = async (options?: { advance?: boolean }) => {
    if (!property || !publication) return;
    setActionBusy(true);
    setActionError(null);
    try {
      await propertiesService.update(
        property.id,
        {
          titulo,
          descripcion,
          telefonoContacto,
          nombreContacto,
          municipio,
          barrio: barrio || null,
        },
        token ?? undefined,
      );
      const pub = await publicationsService.patch(
        publication.id,
        { sharedTitle: titulo, sharedBody: descripcion },
        token ?? undefined,
      );
      setPublication(pub);
      setSharedTitle(pub.sharedTitle || titulo);
      setSharedBody(pub.sharedBody || descripcion);
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
      await publicationsService.patch(
        publication.id,
        { selectedChannels: channels },
        token ?? undefined,
      );
      const pub = await publicationsService.publish(
        publication.id,
        opts,
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
    titulo: sharedTitle || titulo || property.titulo,
    descripcion: sharedBody || descripcion || property.descripcion,
    telefonoContacto,
    nombreContacto,
    municipio: municipio || property.municipio,
    barrio: barrio || property.barrio,
  };

  return (
    <div className="px-6 py-8 md:px-10">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[13px] font-semibold text-[var(--pa-faint)]">
          {property.titulo} · {property.code}
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
          titulo={titulo}
          descripcion={descripcion}
          telefonoContacto={telefonoContacto}
          nombreContacto={nombreContacto}
          municipio={municipio}
          barrio={barrio}
          onTitulo={setTitulo}
          onDescripcion={setDescripcion}
          onTelefono={setTelefonoContacto}
          onNombre={setNombreContacto}
          onMunicipio={setMunicipio}
          onBarrio={setBarrio}
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

function Chip({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`rounded-full px-3.5 py-2 text-xs font-semibold ${
        active
          ? "bg-[var(--pa-navy)] text-white"
          : "border border-[var(--pa-border)] bg-[var(--pa-bg)] text-[#45525E]"
      }`}
    >
      {children}
    </span>
  );
}

function ControlledField({
  label: l,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className={label}>{l}</div>
      <input
        className={input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
const INTENTS = ["Venta", "Arriendo"];
const CONDITIONS = ["Nuevo", "Usado", "Proyecto", "En construcción"];
const ALL_FEATURES = [
  "Balcón",
  "Parqueadero visitantes",
  "Piscina",
  "Gimnasio",
  "Zona BBQ",
  "Vigilancia 24h",
  "Ascensor",
  "Depósito",
];

function ContentStep({
  property,
  titulo,
  descripcion,
  telefonoContacto,
  nombreContacto,
  municipio,
  barrio,
  onTitulo,
  onDescripcion,
  onTelefono,
  onNombre,
  onMunicipio,
  onBarrio,
  busy,
  isDirty,
  onSave,
  onNext,
}: {
  property: Property;
  titulo: string;
  descripcion: string;
  telefonoContacto: string;
  nombreContacto: string;
  municipio: string;
  barrio: string;
  onTitulo: (v: string) => void;
  onDescripcion: (v: string) => void;
  onTelefono: (v: string) => void;
  onNombre: (v: string) => void;
  onMunicipio: (v: string) => void;
  onBarrio: (v: string) => void;
  busy: boolean;
  isDirty: boolean;
  onSave: () => void;
  onNext: () => void;
}) {
  const checklist = [
    { label: "Título y precio", done: Boolean(titulo && property.precio) },
    { label: "Ubicación", done: Boolean(municipio) },
    { label: "Fotos", done: property.completeness >= 100 },
    {
      label: "Contacto",
      done: Boolean(telefonoContacto.trim()),
    },
  ];
  return (
    <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[1fr_300px]">
      <div className="flex min-w-0 flex-col gap-6">
        <Card title="Básicos">
          <div className="grid gap-4">
            <ControlledField
              label="Título *"
              value={titulo}
              onChange={onTitulo}
            />
            <div>
              <div className={label}>Descripción</div>
              <textarea
                className={`${input} min-h-[88px] font-normal leading-relaxed text-[#45525E]`}
                value={descripcion}
                onChange={(e) => onDescripcion(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <div>
                <div className={label}>Tipo</div>
                <div className="flex flex-wrap gap-1.5">
                  {PROPERTY_TYPES.map((t) => (
                    <Chip key={t} active={t === property.tipo}>
                      {t}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <div className={label}>Intención</div>
                <div className="flex gap-1.5">
                  {INTENTS.map((it) => (
                    <Chip key={it} active={it === property.intent}>
                      {it}
                    </Chip>
                  ))}
                </div>
              </div>
              <ReadOnlyField
                label="Precio (COP) *"
                value={formatPrice(property.precio, property.esArriendo)}
              />
            </div>
          </div>
        </Card>

        <Card title="Ubicación">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <ControlledField
              label="Ciudad"
              value={municipio}
              onChange={onMunicipio}
            />
            <ControlledField
              label="Barrio / zona"
              value={barrio}
              onChange={onBarrio}
            />
            <ReadOnlyField label="Dirección" value={property.direccion} />
            <ReadOnlyField
              label="Código postal"
              value={property.codigoPostal}
            />
          </div>
        </Card>

        <Card title="Detalles">
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            <ReadOnlyField label="Alcobas" value={property.alcobas} />
            <ReadOnlyField label="Baños" value={property.banos} />
            <ReadOnlyField label="Parqueaderos" value={property.parqueaderos} />
            <ReadOnlyField label="Estrato" value={property.estrato} />
            <ReadOnlyField label="Piso" value={property.piso} />
            <ReadOnlyField label="Área (m²)" value={property.areaM2} />
            <ReadOnlyField label="Área privada" value={property.areaPrivada} />
            <ReadOnlyField
              label="Área construida"
              value={property.areaConstruida}
            />
            <ReadOnlyField
              label="Administración (COP)"
              value={property.administracion}
            />
            <ReadOnlyField
              label="Año de construcción"
              value={property.anioConstruccion}
            />
            <div className="col-span-2">
              <div className={label}>Estado</div>
              <div className="flex flex-wrap gap-1.5">
                {CONDITIONS.map((c) => (
                  <Chip key={c} active={c === property.condicion}>
                    {c}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Contacto">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <ControlledField
              label="Nombre"
              value={nombreContacto}
              onChange={onNombre}
            />
            <ControlledField
              label="Teléfono *"
              value={telefonoContacto}
              onChange={onTelefono}
            />
          </div>
        </Card>

        <Card title="Características">
          <div className="flex flex-wrap gap-2">
            {ALL_FEATURES.map((f) => (
              <Chip key={f} active={property.features.includes(f)}>
                {f}
              </Chip>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-6">
        <Card>
          <div className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--pa-muted)]">
            Completitud
          </div>
          <div className="mb-2.5 text-[28px] font-extrabold text-[var(--pa-navy)]">
            {property.completeness}%
          </div>
          <div className="mb-3.5 h-2 overflow-hidden rounded bg-[var(--pa-bg-alt)]">
            <div
              className="h-full rounded bg-[var(--pa-accent)]"
              style={{ width: `${property.completeness}%` }}
            />
          </div>
          <ul className="space-y-1 text-xs text-[var(--pa-muted)]">
            {checklist.map((c) => (
              <li key={c.label}>
                {c.done ? "✓" : "○"} {c.label}
              </li>
            ))}
          </ul>
        </Card>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={!isDirty || busy}
            className="rounded-xl border border-[var(--pa-navy)] bg-[var(--pa-surface)] px-6 py-3.5 text-center text-[13px] font-bold text-[var(--pa-navy)] transition-opacity hover:bg-[var(--pa-bg)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Guardando…" : "Guardar cambios"}
          </button>
          <PrimaryBlock onClick={onNext} disabled={busy}>
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

  return (
    <div className="max-w-[920px]">
      <div className="mb-4 text-[13px] text-[var(--pa-muted)]">
        La primera foto es la portada. Usa las flechas para reordenar.
      </div>
      {error && (
        <p className="mb-3 text-sm text-[var(--pa-danger)]">{error}</p>
      )}
      <div className="mb-5 grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5">
        {fotos.map((p, i) => (
          <div
            key={p.id}
            className="relative overflow-hidden rounded-xl bg-[var(--pa-bg-alt)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt=""
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
                    {!selectable && conn?.issue ? (
                      <div className="text-[10px] text-[var(--pa-muted)]">
                        {conn.issue}
                      </div>
                    ) : null}
                    {busy && on ? (
                      <div className="text-[10px] font-semibold text-[var(--pa-warning-ink)]">
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
              {busy ? "Publicando…" : "Publicar ahora"}
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
  const [retrying, setRetrying] = useState<ChannelId | null>(null);
  const [republishing, setRepublishing] = useState<ChannelId | null>(null);
  const [removing, setRemoving] = useState<ChannelId | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [republishError, setRepublishError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    kind: "remove" | "republish";
    channelId: ChannelId;
  } | null>(null);

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
      };
    }
    const uiStatus = mapResultStatus(found.status);
    const isPublished = found.status === "published";
    const channelPc = platformContentForChannel(platformContent, id);
    return {
      id,
      status: uiStatus,
      meta: formatChannelResultMeta(found, {
        republished: republishedChannelIds.has(id),
      }),
      error: found.status === "failed" ? found.errorMessage : null,
      note: isPublished ? found.statusNote : null,
      personalized: isChannelPersonalized(sharedTitle, sharedBody, channelPc),
      canRetry: found.status === "failed",
      canRemove: isPublished,
      canRepublish: isPublished,
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
          </div>
          <span
            className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[10px] font-bold ${STATUS_META[r.status].chip}`}
          >
            {STATUS_META[r.status].label}
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
