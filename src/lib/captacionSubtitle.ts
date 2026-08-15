import type { AgentSession } from "@/features/auth/types";

/** Subtítulo del tablero Captación — paridad con Kanban HTML. */
export function captacionSubtitle(session: AgentSession | null): string {
  if (!session) return "Captación de inmuebles";
  if (session.role === "admin") {
    return "Captación — vista combinada de todos los asesores";
  }
  const municipios = session.municipios ?? [];
  if (municipios.length > 0) {
    return `Captación — ${municipios.join(", ")}`;
  }
  return "Captación — Todas las zonas";
}
