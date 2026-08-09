"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { propertiesService } from "@/services";
import { ChannelChips } from "@/components/ChannelChips";
import { CompletenessBar } from "@/components/CompletenessBar";
import { formatPrice } from "@/lib/format";

export default function PublishHubPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: () => propertiesService.list(token ?? undefined),
  });

  return (
    <div className="px-6 py-8 md:px-10">
      <h1 className="text-[26px] font-extrabold text-[var(--pa-ink)]">Publicar</h1>
      <p className="mb-6 mt-1 text-[13px] text-[var(--pa-muted)]">
        Selecciona una propiedad para abrir el asistente de publicación
        (Contenido → Fotos → Canales → Personalizar → Vista previa → Resultados).
      </p>

      {isLoading && (
        <p className="text-sm text-[var(--pa-muted)]">Cargando inventario…</p>
      )}

      <div className="flex flex-col gap-3">
        {data?.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => router.push(`/properties/${p.id}`)}
            className="flex items-center gap-4 rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] px-5 py-4 text-left transition-shadow hover:shadow-sm"
          >
            <div className="h-12 w-12 shrink-0 rounded-lg bg-[repeating-linear-gradient(45deg,#E4E8EC,#E4E8EC_6px,#EDEFF2_6px,#EDEFF2_12px)]" />
            <div className="min-w-0 flex-1">
              <div className="line-clamp-1 text-[14px] font-bold text-[var(--pa-ink)]">
                {p.titulo}
              </div>
              <div className="text-xs text-[var(--pa-muted)]">
                {p.tipo} · {p.intent} · {p.municipio} · {formatPrice(p.precio, p.esArriendo)}
              </div>
              <div className="mt-2 max-w-[240px]">
                <CompletenessBar value={p.completeness} />
              </div>
            </div>
            <ChannelChips channels={p.channels} />
            <span className="ml-2 shrink-0 rounded-[10px] bg-[var(--pa-navy)] px-4 py-2.5 text-[13px] font-bold text-white">
              Publicar
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
