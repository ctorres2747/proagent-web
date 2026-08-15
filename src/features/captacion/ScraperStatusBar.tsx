"use client";

import { useMemo } from "react";
import { formatDuration, relativeTime } from "@/lib/relativeTime";
import type { ScraperExecution, ScraperStatus } from "@/services/interfaces/scraper";

function buildSummary(status: ScraperStatus) {
  const entries = Object.entries(status.lastByPortal).filter(
    (entry): entry is [string, ScraperExecution] => Boolean(entry[1]),
  );
  if (!entries.length) return null;

  const latestStart = Math.max(
    ...entries.map(([, e]) => new Date(e.fecha_inicio ?? 0).getTime()),
  );
  const recent = entries.filter(
    ([, e]) =>
      latestStart - new Date(e.fecha_inicio ?? 0).getTime() < 12 * 3600 * 1000,
  );
  if (!recent.length) return null;

  const runningPortal =
    recent.find(([, e]) => e.estado === "running")?.[0] ?? null;
  const finished = recent.filter(([, e]) => e.fecha_fin);
  const allOk = recent.every(([, e]) => e.estado === "completed");

  let duration: string | null = null;
  let finishedAtStr: string | null = null;
  if (finished.length) {
    const earliest = recent.reduce<string | null>(
      (a, [, e]) =>
        !a || (e.fecha_inicio && e.fecha_inicio < a) ? e.fecha_inicio ?? null : a,
      null,
    );
    finishedAtStr = finished.reduce<string | null>(
      (a, [, e]) =>
        !a || (e.fecha_fin && e.fecha_fin > a) ? e.fecha_fin ?? null : a,
      null,
    );
    if (earliest && finishedAtStr) {
      duration = formatDuration(earliest, finishedAtStr);
    }
  }

  return { recent, runningPortal, allOk, duration, finishedAtStr };
}

export function ScraperStatusBar({ status }: { status: ScraperStatus }) {
  const summary = useMemo(() => buildSummary(status), [status]);
  const { running, queueStatus, lastExecution } = status;

  if (!running && !summary && !lastExecution && !queueStatus) {
    return null;
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-[var(--pa-border)] bg-[var(--pa-surface)] px-4 py-2.5 text-[12px] text-[var(--pa-muted)]">
      {queueStatus === "pendiente" ? (
        <span className="font-semibold text-[var(--pa-accent)]">
          En cola — esperando a que la PC se conecte…
        </span>
      ) : queueStatus === "en_proceso" ? (
        <span className="font-semibold text-[var(--pa-accent)]">
          La PC está scrapeando (disparado desde el dashboard)…
        </span>
      ) : running ? (
        <span className="font-semibold text-[var(--pa-accent)]">
          Scraper en ejecución
          {summary?.runningPortal ? ` — ${summary.runningPortal}` : ""}…
        </span>
      ) : summary ? (
        <>
          {summary.allOk ? (
            <span className="font-semibold text-[var(--pa-success)]">
              ✓ Scraping completado
            </span>
          ) : (
            <span className="font-semibold text-[var(--pa-danger)]">
              ✗ Scraping con errores
            </span>
          )}
          {summary.finishedAtStr ? (
            <>
              <span className="text-[var(--pa-border)]">·</span>
              <span>
                Finalizó: {relativeTime(summary.finishedAtStr)}
              </span>
            </>
          ) : null}
          {summary.duration ? (
            <>
              <span className="text-[var(--pa-border)]">·</span>
              <span>Duración: {summary.duration}</span>
            </>
          ) : null}
          {summary.recent.map(([portal, e]) => (
            <span key={portal} className="contents">
              <span className="text-[var(--pa-border)]">·</span>
              <span>
                <strong className="text-[var(--pa-ink)]">{portal}:</strong>{" "}
                {e.estado === "completed"
                  ? `${e.leads_nuevos ?? 0} nuevos (${e.leads_encontrados ?? 0} encontrados)`
                  : e.estado === "running"
                    ? "interrumpido"
                    : e.mensaje || "falló"}
              </span>
            </span>
          ))}
        </>
      ) : lastExecution ? (
        <>
          <span>{lastExecution.portal}</span>
          <span className="text-[var(--pa-border)]">·</span>
          <span>
            Último scrape: {relativeTime(lastExecution.fecha_inicio)}
          </span>
          <span className="text-[var(--pa-border)]">·</span>
          <span>{lastExecution.leads_encontrados ?? 0} encontrados</span>
          <span className="text-[var(--pa-border)]">·</span>
          <span>{lastExecution.leads_nuevos ?? 0} nuevos</span>
          <span className="text-[var(--pa-border)]">·</span>
          {lastExecution.estado === "completed" ? (
            <span className="font-semibold text-[var(--pa-success)]">
              ✓ completado
            </span>
          ) : (
            <span className="font-semibold text-[var(--pa-danger)]">
              ✗ {lastExecution.mensaje || "falló"}
            </span>
          )}
        </>
      ) : null}
    </div>
  );
}
