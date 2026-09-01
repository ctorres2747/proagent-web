export const WASI_TITLE_MAX_LENGTH = 70;

export const WASI_TITLE_TOO_LONG_MESSAGE =
  "El título supera 70 caracteres (WASI). Acorta el título o quita la línea de precio del campo título.";

/** WASI usa solo la primera línea del título. */
export function normalizeWasiTitle(title: string): string {
  const raw = (title ?? "").trim();
  if (!raw) return "";
  return raw.split("\n", 1)[0]?.trim() ?? "";
}

export function wasiTitleLength(title: string): number {
  return normalizeWasiTitle(title).length;
}

export function validateWasiTitle(title: string): string | null {
  if (wasiTitleLength(title) > WASI_TITLE_MAX_LENGTH) {
    return WASI_TITLE_TOO_LONG_MESSAGE;
  }
  return null;
}

export type WasiTitleCounterTone = "ok" | "warn" | "error";

export function wasiTitleCounterTone(length: number): WasiTitleCounterTone {
  if (length > WASI_TITLE_MAX_LENGTH) return "error";
  if (length >= 60) return "warn";
  return "ok";
}
