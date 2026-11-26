import type { LeadEstado } from "@/services/interfaces/leads";

/** Ojo de “en revisión”: Pendiente y se conserva en En contacto. */
export function muestraMarcaEnRevision(estado: LeadEstado | string): boolean {
  return estado === "Pendiente" || estado === "En contacto";
}
