"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/AuthProvider";
import { soporteService } from "@/services";

import { CONSENTIMIENTO_QUERY_KEY } from "./ConsentimientoSoporte";

/** D9a — aviso fijo (en cada página, no se puede cerrar) para quien tiene el
 * worker instalado y todavía no aceptó el soporte remoto. Es el único aviso
 * en la web; además se manda un correo al abrir el plazo. */
export function ConsentimientoSoporteBanner() {
  const { token } = useAuth();
  const { data } = useQuery({
    queryKey: CONSENTIMIENTO_QUERY_KEY,
    queryFn: () => soporteService.getConsentimiento(token ?? undefined),
    enabled: Boolean(token),
    staleTime: 5 * 60_000,
  });

  if (!data || !data.requiereAceptacion || !data.tienePcInstalada) return null;

  const vencido = data.estado === "pendiente";
  return (
    <div
      role="status"
      className={`mb-4 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
        vencido
          ? "border-[var(--pa-danger)]/30 bg-[#FDEDEC]"
          : "border-[#E8D4B8] bg-[#FFF8EE]"
      }`}
    >
      <p className={`text-sm font-semibold ${vencido ? "text-[var(--pa-danger)]" : "text-[var(--pa-warning-ink)]"}`}>
        {vencido
          ? "Marketplace está pausado en tu computador: acepta la autorización de soporte remoto para reanudarlo."
          : `Acepta la autorización de soporte remoto de tu computador. Te quedan ${data.diasRestantes ?? 0} día${
              data.diasRestantes === 1 ? "" : "s"
            }; después Marketplace se pausa hasta que la aceptes.`}
      </p>
      <Link
        href="/settings#soporte"
        className="shrink-0 self-end rounded-[10px] bg-white px-3 py-1.5 text-xs font-bold text-[var(--pa-navy)] shadow-sm ring-1 ring-[#E8D4B8] sm:self-auto"
      >
        Revisar y aceptar
      </Link>
    </div>
  );
}
