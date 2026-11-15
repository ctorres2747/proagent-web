export type PhotoEditOp =
  | "enhance_light"
  | "straighten"
  | "remove_objects"
  | "custom";

const CUSTOM_META = {
  op: "custom" as const,
  name: "Pedido",
  subtitle: "Texto libre, con las reglas del servidor",
  processing: "Aplicando pedido…",
  ready: "Pedido · listo",
};

export const PHOTO_EDIT_OPS: {
  op: Exclude<PhotoEditOp, "custom">;
  name: string;
  subtitle: string;
  processing: string;
  ready: string;
}[] = [
  {
    op: "enhance_light",
    name: "Mejorar luz y color",
    subtitle: "Exposición, sombras y balance",
    processing: "Mejorando luz…",
    ready: "Mejorar luz · listo",
  },
  {
    op: "straighten",
    name: "Enderezar",
    subtitle: "Paredes y marcos verticales",
    processing: "Enderezando…",
    ready: "Enderezar · listo",
  },
  {
    op: "remove_objects",
    name: "Quitar objetos",
    subtitle: "Cables, carros, desorden",
    processing: "Quitando objetos…",
    ready: "Quitar objetos · listo",
  },
];

export function photoEditMeta(op: PhotoEditOp) {
  if (op === "custom") return CUSTOM_META;
  return PHOTO_EDIT_OPS.find((item) => item.op === op)!;
}

/** `{código}-{n}-{ambiente}{-ia}.jpg` — AC-05. */
export function photoDownloadFilename(opts: {
  code: string;
  index1: number;
  roomLabel: string | null;
  ia: boolean;
}): string {
  const code = slugPart(opts.code) || "foto";
  const n = String(opts.index1);
  const ambiente = slugPart(opts.roomLabel ?? "");
  const ia = opts.ia ? "-ia" : "";
  const mid = ambiente ? `-${ambiente}` : "";
  return `${code}-${n}${mid}${ia}.jpg`;
}

function slugPart(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

const CHANNEL_ALIASES: Record<string, string> = {
  marketplace: "facebook",
  mp: "facebook",
  ig: "instagram",
  instagram_reel: "reel",
  google_drive: "entrega",
  drive: "entrega",
  whatsapp_catalog: "whatsapp",
};

export function normalizeStalePhotoChannel(id: string): string {
  const key = id.trim().toLowerCase();
  return CHANNEL_ALIASES[key] ?? key;
}

export const FIDELITY_REFUSED_COPY =
  "Ese pedido cambiaría el inmueble. Prueba con luz, sombras o un detalle que ya esté en la foto.";

/** Copy del poll T1 (`errorCode` en `WebPhotoEditStepOut`). */
export function photoEditCopyFromErrorCode(code: string | null | undefined): string | null {
  switch ((code ?? "").trim().toLowerCase()) {
    case "fidelity_refused":
      return FIDELITY_REFUSED_COPY;
    case "fidelity_rejected":
      return "El retoque cambió partes de la foto que había que dejar iguales.";
    case "framing_changed":
      return "El retoque cambió el encuadre. La foto quedó igual.";
    case "timeout":
      return "El retoque tardó demasiado. Intenta de nuevo.";
    case "provider_error":
      return "No se pudo aplicar el retoque. Intenta de nuevo.";
    default:
      return null;
  }
}

export function photoEditErrorMessage(err: unknown, op: PhotoEditOp): string {
  const raw =
    err && typeof err === "object" && "message" in err
      ? String((err as { message: unknown }).message)
      : err instanceof Error
        ? err.message
        : "";
  const lower = raw.toLowerCase();
  const status =
    err && typeof err === "object" && "status" in err
      ? (err as { status: number }).status
      : undefined;
  const fromCode = photoEditCopyFromErrorCode(raw);
  if (fromCode) return fromCode;
  if (status === 422 || lower.includes("cambiaría el inmueble") || lower.includes("fidelity")) {
    return FIDELITY_REFUSED_COPY;
  }
  if (
    lower.includes("quota") ||
    lower.includes("cupo") ||
    lower.includes("límite") ||
    lower.includes("limite") ||
    status === 429
  ) {
    return "Llegaste al límite de retoques de hoy (50). Intenta de nuevo mañana.";
  }
  if (op === "remove_objects" && (lower.includes("máscara") || lower.includes("mascara"))) {
    return "Marca con el pincel lo que hay que quitar.";
  }
  const verb =
    op === "enhance_light"
      ? "mejorar la luz"
      : op === "straighten"
        ? "enderezar"
        : op === "remove_objects"
          ? "quitar objetos"
          : "aplicar el pedido";
  if (raw && raw !== "Failed to fetch" && !/^error$/i.test(raw)) {
    return raw;
  }
  return `No se pudo ${verb}. Intenta de nuevo.`;
}
