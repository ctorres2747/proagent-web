"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { propertiesService } from "@/services";

export default function DashboardPage() {
  const { session, token } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: () => propertiesService.list(token ?? undefined),
  });

  const total = data?.length ?? 0;
  const completas = data?.filter((p) => p.completeness >= 100).length ?? 0;

  return (
    <div className="px-6 py-8 md:px-10">
      <h1 className="text-2xl font-bold text-[var(--pa-navy)]">
        Hola, {session?.nombre ?? "agente"}
      </h1>
      <p className="mt-1 text-sm text-[var(--pa-muted)]">
        Panel de {session?.role === "admin" ? "administrador" : "agente"} ·
        ProAgent Web
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Propiedades" value={isLoading ? "…" : String(total)} />
        <StatCard
          label="Fichas completas"
          value={isLoading ? "…" : String(completas)}
        />
        <StatCard
          label="Por completar"
          value={isLoading ? "…" : String(total - completas)}
        />
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-6">
        <h2 className="font-semibold">Próximos pasos</h2>
        <p className="mt-1 text-sm text-[var(--pa-muted)]">
          Revisa tus propiedades y prepara publicaciones multicanal. La
          publicación de escritorio llega en E-WEB-01.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-5">
      <div className="text-3xl font-bold text-[var(--pa-navy)]">{value}</div>
      <div className="mt-1 text-sm text-[var(--pa-muted)]">{label}</div>
    </div>
  );
}
