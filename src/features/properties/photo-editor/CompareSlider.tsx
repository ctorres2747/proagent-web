"use client";

import { useCallback, useRef } from "react";
import { ChevronsLeftRight } from "lucide-react";

export function CompareSlider({
  originalSrc,
  retouchedSrc,
  split,
  onSplit,
}: {
  originalSrc: string;
  retouchedSrc: string;
  split: number;
  onSplit: (value: number) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);

  const setFromClientX = useCallback(
    (clientX: number) => {
      const box = boxRef.current;
      if (!box) return;
      const rect = box.getBoundingClientRect();
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      onSplit(rect.width === 0 ? 50 : (x / rect.width) * 100);
    },
    [onSplit],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    setFromClientX(e.clientX);
  };

  const clip = Math.min(100, Math.max(0, split));

  return (
    <div
      ref={boxRef}
      className="relative h-full w-full cursor-ew-resize select-none overflow-hidden rounded-[12px] bg-black"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={originalSrc}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-contain"
      />
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 0 0 ${clip}%)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={retouchedSrc}
          alt=""
          draggable={false}
          className="h-full w-full object-contain"
        />
      </div>
      <span className="absolute left-3 top-3 rounded-lg bg-[rgba(8,26,42,.75)] px-2.5 py-1 text-[12px] font-extrabold text-white">
        Original
      </span>
      <span className="absolute right-3 top-3 rounded-lg bg-[#2FC98A] px-2.5 py-1 text-[12px] font-extrabold text-[#06331F]">
        Retocada
      </span>
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-white"
        style={{ left: `${clip}%`, transform: "translateX(-50%)" }}
      />
      <button
        type="button"
        role="slider"
        aria-label="Comparar original y retocada"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clip)}
        className="absolute top-1/2 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2FC98A]"
        style={{ left: `${clip}%` }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            onSplit(Math.max(0, clip - 5));
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            onSplit(Math.min(100, clip + 5));
          }
        }}
      >
        <ChevronsLeftRight className="h-4 w-4 text-[#0A3D62]" strokeWidth={2.2} />
      </button>
    </div>
  );
}
