/** Completeness helpers — aligned with mobile `src/utils/completeness.ts`. */

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
];

export function isFieldComplete(
  key: string,
  missingFields: string[],
): boolean {
  return !missingFields.includes(key);
}
