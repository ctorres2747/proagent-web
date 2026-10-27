import { ApiError } from "@/services/http/client";

/** Alineado con `backend/reel_generator.MIN_FOTOS` (Opción B Remotion). */
export const MIN_REEL_PHOTOS = 4;

/** Primeros N slots de galería que alimentan el reel (`reel_slot` en API). */
export const REEL_SLOT_COUNT = 8;

export function formatReelActionError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 503) {
      return (
        err.message ||
        "La generación de reels no está activa en el servidor — el administrador debe habilitarla en el VPS."
      );
    }
    if (err.status === 409) {
      return (
        err.message ||
        "Ya hay un reel generándose — espera a que termine o elimínalo antes de volver a intentar."
      );
    }
    return err.message;
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  return "No se pudo completar la acción del reel.";
}

export function reelGenerateBlockers(input: {
  photoCount: number;
  precio: number | null;
  instagramHandle?: string | null;
  /** `false` cuando quien mira la ficha no es su dueño (ej. un admin
   * gestionando el inventario de otro asesor) -- en ese caso `instagramHandle`
   * es el del VIEWER, no el del dueño real de la ficha, así que no sirve
   * para bloquear nada acá. El backend sí resuelve el @ del dueño real
   * (`resolve_owner_instagram`) y devuelve un error claro si de verdad le
   * falta configurarlo. Default `true` (caso normal: un asesor viendo su
   * propia ficha). */
  checkInstagramHandle?: boolean;
}): string[] {
  const blockers: string[] = [];
  if (input.photoCount < MIN_REEL_PHOTOS) {
    blockers.push(`al menos ${MIN_REEL_PHOTOS} fotos (tienes ${input.photoCount})`);
  }
  if (input.precio == null || input.precio <= 0) {
    blockers.push("un precio válido en la ficha");
  }
  if (
    (input.checkInstagramHandle ?? true) &&
    !(input.instagramHandle ?? "").trim()
  ) {
    blockers.push("tu usuario de Instagram en Ajustes → Perfil");
  }
  return blockers;
}
