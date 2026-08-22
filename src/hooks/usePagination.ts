"use client";

import { useEffect, useState } from "react";

export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const DEFAULT_PAGE_SIZE: number = PAGE_SIZE_OPTIONS[0];

/**
 * Paginación client-side sobre una lista ya filtrada/ordenada. El tamaño de
 * página se recuerda por vista (`storageKey`) en localStorage; la página
 * siempre vuelve a 1 cuando cambian los filtros (totalItems) o el tamaño —
 * evita quedar parado en una página que ya no existe.
 */
export function usePagination(totalItems: number, storageKey: string) {
  const [pageSize, setPageSizeState] = useState<number>(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = Number(window.localStorage.getItem(storageKey));
    if ((PAGE_SIZE_OPTIONS as readonly number[]).includes(stored)) {
      setPageSizeState(stored);
    }
  }, [storageKey]);

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, String(size));
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setPage(1);
  }, [totalItems, pageSize]);

  const clampedPage = Math.min(page, totalPages);
  const offset = (clampedPage - 1) * pageSize;

  return { page: clampedPage, setPage, totalPages, pageSize, setPageSize, offset };
}
