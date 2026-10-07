"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { clientsService } from "@/services";
import type { Client, ClientChannel } from "@/services/interfaces/clients";
import { CLIENT_CHANNEL_META, CLIENT_CHANNEL_ORDER } from "@/design-system/clientChannels";

/** Modal mínimo de alta (handoff §7): nombre, teléfono y canal son
 * obligatorios; el resto se completa después desde el panel de detalle. */
export function NewClientModal({
  token,
  onClose,
  onCreated,
}: {
  token?: string;
  onClose: () => void;
  /** Entrega el cliente completo (no solo el id) -- la pantalla puede
   * sembrar el caché con él y abrir la ficha al instante, sin esperar un
   * refetch de la lista (revisión 2026-10-07: sin esto, la ficha podía no
   * abrirse hasta que terminara la invalidación de la query). */
  onCreated: (client: Client) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [canal, setCanal] = useState<ClientChannel | "">("");
  const [canalOtro, setCanalOtro] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      clientsService.create(
        {
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          canal: canal as ClientChannel,
          canalOtro: canal === "otro" ? canalOtro.trim() : undefined,
          // Sin columna "Nuevo contacto" (pedido de Cristhian, 2026-10-07),
          // el cliente nace directo en la primera columna visible.
          estado: "calificando",
        },
        token,
      ),
    onSuccess: (client) => onCreated(client),
    onError: (err: unknown) =>
      setError(err instanceof Error ? err.message : "No se pudo crear el cliente"),
  });

  const valido =
    nombre.trim() && telefono.trim() && canal && (canal !== "otro" || canalOtro.trim());

  const input =
    "w-full rounded-[9px] border border-[var(--pa-border)] bg-white px-2.5 py-2 text-[13px]";
  const label = "mb-1.5 block text-[11px] font-bold text-[var(--pa-text-secondary)]";

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar"
        className="fixed inset-0 z-40 bg-[rgba(16,33,49,.28)]"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--pa-border)] bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-extrabold text-[var(--pa-ink)]">Nuevo cliente</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-[var(--pa-bg)]">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className={label}>Nombre *</label>
            <input className={input} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <label className={label}>Teléfono *</label>
            <input className={input} value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>
          <div>
            <label className={label}>Canal de origen *</label>
            <select
              className={input}
              value={canal}
              onChange={(e) => setCanal(e.target.value as ClientChannel)}
            >
              <option value="">Seleccionar…</option>
              {CLIENT_CHANNEL_ORDER.map((c) => (
                <option key={c} value={c}>
                  {CLIENT_CHANNEL_META[c].label}
                </option>
              ))}
            </select>
          </div>
          {canal === "otro" ? (
            <div>
              <label className={label}>¿Cuál canal?</label>
              <input
                className={input}
                value={canalOtro}
                onChange={(e) => setCanalOtro(e.target.value)}
                placeholder="Ej. Instagram, WhatsApp…"
              />
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="mt-3 text-[12px] font-semibold text-[var(--pa-danger)]">{error}</p>
        ) : null}

        <button
          type="button"
          disabled={!valido || createMutation.isPending}
          onClick={() => createMutation.mutate()}
          className="mt-4 w-full rounded-[10px] bg-[var(--pa-navy)] py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
        >
          {createMutation.isPending ? "Creando…" : "Crear cliente"}
        </button>
      </div>
    </>
  );
}
