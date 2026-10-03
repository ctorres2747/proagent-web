"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { displayName } from "@/lib/agentDisplay";
import { dashboardService } from "@/services";
import type { DesempenoDashboard, DesempenoPeriodoTipo } from "@/services/interfaces/dashboard";
import {
  buildAdvanceSummary,
  colorForPct,
  formatConversion,
  formatInteger,
  globalAdvancePct,
  kpiPct,
  monthAbbr,
  monthLabel,
  MESES_LARGO,
  pctForRing,
} from "./kpiMath";

const RING_LARGE = 188.5;
const RING_SMALL = 106.8;

function ProgressRing({
  pct,
  size,
  stroke,
  r,
  label,
}: {
  pct: number | null;
  size: number;
  stroke: number;
  r: number;
  label?: string;
}) {
  const draw = pctForRing(pct);
  const circ = 2 * Math.PI * r;
  const dash = (draw / 100) * circ;
  const color = colorForPct(pct);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#EEF0F3"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <span
        className={`font-extrabold text-[var(--pa-ink)] ${size >= 70 ? "text-[17px] -mt-[52px] mb-6" : "text-[10.5px] -mt-[34px] mb-4"}`}
      >
        {pct == null ? "—" : `${pct}%`}
      </span>
      {label ? (
        <span className="text-[10.5px] font-semibold text-[var(--pa-muted)]">{label}</span>
      ) : null}
    </div>
  );
}

type MetricKey = "captadas" | "publicadas" | "leads" | "conversion";

const KPI_DEFS: { key: MetricKey; label: string; sub: string; ring: string }[] = [
  { key: "captadas", label: "Propiedades captadas", sub: "Registradas en Inventario", ring: "Captadas" },
  { key: "publicadas", label: "Propiedades publicadas", sub: "Enviadas a portales", ring: "Publicadas" },
  { key: "leads", label: "Leads recibidos", sub: "Entraron por Captación", ring: "Leads" },
  { key: "conversion", label: "Tasa de conversión", sub: "", ring: "Conversión" },
];

