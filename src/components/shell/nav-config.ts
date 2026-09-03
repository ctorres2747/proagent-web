import { CAPTACION_NATIVE, CAPTACION_URL } from "@/config/env";

export type NavGroupId = "operacion" | "cartera";
export type NavBadgeKind = "captacion" | "inventory";
export type NavVisibility = "all" | "staff" | "admin";

export interface NavItemConfig {
  id: string;
  label: string;
  railLabel?: string;
  href: string;
  group: NavGroupId;
  visibility: NavVisibility;
  disabled?: boolean;
  soon?: boolean;
  external?: boolean;
  badge?: NavBadgeKind;
}

export const NAV_GROUPS: { id: NavGroupId; label: string }[] = [
  { id: "operacion", label: "Operación" },
  { id: "cartera", label: "Cartera" },
];

const CAPTACION_HREF = CAPTACION_NATIVE ? "/captacion" : CAPTACION_URL;

/** Fuente única: sidebar expandida, riel y drawer mobile web. */
export const NAV_ITEMS: NavItemConfig[] = [
  {
    id: "inicio",
    label: "Inicio",
    href: "/",
    group: "operacion",
    visibility: "all",
  },
  {
    id: "captacion",
    label: "Captación",
    href: CAPTACION_HREF,
    group: "operacion",
    visibility: "staff",
    external: !CAPTACION_NATIVE,
    badge: "captacion",
  },
  {
    id: "inventario",
    label: "Inventario",
    href: "/properties",
    group: "operacion",
    visibility: "all",
    badge: "inventory",
  },
  {
    id: "publicacion",
    label: "Publicación",
    href: "/publications",
    group: "operacion",
    visibility: "all",
  },
  {
    id: "clientes",
    label: "Clientes",
    href: "/clients",
    group: "cartera",
    visibility: "all",
    disabled: true,
    soon: true,
  },
  {
    id: "reportes",
    label: "Reportes",
    href: "/reports",
    group: "cartera",
    visibility: "admin",
    disabled: true,
    soon: true,
  },
];

const MATCHERS: { id: string; test: (pathname: string) => boolean }[] = [
  {
    id: "captacion",
    test: (p) => p === "/captacion" || p.startsWith("/captacion/"),
  },
  {
    id: "publicacion",
    test: (p) => p === "/publications" || p.startsWith("/publications/"),
  },
  {
    id: "inventario",
    test: (p) =>
      p === "/properties" ||
      p === "/properties/new" ||
      /^\/properties\/[^/]+/.test(p),
  },
  { id: "inicio", test: (p) => p === "/" },
  { id: "clientes", test: (p) => p.startsWith("/clients") },
  { id: "reportes", test: (p) => p.startsWith("/reports") },
];

export function resolveActiveNavId(pathname: string): string | null {
  for (const { id, test } of MATCHERS) {
    if (test(pathname)) return id;
  }
  return null;
}

export function filterNavItems(opts: {
  staff: boolean;
  admin: boolean;
}): NavItemConfig[] {
  return NAV_ITEMS.filter((item) => {
    if (item.visibility === "staff") return opts.staff;
    if (item.visibility === "admin") return opts.admin;
    return true;
  });
}

export function pageTitleForPath(pathname: string): string {
  const id = resolveActiveNavId(pathname);
  const item = NAV_ITEMS.find((n) => n.id === id);
  if (item) return item.label;
  if (pathname.startsWith("/settings")) return "Ajustes";
  if (pathname.startsWith("/account")) return "Mi perfil";
  return "ProAgent";
}

export interface BreadcrumbCrumb {
  group: string;
  page: string;
}

const BREADCRUMB_GROUP_LABEL: Record<NavGroupId, string> = {
  operacion: "Operación",
  cartera: "Cartera",
};

export function breadcrumbForPath(pathname: string): BreadcrumbCrumb {
  const id = resolveActiveNavId(pathname);
  const item = NAV_ITEMS.find((n) => n.id === id);
  if (item) {
    return {
      group: BREADCRUMB_GROUP_LABEL[item.group],
      page: item.label,
    };
  }
  if (pathname.startsWith("/settings")) {
    return { group: "Cuenta", page: "Ajustes" };
  }
  if (pathname.startsWith("/account")) {
    return { group: "Cuenta", page: "Mi perfil" };
  }
  if (pathname.startsWith("/help")) {
    return { group: "Cuenta", page: "Ayuda" };
  }
  if (pathname.startsWith("/changelog")) {
    return { group: "Cuenta", page: "Novedades" };
  }
  return { group: "Operación", page: "ProAgent" };
}
