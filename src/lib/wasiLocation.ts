/** Normalización para comparar valores de ubicación WASI. */
export function normalizeWasiLocation(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

export function matchesWasiOption(value: string, option: string): boolean {
  return normalizeWasiLocation(value) === normalizeWasiLocation(option);
}

export function optionInList(value: string, options: string[]): boolean {
  return options.some((opt) => matchesWasiOption(value, opt));
}
