"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PROFILE_PHOTO_VIEW_SIZE,
  exportProfilePhotoCrop,
  extensionForMime,
  initialCropState,
  loadImageFromFile,
  outputMimeForFile,
  type ProfilePhotoCropState,
} from "@/lib/cropProfilePhoto";

interface ProfilePhotoCropModalProps {
  file: File;
  onCancel: () => void;
  onConfirm: (file: File) => void;
  busy?: boolean;
}

export function ProfilePhotoCropModal({
  file,
  onCancel,
  onConfirm,
  busy = false,
}: ProfilePhotoCropModalProps) {
  const view = PROFILE_PHOTO_VIEW_SIZE;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [crop, setCrop] = useState<ProfilePhotoCropState>(initialCropState);
  const [exporting, setExporting] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    void loadImageFromFile(file)
      .then((img) => {
        if (!cancelled) {
          setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const coverScale =
    imgSize && crop.zoom
      ? Math.max(view / imgSize.w, view / imgSize.h) * crop.zoom
      : 1;
  const displayW = imgSize ? imgSize.w * coverScale : view;
  const displayH = imgSize ? imgSize.h * coverScale : view;
  const imgLeft = view / 2 - displayW / 2 + crop.offsetX;
  const imgTop = view / 2 - displayH / 2 + crop.offsetY;

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!imgSize) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        baseX: crop.offsetX,
        baseY: crop.offsetY,
      };
    },
    [crop.offsetX, crop.offsetY, imgSize],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag?.active) return;
    setCrop((prev) => ({
      ...prev,
      offsetX: drag.baseX + (e.clientX - drag.startX),
      offsetY: drag.baseY + (e.clientY - drag.startY),
    }));
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (dragRef.current?.active) {
      dragRef.current.active = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  const handleConfirm = async () => {
    setExporting(true);
    try {
      const img = await loadImageFromFile(file);
      const mime = outputMimeForFile(file);
      const blob = await exportProfilePhotoCrop(img, crop, mime);
      const ext = extensionForMime(mime);
      const cropped = new File([blob], `perfil.${ext}`, { type: mime });
      onConfirm(cropped);
    } catch {
      onCancel();
    } finally {
      setExporting(false);
    }
  };

  const disabled = busy || exporting || !imgSize || loadError;

  if (loadError) {
    return (
      <>
        <button
          type="button"
          aria-label="Cerrar"
          className="fixed inset-0 z-50 bg-black/40"
          onClick={onCancel}
        />
        <div className="fixed left-1/2 top-1/2 z-[51] rounded-xl bg-[var(--pa-surface)] p-4 shadow-lg">
          <p className="text-[13px] text-[var(--pa-danger)]">
            No se pudo abrir la imagen.
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="mt-3 text-[13px] font-semibold text-[var(--pa-navy)]"
          >
            Cerrar
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar recorte"
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-labelledby="crop-title"
        className="fixed left-1/2 top-1/2 z-[51] w-[min(100vw-2rem,400px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-5 shadow-2xl"
      >
        <h2
          id="crop-title"
          className="text-[15px] font-bold text-[var(--pa-ink)]"
        >
          Ajustar foto de perfil
        </h2>
        <p className="mt-1 text-[12px] text-[var(--pa-muted)]">
          Arrastra para mover y usa el zoom. Así se verá en el círculo del avatar.
        </p>

        <div className="mt-4 flex justify-center">
          <div
            className="relative touch-none overflow-hidden rounded-full border-2 border-[var(--pa-navy)] bg-[var(--pa-bg-alt)] shadow-inner"
            style={{ width: view, height: view }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {previewUrl && imgSize ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt=""
                draggable={false}
                className="absolute max-w-none select-none"
                style={{
                  width: displayW,
                  height: displayH,
                  left: imgLeft,
                  top: imgTop,
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[12px] text-[var(--pa-muted)]">
                Cargando…
              </div>
            )}
          </div>
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
            Zoom
          </span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={crop.zoom}
            onChange={(e) =>
              setCrop((prev) => ({ ...prev, zoom: Number(e.target.value) }))
            }
            className="w-full accent-[var(--pa-navy)]"
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled}
            className="rounded-lg border border-[var(--pa-border)] px-3 py-2 text-[13px] font-semibold text-[var(--pa-ink)] hover:bg-[var(--pa-bg)] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={disabled}
            className="rounded-lg bg-[var(--pa-navy)] px-3 py-2 text-[13px] font-bold text-white disabled:opacity-50"
          >
            {exporting || busy ? "Guardando…" : "Usar esta foto"}
          </button>
        </div>
      </div>
    </>
  );
}
