"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";

import type { LeadCreate, LeadEstado } from "@/services/interfaces/leads";
import { leadsService } from "@/services";

const ESTADOS: LeadEstado[] = [
  "Pendiente",
  "En contacto",
  "Captado",
  "Descartado",
];

export function NewLeadModal({
  token,
  onClose,
  onCreated,
}: {
  token?: string;
  onClose: () => void;
  onCreated: (leadId: number) => void;
}) {
  const [form, setForm] = useState<LeadCreate>({
    municipio: "",
    tipoInmueble: "",
    barrio: "",
    precio: "",
    telefono: "",
    nombrePublicador: "",
    linkPublicacion: "",
    notas: "",
    estado: "Pendiente",
  });
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      leadsService.create(
        {
          ...form,
          municipio: form.municipio?.trim() || null,
          tipoInmueble: form.tipoInmueble?.trim() || null,
          barrio: form.barrio?.trim() || null,
          precio: form.precio?.trim() || null,
          telefono: form.telefono?.trim() || null,
          nombrePublicador: form.nombrePublicador?.trim() || null,
          linkPublicacion: form.linkPublicacion?.trim() || null,
          notas: form.notas?.trim() || null,
        },
        token,
      ),
    onSuccess: (lead) => {
      onCreated(lead.id);
      onClose();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "No se pudo crear el lead.");
    },
  });

  const setField =
    (key: keyof LeadCreate) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(16,33,49,.45)] p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-lead-title"
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[var(--pa-surface)] shadow-[var(--pa-shadow-overlay)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--pa-border)] px-5 py-4">
          <h2 id="new-lead-title" className="text-[16px] font-extrabold text-[var(--pa-ink)]">
            Nuevo lead manual
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-[10px] hover:bg-[var(--pa-bg)]"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[12px] font-semibold text-[var(--pa-muted)]">
              Municipio
              <input
                value={form.municipio ?? ""}
                onChange={setField("municipio")}
                placeholder="Sabaneta"
                className="mt-1 w-full rounded-[10px] border border-[var(--pa-border)] px-3 py-2 text-[13px]"
              />
            </label>
            <label className="block text-[12px] font-semibold text-[var(--pa-muted)]">
              Tipo
              <input
                value={form.tipoInmueble ?? ""}
                onChange={setField("tipoInmueble")}
                placeholder="Apartamento"
                className="mt-1 w-full rounded-[10px] border border-[var(--pa-border)] px-3 py-2 text-[13px]"
              />
            </label>
          </div>
          <label className="block text-[12px] font-semibold text-[var(--pa-muted)]">
            Barrio / Zona
            <input
              value={form.barrio ?? ""}
              onChange={setField("barrio")}
              className="mt-1 w-full rounded-[10px] border border-[var(--pa-border)] px-3 py-2 text-[13px]"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[12px] font-semibold text-[var(--pa-muted)]">
              Precio
              <input
                value={form.precio ?? ""}
                onChange={setField("precio")}
                placeholder="$ 350.000.000"
                className="mt-1 w-full rounded-[10px] border border-[var(--pa-border)] px-3 py-2 text-[13px]"
              />
            </label>
            <label className="block text-[12px] font-semibold text-[var(--pa-muted)]">
              Estado inicial
              <select
                value={form.estado ?? "Pendiente"}
                onChange={setField("estado")}
                className="mt-1 w-full rounded-[10px] border border-[var(--pa-border)] bg-white px-3 py-2 text-[13px]"
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-[12px] font-semibold text-[var(--pa-muted)]">
            Teléfono
            <input
              value={form.telefono ?? ""}
              onChange={setField("telefono")}
              placeholder="300 123 4567"
              className="mt-1 w-full rounded-[10px] border border-[var(--pa-border)] px-3 py-2 text-[13px]"
            />
          </label>
          <label className="block text-[12px] font-semibold text-[var(--pa-muted)]">
            Nombre del propietario
            <input
              value={form.nombrePublicador ?? ""}
              onChange={setField("nombrePublicador")}
              className="mt-1 w-full rounded-[10px] border border-[var(--pa-border)] px-3 py-2 text-[13px]"
            />
          </label>
          <label className="block text-[12px] font-semibold text-[var(--pa-muted)]">
            Link de publicación (opcional)
            <input
              value={form.linkPublicacion ?? ""}
              onChange={setField("linkPublicacion")}
              placeholder="Vacío para prospectos por referido"
              className="mt-1 w-full rounded-[10px] border border-[var(--pa-border)] px-3 py-2 text-[13px]"
            />
          </label>
          <label className="block text-[12px] font-semibold text-[var(--pa-muted)]">
            Notas
            <textarea
              rows={3}
              value={form.notas ?? ""}
              onChange={setField("notas")}
              className="mt-1 w-full rounded-[10px] border border-[var(--pa-border)] px-3 py-2 text-[13px]"
            />
          </label>
          {error ? (
            <p className="text-[12px] text-[var(--pa-danger)]">{error}</p>
          ) : null}
        </div>

        <div className="border-t border-[var(--pa-border)] px-5 py-4">
          <button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="w-full rounded-[10px] bg-[var(--pa-navy)] px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
          >
            {createMutation.isPending ? "Creando…" : "Crear lead"}
          </button>
        </div>
      </div>
    </div>
  );
}
