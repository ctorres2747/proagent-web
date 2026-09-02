"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "pa.shell.collapsed";

export function useShellState() {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const prefersRail =
      window.matchMedia("(max-width: 1279px)").matches &&
      !window.matchMedia("(max-width: 767px)").matches;
    if (stored === "1") setCollapsed(true);
    else if (stored === "0") setCollapsed(false);
    else if (prefersRail) setCollapsed(true);
    setHydrated(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "[" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        toggleCollapsed();
      }
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCollapsed]);

  return {
    collapsed,
    toggleCollapsed,
    drawerOpen,
    setDrawerOpen,
    hydrated,
  };
}
