"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { adminDashboardService } from "@/services";
import type {
  AdminAsesorDashboard,
  AdminDashboard,
  AdminMetrica,
  AdminPubCanal,
} from "@/services/interfaces/adminDashboard";
import { formatInteger, MESES_LARGO, monthAbbr, monthLabel } from "./kpiMath";
import {
  CANAL_LABEL,
  chipClass,
  chipText,
  chipTone,
  colorAsesor,
  conversionPct,
  dayKeyBogota,
  failCellStyle,
  formatDecimal,
  formatPct,
  formatShortDate,
  formatWhen,
  METRICA_LABEL,
  metricValue,
  shortName,
  upIsGood,
} from "./adminInicio";

const METRICAS: AdminMetrica[] = [
  "leads",
  "en_contacto",
  "captadas",
  "descartadas",
  "cerrados",
];

function DiffChip({
  diff,
  prevMes,
  good,
  withVs = true,
  equalSize = false,
}: {
  diff: number;
  prevMes: number;
  good: boolean | null;
  withVs?: boolean;
  equalSize?: boolean;
}) {
  const tone = chipTone(diff, good);
  return (
    <span
      className={`inline-flex h-[22px] shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2 text-[11px] font-bold tabular-nums ${
        equalSize ? "min-w-[6.25rem]" : ""
      } ${chipClass(tone)}`}
    >
      {chipText(diff, prevMes, withVs)}
    </span>
  );
}

function Avatar({
  iniciales,
  colorIndex,
  size = 34,
}: {
  iniciales: string;
  colorIndex: number;
  size?: number;
}) {
  const c = colorAsesor(colorIndex);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full text-[12.5px] font-extrabold"
      style={{
        width: size,
        height: size,
        background: c.bg,
        color: c.ink,
      }}
    >
      {iniciales}
    </span>
  );
}

