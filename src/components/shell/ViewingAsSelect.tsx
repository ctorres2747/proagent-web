"use client";

import { useState } from "react";
import { ChevronDown, Eye } from "lucide-react";

import { useAgentView } from "@/features/agentView/AgentViewProvider";
import { useAuth } from "@/features/auth/AuthProvider";

export function ViewingAsSelect({ collapsed }: { collapsed: boolean }) {
  const { session } = useAuth();
  const { viewAgenteId, setViewAgenteId, agentesList } = useAgentView();
  const [open, setOpen] = useState(false);

  if (session?.role !== "admin") return null;

  const label =
    viewAgenteId != null
      ? agentesList.find((a) => String(a.id) === viewAgenteId)?.nombrePreferido ??
        `Asesor ${viewAgenteId}`
      : "Todos";

  if (collapsed) {
    return (
      <button
        type="button"
        title={`Viendo como: ${label}`}
        className="relative mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-[10px] hover:bg-[rgba(255,255,255,.08)]"
        onClick={() => setOpen((v) => !v)}
      >
        <Eye size={18} strokeWidth={1.9} className="text-[rgba(255,255,255,.72)]" />
        {viewAgenteId ? (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--pa-warning)]" />
        ) : null}
      </button>
    );
  }

  return (
    <div className="relative mb-2">
      <button
        type="button"
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
      {open ? (
        <div className="absolute bottom-full left-0 right-0 z-20 mb-1 max-h-48 overflow-y-auto rounded-[10px] border border-[var(--pa-border)] bg-white py-1 shadow-[var(--pa-shadow-overlay)]">
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-[var(--pa-bg)]"
            onClick={() => {
              setViewAgenteId(null);
              setOpen(false);
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
                setOpen(false);
              }}
            >
              {a.nombrePreferido || a.nombre || `Asesor ${a.id}`}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
