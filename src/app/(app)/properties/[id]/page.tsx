"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { propertiesService, publicationsService } from "@/services";
import type { Property } from "@/services/interfaces/properties";
import type {
  ChannelResult,
  ChannelResultStatus,
  Publication,
} from "@/services/interfaces/publications";
import {
  CHANNEL_META,
  CHANNEL_ORDER,
  STATUS_META,
  type ChannelId,
  type ChannelStatus,
} from "@/design-system/channels";
import { formatPrice } from "@/lib/format";

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

function formatPublishedAt(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("es-CO", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
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

  // Content form
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [telefonoContacto, setTelefonoContacto] = useState("");
  const [nombreContacto, setNombreContacto] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [barrio, setBarrio] = useState("");

  // Customize form
  const [sharedTitle, setSharedTitle] = useState("");
  const [sharedBody, setSharedBody] = useState("");

  // Channels
  const [selectedChannels, setSelectedChannels] = useState<
    Record<ChannelId, boolean>
  >({
    wasi: true,
    facebook: true,
    instagram: true,
    whatsapp: false,
    web: true,
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
    setTitulo(property.titulo ?? "");
    setDescripcion(property.descripcion ?? "");
    setTelefonoContacto(property.telefonoContacto ?? "");
    setNombreContacto(property.nombreContacto ?? "");
    setMunicipio(property.municipio ?? "");
    setBarrio(property.barrio ?? "");
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
      .createDraft(propId, token ?? undefined)
      .then((pub) => {
        if (cancelled) return;
        setPublication(pub);
        setSharedTitle(pub.sharedTitle || seedTitle || "");
        setSharedBody(pub.sharedBody || seedBody || "");
        if (pub.selectedChannels.length === 0) {
          setSelectedChannels({
            wasi: true,
            facebook: true,
            instagram: true,
            whatsapp: false,
            web: true,
          });
        } else {
          const toggles = Object.fromEntries(
            CHANNEL_ORDER.map((id) => [
              id,
              pub.selectedChannels.includes(id),
            ]),
          ) as Record<ChannelId, boolean>;
          setSelectedChannels(toggles);
        }
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

  const onContentContinue = async () => {
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
      await queryClient.invalidateQueries({
        queryKey: ["property", params.id],
      });
      setStep("photos");
    } catch {
      setActionError("No se pudo guardar el contenido.");
    } finally {
      setActionBusy(false);
    }
  };

  const onChannelsContinue = async () => {
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
      setStep("customize");
    } catch {
      setActionError("No se pudieron guardar los canales.");
    } finally {
      setActionBusy(false);
    }
  };

  const onCustomizeContinue = async () => {
    if (!publication) return;
    setActionBusy(true);
    setActionError(null);
    try {
      const pub = await publicationsService.patch(
        publication.id,
        { sharedTitle, sharedBody },
        token ?? undefined,
      );
      setPublication(pub);
      setStep("preview");
    } catch {
      setActionError("No se pudo guardar la personalización.");
    } finally {
      setActionBusy(false);
    }
  };

  const onPublish = async () => {
    if (!publication) return;
    setActionBusy(true);
    setActionError(null);
    try {
      const pub = await publicationsService.publish(
        publication.id,
        undefined,
        token ?? undefined,
      );
      setPublication(pub);
      setStep("results");
    } catch {
      setActionError("No se pudo publicar. Intenta de nuevo.");
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
      router.push("/properties");
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
          onClick={() => router.push("/properties")}
          className="text-sm text-[var(--pa-muted)] hover:underline"
        >
          ← Propiedades
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
          onClick={() => router.push("/properties")}
          className="text-sm text-[var(--pa-muted)] hover:underline"
        >
          ← Propiedades
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
          onClick={async () => {
            const ok = window.confirm(
              `¿Eliminar «${property.titulo}»? Esta acción no se puede deshacer.`,
            );
            if (!ok) return;
            try {
              await propertiesService.delete(property.id, token ?? undefined);
              router.push("/properties");
            } catch {
              window.alert("No se pudo eliminar la propiedad.");
            }
          }}
          className="text-xs font-bold text-[var(--pa-danger)] hover:underline"
        >
          Eliminar propiedad
        </button>
      </div>

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
          onNext={() => void onContentContinue()}
        />
      )}
      {step === "photos" && (
        <PhotosStep onNext={() => setStep("channels")} />
      )}
      {step === "channels" && (
        <ChannelsStep
          toggles={selectedChannels}
          onToggle={(id) =>
            setSelectedChannels((t) => ({ ...t, [id]: !t[id] }))
          }
          busy={actionBusy}
          onNext={() => void onChannelsContinue()}
        />
      )}
      {step === "customize" && (
        <CustomizeStep
          sharedTitle={sharedTitle}
          sharedBody={sharedBody}
          onTitle={setSharedTitle}
          onBody={setSharedBody}
          busy={actionBusy}
          onNext={() => void onCustomizeContinue()}
        />
      )}
      {step === "preview" && (
        <PreviewStep
          property={displayProperty}
          busy={actionBusy}
          onPublish={() => void onPublish()}
          onDraft={() => void onSaveDraft()}
        />
      )}
      {step === "results" && (
        <ResultsStep
          property={displayProperty}
          channelResults={publication.channelResults}
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
        <PrimaryBlock onClick={onNext} disabled={busy}>
          {busy ? "Guardando…" : "Continuar a fotos"}
        </PrimaryBlock>
      </div>
    </div>
  );
}

function PhotosStep({ onNext }: { onNext: () => void }) {
  const photos = [
    "sala principal",
    "cocina integral",
    "alcoba 1",
    "alcoba 2",
    "baño",
    "balcón",
  ];
  return (
    <div className="max-w-[920px]">
      <div className="mb-4 text-[13px] text-[var(--pa-muted)]">
        La primera foto es la portada. Arrastra para reordenar.
      </div>
      <div className="mb-5 grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5">
        {photos.map((p, i) => (
          <div
            key={p}
            className="relative flex aspect-[4/3] items-center justify-center rounded-xl bg-[repeating-linear-gradient(45deg,#E4E8EC,#E4E8EC_8px,#EDEFF2_8px,#EDEFF2_16px)]"
          >
            <span className="font-mono text-[10px] text-[#8B98A5]">{p}</span>
            {i === 0 && (
              <span className="absolute left-2 top-2 rounded-md bg-[var(--pa-navy)] px-2 py-0.5 text-[10px] font-bold text-white">
                ★ Portada
              </span>
            )}
            <span className="absolute bottom-2 right-2 flex h-[22px] w-[22px] items-center justify-center rounded-md bg-[rgba(22,33,43,0.6)] text-[11px] font-bold text-white">
              {i + 1}
            </span>
          </div>
        ))}
        <div className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-[#C9D1D8] p-2.5 text-center text-xs text-[var(--pa-faint)]">
          <span className="text-[22px]">+</span>
          Arrastra o haz clic para subir
        </div>
      </div>
      <PrimaryBlock onClick={onNext} className="w-[220px]">
        Continuar a canales
      </PrimaryBlock>
    </div>
  );
}

function ChannelsStep({
  toggles,
  onToggle,
  busy,
  onNext,
}: {
  toggles: Record<ChannelId, boolean>;
  onToggle: (id: ChannelId) => void;
  busy: boolean;
  onNext: () => void;
}) {
  const aiActions = ["Sugerir", "Mejorar", "Acortar", "Más profesional", "Más persuasivo"];
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
          const issue = id === "whatsapp";
          return (
            <div
              key={id}
              className="rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-[18px]"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[var(--pa-bg-alt)] text-[13px] font-extrabold text-[#45525E]">
                  {meta.initial}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[var(--pa-ink)]">
                    {meta.name}
                  </div>
                  <div className="text-[11px] text-[var(--pa-muted)]">
                    {meta.account}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Alternar ${meta.name}`}
                  onClick={() => onToggle(id)}
                  className={`relative h-[22px] w-10 shrink-0 rounded-full transition-colors ${
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
                className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-bold ${
                  issue
                    ? "bg-[var(--pa-warning-bg)] text-[var(--pa-warning-ink)]"
                    : "bg-[var(--pa-success-bg)] text-[var(--pa-accent)]"
                }`}
              >
                {issue ? "Requiere autorización" : "Conectado"}
              </span>
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
        <div className="flex flex-wrap gap-2">
          {aiActions.map((a, i) => (
            <button
              key={a}
              type="button"
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                i === 0
                  ? "bg-[var(--pa-navy)] text-white"
                  : "border border-[var(--pa-border)] text-[#45525E]"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-[var(--pa-faint)]">
          La IA sugiere; siempre revisas y apruebas antes de publicar.
        </p>
      </div>

      <PrimaryBlock onClick={onNext} disabled={busy} className="w-[240px]">
        {busy ? "Guardando…" : "Continuar a personalizar"}
      </PrimaryBlock>
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
  sharedTitle,
  sharedBody,
  onTitle,
  onBody,
  busy,
  onNext,
}: {
  sharedTitle: string;
  sharedBody: string;
  onTitle: (v: string) => void;
  onBody: (v: string) => void;
  busy: boolean;
  onNext: () => void;
}) {
  const platforms: { id: ChannelId; label: string }[] = [
    { id: "wasi", label: "WASI" },
    { id: "facebook", label: "Facebook" },
    { id: "instagram", label: "Instagram" },
    { id: "whatsapp", label: "WhatsApp" },
  ];
  const [active, setActive] = useState<ChannelId>("wasi");
  const limit = PLATFORM_LIMITS[active] ?? 1000;

  return (
    <div className="max-w-[960px]">
      <div className="mb-6 flex w-fit gap-1.5 rounded-xl bg-[var(--pa-bg-alt)] p-1">
        {platforms.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActive(p.id)}
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
          <div className={label}>Título</div>
          <input
            className={`${input} mb-4`}
            value={sharedTitle}
            onChange={(e) => onTitle(e.target.value)}
          />
          <div className="mb-1.5 flex items-center justify-between">
            <div className={label}>Descripción</div>
            <span className="text-[11px] text-[var(--pa-faint)]">
              {sharedBody.length}/{limit}
            </span>
          </div>
          <textarea
            className={`${input} min-h-[140px] font-normal leading-relaxed text-[#45525E]`}
            value={sharedBody}
            onChange={(e) => onBody(e.target.value)}
          />
        </Card>
        <div>
          <div className="mb-2.5 text-[11px] font-bold uppercase text-[var(--pa-faint)]">
            Vista previa
          </div>
          <div className="overflow-hidden rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)]">
            <div className="aspect-[4/3] w-full bg-[repeating-linear-gradient(45deg,#E4E8EC,#E4E8EC_10px,#EDEFF2_10px,#EDEFF2_20px)]" />
            <div className="p-3.5">
              <div className="mb-1 text-[13px] font-bold text-[var(--pa-ink)]">
                {sharedTitle}
              </div>
              <div className="line-clamp-4 text-xs leading-relaxed text-[#45525E]">
                {sharedBody}
              </div>
            </div>
          </div>
        </div>
      </div>
      <PrimaryBlock onClick={onNext} disabled={busy} className="mt-6 w-[220px]">
        {busy ? "Guardando…" : "Ir a vista previa"}
      </PrimaryBlock>
    </div>
  );
}

function PreviewStep({
  property,
  busy,
  onPublish,
  onDraft,
}: {
  property: Property;
  busy: boolean;
  onPublish: () => void;
  onDraft: () => void;
}) {
  const [scheduling, setScheduling] = useState(false);
  const facts = [
    property.alcobas !== null ? `${property.alcobas} alcobas` : null,
    property.banos !== null ? `${property.banos} baños` : null,
    property.parqueaderos !== null ? `${property.parqueaderos} parqueadero` : null,
    property.areaM2 !== null ? `${property.areaM2} m²` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="grid max-w-[1100px] grid-cols-1 gap-7 lg:grid-cols-[1fr_340px]">
      <div className="overflow-hidden rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)]">
        <div className="h-[280px] w-full bg-[repeating-linear-gradient(45deg,#E4E8EC,#E4E8EC_12px,#EDEFF2_12px,#EDEFF2_24px)]" />
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
            Checklist
          </div>
          <div className="space-y-1.5 text-[13px] text-[var(--pa-ink)]">
            <div>✓ Fotos completas</div>
            <div>✓ Precio definido</div>
            <div>✓ Canales conectados</div>
            <div>○ Contenido revisado</div>
          </div>
        </Card>
        {!scheduling ? (
          <>
            <PrimaryBlock onClick={onPublish} disabled={busy}>
              {busy ? "Publicando…" : "Publicar ahora"}
            </PrimaryBlock>
            <button
              type="button"
              onClick={() => setScheduling(true)}
              disabled={busy}
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
              <input className={input} type="date" />
            </div>
            <div>
              <div className={label}>Hora</div>
              <input className={input} type="time" defaultValue="17:00" />
            </div>
            <PrimaryBlock onClick={onPublish} disabled={busy}>
              {busy ? "Publicando…" : "Confirmar programación"}
            </PrimaryBlock>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultsStep({
  property,
  channelResults,
}: {
  property: Property;
  channelResults: ChannelResult[];
}) {
  const results = CHANNEL_ORDER.map((id) => {
    const found = channelResults.find((r) => r.channelId === id);
    if (!found) {
      return {
        id,
        status: "none" as ChannelStatus,
        meta: "No se intentó publicar",
        error: null as string | null,
      };
    }
    const uiStatus = mapResultStatus(found.status);
    return {
      id,
      status: uiStatus,
      meta: found.publishedAt
        ? formatPublishedAt(found.publishedAt)
        : found.status === "pending" || found.status === "publishing"
          ? "En proceso…"
          : found.status === "failed"
            ? "Falló"
            : STATUS_META[uiStatus].label,
      error: found.errorMessage,
    };
  });
  const publishedCount = results.filter((r) => r.status === "published").length;
  const pct =
    results.length === 0
      ? 0
      : Math.round((publishedCount / results.length) * 100);

  return (
    <div className="max-w-[760px]">
      <div className="mb-5 rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] px-6 py-5">
        <div className="mb-2.5 text-[13px] font-bold text-[var(--pa-ink)]">
          {publishedCount} de {results.length} canales publicados ·{" "}
          {property.titulo}
        </div>
        <div className="h-2 overflow-hidden rounded bg-[var(--pa-bg-alt)]">
          <div
            className="h-full bg-[var(--pa-accent)]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {results.map((r) => (
        <div
          key={r.id}
          className="mb-3 flex items-center gap-3.5 rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] px-5 py-4"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[var(--pa-bg-alt)] text-xs font-extrabold text-[#45525E]">
            {CHANNEL_META[r.id].initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-[var(--pa-ink)]">
              {CHANNEL_META[r.id].name}
            </div>
            <div className="text-[11px] text-[var(--pa-faint)]">{r.meta}</div>
            {r.error && (
              <div className="mt-1 text-xs text-[var(--pa-danger)]">{r.error}</div>
            )}
          </div>
          <span
            className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[10px] font-bold ${STATUS_META[r.status].chip}`}
          >
            {STATUS_META[r.status].label}
          </span>
          {r.error && (
            <button
              type="button"
              disabled
              title="Reintento disponible en Part B"
              className="whitespace-nowrap rounded-lg border border-[var(--pa-border)] px-3.5 py-1.5 text-[11px] font-bold text-[var(--pa-ink)] opacity-50"
            >
              Reintentar
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
