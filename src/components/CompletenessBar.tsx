/** Completeness bar: emerald >=80, warning 50–79, danger below 50. */
export function CompletenessBar({
  value,
  showLabel = true,
  compact = false,
}: {
  value: number;
  showLabel?: boolean;
  /** Tabla inventario: barra 4px sin etiqueta lateral. */
  compact?: boolean;
}) {
  const color =
    value >= 80
      ? "var(--pa-accent)"
      : value >= 50
        ? "var(--pa-warning)"
        : "var(--pa-danger)";

  if (compact) {
    return (
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-[var(--pa-bg-alt)]"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--pa-bg-alt)]">
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      {showLabel && (
        <span className="whitespace-nowrap text-[11px] font-bold text-[var(--pa-muted)]">
          {value}%
        </span>
      )}
    </div>
  );
}
