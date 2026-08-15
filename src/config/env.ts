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