function ShareBar({
  values,
}: {
  values: { value: number; color: string }[];
}) {
  const total = values.reduce((s, v) => s + v.value, 0);
  return (
    <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-[3px] bg-[#EEF0F3]">
      {values.map((v, i) =>
        v.value > 0 ? (
          <span
            key={i}
            className="h-full min-w-[4px] rounded-[3px]"
            style={{
              width: total ? `${(v.value / total) * 100}%` : 0,
              background: v.color,
            }}
          />
        ) : null,
      )}
    </div>
  );
}

function scraperLabel(estado: AdminAsesorDashboard["scraper"]["estado"]) {
  if (estado === "ok") return { text: "Activo", dot: "#1E8E5A", fg: "#16774A", halo: false };
  if (estado === "warn") return { text: "Activo con alertas", dot: "#D97B2B", fg: "#8A4E12", halo: false };
  return { text: "Con error", dot: "#C23B2B", fg: "#A3271A", halo: true };
}

function AdminSkeleton() {
  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-7 w-56 animate-pulse rounded-lg bg-[#EEF0F3]" />
          <div className="h-4 w-80 animate-pulse rounded bg-[#EEF0F3]" />
        </div>
        <div className="h-9 w-36 animate-pulse rounded-lg bg-[#EEF0F3]" />
      </div>
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-[#EEF0F3]" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-[#EEF0F3]" />
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="h-56 animate-pulse rounded-2xl bg-[#EEF0F3]" />
        <div className="h-56 animate-pulse rounded-2xl bg-[#EEF0F3]" />
      </div>
      <div className="h-52 animate-pulse rounded-2xl bg-[#EEF0F3]" />
    </div>
  );
}

export function AdminInicioDashboard() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const anioParam = searchParams.get("anio");
  const mesParam = searchParams.get("mes");
  const metricaParam = searchParams.get("metrica");
  const anioQuery = anioParam ? Number(anioParam) : undefined;
  const mesQuery = mesParam ? Number(mesParam) : undefined;
  const metrica: AdminMetrica = METRICAS.includes(metricaParam as AdminMetrica)
    ? (metricaParam as AdminMetrica)
    : "leads";

  const [monthOpen, setMonthOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!monthOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!monthPickerRef.current?.contains(e.target as Node)) setMonthOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [monthOpen]);

  const today = useMemo(() => {
    const parts = dayKeyBogota().split("-").map(Number);
    return { anio: parts[0], mes: parts[1] };
  }, []);
  const effectiveAnio = anioQuery ?? today.anio;
  const effectiveMes = mesQuery ?? today.mes;

  const setParams = useCallback(
    (next: Partial<{ anio: number; mes: number; metrica: AdminMetrica }>) => {
      const p = new URLSearchParams(searchParams.toString());
      p.delete("periodo");
      p.set("anio", String(next.anio ?? anioQuery ?? today.anio));
      p.set("mes", String(next.mes ?? mesQuery ?? today.mes));
      p.set("metrica", next.metrica ?? metrica);
      router.replace(`/?${p.toString()}`, { scroll: false });
    },
    [anioQuery, mesQuery, metrica, router, searchParams, today.anio, today.mes],
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-dashboard", effectiveAnio, effectiveMes, token],
    queryFn: () =>
      adminDashboardService.getAdminDashboard(
        {
          anio: effectiveAnio,
          mes: effectiveMes,
        },
        token ?? undefined,
      ),
  });

  useEffect(() => {
    if (!data?.periodo) return;
    if (anioParam && mesParam) return;
    setParams({ anio: data.periodo.anio, mes: data.periodo.mes });
  }, [data, anioParam, mesParam, setParams]);

  const monthOptions = useMemo(() => {
    const opts: { anio: number; mes: number; label: string }[] = [];
    const y = today.anio;
    for (let m = today.mes; m >= 1; m--) {
      opts.push({ anio: y, mes: m, label: `${MESES_LARGO[m - 1]} ${y}` });
    }
    for (let m = 12; m >= 1; m--) {
      opts.push({ anio: y - 1, mes: m, label: `${MESES_LARGO[m - 1]} ${y - 1}` });
    }
    return opts;
  }, [today]);

  if (isLoading) return <AdminSkeleton />;
  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-[var(--pa-border)] bg-white p-6">
        <p className="text-sm text-[var(--pa-danger)]">No se pudo cargar el panel del equipo.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 text-sm font-bold text-[var(--pa-navy)]"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const prevMes = Number(data.periodo.comparadoCon.desde.slice(5, 7));
  const prevLabel = monthLabel(prevMes);
  const subtitle = data.periodo.enCurso
    ? `${monthLabel(data.periodo.mes)} ${data.periodo.anio}, del 1 al ${Number(data.periodo.hasta.slice(8))} · comparado con el mismo periodo de ${prevLabel}`
    : `${monthLabel(data.periodo.mes)} ${data.periodo.anio} · comparado con ${prevLabel}`;

  return (
    <div className="flex flex-col gap-[18px] pb-6" style={{ paddingBottom: 56 }}>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#16212B]">Gestión del equipo</h1>
          <p className="mt-1 text-[13px] text-[#5B6B79]">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center">
            {data.asesores.map((a, i) => (
              <span
                key={a.id}
                className="-ml-2 first:ml-0"
                style={{ zIndex: data.asesores.length - i }}
              >
                <Avatar iniciales={a.iniciales} colorIndex={i} />
              </span>
            ))}
            <span className="ml-2 text-[12.5px] font-bold text-[#5B6B79]">
              {data.asesores.length} {data.asesores.length === 1 ? "asesor" : "asesores"}
            </span>
          </div>
          <div className="relative" ref={monthPickerRef}>
            <button
              type="button"
              onClick={() => setMonthOpen((o) => !o)}
              className="flex items-center gap-2 rounded-[9px] border border-[#E4E8EC] bg-white px-3 py-2 text-[12.5px] font-bold text-[var(--pa-ink)]"
            >
              {monthLabel(data.periodo.mes)} {data.periodo.anio}
              <span className="text-[#9AA6B2]">▾</span>
            </button>
            {monthOpen ? (
              <ul className="absolute right-0 z-20 mt-1 max-h-64 w-48 overflow-auto rounded-lg border border-[#E4E8EC] bg-white py-1 shadow-lg">
                {monthOptions.map((o) => (
                  <li key={`${o.anio}-${o.mes}`}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-[12.5px] hover:bg-[#EEF0F3]"
                      onClick={() => {
                        setParams({ anio: o.anio, mes: o.mes });
                        setMonthOpen(false);
                      }}
                    >
                      {o.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </header>

      {data.asesores.length === 0 ? (
        <p className="rounded-2xl border border-[#E4E8EC] bg-white p-8 text-[13px] text-[#5B6B79]">
          Aún no tienes asesores asignados.
        </p>
      ) : (
        <>
          <ScraperAlert data={data} />
          <KpiRow data={data} prevMes={prevMes} />
          <CaptacionTable data={data} prevMes={prevMes} todayIso={data.periodo.hasta} />
          <div className="grid gap-[18px] lg:grid-cols-[1.35fr_1fr]">
            <FallosMatrix data={data} prevMes={prevMes} />
            <Comparativo
              data={data}
              prevMes={prevMes}
              metrica={metrica}
              onMetrica={(m) => setParams({ metrica: m })}
            />
          </div>
          <ClientesFunnel data={data} prevMes={prevMes} />
        </>
      )}
    </div>
  );
}

function ScraperAlert({ data }: { data: AdminDashboard }) {
  const errors = data.asesores.filter((a) => a.scraper.estado === "error");
  if (!errors.length) return null;
  const warns = data.asesores.filter((a) => a.scraper.estado === "warn");
  const title =
    errors.length === 1
      ? `El scraper de ${errors[0].nombre} falló en ${
          consecutiveFails(errors[0]) > 1
            ? `las ${consecutiveFails(errors[0])} últimas corridas`
            : "la última corrida"
        }`
      : `${errors.length} scrapers con error: ${errors.map((a) => a.nombre).join(", ")}`;
  const detailParts = [errors[0].scraper.ultimoError].filter(Boolean);
  for (const w of warns) {
    const n = w.scraper.corridas.filter((c) => c.estado === "error").length;
    if (n) detailParts.push(`${w.nombre} tuvo ${n} corridas fallidas este mes, ya recuperadas.`);
  }
  return (
    <div className="flex items-start gap-3.5 rounded-[14px] border border-[#F2B8AF] bg-[#FBE7E4] px-[18px] py-[13px]">
      <span
        className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-[#C23B2B] text-white"
        aria-hidden
      >
        !
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-extrabold text-[#5E1409]">{title}</p>
        {detailParts.length ? (
          <p className="mt-0.5 text-[12px] text-[#7A2418]">{detailParts.join(" ")}</p>
        ) : null}
      </div>
      <a
        href="#scraper"
        className="shrink-0 rounded-[9px] border border-[#F2B8AF] bg-white px-3 py-2 text-[12.5px] font-extrabold text-[#7A2418]"
      >
        Ver scrapers
      </a>
    </div>
  );
}

function consecutiveFails(a: AdminAsesorDashboard): number {
  let n = 0;
  for (let i = a.scraper.corridas.length - 1; i >= 0; i--) {
    if (a.scraper.corridas[i].estado !== "ok") n += 1;
    else break;
  }
  return n;
}

function KpiRow({ data, prevMes }: { data: AdminDashboard; prevMes: number }) {
  const leads = data.asesores.reduce((s, a) => s + a.leads.recibidos, 0);
  const leadsAnt = data.asesores.reduce((s, a) => s + a.leadsAnt.recibidos, 0);
  const captadas = data.asesores.reduce((s, a) => s + a.leads.captadas, 0);
  const descartadas = data.asesores.reduce((s, a) => s + a.leads.descartadas, 0);
  const fallos = data.asesores.reduce(
    (s, a) => s + data.canales.reduce((x, ch) => x + a.publicacion[ch].fallos, 0),
    0,
  );
  const intentos = data.asesores.reduce(
    (s, a) => s + data.canales.reduce((x, ch) => x + a.publicacion[ch].intentos, 0),
    0,
  );
  const fallosAnt = data.asesores.reduce(
    (s, a) => s + data.canales.reduce((x, ch) => x + (a.publicacionFallosAnt[ch] ?? 0), 0),
    0,
  );
  const cerrados = data.asesores.reduce((s, a) => s + a.clientes.cerrados, 0);
  const cerradosAnt = data.asesores.reduce((s, a) => s + a.clientes.cerradosAnt, 0);
  const activos = data.asesores.reduce(
    (s, a) => s + a.clientes.calificando + a.clientes.visitas + a.clientes.negociando,
    0,
  );
  const corridasOk = data.asesores.reduce(
    (s, a) => s + a.scraper.corridas.filter((c) => c.estado === "ok").length,
    0,
  );
  const corridasTot = data.asesores.reduce((s, a) => s + a.scraper.corridas.length, 0);
  const conv = conversionPct(captadas, leads);

  const cards = [
    {
      label: "Leads recibidos por scraper",
      value: leads,
      diff: leads - leadsAnt,
      good: true as boolean | null,
      sub: `${corridasOk} de ${corridasTot} corridas OK · ${monthAbbr(prevMes)}: ${formatInteger(leadsAnt)}`,
      shares: data.asesores.map((a, i) => ({ value: a.leads.recibidos, color: colorAsesor(i).bg })),
    },
    {
      label: "Propiedades captadas",
      value: captadas,
      diff: captadas - data.asesores.reduce((s, a) => s + a.leadsAnt.captadas, 0),
      good: true as boolean | null,
      sub: `Conversión ${conv == null ? "—" : formatPct(conv)} · ${formatInteger(descartadas)} descartadas`,
      shares: data.asesores.map((a, i) => ({ value: a.leads.captadas, color: colorAsesor(i).bg })),
    },
    {
      label: "Fallos de publicación",
      value: fallos,
      diff: fallos - fallosAnt,
      good: false as boolean | null,
      sub: `${intentos ? formatPct((fallos / intentos) * 100) : "0,0%"} de ${formatInteger(intentos)} intentos · ${monthAbbr(prevMes)}: ${formatInteger(fallosAnt)}`,
      shares: data.asesores.map((a, i) => ({
        value: data.canales.reduce((x, ch) => x + a.publicacion[ch].fallos, 0),
        color: colorAsesor(i).bg,
      })),
    },
    {
      label: "Clientes cerrados",
      value: cerrados,
      diff: cerrados - cerradosAnt,
      good: true as boolean | null,
      sub: `${formatInteger(activos)} clientes activos en el embudo`,
      shares: data.asesores.map((a, i) => ({ value: a.clientes.cerrados, color: colorAsesor(i).bg })),
    },
  ];

  return (
    <div className="grid grid-cols-1 items-stretch gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <article
          key={c.label}
          className="flex h-full min-h-[168px] flex-col gap-2 rounded-2xl border border-[#E4E8EC] bg-white px-5 py-[18px]"
        >
          <span className="min-h-[36px] text-[12.5px] font-bold leading-snug text-[#5B6B79]">
            {c.label}
          </span>
          <div className="flex items-end justify-between gap-2">
            <p className="text-[32px] font-extrabold tabular-nums leading-none tracking-[-0.02em] text-[#16212B]">
              {formatInteger(c.value)}
            </p>
            <DiffChip diff={c.diff} prevMes={prevMes} good={c.good} equalSize />
          </div>
          <ShareBar values={c.shares} />
          <p className="mt-auto text-[11.5px] font-semibold leading-snug text-[#5B6B79]">{c.sub}</p>
        </article>
      ))}
    </div>
  );
}

function CaptacionTable({
  data,
  prevMes,
  todayIso,
}: {
  data: AdminDashboard;
  prevMes: number;
  todayIso: string;
}) {
  const maxLeads = Math.max(
    1,
    ...data.asesores.flatMap((a) => a.scraper.corridas.filter((c) => c.estado === "ok").map((c) => c.leads)),
  );
  const totOk = data.asesores.reduce((s, a) => s + a.scraper.corridas.filter((c) => c.estado === "ok").length, 0);
  const totAll = data.asesores.reduce((s, a) => s + a.scraper.corridas.length, 0);
  const totLeadsOk = data.asesores.reduce(
    (s, a) => s + a.scraper.corridas.filter((c) => c.estado === "ok").reduce((x, c) => x + c.leads, 0),
    0,
  );
  const avg = totOk ? totLeadsOk / totOk : 0;
  const sum = (key: "recibidos" | "enContacto" | "captadas" | "descartadas") =>
    data.asesores.reduce((s, a) => s + a.leads[key], 0);
  const sumAnt = (key: "recibidos" | "enContacto" | "captadas" | "descartadas") =>
    data.asesores.reduce((s, a) => s + a.leadsAnt[key], 0);

  return (
    <section id="scraper" className="rounded-2xl border border-[#E4E8EC] bg-white px-[22px] pb-2 pt-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-extrabold text-[#16212B]">Captación por asesor · scraper</h2>
          <p className="mt-1 text-[12px] text-[#5B6B79]">
            Leads recibidos por corrida en lo que va del mes (corrida automática diaria, 7:00 a. m.).
            Debajo de cada cifra, la diferencia vs. {monthAbbr(prevMes)}.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-[#5B6B79]">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#5F86A6]" /> Corrida OK
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border-b-[3px] border-[#C23B2B] bg-[#FBE7E4]" /> Corrida
            fallida
          </span>
        </div>
      </div>
      <div>
        <div
          className="grid items-center gap-3 border-b border-[#EEF0F3] py-2 text-left text-[11px] font-bold uppercase tracking-[.04em] text-[#5B6B79]"
          style={{
            gridTemplateColumns:
              "minmax(132px,1.15fr) minmax(120px,1fr) minmax(0,1.35fr) repeat(4, minmax(0,0.7fr))",
          }}
        >
          <span>Asesor</span>
          <span>Scraper</span>
          <span>Leads por corrida</span>
          <span>Recibidos</span>
          <span>En contacto</span>
          <span>Captadas</span>
          <span>Descartadas</span>
        </div>
        {data.asesores.map((a, i) => {
          const conv = conversionPct(a.leads.captadas, a.leads.recibidos);
          const st = scraperLabel(a.scraper.estado);
          const okN = a.scraper.corridas.filter((c) => c.estado === "ok").length;
          const failN = a.scraper.corridas.length - okN;
          const avgA = okN
            ? a.scraper.corridas.filter((c) => c.estado === "ok").reduce((s, c) => s + c.leads, 0) / okN
            : 0;
          const first = a.scraper.corridas[0]?.inicio;
          const last = a.scraper.corridas.at(-1)?.inicio;
          return (
            <Link
              key={a.id}
              href={`/captacion?agente_id=${a.id}`}
              className="grid items-center gap-3 border-b border-[#EEF0F3] py-4 hover:bg-[#FAFBFC]"
              style={{
                gridTemplateColumns:
                  "minmax(132px,1.15fr) minmax(120px,1fr) minmax(0,1.35fr) repeat(4, minmax(0,0.7fr))",
              }}
            >
              <span className="flex items-center gap-2.5">
                <Avatar iniciales={a.iniciales} colorIndex={i} />
                <span>
                  <span className="block text-[13.5px] font-extrabold text-[#16212B]">{a.nombre}</span>
                  <span className="text-[11.5px] font-semibold text-[#5B6B79]">
                    Conversión {conv == null ? "—" : formatPct(conv)}
                  </span>
                </span>
              </span>
              <span>
                {a.scraper.corridas.length === 0 ? (
                  <span className="text-[12.5px] text-[#5B6B79]">Sin corridas este mes</span>
                ) : (
                  <>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          background: st.dot,
                          boxShadow: st.halo ? "0 0 0 4px #FBE7E4" : undefined,
                        }}
                      />
                      <span className="text-[12.5px] font-extrabold" style={{ color: st.fg }}>
                        {st.text}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[11.5px] font-semibold text-[#5B6B79]">
                      {okN} de {a.scraper.corridas.length} corridas OK
                      {failN ? ` · ${failN} fallidas` : ""}
                    </span>
                    <span className="block text-[11.5px] font-semibold text-[#5B6B79]">
                      {a.scraper.estado === "error"
                        ? `Última OK: ${formatShortDate(a.scraper.ultimaCorridaOk)}`
                        : `Última: ${formatWhen(a.scraper.ultimaCorrida, todayIso)}`}
                    </span>
                  </>
                )}
              </span>
              <span>
                {a.scraper.corridas.length ? (
                  <>
                    <span className="flex h-[46px] items-end gap-[3px]">
                      {a.scraper.corridas.map((c, idx) => {
                        const fail = c.estado !== "ok";
                        const h = fail ? 100 : Math.max(6, (c.leads / maxLeads) * 100);
                        const lastBar = idx === a.scraper.corridas.length - 1;
                        return (
                          <span
                            key={`${c.inicio}-${idx}`}
                            title={
                              fail
                                ? `${formatShortDate(c.inicio)} · corrida fallida`
                                : `${formatShortDate(c.inicio)} · ${c.leads} leads`
                            }
                            className="min-w-[6px] flex-1 rounded-t-[3px]"
                            style={{
                              height: `${h}%`,
                              background: fail ? "#FBE7E4" : lastBar ? "#0A3D62" : "#5F86A6",
                              borderBottom: fail ? "3px solid #C23B2B" : undefined,
                            }}
                          />
                        );
                      })}
                    </span>
                    <span className="mt-1 flex justify-between text-[11px] font-semibold text-[#5B6B79]">
                      <span>{formatShortDate(first)}</span>
                      <span>Prom. {formatDecimal(avgA)} leads por corrida</span>
                      <span>{formatShortDate(last ?? null)}</span>
                    </span>
                  </>
                ) : (
                  <span className="block h-[46px] rounded bg-[#FAFBFC]" />
                )}
              </span>
              <NumDiff actual={a.leads.recibidos} prev={a.leadsAnt.recibidos} prevMes={prevMes} good />
              <NumDiff actual={a.leads.enContacto} prev={a.leadsAnt.enContacto} prevMes={prevMes} good />
              <NumDiff actual={a.leads.captadas} prev={a.leadsAnt.captadas} prevMes={prevMes} good />
              <NumDiff actual={a.leads.descartadas} prev={a.leadsAnt.descartadas} prevMes={prevMes} good={null} />
            </Link>
          );
        })}
        <div
          className="grid items-center gap-3 py-4"
          style={{
            gridTemplateColumns:
              "minmax(132px,1.15fr) minmax(120px,1fr) minmax(0,1.35fr) repeat(4, minmax(0,0.7fr))",
          }}
        >
          <span className="text-[13.5px] font-extrabold">Total equipo</span>
          <span className="text-[12.5px] font-semibold text-[#5B6B79]">
            {totOk} de {totAll} corridas OK
          </span>
          <span className="text-[12.5px] font-semibold text-[#5B6B79]">
            Prom. {formatDecimal(avg)} leads por corrida
          </span>
          <NumDiff actual={sum("recibidos")} prev={sumAnt("recibidos")} prevMes={prevMes} good />
          <NumDiff actual={sum("enContacto")} prev={sumAnt("enContacto")} prevMes={prevMes} good />
          <NumDiff actual={sum("captadas")} prev={sumAnt("captadas")} prevMes={prevMes} good />
          <NumDiff actual={sum("descartadas")} prev={sumAnt("descartadas")} prevMes={prevMes} good={null} />
        </div>
      </div>
    </section>
  );
}

function NumDiff({
  actual,
  prev,
  prevMes,
  good,
}: {
  actual: number;
  prev: number;
  prevMes: number;
  good: boolean | null;
}) {
  return (
    <span className="text-left">
      <span className="block text-[20px] font-extrabold tabular-nums text-[#16212B]">
        {formatInteger(actual)}
      </span>
      <span className="mt-0.5 inline-block">
        <DiffChip diff={actual - prev} prevMes={prevMes} good={good} withVs={false} />
      </span>
    </span>
  );
}

function FallosMatrix({ data, prevMes }: { data: AdminDashboard; prevMes: number }) {
  const canales = data.canales;
  const teamFallos = (ch: AdminPubCanal) => data.asesores.reduce((s, a) => s + a.publicacion[ch].fallos, 0);
  const teamInt = (ch: AdminPubCanal) => data.asesores.reduce((s, a) => s + a.publicacion[ch].intentos, 0);
  const teamAnt = (ch: AdminPubCanal) =>
    data.asesores.reduce((s, a) => s + (a.publicacionFallosAnt[ch] ?? 0), 0);
  const totF = canales.reduce((s, ch) => s + teamFallos(ch), 0);
  const totI = canales.reduce((s, ch) => s + teamInt(ch), 0);
  const totAnt = canales.reduce((s, ch) => s + teamAnt(ch), 0);
  const cols = `140px repeat(${canales.length}, minmax(0,1fr)) 64px`;

  return (
    <section className="rounded-2xl border border-[#E4E8EC] bg-white p-[22px]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-extrabold">Fallos de publicación por canal</h2>
          <p className="mt-1 text-[12px] text-[#5B6B79]">
            Publicaciones que terminaron en error, sobre los intentos del mes.
          </p>
        </div>
        <span className="rounded-full bg-[#FBE7E4] px-2 py-0.5 text-[11px] font-bold text-[#A3271A]">
          {totI ? formatPct((totF / totI) * 100) : "0,0%"} de fallo
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[520px] items-center gap-2" style={{ gridTemplateColumns: cols }}>
          <span />
          {canales.map((ch) => (
            <span key={ch} className="text-center text-[11px] font-bold text-[#5B6B79]">
              {CANAL_LABEL[ch]}
            </span>
          ))}
          <span className="text-center text-[11px] font-bold text-[#5B6B79]">Total</span>
        </div>
        {data.asesores.map((a) => {
          const totalF = canales.reduce((s, ch) => s + a.publicacion[ch].fallos, 0);
          return (
            <div
              key={a.id}
              className="mt-2 grid min-w-[520px] items-center gap-2"
              style={{ gridTemplateColumns: cols }}
            >
              <span className="truncate text-[12.5px] font-bold">{a.nombre}</span>
              {canales.map((ch) => {
                const cell = a.publicacion[ch];
                const st = failCellStyle(cell.fallos, cell.intentos);
                return (
                  <Link
                    key={ch}
                    href={`/publications?filtro=error`}
                    className="rounded-lg px-1 py-[7px] text-center"
                    style={{ background: st.bg, color: st.fg }}
                  >
                    {st.empty ? (
                      <span className="text-[15px] font-extrabold">—</span>
                    ) : (
                      <>
                        <span className="block text-[15px] font-extrabold">{cell.fallos}</span>
                        <span className="text-[10.5px] font-semibold opacity-80">de {cell.intentos}</span>
                      </>
                    )}
                  </Link>
                );
              })}
              <span className="text-center text-[15px] font-extrabold">{totalF}</span>
            </div>
          );
        })}
        <div
          className="mt-3 grid min-w-[520px] items-center gap-2 border-t border-[#EEF0F3] pt-3"
          style={{ gridTemplateColumns: cols }}
        >
          <span className="text-[12.5px] font-extrabold">Equipo · vs. {monthAbbr(prevMes)}</span>
          {canales.map((ch) => (
            <span key={ch} className="text-center">
              <span className="block text-[14px] font-extrabold">{teamFallos(ch)}</span>
              <DiffChip
                diff={teamFallos(ch) - teamAnt(ch)}
                prevMes={prevMes}
                good={false}
                withVs={false}
              />
            </span>
          ))}
          <span className="text-center">
            <span className="block text-[14px] font-extrabold">{totF}</span>
            <DiffChip diff={totF - totAnt} prevMes={prevMes} good={false} withVs={false} />
          </span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-[11px] font-semibold text-[#5B6B79]">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[#F1F3F5]" /> Sin fallos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[#F7D9B9]" /> 1–2 fallos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[#C23B2B]" /> 3 o más
        </span>
      </div>
    </section>
  );
}

function Comparativo({
  data,
  prevMes,
  metrica,
  onMetrica,
}: {
  data: AdminDashboard;
  prevMes: number;
  metrica: AdminMetrica;
  onMetrica: (m: AdminMetrica) => void;
}) {
  const rows = data.asesores.map((a) => ({
    id: a.id,
    nombre: shortName(a.nombre),
    actual: metricValue(a, metrica, false),
    anterior: metricValue(a, metrica, true),
  }));
  const teamA = rows.reduce((s, r) => s + r.actual, 0);
  const teamB = rows.reduce((s, r) => s + r.anterior, 0);
  const maxAsesor = Math.max(1, ...rows.flatMap((r) => [r.actual, r.anterior])) * 1.08;
  const maxTeam = Math.max(1, teamA, teamB) * 1.08;
  const good = upIsGood(metrica);
  const noPrev = rows.every((r) => r.anterior === 0) && teamB === 0 && teamA === 0;

  return (
    <section className="rounded-2xl border border-[#E4E8EC] bg-white p-[22px]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold">
          {monthLabel(data.periodo.mes)} vs. {monthLabel(prevMes)}
        </h2>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-[#5B6B79]">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#0A3D62]" /> {monthAbbr(data.periodo.mes)}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#C9D7E3]" /> {monthAbbr(prevMes)}
          </span>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {METRICAS.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={metrica === m}
            onClick={() => onMetrica(m)}
            className={`rounded-full px-3 py-1.5 text-[12px] ${
              metrica === m
                ? "border border-[#0A3D62] bg-[#0A3D62] font-bold text-white"
                : "border border-[#D7DCE1] bg-white font-semibold text-[#45525E]"
            }`}
          >
            {METRICA_LABEL[m]}
          </button>
        ))}
      </div>
      {noPrev ? (
        <p className="text-[12.5px] text-[#5B6B79]">
          Aún no hay datos de {monthLabel(prevMes)} para comparar.
        </p>
      ) : (
        <div className="flex flex-col gap-[18px]">
          {rows.map((r) => (
            <CompareRow
              key={r.id}
              name={r.nombre}
              actual={r.actual}
              anterior={r.anterior}
              scale={maxAsesor}
              prevMes={prevMes}
              good={good}
            />
          ))}
          <CompareRow
            name="Equipo"
            actual={teamA}
            anterior={teamB}
            scale={maxTeam}
            prevMes={prevMes}
            good={good}
            team
          />
        </div>
      )}
    </section>
  );
}

function CompareRow({
  name,
  actual,
  anterior,
  scale,
  prevMes,
  good,
  team,
}: {
  name: string;
  actual: number;
  anterior: number;
  scale: number;
  prevMes: number;
  good: boolean | null;
  team?: boolean;
}) {
  const w = (n: number) => `${Math.max(4, (n / scale) * 100)}%`;
  return (
    <div className="grid items-center gap-3" style={{ gridTemplateColumns: "120px 1fr 72px" }}>
      <span className={`truncate text-[12.5px] ${team ? "font-extrabold" : "font-bold"}`}>{name}</span>
      <span className="flex flex-col gap-[5px]">
        <span className="flex items-center gap-2">
          <span
            className="h-3 rounded"
            style={{ width: w(actual), background: team ? "#16212B" : "#0A3D62" }}
          />
          <span className="text-[12px] font-extrabold">{actual}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 rounded bg-[#C9D7E3]" style={{ width: w(anterior) }} />
          <span className="text-[12px] font-semibold text-[#5B6B79]">{anterior}</span>
        </span>
      </span>
      <DiffChip diff={actual - anterior} prevMes={prevMes} good={good} />
    </div>
  );
}

function ClientesFunnel({ data, prevMes }: { data: AdminDashboard; prevMes: number }) {
  const stages = [
    { key: "calificando" as const, label: "Calificando", color: "#C9D7E3" },
    { key: "visitas" as const, label: "En visitas", color: "#7C9DB8" },
    { key: "negociando" as const, label: "Negociando", color: "#0A3D62" },
    { key: "cerrados" as const, label: "Cerrado", color: "#1E8E5A" },
  ];
  const total = (a: AdminAsesorDashboard) =>
    a.clientes.calificando + a.clientes.visitas + a.clientes.negociando + a.clientes.cerrados;
  const team = {
    calificando: data.asesores.reduce((s, a) => s + a.clientes.calificando, 0),
    visitas: data.asesores.reduce((s, a) => s + a.clientes.visitas, 0),
    negociando: data.asesores.reduce((s, a) => s + a.clientes.negociando, 0),
    cerrados: data.asesores.reduce((s, a) => s + a.clientes.cerrados, 0),
    cerradosAnt: data.asesores.reduce((s, a) => s + a.clientes.cerradosAnt, 0),
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E4E8EC] bg-white pt-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 px-[22px]">
        <div>
          <h2 className="text-[15px] font-extrabold">Clientes · embudo de venta por asesor</h2>
          <p className="mt-1 text-[12px] text-[#5B6B79]">
            Clientes activos en cada etapa del módulo Clientes. Cerrados cuenta los cierres del mes.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-[#5B6B79]">
          {stages.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto px-[22px]">
        <div
          className="grid min-w-[860px] items-center gap-4 border-b border-[#EEF0F3] py-2 text-[11px] font-bold uppercase tracking-[.04em] text-[#5B6B79]"
          style={{ gridTemplateColumns: "200px minmax(0,1fr) 86px 86px 86px 86px 120px" }}
        >
          <span>Asesor</span>
          <span>Distribución</span>
          <span className="text-right">Calificando</span>
          <span className="text-right">En visitas</span>
          <span className="text-right">Negociando</span>
          <span className="text-right">Cerrado</span>
          <span className="text-right">Cierres vs. {monthAbbr(prevMes)}</span>
        </div>
        {data.asesores.map((a, i) => (
          <FunnelRow
            key={a.id}
            name={a.nombre}
            iniciales={a.iniciales}
            colorIndex={i}
            counts={a.clientes}
            total={total(a)}
            prevMes={prevMes}
            stages={stages}
          />
        ))}
      </div>
      <div className="-mx-0 bg-[#FAFBFC] px-[22px]">
        <FunnelRow
          name="Total equipo"
          iniciales="Σ"
          colorIndex={-1}
          counts={team}
          total={team.calificando + team.visitas + team.negociando + team.cerrados}
          prevMes={prevMes}
          stages={stages}
        />
      </div>
    </section>
  );
}

function FunnelRow({
  name,
  iniciales,
  colorIndex,
  counts,
  total,
  prevMes,
  stages,
}: {
  name: string;
  iniciales: string;
  colorIndex: number;
  counts: {
    calificando: number;
    visitas: number;
    negociando: number;
    cerrados: number;
    cerradosAnt: number;
  };
  total: number;
  prevMes: number;
  stages: { key: "calificando" | "visitas" | "negociando" | "cerrados"; color: string }[];
}) {
  const vals = [
    counts.calificando,
    counts.visitas,
    counts.negociando,
    counts.cerrados,
  ];
  const sum = vals.reduce((s, n) => s + n, 0);
  return (
    <div
      className="grid min-w-[860px] items-center gap-4 border-b border-[#EEF0F3] py-3.5 last:border-0"
      style={{ gridTemplateColumns: "200px minmax(0,1fr) 86px 86px 86px 86px 120px" }}
    >
      <span className="flex items-center gap-2.5">
        {colorIndex < 0 ? (
          <span className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#EEF0F3] text-[12.5px] font-extrabold text-[#45525E]">
            Σ
          </span>
        ) : (
          <Avatar iniciales={iniciales} colorIndex={colorIndex} />
        )}
        <span>
          <span className="block text-[13.5px] font-extrabold">{name}</span>
          <span className="text-[11.5px] font-semibold text-[#5B6B79]">{total} clientes</span>
        </span>
      </span>
      <span className="flex h-4 gap-[3px] overflow-hidden rounded-[5px] bg-[#EEF0F3]">
        {stages.map((s, i) =>
          vals[i] > 0 ? (
            <span
              key={s.key}
              className="h-full min-w-[6px] rounded-[5px]"
              style={{
                width: sum ? `${(vals[i] / sum) * 100}%` : 0,
                background: s.color,
              }}
            />
          ) : null,
        )}
      </span>
      {vals.map((n, i) => (
        <span key={i} className="text-right text-[20px] font-extrabold">
          {n}
        </span>
      ))}
      <span className="text-right">
        <DiffChip diff={counts.cerrados - counts.cerradosAnt} prevMes={prevMes} good />
      </span>
    </div>
  );
}
