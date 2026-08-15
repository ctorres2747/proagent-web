import type { AgentSession } from "@/features/auth/types";

/** Subtítulo del tablero Captación — municipios del asesor (sin repetir el título). */
export function captacionSubtitle(session: AgentSession | null): string {
  if (!session) return "Todas las zonas";
  if (session.role === "admin") {
    return "Vista combinada de todos los asesores";
  }
  const municipios = session.municipios ?? [];
  if (municipios.length > 0) {
    return municipios.join(", ");
  }
  return "Todas las zonas";
}
