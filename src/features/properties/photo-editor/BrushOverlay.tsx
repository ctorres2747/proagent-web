"use client";

import { useEffect, useRef } from "react";

export function BrushOverlay({
  size,
  onStrokeChange,
  resetKey,
}: {
  size: number;
  onStrokeChange: (hasStroke: boolean) => void;
  resetKey: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const hasStroke = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      hasStroke.current = false;
      onStrokeChange(false);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [resetKey, onStrokeChange]);

  const paint = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(47,201,138,.45)";
    ctx.lineWidth = size;
    ctx.beginPath();
    const from = last.current ?? { x, y };
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    last.current = { x, y };
    if (!hasStroke.current) {
      hasStroke.current = true;
      onStrokeChange(true);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      data-brush-canvas=""
      className="absolute inset-0 z-10 h-full w-full touch-none"
      style={{ cursor: "crosshair" }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drawing.current = true;
        last.current = null;
        paint(e);
      }}
      onPointerMove={(e) => {
        if (!drawing.current) return;
        paint(e);
      }}
      onPointerUp={() => {
        drawing.current = false;
        last.current = null;
      }}
      onPointerCancel={() => {
        drawing.current = false;
        last.current = null;
      }}
    />
  );
}

export function clearBrushCanvas(root: HTMLElement | null) {
  const canvas = root?.querySelector<HTMLCanvasElement>("[data-brush-canvas]");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export async function exportBrushMask(root: HTMLElement | null): Promise<File | null> {
  const canvas = root?.querySelector<HTMLCanvasElement>("[data-brush-canvas]");
  if (!canvas) return null;
  const src = canvas.getContext("2d");
  if (!src) return null;
  const w = canvas.width;
  const h = canvas.height;
  const data = src.getImageData(0, 0, w, h);
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const dst = out.getContext("2d");
  if (!dst) return null;
  const mask = dst.createImageData(w, h);
  for (let i = 0; i < data.data.length; i += 4) {
    const painted = data.data[i + 3] > 16;
    const v = painted ? 255 : 0;
    mask.data[i] = v;
    mask.data[i + 1] = v;
    mask.data[i + 2] = v;
    mask.data[i + 3] = 255;
  }
  dst.putImageData(mask, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) =>
    out.toBlob((b) => resolve(b), "image/png"),
  );
  if (!blob) return null;
  return new File([blob], "mask.png", { type: "image/png" });
}
