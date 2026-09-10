"use client";

import { ArrowRight, MessageCircle, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { AgentSession } from "@/features/auth/types";
import { displayName } from "@/lib/agentDisplay";

import { assistantContextLabel } from "./assistant-context";

type DemoMessage =
  | { role: "assistant"; text: string }
  | { role: "user"; text: string };

function demoMessages(userName: string): DemoMessage[] {
  return [
    {
      role: "assistant",
      text: `Hola ${userName}, puedo ayudarte a revisar completitud, redactar descripciones o filtrar tu inventario. ¿Qué necesitas?`,
    },
    {
      role: "user",
      text: "¿Cuáles propiedades tienen menos de 50% de completitud?",
    },
    {
      role: "assistant",
      text: "Tienes 2: Casa en La Estrella (39%) y Lote en La Estrella (44%). A ambas les falta fotos y descripción.",
    },
  ];
}

export function AssistantShell({
  pathname,
  userName,
  inventoryCount,
  captacionPending,
}: {
  pathname: string;
  userName: string;
  inventoryCount?: number;
  captacionPending?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const contextLabel = assistantContextLabel(pathname, {
    inventoryCount,
    captacionPending,
  });

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-label="Abrir asistente ProAgent"
        aria-expanded={open}
        className="fixed bottom-7 right-8 z-[45] flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#2FC98A] text-[#06331F] shadow-[0_8px_20px_rgba(47,201,138,.4)] transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2FC98A] motion-reduce:transition-none motion-reduce:hover:scale-100"
      >
        <MessageCircle size={23} strokeWidth={1.9} aria-hidden />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Cerrar asistente"
            className="fixed inset-0 z-[48] bg-[rgba(16,33,49,.28)] motion-reduce:transition-none"
            onClick={close}
          />
          <aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Asistente ProAgent"
            className="fixed bottom-0 right-0 top-0 z-[50] flex w-[380px] max-w-[92vw] flex-col border-l border-[#E4E8EC] bg-white shadow-[-8px_0_32px_rgba(16,33,49,.14)]"
          >
            <header className="flex h-[60px] shrink-0 items-center gap-2.5 border-b border-[#E4E8EC] px-[18px]">
              <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#2FC98A] text-[#06331F]">
                <MessageCircle size={15} strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-extrabold text-[var(--pa-ink)]">
                  Asistente ProAgent
                </div>
                <div className="truncate text-[11px] font-semibold text-[#5B6B79]">
                  {contextLabel}
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar panel"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[#5B6B79] hover:bg-[var(--pa-bg)]"
              >
                <X size={16} strokeWidth={2} aria-hidden />
              </button>
            </header>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-[18px]">
              {demoMessages(userName).map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-[88%] rounded-xl px-[13px] py-2.5 text-[13px] leading-[1.5] ${
                    msg.role === "assistant"
                      ? "self-start bg-[#F6F7F9] text-[var(--pa-ink)]"
                      : "self-end bg-[var(--pa-navy)] text-white"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            <footer className="shrink-0 border-t border-[#E4E8EC] px-4 py-3.5">
              <div className="flex items-center gap-2 rounded-[10px] border border-[#E4E8EC] bg-[#F6F7F9] px-3 py-2">
                <input
                  type="text"
                  readOnly
                  placeholder="Pregúntale al asistente…"
                  aria-label="Mensaje para el asistente (próximamente)"
                  className="min-w-0 flex-1 bg-transparent text-[12.5px] text-[var(--pa-ink)] placeholder:text-[#9AA6B2] focus:outline-none"
                />
                <span
                  className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[7px] bg-[var(--pa-navy)] text-white"
                  aria-hidden
                >
                  <ArrowRight size={13} strokeWidth={2.3} />
                </span>
              </div>
            </footer>
          </aside>
        </>
      ) : null}
    </>
  );
}

export function AssistantShellFromSession({
  pathname,
  session,
  inventoryCount,
  captacionPending,
}: {
  pathname: string;
  session: AgentSession | null;
  inventoryCount?: number;
  captacionPending?: number | null;
}) {
  const userName = session ? displayName(session) : "agente";
  return (
    <AssistantShell
      pathname={pathname}
      userName={userName}
      inventoryCount={inventoryCount}
      captacionPending={captacionPending}
    />
  );
}
