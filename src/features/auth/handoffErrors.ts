import { ApiError } from "@/services/http/client";

/** User-facing copy for handoff exchange failures. */
export function handoffErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 410) {
      return "El enlace de acceso expiró. Vuelve al Kanban y pulsa Publicar de nuevo.";
    }
    if (err.status === 409) {
      return "Este enlace ya se utilizó. Vuelve al Kanban y pulsa Publicar de nuevo.";
    }
    if (err.status === 400 || err.status === 404) {
      return "El enlace de acceso no es válido o ya no está disponible.";
    }
    return err.message || "No se pudo completar el acceso desde el Kanban.";
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return "No se pudo completar el acceso desde el Kanban.";
}
