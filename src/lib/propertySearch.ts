import type { Property } from "@/services/interfaces/properties";

/** Normaliza teléfono para búsqueda (solo dígitos). */
function phoneDigits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

/**
 * Búsqueda de inventario/publicación: título, código, nombre y teléfono del
 * propietario (contacto en ficha).
 */
export function matchesPropertySearch(
  property: Property,
  rawQuery: string,
): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const qDigits = q.replace(/\D/g, "");
  const phone = phoneDigits(property.telefonoContacto);

  if (property.titulo.toLowerCase().includes(q)) return true;
  if (property.code.toLowerCase().includes(q)) return true;
  if ((property.nombreContacto?.toLowerCase().includes(q) ?? false)) return true;
  if (property.municipio.toLowerCase().includes(q)) return true;
  if ((property.barrio?.toLowerCase().includes(q) ?? false)) return true;
  if (qDigits.length >= 3 && phone.includes(qDigits)) return true;

  return false;
}
