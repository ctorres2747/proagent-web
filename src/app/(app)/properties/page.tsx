"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { propertiesService } from "@/services";
import type { Property } from "@/services/interfaces/properties";
import { ChannelChips } from "@/components/ChannelChips";
import { CompletenessBar } from "@/components/CompletenessBar";
import { formatPrice } from "@/lib/format";

const FILTERS = ["Tipo", "Ciudad", "Estado", "Precio"];

export default function PropertiesPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<"table" | "cards">("table");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["properties"],
    queryFn: () => propertiesService.list(token ?? undefined),
  });

  const open = (p: Property) => router.push(`/properties/${p.id}`);

  return (
    <div className="px-6 py-8 md:px-10 md:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold text-[var(--pa-ink)]">
            Propiedades
          </h1>
          <p className="mt-1 text-[13px] text-[var(--pa-muted)]">
            {isLoading
              ? "Cargando inventario…"
              : `${data?.length ?? 0} inmuebles en tu inventario`}
          </p>
        </div>
        <div className="flex rounded-[10px] bg-[var(--pa-bg-alt)] p-[3px]">
          <SegBtn active={view === "cards"} onClick={() => setView("cards")}>
            Tarjetas
          </SegBtn>
          <SegBtn active={view === "table"} onClick={() => setView("table")}>
            Tabla
          </SegBtn>
        </div>
      </div>

      {/* Filter chips */}
      <div className="mb-6 flex flex-wrap gap-2.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className="whitespace-nowrap rounded-full border border-[var(--pa-border)] bg-[var(--pa-surface)] px-4 py-2 text-[13px] font-semibold text-[#45525E] hover:border-[var(--pa-navy)]"
          >
            {f} ▾
          </button>
        ))}
      </div>

      {isLoading && <SkeletonGrid />}
      {isError && (
        <p className="text-sm text-[var(--pa-danger)]">
          No se pudieron cargar las propiedades.
        </p>
      )}

      {data && data.length === 0 && <EmptyState onCreate={() => router.push("/publications")} />}

      {data && data.length > 0 && view === "cards" && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
          {data.map((p) => (
            <PropertyCard key={p.id} p={p} onClick={() => open(p)} />
          ))}
        </div>
      )}

      {data && data.length > 0 && view === "table" && (
        <PropertyTable properties={data} onOpen={open} />
      )}
    </div>
  );
}

function SegBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-xs transition-colors ${
        active
          ? "bg-[var(--pa-surface)] font-bold text-[var(--pa-navy)] shadow-sm"
          : "font-semibold text-[var(--pa-muted)]"
      }`}
    >
      {children}
    </button>
  );
}

function PropertyCard({ p, onClick }: { p: Property; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-3.5 text-left transition-shadow hover:shadow-sm"
    >
      <div className="relative mb-3.5 flex h-[150px] items-center justify-center rounded-xl bg-[repeating-linear-gradient(45deg,#E4E8EC,#E4E8EC_10px,#EDEFF2_10px,#EDEFF2_20px)]">
        <span className="font-mono text-[11px] text-[#8B98A5]">foto portada</span>
        <span className="absolute left-2.5 top-2.5 rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[var(--pa-ink)]">
          {p.code}
        </span>
      </div>
      <div className="mb-1 line-clamp-1 text-sm font-bold text-[var(--pa-ink)]">
        {p.titulo}
      </div>
      <div className="mb-2.5 text-xs text-[var(--pa-muted)]">
        {p.tipo} · {p.intent} · {p.municipio}
      </div>
      <div className="mb-3 text-[15px] font-extrabold text-[var(--pa-navy)]">
        {formatPrice(p.precio, p.esArriendo)}
      </div>
      <div className="mb-3">
        <CompletenessBar value={p.completeness} />
      </div>
      <ChannelChips channels={p.channels} />
    </button>
  );
}

function PropertyTable({
  properties,
  onOpen,
}: {
  properties: Property[];
  onOpen: (p: Property) => void;
}) {
  const cols =
    "grid-cols-[64px_2fr_1.2fr_1fr_1.2fr_1.1fr_1.6fr]";
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)]">
      <div
        className={`grid ${cols} gap-3 border-b border-[var(--pa-border)] bg-[var(--pa-bg)] px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-[var(--pa-muted)]`}
      >
        <div />
        <div>Título</div>
        <div>Tipo</div>
        <div>Precio</div>
        <div>Ubicación</div>
        <div>Completitud</div>
        <div>Canales</div>
      </div>
      {properties.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onOpen(p)}
          className={`grid w-full ${cols} items-center gap-3 border-b border-[var(--pa-bg-alt)] px-5 py-3 text-left last:border-b-0 hover:bg-[var(--pa-bg)]`}
        >
          <div className="h-11 w-11 rounded-lg bg-[repeating-linear-gradient(45deg,#E4E8EC,#E4E8EC_6px,#EDEFF2_6px,#EDEFF2_12px)]" />
          <div className="min-w-0">
            <div className="line-clamp-1 text-[13px] font-bold text-[var(--pa-ink)]">
              {p.titulo}
            </div>
            <div className="text-[11px] text-[var(--pa-faint)]">{p.code}</div>
          </div>
          <div className="text-xs text-[var(--pa-muted)]">
            {p.tipo} · {p.intent}
          </div>
          <div className="text-[13px] font-bold text-[var(--pa-navy)]">
            {formatPrice(p.precio, p.esArriendo)}
          </div>
          <div className="text-xs text-[var(--pa-muted)]">{p.municipio}</div>
          <div>
            <CompletenessBar value={p.completeness} showLabel={false} />
            <span className="text-[11px] font-bold text-[var(--pa-muted)]">
              {p.completeness}%
            </span>
          </div>
          <ChannelChips channels={p.channels} />
        </button>
      ))}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-4"
        >
          <div className="mb-3.5 h-[150px] animate-pulse rounded-xl bg-[var(--pa-border)]" />
          <div className="mb-2 h-3.5 w-[70%] animate-pulse rounded bg-[var(--pa-border)]" />
          <div className="mb-3.5 h-3 w-[45%] animate-pulse rounded bg-[var(--pa-border)]" />
          <div className="h-2 w-full animate-pulse rounded bg-[var(--pa-border)]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-[20px] border border-dashed border-[#D7DCE1] bg-[var(--pa-surface)] px-10 py-20 text-center">
      <div className="mb-5 h-16 w-16 rounded-2xl bg-[var(--pa-bg-alt)]" />
      <div className="mb-2 text-[17px] font-extrabold text-[var(--pa-ink)]">
        Aún no tienes inmuebles captados
      </div>
      <div className="mb-6 max-w-[340px] text-[13px] text-[var(--pa-muted)]">
        Registra tu primer inmueble para empezar a publicarlo en tus canales.
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="rounded-[10px] bg-[var(--pa-navy)] px-5 py-3 text-[13px] font-bold text-white"
      >
        Registrar el primero
      </button>
    </div>
  );
}
