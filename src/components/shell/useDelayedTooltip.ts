"use client";

import { useCallback, useRef, useState } from "react";

export function useDelayedTooltip(delayMs = 400) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onPointerEnter = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), delayMs);
  }, [delayMs]);

  const onPointerLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
  }, []);

  return { visible, onPointerEnter, onPointerLeave };
}
