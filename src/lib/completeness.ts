/** Completeness helpers — aligned with API `backend/completeness.py` (Sprint 032). */

export const FIELD_LABELS: Record<string, string> = {
  title: "título",
  description: "descripción",
  type: "tipo",
  intent: "intención",
  price: "precio",
  city: "ciudad",
  neighborhood: "zona",
  contactPhone: "teléfono",
  photos: "fotos",
  buildingYear: "año de construcción",
  areaM2: "área",
  bedrooms: "alcobas",
  bathrooms: "baños",
};

export function formatMissingFields(missingFields: string[]): string {
  return missingFields.map((f) => FIELD_LABELS[f] ?? f).join(", ");
}

export const COMPLETENESS_CHECKLIST: {
  key: string;
  label: string;
}[] = [
  { key: "title", label: "Título" },
  { key: "description", label: "Descripción" },
  { key: "type", label: "Tipo" },
  { key: "intent", label: "Intención" },
  { key: "price", label: "Precio" },
  { key: "city", label: "Ciudad" },
  { key: "neighborhood", label: "Zona / barrio" },
  { key: "contactPhone", label: "Teléfono" },
  { key: "photos", label: "Fotos" },
  { key: "buildingYear", label: "Año de construcción" },
  { key: "areaM2", label: "Área (m²)" },
  { key: "bedrooms", label: "Alcobas" },
  { key: "bathrooms", label: "Baños" },
];

const RESIDENTIAL_TYPES = new Set([
  "apartamento",
  "casa",
  "apartaestudio",
  "apto",
  "estudio",
]);

export function isResidentialTipo(tipo: string | null | undefined): boolean {
  const key = (tipo ?? "").trim().toLowerCase();
  if (!key) return false;
  return RESIDENTIAL_TYPES.has(key) || key.startsWith("apart");
}

export function checklistForTipo(tipo: string | null | undefined) {
  return COMPLETENESS_CHECKLIST.filter((item) => {
    if (item.key === "bedrooms" || item.key === "bathrooms") {
      return isResidentialTipo(tipo);
    }
    return true;
  });
}

export function isFieldComplete(
  key: string,
  missingFields: string[],
): boolean {
  return !missingFields.includes(key);
}

export const WASI_PUBLISH_HINT = "Falta datos para publicar en WASI";

export function isWasiPublishReady(missingFields: string[]): boolean {
  return missingFields.length === 0;
}

function parseDraftNumber(value: string | null | undefined): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const n = Number(raw.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Live missing fields while editing (aligned with backend/completeness.py). */
export function missingFieldsFromDraft(input: {
  titulo: string;
  descripcion: string;
  tipo: string;
  intent?: string;
  precio: string;
  municipio: string;
  barrio: string;
  telefonoContacto: string;
  alcobas: string;
  banos: string;
  areaM2: string;
  anioConstruccion: string;
  photoCount: number;
}): string[] {
  const missing: string[] = [];
  const precio = parseDraftNumber(
    input.precio.replace(/\./g, "").replace(/,/g, ""),
  );
  const tipo = input.tipo;

  if (!input.titulo.trim()) missing.push("title");
  if (!input.descripcion.trim()) missing.push("description");
  if (!tipo.trim()) missing.push("type");
  if (!input.intent?.trim()) missing.push("intent");
  if (precio == null || precio <= 0) missing.push("price");
  if (!input.municipio.trim()) missing.push("city");
  if (!input.barrio.trim()) missing.push("neighborhood");
  if (!input.telefonoContacto.trim()) missing.push("contactPhone");
  if (input.photoCount <= 0) missing.push("photos");
  const year = parseDraftNumber(input.anioConstruccion);
  if (year == null || year <= 0) missing.push("buildingYear");
  const area = parseDraftNumber(input.areaM2);
  if (area == null || area <= 0) missing.push("areaM2");
  if (isResidentialTipo(tipo)) {
    if (parseDraftNumber(input.alcobas) == null) missing.push("bedrooms");
    if (parseDraftNumber(input.banos) == null) missing.push("bathrooms");
  }
  return missing;
}
