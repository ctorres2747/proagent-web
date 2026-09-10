import { breadcrumbForPath } from "./nav-config";

/** Subtítulo del panel Asistente según vista actual (solo UI — sin lógica IA). */
export function assistantContextLabel(
  pathname: string,
  counts?: { inventoryCount?: number; captacionPending?: number | null },
): string {
  const { page } = breadcrumbForPath(pathname);

  if (
    pathname === "/properties" ||
    pathname.startsWith("/properties/") ||
    pathname === "/properties/new"
  ) {
    const n = counts?.inventoryCount;
    return n != null ? `Sobre ${page} · ${n} inmuebles` : `Sobre ${page}`;
  }

  if (pathname === "/captacion" || pathname.startsWith("/captacion/")) {
    const n = counts?.captacionPending;
    return n != null ? `Sobre ${page} · ${n} leads pendientes` : `Sobre ${page}`;
  }

  return `Sobre ${page}`;
}
