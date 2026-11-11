"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Cloud,
  Download,
  Eraser,
  Grid2x2,
  Sparkles,
  Sun,
  Undo2,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  PHOTO_EDIT_OPS,
  photoDownloadFilename,
  photoEditErrorMessage,
  photoEditMeta,
  type PhotoEditOp,
} from "@/lib/photoEdit";
import { propertiesService } from "@/services";
import { ApiError } from "@/services/http/client";
import type { Property, PropertyPhoto } from "@/services/interfaces/properties";
import { BrushOverlay, clearBrushCanvas, exportBrushMask } from "./BrushOverlay";
import { CompareSlider } from "./CompareSlider";

type ViewMode = "original" | "retocada" | "comparar";

interface DraftState {
  versionId: string | null;
  steps: PhotoEditOp[];
  previewUrl: string | null;
  dirty: boolean;
}

const EMPTY_DRAFT: DraftState = {
  versionId: null,
  steps: [],
  previewUrl: null,
  dirty: false,
};

const OP_ICON = {
  enhance_light: Sun,
  straighten: Grid2x2,
  remove_objects: Eraser,
  sky_replace: Cloud,
} as const;

export function PhotoEditorModal({
  property,
  photos,
  startIndex,
  token,
  onClose,
  onSaved,
}: {
  property: Property;
  photos: PropertyPhoto[];
  startIndex: number;
  token?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const photoStageRef = useRef<HTMLDivElement>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(
    typeof document !== "undefined" ? (document.activeElement as HTMLElement) : null,
  );

  const [index, setIndex] = useState(startIndex);
  const [view, setView] = useState<ViewMode>("retocada");
  const [split, setSplit] = useState(50);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [processing, setProcessing] = useState<{
    photoId: string;
    op: PhotoEditOp;
  } | null>(null);
  const [error, setError] = useState<{
    photoId: string;
    op: PhotoEditOp;
    message: string;
    mask?: File | null;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [brush, setBrush] = useState(false);
  const [brushSize, setBrushSize] = useState(44);
  const [hasStroke, setHasStroke] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  useFocusTrap(dialogRef, true);

  const photo = photos[index] ?? photos[0];
  const total = photos.length;
  const n = index + 1;
  const draft = drafts[photo?.id ?? ""] ?? EMPTY_DRAFT;
  const hasRetouch = Boolean(photo?.iaRetoqueGuardado) || draft.steps.length > 0;
  const originalSrc = photo?.originalUrl || photo?.url || "";
  const retouchedSrc = draft.previewUrl || photo?.url || originalSrc;
  const processingHere = processing?.photoId === photo?.id ? processing : null;
  const errorHere = error?.photoId === photo?.id ? error : null;

  const dirtyCount = useMemo(
    () => Object.values(drafts).filter((d) => d.dirty && d.steps.length > 0).length,
    [drafts],
  );

  useEffect(() => {
    const opener = openerRef.current;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      opener?.focus?.();
    };
  }, []);

  useEffect(() => {
    const el = filmstripRef.current?.querySelector<HTMLElement>("[data-active='true']");
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [index]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const go = useCallback(
    (dir: -1 | 1) => {
      if (total === 0) return;
      setIndex((i) => (i + dir + total) % total);
      setView("retocada");
      setBrush(false);
      setHasStroke(false);
      setSplit(50);
      setConfirmClose(false);
    },
    [total],
  );

  const requestClose = useCallback(() => {
    if (brush) {
      setBrush(false);
      setHasStroke(false);
      return;
    }
    if (dirtyCount > 0) {
      setConfirmClose(true);
      return;
    }
    onClose();
  }, [brush, dirtyCount, onClose]);

  const discardAndClose = async () => {
    const pending = Object.entries(drafts).filter(
      ([, d]) => d.dirty && d.versionId,
    );
    await Promise.all(
      pending.map(([photoId, d]) =>
        propertiesService
          .discardPhotoEdit(property.id, photoId, d.versionId!, token)
          .catch(() => undefined),
      ),
    );
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "[" && brush) {
        e.preventDefault();
        setBrushSize((s) => Math.max(20, s - 4));
        return;
      }
      if (e.key === "]" && brush) {
        e.preventDefault();
        setBrushSize((s) => Math.min(90, s + 4));
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        if (confirmClose) {
          setConfirmClose(false);
          return;
        }
        requestClose();
        return;
      }
      if (view === "comparar" && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [brush, confirmClose, go, requestClose, view]);

  const patchDraft = (photoId: string, next: Partial<DraftState>) => {
    setDrafts((prev) => ({
      ...prev,
      [photoId]: { ...(prev[photoId] ?? EMPTY_DRAFT), ...next },
    }));
  };

  const runEdit = async (op: PhotoEditOp, mask?: File | null) => {
    if (!photo || processing) return;
    setError(null);
    setBrush(false);
    setHasStroke(false);
    setProcessing({ photoId: photo.id, op });
    try {
      const start = await propertiesService.startPhotoEdit(
        property.id,
        photo.id,
        op,
        mask ?? null,
        token,
      );
      // T1 enqueue is `{ versionId, stepId, status }` without previewUrl.
      // Stub síncrono puede devolver `ready`/`done` ya en el POST: hay que
      // pollar GET al menos una vez para tomar previewUrl.
      let previewUrl = start.previewUrl ?? null;
      let status = start.status;
      if (status === "error") {
        throw new ApiError(400, start.message || "error");
      }
      const deadline = Date.now() + 60_000;
      let polled = false;
      while (status === "processing" || !previewUrl || !polled) {
        if (Date.now() >= deadline) {
          throw new Error("timeout");
        }
        if (polled) await sleep(1500);
        const poll = await propertiesService.pollPhotoEdit(
          property.id,
          photo.id,
          start.stepId,
          token,
        );
        polled = true;
        status = poll.status;
        if (poll.previewUrl) previewUrl = poll.previewUrl;
        if (status === "error") {
          throw new ApiError(400, poll.message || "error");
        }
        if (status === "done") break;
      }
      if (status !== "done") {
        throw new Error("timeout");
      }
      setDrafts((prev) => {
        const cur = prev[photo.id] ?? EMPTY_DRAFT;
        return {
          ...prev,
          [photo.id]: {
            versionId: start.versionId,
            steps: [...cur.steps, op],
            previewUrl: previewUrl || cur.previewUrl,
            dirty: true,
          },
        };
      });
      setView("retocada");
      setToast(photoEditMeta(op).ready);
    } catch (err) {
      setError({
        photoId: photo.id,
        op,
        message: photoEditErrorMessage(err, op),
        mask: mask ?? null,
      });
    } finally {
      setProcessing(null);
    }
  };

  const onUndo = async () => {
    if (!photo || !draft.versionId || draft.steps.length === 0 || processing) return;
    setError(null);
    try {
      const result = await propertiesService.undoLastPhotoEditStep(
        property.id,
        photo.id,
        draft.versionId,
        token,
      );
      const nextSteps = draft.steps.slice(0, -1);
      patchDraft(photo.id, {
        steps: nextSteps,
        previewUrl:
          result.previewUrl ??
          (nextSteps.length ? draft.previewUrl : null),
        dirty: nextSteps.length > 0,
        versionId: nextSteps.length ? draft.versionId : draft.versionId,
      });
      if (nextSteps.length === 0) setView("original");
    } catch (err) {
      setError({
        photoId: photo.id,
        op: draft.steps[draft.steps.length - 1],
        message: photoEditErrorMessage(err, draft.steps[draft.steps.length - 1]),
      });
    }
  };

  const onSave = async () => {
    if (!photo || !draft.versionId || !draft.dirty || processing) return;
    setSaving(true);
    setError(null);
    try {
      await propertiesService.savePhotoEdit(
        property.id,
        photo.id,
        draft.versionId,
        token,
      );
      patchDraft(photo.id, {
        versionId: null,
        steps: [],
        previewUrl: null,
        dirty: false,
      });
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2200);
      setToast("Foto actualizada en la publicación");
      onSaved();
    } catch (err) {
      setError({
        photoId: photo.id,
        op: draft.steps[draft.steps.length - 1] ?? "enhance_light",
        message:
          err instanceof Error
            ? err.message
            : "No se pudo guardar el retoque.",
      });
    } finally {
      setSaving(false);
    }
  };

  const onDownload = async () => {
    if (!photo) return;
    const seeingOriginal = view === "original";
    const ia = !seeingOriginal && hasRetouch;
    const filename = photoDownloadFilename({
      code: property.code,
      index1: n,
      roomLabel: photo.roomLabel,
      ia,
    });
    const src = seeingOriginal ? originalSrc : retouchedSrc;
    const useDraftPreview = !seeingOriginal && Boolean(draft.previewUrl);
    try {
      if (useDraftPreview) {
        triggerBlobDownload(src, filename);
        return;
      }
      await propertiesService.downloadPhoto(
        property.id,
        photo.id,
        seeingOriginal ? "original" : "active",
        filename,
        token,
        src,
      );
    } catch {
      triggerBlobDownload(src, filename);
    }
  };

  const startBrushApply = async () => {
    const mask = await exportBrushMask(photoStageRef.current);
    if (!mask) return;
    clearBrushCanvas(photoStageRef.current);
    setHasStroke(false);
    await runEdit("remove_objects", mask);
  };

  const title = photo?.roomLabel?.trim() || `Foto ${n}`;
  const blocked = Boolean(processing) || saving;
  const showSegmented = hasRetouch;

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,30,50,.42)] p-6 backdrop-blur-[10px] max-md:p-0 supports-[not(backdrop-filter:blur(10px))]:bg-[rgba(10,30,50,.7)]"
      role="presentation"
      onClick={requestClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pa-photo-editor-title"
        className="flex h-[min(820px,100%)] w-[min(1320px,100%)] origin-center overflow-hidden rounded-[18px] bg-[#0B1620] shadow-[0_30px_80px_rgba(8,26,42,.45)] max-md:h-[100dvh] max-md:rounded-none md:animate-[pa-fade-in_180ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-4 border-b border-white/8 px-5">
            <div className="min-w-0 flex-1">
              <h2
                id="pa-photo-editor-title"
                className="truncate text-[15px] font-extrabold whitespace-nowrap text-white"
              >
                {title}
              </h2>
              <p className="text-[12px] font-semibold text-white/60">
                Foto {n} de {total} · {property.code}
              </p>
            </div>
            {showSegmented && (
              <div
                className="hidden h-[40px] items-center rounded-[10px] bg-white/8 p-[3px] sm:flex"
                role="tablist"
                aria-label="Versión de la foto"
              >
                {(
                  [
                    ["original", "Original"],
                    ["retocada", "Retocada"],
                    ["comparar", "Comparar"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={view === id}
                    disabled={blocked}
                    onClick={() => {
                      setView(id);
                      if (id === "comparar") setBrush(false);
                    }}
                    className={`h-[34px] rounded-[8px] px-3.5 text-[13px] font-bold ${
                      view === id
                        ? "bg-white text-[#0A3D62]"
                        : "text-white/75 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => void onDownload()}
              className="flex h-10 items-center gap-1.5 rounded-[10px] border border-white/18 px-3 text-[13px] font-bold text-white"
            >
              <Download className="h-4 w-4" strokeWidth={2.2} />
              <span className="hidden sm:inline">Descargar</span>
            </button>
            <button
              ref={closeBtnRef}
              type="button"
              title="Cerrar (Esc)"
              aria-label="Cerrar"
              onClick={requestClose}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/8 text-white hover:bg-white/16 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2FC98A]"
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </header>

          <div className="relative flex min-h-0 flex-1 items-center px-[68px] py-4 max-[1100px]:px-[52px] max-md:px-12">
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={() => go(-1)}
              className="absolute left-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 max-[1100px]:h-10 max-[1100px]:w-10"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              aria-label="Foto siguiente"
              onClick={() => go(1)}
              className="absolute right-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 max-[1100px]:h-10 max-[1100px]:w-10"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2.2} />
            </button>

            <div className="relative mx-auto aspect-[4/3] max-h-full w-full max-w-[1100px] overflow-hidden rounded-xl bg-black">
              <div ref={photoStageRef} className="relative h-full w-full">
                {view === "comparar" && hasRetouch ? (
                  <CompareSlider
                    originalSrc={originalSrc}
                    retouchedSrc={retouchedSrc}
                    split={split}
                    onSplit={setSplit}
                  />
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={view === "original" ? originalSrc : retouchedSrc}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                    {brush && (
                      <BrushOverlay
                        size={brushSize}
                        onStrokeChange={setHasStroke}
                        resetKey={`${photo.id}-${draft.steps.length}`}
                      />
                    )}
                  </>
                )}

                {brush && !processingHere && (
                  <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-[10px] bg-[rgba(8,26,42,.82)] px-3 py-1.5 text-[13px] font-bold text-white">
                    Pinta sobre el objeto que quieres quitar
                  </div>
                )}

                {processingHere && (
                  <div className="absolute inset-0 z-30 overflow-hidden bg-[rgba(8,26,42,.45)]">
                    <div className="absolute inset-x-0 h-1/2 animate-[pa-photo-scan_1.4s_linear_infinite] bg-[linear-gradient(180deg,transparent_40%,rgba(47,201,138,.28)_50%,transparent_60%)]" />
                    <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-xl bg-[rgba(8,26,42,.88)] px-5 py-3.5 text-[13px] font-semibold text-white">
                      <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/25 border-t-[#2FC98A]" />
                      {photoEditMeta(processingHere.op).processing}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            ref={filmstripRef}
            className="flex h-[76px] shrink-0 items-center justify-center gap-2 overflow-x-auto border-t border-white/8 px-4"
          >
            {photos.map((p, i) => {
              const d = drafts[p.id];
              const marked = p.iaRetoqueGuardado || (d && d.steps.length > 0);
              const spinning = processing?.photoId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  data-active={i === index ? "true" : "false"}
                  aria-label={`Foto ${i + 1}`}
                  onClick={() => {
                    setIndex(i);
                    setView("retocada");
                    setBrush(false);
                    setHasStroke(false);
                    setSplit(50);
                  }}
                  className={`relative h-[50px] w-[68px] shrink-0 overflow-hidden rounded-lg ${
                    i === index
                      ? "opacity-100 outline outline-2 outline-offset-2 outline-[#2FC98A]"
                      : "opacity-60 hover:opacity-90"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d?.previewUrl || p.url} alt="" className="h-full w-full object-cover" />
                  {marked && (
                    <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#2FC98A] text-[9px] text-[#06331F]">
                      ✦
                    </span>
                  )}
                  {spinning && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-[#2FC98A]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <aside
          className={`flex w-[clamp(270px,26vw,330px)] shrink-0 flex-col bg-white max-md:absolute max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:w-full max-md:rounded-t-2xl max-md:shadow-[0_-8px_32px_rgba(8,26,42,.25)] ${
            panelOpen ? "" : "max-md:h-12"
          }`}
        >
          <button
            type="button"
            className="hidden max-md:flex h-12 items-center justify-center gap-2 border-b border-[#EEF0F3] text-[13px] font-bold text-[#0A3D62]"
            onClick={() => setPanelOpen((v) => !v)}
          >
            <Sparkles className="h-4 w-4 text-[#2FC98A]" />
            Retoque con IA
          </button>
          <div className={`flex min-h-0 flex-1 flex-col ${panelOpen ? "" : "max-md:hidden"}`}>
            <div className="border-b border-[#EEF0F3] px-[18px] pb-3 pt-4 max-md:hidden">
              <div className="flex items-center gap-2 text-[16px] font-extrabold text-[#0A3D62]">
                <Sparkles className="h-4 w-4 text-[#2FC98A]" strokeWidth={2.2} />
                Retoque con IA
              </div>
              <p className="mt-1 text-[12.5px] text-[#5B6B79]">
                La foto original siempre se conserva.
              </p>
            </div>

            <div className="flex flex-col gap-2 px-3.5 py-3">
              {PHOTO_EDIT_OPS.map((tool) => {
                const Icon = OP_ICON[tool.op];
                const applied = draft.steps.includes(tool.op);
                const isRemove = tool.op === "remove_objects";
                return (
                  <div
                    key={tool.op}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
                      brush && isRemove
                        ? "border-[#2FC98A] bg-[#F2FBF7]"
                        : applied
                          ? "border-[#2FC98A] bg-[#F2FBF7]"
                          : "border-[#E4E8EC]"
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#EAF0F5] text-[#0A3D62]">
                      <Icon className="h-4 w-4" strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-bold text-[#16212B]">
                        {tool.name}
                      </div>
                      <div
                        className="truncate text-[11.5px] text-[#5B6B79]"
                        title={
                          brush && isRemove
                            ? "Pinta sobre la foto"
                            : applied
                              ? "Aplicado"
                              : tool.subtitle
                        }
                      >
                        {brush && isRemove
                          ? "Pinta sobre la foto"
                          : applied
                            ? "Aplicado"
                            : tool.subtitle}
                      </div>
                    </div>
                    {isRemove ? (
                      brush ? (
                        <button
                          type="button"
                          disabled={blocked}
                          onClick={() => {
                            if (hasStroke) {
                              void startBrushApply();
                            } else {
                              setBrush(false);
                              setHasStroke(false);
                            }
                          }}
                          className={`h-[30px] shrink-0 rounded-lg px-3 text-[12px] font-bold ${
                            hasStroke
                              ? "bg-[#0A3D62] text-white"
                              : "bg-[#EEF0F3] text-[#45525E]"
                          }`}
                        >
                          {hasStroke ? "Quitar" : "Cancelar"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={blocked}
                          onClick={() => {
                            setView("retocada");
                            setBrush(true);
                            setHasStroke(false);
                          }}
                          className="h-[30px] shrink-0 rounded-lg bg-[#0A3D62] px-3 text-[12px] font-bold text-white disabled:bg-[#EEF0F3] disabled:text-[#9AA6B2]"
                        >
                          {applied ? "Otro" : "Pincel"}
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        disabled={blocked}
                        onClick={() => void runEdit(tool.op)}
                        className="h-[30px] shrink-0 rounded-lg bg-[#0A3D62] px-3 text-[12px] font-bold text-white disabled:bg-[#EEF0F3] disabled:text-[#9AA6B2]"
                      >
                        Aplicar
                      </button>
                    )}
                  </div>
                );
              })}

              {brush && (
                <div className="flex items-center gap-3 px-1 pt-1">
                  <span className="text-[12px] font-bold text-[#45525E]">Pincel</span>
                  <input
                    type="range"
                    min={20}
                    max={90}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="flex-1 accent-[#0A3D62]"
                    aria-label="Tamaño del pincel"
                  />
                  <button
                    type="button"
                    className="text-[12px] font-bold text-[#0A3D62] underline"
                    onClick={() => {
                      clearBrushCanvas(photoStageRef.current);
                      setHasStroke(false);
                    }}
                  >
                    Limpiar
                  </button>
                </div>
              )}

              {errorHere && (
                <div className="rounded-xl border border-[#FBE7E4] bg-[#FBE7E4] px-3 py-2 text-[12px] text-[#C23B2B]">
                  <p>{errorHere.message}</p>
                  <button
                    type="button"
                    className="mt-1 font-bold underline"
                    onClick={() => {
                      const retry = errorHere;
                      setError(null);
                      if (retry.op === "remove_objects" && !retry.mask) {
                        setBrush(true);
                        return;
                      }
                      void runEdit(retry.op, retry.mask);
                    }}
                  >
                    Reintentar
                  </button>
                </div>
              )}
            </div>

            <div className="mt-auto border-t border-[#EEF0F3] bg-[#FAFBFC] px-3.5 py-3">
              {draft.steps.length > 0 && (
                <button
                  type="button"
                  disabled={blocked}
                  onClick={() => void onUndo()}
                  className="mb-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#E4E8EC] bg-white text-[12.5px] font-bold text-[#45525E] disabled:opacity-50"
                >
                  <Undo2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                  Deshacer último
                </button>
              )}
              <button
                type="button"
                disabled={blocked || !draft.dirty || draft.steps.length === 0}
                onClick={() => void onSave()}
                className="h-10 w-full rounded-[10px] text-[13.5px] font-extrabold text-white disabled:cursor-not-allowed disabled:bg-[#C9D0D7] enabled:bg-[#0A3D62]"
              >
                {savedFlash && !draft.dirty
                  ? "Guardada ✓"
                  : saving
                    ? "Guardando…"
                    : "Guardar en la publicación"}
              </button>
              <p className="mt-1.5 text-center text-[11.5px] text-[#5B6B79]">
                Reemplaza la foto en la publicación y en el reel.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {toast && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-[#16212B] px-4 py-2.5 text-[13px] font-semibold text-white">
          {toast}
        </div>
      )}

      <ConfirmDialog
        open={confirmClose}
        title="Retoques sin guardar"
        message={`Tienes retoques sin guardar en ${dirtyCount} foto(s). ¿Salir sin guardar?`}
        confirmLabel="Salir sin guardar"
        cancelLabel="Seguir editando"
        tone="danger"
        onCancel={() => setConfirmClose(false)}
        onConfirm={() => void discardAndClose()}
      />
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function triggerBlobDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
