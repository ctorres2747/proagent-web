import type { Intent } from "@/services/interfaces/properties";

const ARRIENDO_RE = /arriend|alquiler/i;

/** Mirrors backend `infer_intent` / web `_infer_intent` (title + price heuristics). */
export function inferIntentFromDraft(
  titulo: string,
  precio: string,
): Intent {
  const t = titulo.toLowerCase();
  if (ARRIENDO_RE.test(t)) return "Arriendo";
  const raw = precio.replace(/\./g, "").replace(/,/g, "").trim();
  if (raw) {
    const n = Number(raw.replace(/[^\d]/g, ""));
    if (Number.isFinite(n) && n > 0 && n < 20_000_000) return "Arriendo";
  }
  return "Venta";
}

/** Nudge title so inferred intent matches the user's selection on save. */
export function applyIntentToTitle(titulo: string, intent: Intent): string {
  const t = titulo.trim();
  if (intent === "Arriendo") {
    if (ARRIENDO_RE.test(t)) return t;
    return t ? `${t} en arriendo` : "En arriendo";
  }
  return t
    .replace(/\s+en\s+arriendo/gi, "")
    .replace(/\s+en\s+alquiler/gi, "")
    .replace(/arriendo/gi, "")
    .replace(/alquiler/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
