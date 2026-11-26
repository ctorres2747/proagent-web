"use client";

import { useEffect, useRef, type Ref } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AgendarForm } from "@/features/captacion/AgendarForm";
import {
  followUpRelativeLabel,
  followUpTone,
  TIPO_ACTIVIDAD_LABEL,
} from "@/lib/leadFollowUp";
import { leadsService } from "@/services";
import type {
  LeadActivity,
  LeadActivityCreate,
  ProximaActividad,
} from "@/services/interfaces/leads";

export function LeadActivitiesSection({
  leadId,
  token,
  now,
  highlightActivityId,
  onProximaChange,
}: {
  leadId: number;
  token?: string;
  now: Date;
  highlightActivityId?: number | null;
  onProximaChange: (proxima: ProximaActividad | null) => void;
}) {
  const queryClient = useQueryClient();
  const highlightRef = useRef<HTMLLIElement>(null);

  const { data: activities, isLoading } = useQuery({
    queryKey: ["lead-activities", leadId],
    queryFn: () => leadsService.listActivities(leadId, token),
  });

  useEffect(() => {
    if (!highlightActivityId) return;
    highlightRef.current?.scrollIntoView({ block: "nearest" });
  }, [highlightActivityId, activities]);

  const createMutation = useMutation({
    mutationFn: (data: LeadActivityCreate) =>
      leadsService.createActivity(leadId, data, token),
    onSuccess: (proxima) => {
      onProximaChange(proxima);
      void queryClient.invalidateQueries({
        queryKey: ["lead-activities", leadId],
      });
    },
  });

  const patchMutation = useMutation({
    mutationFn: ({
      id,
      estado,
    }: {
      id: number;
      estado: "completada" | "cancelada";
    }) => leadsService.patchActivity(leadId, id, { estado }, token),
    onSuccess: (proxima) => {
      onProximaChange(proxima);
      void queryClient.invalidateQueries({
        queryKey: ["lead-activities", leadId],
      });
    },
  });

  const pendientes = (activities ?? []).filter((a) => a.estado === "pendiente");
  const historial = (activities ?? []).filter((a) => a.estado !== "pendiente");

  return (
    <section id="lead-actividades" className="space-y-3">
      <h4 className="text-[11px] font-bold uppercase tracking-wide text-[var(--pa-text-secondary)]">
        Agendar seguimiento
      </h4>
      <AgendarForm
        onSave={async (data) => {
          await createMutation.mutateAsync(data);
        }}
        pending={createMutation.isPending}
        submitLabel="Agendar"
      />
      {isLoading ? (
        <p className="text-[12px] text-[var(--pa-muted)]">Cargando…</p>
      ) : null}
      {!isLoading && pendientes.length === 0 && historial.length === 0 ? (
        <p className="text-[12px] text-[var(--pa-faint)]">
          Sin actividades. Completa el formulario o agenda desde la tarjeta.
        </p>
      ) : null}
      {pendientes.length > 0 ? (
        <ul className="space-y-1.5">
          {pendientes.map((act) => (
            <ActivityRow
              key={act.id}
              activity={act}
              now={now}
              highlight={act.id === highlightActivityId}
              rowRef={act.id === highlightActivityId ? highlightRef : undefined}
              busy={patchMutation.isPending}
              onComplete={() =>
                patchMutation.mutate({ id: act.id, estado: "completada" })
              }
              onCancel={() =>
                patchMutation.mutate({ id: act.id, estado: "cancelada" })
              }
            />
          ))}
        </ul>
      ) : null}
      {historial.length > 0 ? (
        <ul className="space-y-1 border-t border-[var(--pa-border)] pt-2">
          {historial.map((act) => (
            <ActivityRow
              key={act.id}
              activity={act}
              now={now}
              highlight={act.id === highlightActivityId}
              rowRef={act.id === highlightActivityId ? highlightRef : undefined}
              historic
            />
          ))}
        </ul>
      ) : null}
      {createMutation.isError || patchMutation.isError ? (
        <p className="text-[12px] text-[var(--pa-danger)]">
          {(createMutation.error ?? patchMutation.error) instanceof Error
            ? (createMutation.error ?? patchMutation.error)!.message
            : "No se pudo actualizar la actividad."}
        </p>
      ) : null}
    </section>
  );
}

function ActivityRow({
  activity,
  now,
  highlight,
  rowRef,
  historic,
  busy,
  onComplete,
  onCancel,
}: {
  activity: LeadActivity;
  now: Date;
  highlight?: boolean;
  rowRef?: Ref<HTMLLIElement>;
  historic?: boolean;
  busy?: boolean;
  onComplete?: () => void;
  onCancel?: () => void;
}) {
  const tone = followUpTone(activity, now);
  const ring =
    highlight &&
    "ring-2 ring-[var(--pa-navy)] ring-offset-1 ring-offset-[var(--pa-surface)]";
  const muted = historic ? "opacity-60" : "";
  return (
    <li
      ref={rowRef}
      data-activity-id={activity.id}
      className={`rounded-[10px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 py-2 ${ring} ${muted}`}
    >
      <p className="text-[13px] font-semibold text-[var(--pa-ink)]">
        {activity.titulo ?? TIPO_ACTIVIDAD_LABEL[activity.tipo] ?? activity.tipo}
      </p>
      <p
        className={`text-[11px] ${
          !historic && tone === "overdue"
            ? "font-semibold text-[var(--pa-danger)]"
            : "text-[var(--pa-muted)]"
        }`}
      >
        {historic
          ? activity.estado === "completada"
            ? "Completada"
            : "Cancelada"
          : followUpRelativeLabel(activity, now)}
        {activity.todoElDia ? " · Todo el día" : ""}
      </p>
      {activity.nota ? (
        <p className="mt-0.5 text-[11px] text-[var(--pa-text-secondary)]">
          {activity.nota}
        </p>
      ) : null}
      {!historic ? (
        <div className="mt-1.5 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onComplete}
            className="text-[11px] font-semibold text-[var(--pa-accent)] hover:underline disabled:opacity-60"
          >
            Completar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="text-[11px] font-semibold text-[var(--pa-muted)] hover:underline disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      ) : null}
    </li>
  );
}
