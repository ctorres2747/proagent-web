"use client";

export function SegBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-xs transition-colors ${
        active
          ? "bg-[var(--pa-surface)] font-bold text-[var(--pa-navy)] shadow-sm"
          : "font-semibold text-[var(--pa-muted)]"
      }`}
    >
      {children}
    </button>
  );
}

export function ViewToggle({
  view,
  onView,
}: {
  view: "table" | "cards";
  onView: (v: "table" | "cards") => void;
}) {
  return (
    <div className="flex rounded-[10px] bg-[var(--pa-bg-alt)] p-[3px]">
      <SegBtn active={view === "cards"} onClick={() => onView("cards")}>
        Tarjetas
      </SegBtn>
      <SegBtn active={view === "table"} onClick={() => onView("table")}>
        Tabla
      </SegBtn>
    </div>
  );
}

export function PropertySearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Buscar por título, código, propietario o teléfono…"
      className="w-full rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-surface)] px-4 py-2.5 text-[13px] text-[var(--pa-ink)] outline-none focus:border-[var(--pa-navy)]"
    />
  );
}

export function PropertyListSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-4"
        >
          <div className="mb-3.5 h-[150px] animate-pulse rounded-xl bg-[var(--pa-border)]" />
          <div className="mb-2 h-3.5 w-[70%] animate-pulse rounded bg-[var(--pa-border)]" />
          <div className="mb-3.5 h-3 w-[45%] animate-pulse rounded bg-[var(--pa-border)]" />
          <div className="h-2 w-full animate-pulse rounded bg-[var(--pa-border)]" />
        </div>
      ))}
    </div>
  );
}

export function formatTableRowTotal(shown: number, total: number): string {
  const noun = shown === 1 ? "fila" : "filas";
  if (shown !== total) {
    return `${shown} de ${total} ${noun} (filtro activo)`;
  }
  return `${shown} ${noun}`;
}

export function PaginationBar({
  page,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions,
  total,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions: readonly number[];
  total: number;
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--pa-border)] bg-[var(--pa-bg)] px-5 py-3 text-[12px] font-semibold text-[var(--pa-muted)]">
      <div className="flex items-center gap-2">
        <span>Mostrar</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-lg border border-[var(--pa-border)] bg-[var(--pa-surface)] px-2 py-1 text-[12px] font-semibold text-[var(--pa-ink)]"
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span>por página</span>
      </div>
      <div className="flex items-center gap-3">
        <span>{total === 0 ? "0 resultados" : `${start}–${end} de ${total}`}</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
            className="rounded-lg border border-[var(--pa-border)] bg-[var(--pa-surface)] px-3 py-1.5 text-[var(--pa-ink)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ‹
          </button>
          <span className="px-1">
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Página siguiente"
            className="rounded-lg border border-[var(--pa-border)] bg-[var(--pa-surface)] px-3 py-1.5 text-[var(--pa-ink)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
