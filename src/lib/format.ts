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
