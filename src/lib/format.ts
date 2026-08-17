const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** Format a COP price; appends "/mes" for rentals. */
export function formatPrice(
  value: number | null,
  esArriendo = false,
): string {
  if (value === null) return "Precio a convenir";
  return esArriendo ? `${cop.format(value)}/mes` : cop.format(value);
}

export function isLeadArriendo(precioNum: number | null): boolean {
  return precioNum !== null && precioNum > 0 && precioNum < 5_000_000;
}

/** Prefer numeric price for consistent display (Sprint 028). */
export function formatLeadPrice(lead: {
  precio: string | null;
  precioNum: number | null;
}): string {
  if (lead.precioNum != null) {
    return formatPrice(lead.precioNum, isLeadArriendo(lead.precioNum));
  }
  return lead.precio ?? "Precio a convenir";
}
