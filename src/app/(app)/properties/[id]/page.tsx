"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { propertiesService } from "@/services";
import type { Property } from "@/services/interfaces/properties";
import {
  CHANNEL_META,
  CHANNEL_ORDER,
  STATUS_META,
  type ChannelId,
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

export default function PublishWizardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const [step, setStep] = useState<StepId>("content");

  const { data: property, isLoading, isError } = useQuery({
    queryKey: ["property", params.id],
    queryFn: () => propertiesService.get(params.id, token ?? undefined),
    enabled: Boolean(params.id),
  });

  if (isLoading) {
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

  return (
    <div className="px-6 py-8 md:px-10">
      <div className="mb-1.5 text-[13px] font-semibold text-[var(--pa-faint)]">
        {property.titulo} · {property.code}
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

      {step === "content" && (
        <ContentStep property={property} onNext={() => setStep("photos")} />
      )}
      {step === "photos" && <PhotosStep onNext={() => setStep("channels")} />}
      {step === "channels" && (
        <ChannelsStep onNext={() => setStep("customize")} />
      )}
      {step === "customize" && (
        <CustomizeStep property={property} onNext={() => setStep("preview")} />
      )}
      {step === "preview" && (
        <PreviewStep
          property={property}
          onPublish={() => setStep("results")}
          onDraft={() => router.push("/properties")}
        />
      )}
      {step === "results" && <ResultsStep property={property} />}
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

function Field({
  label: l,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div>
      <div className={label}>{l}</div>
      <input className={input} defaultValue={value ?? ""} />
    </div>
  );
}

function PrimaryBlock({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl bg-[var(--pa-navy)] px-6 py-3.5 text-center text-[13px] font-bold text-white transition-opacity hover:opacity-90 ${className}`}
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
  onNext,
}: {
  property: Property;
  onNext: () => void;
}) {
  const checklist = [
    { label: "Título y precio", done: Boolean(property.titulo && property.precio) },
    { label: "Ubicación", done: Boolean(property.municipio) },
    { label: "Fotos", done: property.completeness >= 100 },
    { label: "Contacto", done: property.completeness >= 100 },
  ];
  return (
    <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[1fr_300px]">
      <div className="flex min-w-0 flex-col gap-6">
        <Card title="Básicos">
          <div className="grid gap-4">
            <Field label="Título *" value={property.titulo} />
            <div>
              <div className={label}>Descripción</div>
              <textarea
                className={`${input} min-h-[88px] font-normal leading-relaxed text-[#45525E]`}
                defaultValue={property.descripcion ?? ""}
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
              <Field
                label="Precio (COP) *"
                value={formatPrice(property.precio, property.esArriendo)}
              />
            </div>
          </div>
        </Card>

        <Card title="Ubicación">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Ciudad" value={property.municipio} />
            <Field label="Barrio / zona" value={property.barrio} />
            <Field label="Dirección" value={property.direccion} />
            <Field label="Código postal" value={property.codigoPostal} />
          </div>
        </Card>

        <Card title="Detalles">
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            <Field label="Alcobas" value={property.alcobas} />
            <Field label="Baños" value={property.banos} />
            <Field label="Parqueaderos" value={property.parqueaderos} />
            <Field label="Estrato" value={property.estrato} />
            <Field label="Piso" value={property.piso} />
            <Field label="Área (m²)" value={property.areaM2} />
            <Field label="Área privada" value={property.areaPrivada} />
            <Field label="Área construida" value={property.areaConstruida} />
            <Field label="Administración (COP)" value={property.administracion} />
            <Field label="Año de construcción" value={property.anioConstruccion} />
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
        <PrimaryBlock onClick={onNext}>Continuar a fotos</PrimaryBlock>
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

function ChannelsStep({ onNext }: { onNext: () => void }) {
  const [toggles, setToggles] = useState<Record<ChannelId, boolean>>({
    wasi: true,
    facebook: true,
    instagram: true,
    whatsapp: false,
    web: true,
  });
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
                  onClick={() => setToggles((t) => ({ ...t, [id]: !t[id] }))}
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

      <PrimaryBlock onClick={onNext} className="w-[240px]">
        Continuar a personalizar
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
  property,
  onNext,
}: {
  property: Property;
  onNext: () => void;
}) {
  const platforms: { id: ChannelId; label: string }[] = [
    { id: "wasi", label: "WASI" },
    { id: "facebook", label: "Facebook" },
    { id: "instagram", label: "Instagram" },
    { id: "whatsapp", label: "WhatsApp" },
  ];
  const [active, setActive] = useState<ChannelId>("wasi");

  const body = useMemo(() => {
    const base =
      property.descripcion ??
      `${property.tipo} en ${property.municipio}. ${formatPrice(property.precio, property.esArriendo)}.`;
    if (active === "instagram")
      return `${base} #${property.municipio.replace(/\s/g, "")} #Inmuebles #Proinversores`;
    if (active === "whatsapp")
      return `${formatPrice(property.precio, property.esArriendo)} · ${property.tipo} en ${property.municipio}.`;
    return base;
  }, [active, property]);

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
          <input className={`${input} mb-4`} defaultValue={property.titulo} />
          <div className="mb-1.5 flex items-center justify-between">
            <div className={label}>Descripción</div>
            <span className="text-[11px] text-[var(--pa-faint)]">
              {body.length}/{limit}
            </span>
          </div>
          <textarea
            className={`${input} min-h-[140px] font-normal leading-relaxed text-[#45525E]`}
            defaultValue={body}
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
                {property.titulo}
              </div>
              <div className="line-clamp-4 text-xs leading-relaxed text-[#45525E]">
                {body}
              </div>
            </div>
          </div>
        </div>
      </div>
      <PrimaryBlock onClick={onNext} className="mt-6 w-[220px]">
        Ir a vista previa
      </PrimaryBlock>
    </div>
  );
}

function PreviewStep({
  property,
  onPublish,
  onDraft,
}: {
  property: Property;
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
            <PrimaryBlock onClick={onPublish}>Publicar ahora</PrimaryBlock>
            <button
              type="button"
              onClick={() => setScheduling(true)}
              className="rounded-xl border border-[var(--pa-border)] px-6 py-3 text-center text-[13px] font-bold text-[var(--pa-ink)]"
            >
              Programar…
            </button>
            <button
              type="button"
              onClick={onDraft}
              className="py-1.5 text-center text-[13px] font-bold text-[var(--pa-muted)]"
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
            <PrimaryBlock onClick={onPublish}>
              Confirmar programación
            </PrimaryBlock>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultsStep({ property }: { property: Property }) {
  // Derived demo results: connected channels succeed, whatsapp disconnected,
  // facebook shows a retryable error to exercise the error UI.
  const results = CHANNEL_ORDER.map((id) => {
    if (id === "whatsapp")
      return {
        id,
        status: "none" as const,
        meta: "No se intentó publicar",
        error: null,
      };
    if (id === "facebook")
      return {
        id,
        status: "error" as const,
        meta: "Hoy · 9:13 AM",
        error: "La página de Facebook no tiene permisos de publicación.",
      };
    return {
      id,
      status: "published" as const,
      meta: "Hoy · 9:12 AM",
      error: null,
    };
  });
  const publishedCount = results.filter((r) => r.status === "published").length;
  const pct = Math.round((publishedCount / results.length) * 100);

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
              className="whitespace-nowrap rounded-lg border border-[var(--pa-border)] px-3.5 py-1.5 text-[11px] font-bold text-[var(--pa-ink)]"
            >
              Reintentar
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
