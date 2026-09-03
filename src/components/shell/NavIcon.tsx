import {
  ArrowUpFromLine,
  BarChart3,
  Building2,
  Home,
  KanbanSquare,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { NavItemConfig } from "./nav-config";

const ICONS: Record<string, LucideIcon> = {
  inicio: Home,
  captacion: KanbanSquare,
  inventario: Building2,
  publicacion: ArrowUpFromLine,
  clientes: Users,
  reportes: BarChart3,
};

export function NavIcon({
  item,
  size = 20,
  className,
}: {
  item: Pick<NavItemConfig, "id">;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[item.id] ?? Home;
  return (
    <Icon
      size={size}
      strokeWidth={1.9}
      className={className}
      aria-hidden
    />
  );
}
