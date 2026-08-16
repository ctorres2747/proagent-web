/** Recorte circular para foto de perfil (canvas, sin dependencias). */

export interface ProfilePhotoCropState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export const PROFILE_PHOTO_VIEW_SIZE = 280;
export const PROFILE_PHOTO_OUTPUT_SIZE = 512;

export function initialCropState(): ProfilePhotoCropState {
  return { zoom: 1, offsetX: 0, offsetY: 0 };
}

function imageCoverScale(
  img: HTMLImageElement,
  viewSize: number,
  zoom: number,
): number {
  return Math.max(viewSize / img.naturalWidth, viewSize / img.naturalHeight) * zoom;
}

/** Exporta un JPEG cuadrado recortado al círculo visible en el visor. */
export async function exportProfilePhotoCrop(
  img: HTMLImageElement,
  state: ProfilePhotoCropState,
  mime: string = "image/jpeg",
): Promise<Blob> {
  const view = PROFILE_PHOTO_VIEW_SIZE;
  const out = PROFILE_PHOTO_OUTPUT_SIZE;
  const scale = imageCoverScale(img, view, state.zoom);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  const x = view / 2 - w / 2 + state.offsetX;
  const y = view / 2 - h / 2 + state.offsetY;

  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");

  ctx.beginPath();
  ctx.arc(out / 2, out / 2, out / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const k = out / view;
  ctx.drawImage(img, x * k, y * k, w * k, h * k);

  const quality = mime === "image/png" ? undefined : 0.92;
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, quality),
  );
  if (!blob) throw new Error("No se pudo generar la imagen recortada");
  return blob;
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

export function outputMimeForFile(file: File): string {
  const t = (file.type || "").toLowerCase();
  if (t === "image/png") return "image/png";
  if (t === "image/webp") return "image/webp";
  return "image/jpeg";
}

export function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}
