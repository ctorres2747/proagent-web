"use client";

import type { ClientTemperature } from "@/services/interfaces/clients";

// Paths exactos del archivo de referencia (TEMP_ICONS, Clientes - Kanban.dc.html)
// -- copiados tal cual, sin sustituir por otra librería (handoff §3.1).
const TEMP_ICON_PATHS: Record<ClientTemperature, string> = {
  cold: "M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5M4.7 10.6l3.4-.9-.9-3.4M19.3 13.4l-3.4.9.9 3.4M4.7 13.4l3.4.9-.9 3.4M19.3 10.6l-3.4-.9.9-3.4",
  warm: "M12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8ZM12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4",
  hot: "M12 21.5c3.9 0 6.8-2.7 6.8-6.6 0-3.5-2.3-5.9-4.2-8-.4 1.9-1.4 3.2-2.6 3.8.3-3.2-1.2-6.2-3.9-8.7-.2 3.5-2.9 5.9-3.9 8.8-.4 1.2-.6 2.4-.6 3.5 0 4.2 3.1 7.2 8.4 7.2Z",
};

export const TEMP_META: Record<
  ClientTemperature,
  { label: string; iconColor: string; text: string; bg: string; border: string }
> = {
  hot: {
    label: "Caliente",
    iconColor: "#C23B2B",
    text: "#C23B2B",
    bg: "#FBE7E4",
    border: "#C23B2B",
  },
  warm: {
    label: "Tibio",
    iconColor: "#D97B2B",
    text: "#B5651D",
    bg: "#FCEEE0",
    border: "#D97B2B",
  },
  cold: {
    label: "Frío",
    iconColor: "#5F86A6",
    text: "#0A3D62",
    bg: "#E7EEF4",
    border: "#5F86A6",
  },
};

export function TempIcon({
  value,
  color,
  size = 13,
}: {
  value: ClientTemperature;
  color: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={TEMP_ICON_PATHS[value]} />
    </svg>
  );
}

/** Chip de temperatura — ícono (copo de nieve / sol / llama) + etiqueta
 * (handoff §3.1). Se distingue por forma y color a la vez, para que
 * funcione aunque el color no se perciba. Es independiente de la columna:
 * comunica urgencia, no etapa del embudo. */
export function TemperatureChip({
  value,
  active = true,
  onClick,
}: {
  value: ClientTemperature;
  /** false = variante "apagada" para usar como opción en un selector. */
  active?: boolean;
  onClick?: () => void;
}) {
  const meta = TEMP_META[value];
  const Comp = onClick ? "button" : "span";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-[6px] px-[7px] py-[3px] text-[11px] font-bold"
      style={
        active
          ? { background: meta.bg, color: meta.text, border: `1px solid ${meta.border}` }
          : { background: "#fff", color: "var(--pa-text-secondary)", border: "1px solid var(--pa-border)" }
      }
    >
      <TempIcon value={value} color={active ? meta.iconColor : "#D7DCE1"} />
      {meta.label}
    </Comp>
  );
}

export function temperatureLabel(value: ClientTemperature): string {
  return TEMP_META[value].label;
}
