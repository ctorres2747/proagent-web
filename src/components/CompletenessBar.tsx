/** Completeness bar: emerald >=80, warning >=50, danger below. */
export function CompletenessBar({
  value,
  showLabel = true,
}: {
  value: number;
  showLabel?: boolean;
}) {
  const color =
    value >= 80
      ? "var(--pa-accent)"
      : value >= 50
        ? "var(--pa-warning)"
        : "var(--pa-danger)";
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
