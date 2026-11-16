/**
 * Runtime configuration for ProAgent Web.
 *
 * The web app is a decoupled client: the backend host is injected via
 * NEXT_PUBLIC_API_URL. When it is empty (or mocks are forced) the app runs
 * fully offline against in-memory mocks.
 */

export const API_URL: string = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();

const FORCE_MOCKS: boolean = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

/** True when the app should talk HTTP to the backend; false = mocks. */
export const USE_HTTP_API: boolean = !FORCE_MOCKS && API_URL.length > 0;

/**
 * Un build de producción sin NEXT_PUBLIC_API_URL caía en mocks y entraba solo
 * como admin demo. En producción los mocks exigen opt-in explícito
 * (NEXT_PUBLIC_USE_MOCKS=true, p. ej. para demos); si no, la app muestra un
 * error de configuración en vez de una sesión falsa.
 */
export const CONFIG_ERROR: string | null =
  !USE_HTTP_API && !FORCE_MOCKS && process.env.NODE_ENV === "production"
    ? "Falta NEXT_PUBLIC_API_URL en este build de producción. Configúrala y vuelve a ejecutar `npm run build` (o define NEXT_PUBLIC_USE_MOCKS=true para un demo sin backend)."
    : null;

/** Kanban / captación interna (deep-link, no embed). */
export const CAPTACION_URL: string = (
  process.env.NEXT_PUBLIC_CAPTACION_URL ?? "https://agente.proinversores.bond"
).replace(/\/$/, "");

/**
 * Sprint 011 — Captación nativa en Next (`/captacion`).
 * Default **false**: nav sigue al Kanban HTML externo. Owner activa tras smoke.
 */
export const CAPTACION_NATIVE: boolean =
  process.env.NEXT_PUBLIC_CAPTACION_NATIVE === "true";
