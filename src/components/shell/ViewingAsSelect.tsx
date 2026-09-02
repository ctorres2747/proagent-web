"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { ChevronDown, Eye } from "lucide-react";

import { useAgentView } from "@/features/agentView/AgentViewProvider";
import { useAuth } from "@/features/auth/AuthProvider";

function ViewingAsDropdown({
  open,
  onClose,
  collapsed,
  anchorRef,
}: {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  anchorRef: RefObject<HTMLButtonElement | null>;
}) {
  const { setViewAgenteId, agentesList } = useAgentView();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open, onClose, anchorRef]);

  useEffect(() => {
    if (!open || !collapsed || !anchorRef.current || !panelRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const panel = panelRef.current;
    panel.style.left = `${rect.right + 8}px`;
    panel.style.bottom = `${window.innerHeight - rect.bottom}px`;
  }, [open, collapsed, anchorRef]);

  if (!open) return null;

  const panelClass = collapsed
    ? "fixed z-[70] w-56 max-h-48 overflow-y-auto rounded-[10px] border border-[var(--pa-border)] bg-white py-1 shadow-[var(--pa-shadow-overlay)]"
    : "absolute bottom-full left-0 right-0 z-20 mb-1 max-h-48 overflow-y-auto rounded-[10px] border border-[var(--pa-border)] bg-white py-1 shadow-[var(--pa-shadow-overlay)]";

  return (
    <div ref={panelRef} className={panelClass} role="listbox" aria-label="Viendo como">
      <button
        type="button"
        className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-[var(--pa-bg)]"
        onClick={() => {
          setViewAgenteId(null);
          onClose();
        }}
      >
        Todos (vista combinada)
      </button>
      {agentesList.map((a) => (
        <button
          key={a.id}
          type="button"
          className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-[var(--pa-bg)]"
          onClick={() => {
            setViewAgenteId(String(a.id));
            onClose();
          }}
        >
          {a.nombrePreferido || a.nombre || `Asesor ${a.id}`}
        </button>
      ))}
    </div>
  );
}

export function ViewingAsSelect({ collapsed }: { collapsed: boolean }) {
  const { session } = useAuth();
  const { viewAgenteId, agentesList } = useAgentView();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  if (session?.role !== "admin") return null;

  const label =
    viewAgenteId != null
      ? agentesList.find((a) => String(a.id) === viewAgenteId)?.nombrePreferido ??
        `Asesor ${viewAgenteId}`
      : "Todos";

  if (collapsed) {
    return (
      <div className="relative mb-2 flex justify-center">
        <button
          ref={anchorRef}
          type="button"
          aria-label={`Viendo como: ${label}`}
          aria-expanded={open}
          className="relative flex h-11 w-11 items-center justify-center rounded-[10px] hover:bg-[rgba(255,255,255,.08)]"
          onClick={() => setOpen((v) => !v)}
        >
          <Eye size={18} strokeWidth={1.9} className="text-[rgba(255,255,255,.72)]" />
          {viewAgenteId ? (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--pa-warning)]" />
          ) : null}
        </button>
        <ViewingAsDropdown
          open={open}
          onClose={() => setOpen(false)}
          collapsed
          anchorRef={anchorRef}
        />
      </div>
    );
  }

  return (
    <div className="relative mb-2">
      <button
        ref={anchorRef}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-[10px] bg-[rgba(255,255,255,.07)] px-3 py-2.5 text-left"
      >
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[.06em] text-[rgba(255,255,255,.5)]">
            Viendo como
          </div>
          <div className="truncate text-[12px] font-bold text-white">{label}</div>
        </div>
        <ChevronDown size={14} className="shrink-0 text-[rgba(255,255,255,.5)]" />
      </button>
      <ViewingAsDropdown
        open={open}
        onClose={() => setOpen(false)}
        collapsed={false}
        anchorRef={anchorRef}
      />
    </div>
  );
}
