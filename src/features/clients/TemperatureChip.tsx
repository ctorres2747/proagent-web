"use client";

import type { ClientTemperature } from "@/services/interfaces/clients";

const TEMP_META: Record<
  ClientTemperature,
  { label: string; bars: number; barColor: string; text: string; bg: string; border: string }
> = {
  hot: {
    label: "Caliente",
    bars: 3,
    barColor: "#C23B2B",
    text: "#C23B2B",
    bg: "#FBE7E4",
    border: "#C23B2B",
  },
  warm: {
    label: "Tibio",
    bars: 2,
    barColor: "#D97B2B",
    text: "#B5651D",
    bg: "#FCEEE0",
    border: "#D97B2B",
  },
  cold: {
    label: "Frío",
    bars: 1,
    barColor: "#5F86A6",
    text: "#0A3D62",
    bg: "#E7EEF4",
    border: "#5F86A6",
  },
};

const BAR_HEIGHTS = [5, 8, 11];

function Bars({ filled, color }: { filled: number; color: string }) {
  return (
    <span className="flex items-end gap-[2px]">
      {BAR_HEIGHTS.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-[1px]"
          style={{ height: h, background: i < filled ? color : "#D7DCE1" }}
        />
      ))}
    </span>
  );
}

/** Chip de temperatura — barras + etiqueta (handoff §3.1). Se distingue por
 * forma y color a la vez (3/2/1 barras), para que funcione aunque el color
 * no se perciba. Es independiente de la columna: comunica urgencia, no
 * etapa del embudo. */
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
      <Bars filled={meta.bars} color={active ? meta.barColor : "#D7DCE1"} />
      {meta.label}
    </Comp>
  );
}

export function temperatureLabel(value: ClientTemperature): string {
  return TEMP_META[value].label;
}