function KpiChip({
  periodo,
  kpiKey,
  kpi,
  compareMes,
}: {
  periodo: DesempenoPeriodoTipo;
  kpiKey: MetricKey;
  kpi: DesempenoDashboard["kpis"][MetricKey];
  compareMes: number | null;
}) {
  if (periodo === "mes") {
    if (kpi.anterior == null) return null;
    const diff =
      kpiKey === "conversion"
        ? Number(kpi.actual) - Number(kpi.anterior)
        : Number(kpi.actual) - Number(kpi.anterior);
    const up = diff >= 0;
    const mesRef = compareMes ? monthAbbr(compareMes) : "ant.";
    const text =
      kpiKey === "conversion"
        ? `${up ? "▲" : "▼"} ${formatConversion(Math.abs(diff))} pts vs. ${mesRef}`
        : `${up ? "▲" : "▼"} ${formatInteger(Math.abs(diff))} vs. ${mesRef}`;
    return (
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
          up ? "bg-[#E6F5EE] text-[#1E8E5A]" : "bg-[#FBE7E4] text-[#C23B2B]"
        }`}
      >
        {text}
      </span>
    );
  }
  if (kpi.meta == null) return null;
  const gap = Number(kpi.meta) - Number(kpi.actual);
  if (gap <= 0) {
    return (
      <span className="rounded-full bg-[#E6F5EE] px-2 py-0.5 text-[11px] font-bold text-[#1E8E5A]">
        Al día
      </span>
    );
  }
  const unit =
    kpiKey === "conversion"
      ? `${formatConversion(gap)} pts`
      : formatInteger(gap);
  return (
    <span className="rounded-full bg-[#FCEEE0] px-2 py-0.5 text-[11px] font-bold text-[#8A4E12]">
      Faltan {unit}
    </span>
  );
}

export function InicioDashboard() {
  const { session, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const periodo = (searchParams.get("periodo") === "anio" ? "anio" : "mes") as DesempenoPeriodoTipo;
  const anioParam = searchParams.get("anio");
  const mesParam = searchParams.get("mes");
  const anioQuery = anioParam ? Number(anioParam) : undefined;
  const mesQuery = mesParam ? Number(mesParam) : undefined;
  const [monthOpen, setMonthOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!monthOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!monthPickerRef.current?.contains(e.target as Node)) {
        setMonthOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [monthOpen]);

  const today = useMemo(() => {
    const n = new Date();
    return { anio: n.getFullYear(), mes: n.getMonth() + 1 };
  }, []);

  // Sin anio/mes en la URL, el panel arranca en el mes/anio EN CURSO (no el
  // ultimo mes cerrado) -- pedido explicito, aunque el mes actual tenga
  // pocos datos todavia.
  const effectiveAnio = anioQuery ?? today.anio;
  const effectiveMes = mesQuery ?? today.mes;

  const setParams = useCallback(
    (next: Partial<{ periodo: DesempenoPeriodoTipo; anio: number; mes: number }>) => {
      const p = new URLSearchParams(searchParams.toString());
      const tipo = next.periodo ?? periodo;
      p.set("periodo", tipo);
      if (next.anio != null) p.set("anio", String(next.anio));
      else if (anioQuery != null) p.set("anio", String(anioQuery));
      if (tipo === "mes") {
        if (next.mes != null) p.set("mes", String(next.mes));
        else if (mesQuery != null) p.set("mes", String(mesQuery));
      } else p.delete("mes");
      router.replace(`/?${p.toString()}`);
    },
    [anioQuery, mesQuery, periodo, router, searchParams],
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      "dashboard-desempeno",
      periodo,
      effectiveAnio,
      periodo === "mes" ? effectiveMes : undefined,
      token,
    ],
    queryFn: () =>
      dashboardService.getDesempeno(
        {
          periodo,
          anio: effectiveAnio,
          mes: periodo === "mes" ? effectiveMes : undefined,
        },
        token ?? undefined,
      ),
  });

  useEffect(() => {
    if (!data?.periodo) return;
    const needsAnio = !anioParam;
    const needsMes = periodo === "mes" && !mesParam;
    if (!needsAnio && !needsMes) return;
    setParams({
      periodo: data.periodo.tipo,
      anio: data.periodo.anio,
      mes: data.periodo.mes,
    });
  }, [data, anioParam, mesParam, periodo, setParams]);

  const anio = data?.periodo.anio ?? effectiveAnio;
  const mes = data?.periodo.mes ?? effectiveMes;

  const monthOptions = useMemo(() => {
    const opts: { anio: number; mes: number; label: string }[] = [];
    const now = new Date();
    const y = now.getFullYear();
    const maxM = now.getMonth() + 1;
    for (let m = 1; m <= maxM; m++) {
      opts.push({ anio: y, mes: m, label: `${MESES_LARGO[m - 1]} ${y}` });
    }
    return opts.reverse();
  }, []);

  const subtitle = useMemo(() => {
    if (!data) return "";
    if (data.periodo.tipo === "mes") {
      const prev = data.periodo.comparadoCon;
      const prevLabel = prev ? `${monthLabel(prev.mes)}` : "mes anterior";
      return `Tu gestión de ${monthLabel(data.periodo.mes)} ${data.periodo.anio}, comparada con ${prevLabel}`;
    }
    return `Lo corrido de ${data.periodo.anio} · enero a ${monthLabel(data.periodo.mes)}`;
  }, [data]);

  const ringItems = useMemo(() => {
    if (!data) return [];
    return KPI_DEFS.map(({ key, ring }) => ({
      key,
      label: ring,
      pct: kpiPct(data.kpis[key]),
    }));
  }, [data]);

  const globalPct = useMemo(
    () => (data ? globalAdvancePct(ringItems.map((r) => r.pct)) : null),
    [data, ringItems],
  );

  const [chartMetric, setChartMetric] = useState<"leads" | "captadas" | "publicadas">("leads");

  if (isLoading) {
    return <InicioSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-[var(--pa-border)] bg-white p-6">
        <p className="text-sm text-[var(--pa-danger)]">No se pudo cargar tu panel de desempeño.</p>
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

  const summaryLabels = KPI_DEFS.map(({ key, label }) => ({
    key,
    label: label.replace("Propiedades ", "").replace("Tasa de ", ""),
    kpi: data.kpis[key],
  }));

  return (
    <div className="flex flex-col gap-[18px] px-[26px] py-[26px] pb-11 md:px-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#16212B]">
            Hola, {displayName(session)}
          </h1>
          <p className="mt-1 text-[13px] text-[#5B6B79]">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {periodo === "mes" ? (
            <div className="relative" ref={monthPickerRef}>
              <button
                type="button"
                onClick={() => setMonthOpen((o) => !o)}
                className="flex items-center gap-2 rounded-[9px] border border-[#E4E8EC] bg-white px-3 py-2 text-[12.5px] font-bold text-[var(--pa-ink)]"
              >
                {monthLabel(mes)} {anio}
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
          ) : null}
          <div className="flex rounded-[10px] bg-[#EEF0F3] p-[3px]">
            {(["mes", "anio"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setParams({ periodo: t })}
                className={`rounded-lg px-3 py-1.5 text-[12.5px] font-semibold ${
                  periodo === t
                    ? "bg-white font-bold text-[#0A3D62] shadow-[0_1px_3px_rgba(16,24,32,.12)]"
                    : "text-[#5B6B79]"
                }`}
              >
                {t === "mes" ? "Mes" : "Año corrido"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="flex flex-col gap-4 rounded-2xl border border-[#E4E8EC] bg-white px-[22px] py-[18px] lg:flex-row lg:items-center">
        <ProgressRing pct={globalPct} size={76} stroke={9} r={30} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-extrabold text-[var(--pa-ink)]">Avance hacia la meta</h2>
          <p className="mt-1 text-[12.5px] text-[#5B6B79]">
            {globalPct == null
              ? "Define metas en Ajustes para ver tu avance global."
              : buildAdvanceSummary(summaryLabels)}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-[22px] lg:justify-end">
          {ringItems.map((item) => (
            <ProgressRing
              key={item.key}
              pct={item.pct}
              size={44}
              stroke={5}
              r={17}
              label={item.label}
            />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
        {KPI_DEFS.map(({ key, label, sub }) => {
          const kpi = data.kpis[key];
          const pct = kpiPct(kpi);
          const metaLabel =
            periodo === "anio" ? "a la fecha" : "meta";
          const convSub =
            key === "conversion"
              ? `${data.kpis.conversion.captados} de ${data.kpis.conversion.recibidos} leads captados`
              : sub;
          return (
            <div
              key={key}
              className="flex flex-col gap-2.5 rounded-2xl border border-[#E4E8EC] bg-white px-5 py-[18px]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="truncate text-[12.5px] font-bold text-[#5B6B79]">{label}</span>
                <KpiChip
                  periodo={periodo}
                  kpiKey={key}
                  kpi={kpi}
                  compareMes={data.periodo.comparadoCon?.mes ?? null}
                />
              </div>
              <div className="flex flex-wrap items-baseline gap-1">
                <span className="text-[32px] font-extrabold tracking-tight text-[var(--pa-ink)]">
                  {key === "conversion"
                    ? `${formatConversion(Number(kpi.actual))}%`
                    : formatInteger(Number(kpi.actual))}
                </span>
                {kpi.meta != null ? (
                  <span className="text-[12.5px] font-semibold text-[#9AA6B2]">
                    de {key === "conversion" ? `${formatConversion(kpi.meta)}%` : formatInteger(kpi.meta)}{" "}
                    {metaLabel}
                  </span>
                ) : (
                  <span className="text-[12.5px] font-semibold text-[#9AA6B2]">Sin meta definida</span>
                )}
              </div>
              <div className="h-1.5 overflow-hidden rounded-[3px] bg-[#EEF0F3]">
                <div
                  className="h-full rounded-[3px] transition-all"
                  style={{
                    width: `${pctForRing(pct)}%`,
                    backgroundColor: colorForPct(pct),
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11.5px]">
                <span className="font-semibold text-[#9AA6B2]">{convSub}</span>
                {pct != null ? (
                  <span className="font-bold" style={{ color: colorForPct(pct) }}>
                    {pct}% de la meta
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-[14px] lg:grid-cols-[1.7fr_1fr]">
        <ComparativoBlock data={data} chartMetric={chartMetric} setChartMetric={setChartMetric} />
        <PendientesBlock pendientes={data.pendientes} />
      </div>
    </div>
  );
}

function ComparativoBlock({
  data,
  chartMetric,
  setChartMetric,
}: {
  data: DesempenoDashboard;
  chartMetric: "leads" | "captadas" | "publicadas";
  setChartMetric: (m: "leads" | "captadas" | "publicadas") => void;
}) {
  if (data.periodo.tipo === "mes") {
    const prev = data.periodo.comparadoCon;
    const title = prev
      ? `${monthLabel(data.periodo.mes)} vs. ${monthLabel(prev.mes)}`
      : "Comparativo mensual";
    const rows = KPI_DEFS.filter((k) => k.key !== "conversion").concat(
      KPI_DEFS.filter((k) => k.key === "conversion"),
    );
    return (
      <div className="rounded-2xl border border-[#E4E8EC] bg-white px-[22px] py-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[15px] font-extrabold">{title}</h3>
          <div className="flex items-center gap-3 text-[11px] text-[#5B6B79]">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#0A3D62]" /> Mes actual
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#C9D7E3]" /> Mes anterior
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-[18px]">
          {rows.map(({ key, label }) => {
            const kpi = data.kpis[key];
            const actual = Number(kpi.actual);
            const anterior = kpi.anterior != null ? Number(kpi.anterior) : 0;
            const max = Math.max(actual, anterior, 1) * 1.08;
            const wActual = Math.max(4, (actual / max) * 100);
            const wPrev = Math.max(4, (anterior / max) * 100);
            return (
              <div key={key} className="grid items-center gap-3 lg:grid-cols-[170px_1fr_92px]">
                <span className="text-[12.5px] font-bold text-[var(--pa-ink)]">{label}</span>
                <div className="flex flex-col gap-1">
                  <div className="flex h-3 items-center rounded bg-[#0A3D62]/10">
                    <div
                      className="flex h-3 min-w-[4px] items-center rounded bg-[#0A3D62] px-1 text-[10px] font-extrabold text-white"
                      style={{ width: `${wActual}%` }}
                    >
                      {key === "conversion" ? `${formatConversion(actual)}%` : formatInteger(actual)}
                    </div>
                  </div>
                  <div className="flex h-3 items-center rounded bg-[#C9D7E3]/30">
                    <div
                      className="flex h-3 min-w-[4px] items-center rounded bg-[#C9D7E3] px-1 text-[10px] font-semibold text-[#9AA6B2]"
                      style={{ width: `${wPrev}%` }}
                    >
                      {key === "conversion"
                        ? `${formatConversion(anterior)}%`
                        : formatInteger(anterior)}
                    </div>
                  </div>
                </div>
                <KpiChip
                  periodo="mes"
                  kpiKey={key}
                  kpi={kpi}
                  compareMes={data.periodo.comparadoCon?.mes ?? null}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const serie = data.serieMensual;
  if (!serie) {
    return (
      <div className="rounded-2xl border border-[#E4E8EC] bg-white px-[22px] py-5">
        <p className="text-[12.5px] text-[#5B6B79]">Aún no hay datos para el gráfico anual.</p>
      </div>
    );
  }
  const values = serie[chartMetric];
  const metaSeries =
    chartMetric === "leads"
      ? serie.metaLeads
      : chartMetric === "captadas"
        ? serie.metaCaptadas
        : serie.metaPublicadas;
  const metaForLabel =
    metaSeries.find((m) => m != null && m > 0) ??
    serie.metaMensual?.[chartMetric] ??
    0;
  const max = Math.max(...values, ...metaSeries.filter((m): m is number => m != null), metaForLabel, 1) * 1.18;
  const firstMetaIndex = metaSeries.findIndex((m) => m != null && m > 0);

  return (
    <div className="rounded-2xl border border-[#E4E8EC] bg-white px-[22px] py-5">
      <h3 className="text-[15px] font-extrabold">
        Mes a mes · enero a {monthLabel(data.periodo.mes)}
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {(["leads", "captadas", "publicadas"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setChartMetric(m)}
            className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
              chartMetric === m
                ? "border-[#0A3D62] bg-[#0A3D62] text-white"
                : "border-[#E4E8EC] text-[#45525E]"
            }`}
          >
            {m === "leads" ? "Leads" : m === "captadas" ? "Captadas" : "Publicadas"}
          </button>
        ))}
      </div>
      <div className="relative mt-6 flex h-[220px] items-end gap-3.5 overflow-x-auto pb-6">
        {values.map((v, i) => {
          const h = (v / max) * 82;
          const isLast = i === values.length - 1;
          const metaMonth = metaSeries[i];
          return (
            <div
              key={i}
              className="relative flex max-w-[44px] flex-1 flex-col items-center justify-end gap-1"
              style={{ height: "100%" }}
            >
              <span className="text-[11px] font-bold">{formatInteger(v)}</span>
              <div className="relative flex w-full flex-1 items-end">
                {metaMonth != null && metaMonth > 0 ? (
                  <div
                    className="pointer-events-none absolute left-0 right-0 z-10 border-t-[1.5px] border-dashed border-[#1E8E5A]"
                    style={{ bottom: `${(metaMonth / max) * 82}%` }}
                  >
                    {i === firstMetaIndex ? (
                      <span className="pointer-events-none absolute left-0 bottom-[3px] whitespace-nowrap text-[10.5px] font-bold text-[#1E8E5A]">
                        Meta mensual (por mes)
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <div
                  className={`w-full rounded-t-md ${isLast ? "bg-[#0A3D62]" : "bg-[#9DB4C7]"}`}
                  style={{ height: `${h}%`, minHeight: v > 0 ? 4 : 0 }}
                />
              </div>
              <span className="text-[11px] font-semibold text-[#9AA6B2]">{monthAbbr(i + 1)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PendientesBlock({
  pendientes,
}: {
  pendientes: DesempenoDashboard["pendientes"];
}) {
  const rows = [
    pendientes.leadsSinContactar.total > 0
      ? {
          color: "#C23B2B",
          title: `${pendientes.leadsSinContactar.total} leads sin contactar`,
          sub: `${pendientes.leadsSinContactar.masDe48h} llevan más de 48 horas`,
          href: "/captacion?estado=Pendiente",
          action: "Ir a Captación",
        }
      : null,
    pendientes.fichasIncompletas.total > 0
      ? {
          color: "#D97B2B",
          title: `${pendientes.fichasIncompletas.total} fichas por debajo de 50%`,
          sub:
            pendientes.fichasIncompletas.muestras.join(", ") +
            (pendientes.fichasIncompletas.total > 2
              ? ` y ${pendientes.fichasIncompletas.total - 2} más`
              : ""),
          href: "/properties?filtro=incompletas&umbral=50",
          action: "Completar",
        }
      : null,
    pendientes.captadosSinRegistrar.total > 0
      ? {
          color: "#0A3D62",
          title: `${pendientes.captadosSinRegistrar.total} leads captados sin registrar`,
          sub: "Aún no están en Inventario",
          href:
            pendientes.captadosSinRegistrar.total > 1
              ? "/captacion?estado=Captado"
              : pendientes.captadosSinRegistrar.primerLeadId != null
                ? `/properties?crearDesdeLead=${pendientes.captadosSinRegistrar.primerLeadId}`
                : "/captacion?estado=Captado",
          action: "Registrar",
        }
      : null,
    pendientes.sinPublicar.total > 0
      ? {
          color: "#1E8E5A",
          title: `${pendientes.sinPublicar.total} propiedades sin publicar`,
          sub: "Fichas completas, listas para portales",
          href: "/publications",
          action: "Publicar",
        }
      : null,
  ].filter(Boolean) as {
    color: string;
    title: string;
    sub: string;
    href: string;
    action: string;
  }[];

  return (
    <div className="rounded-2xl border border-[#E4E8EC] bg-white px-[22px] py-5">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-[15px] font-extrabold">Pendientes</h3>
        <span className="text-[11.5px] font-bold text-[#9AA6B2]">
          {rows.length} acciones
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="py-4 text-[12.5px] text-[#5B6B79]">
          Todo al día. No tienes pendientes.
        </p>
      ) : (
        <ul>
          {rows.map((row) => (
            <li key={row.title} className="border-t border-[#EEF0F3] py-3 first:border-t-0">
              <div className="flex gap-2">
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-[var(--pa-ink)]">{row.title}</p>
                  <p className="text-[11.5px] text-[#5B6B79]">{row.sub}</p>
                  <Link href={row.href} className="mt-1 inline-block text-[12px] font-bold text-[#0A3D62]">
                    {row.action} →
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function InicioSkeleton() {
  return (
    <div className="flex flex-col gap-[18px] px-[26px] py-[26px] animate-pulse">
      <div className="h-10 w-64 rounded-lg bg-[#EEF0F3]" />
      <div className="h-28 rounded-2xl bg-[#EEF0F3]" />
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-36 rounded-2xl bg-[#EEF0F3]" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-64 rounded-2xl bg-[#EEF0F3]" />
        <div className="h-64 rounded-2xl bg-[#EEF0F3]" />
      </div>
    </div>
  );
}
