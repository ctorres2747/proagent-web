"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useAgentView } from "@/features/agentView/AgentViewProvider";
import { useAuth } from "@/features/auth/AuthProvider";
import { ClientCard } from "@/features/clients/ClientCard";
import { ClientDetailDrawer } from "@/features/clients/ClientDetailDrawer";
import { DiscardedClientsTable } from "@/features/clients/DiscardedClientsTable";
import { NewClientModal } from "@/features/clients/NewClientModal";
import { TemperatureChip } from "@/features/clients/TemperatureChip";
import { CLIENT_CHANNEL_META, CLIENT_CHANNEL_ORDER } from "@/design-system/clientChannels";
import { buildMunicipioOptions } from "@/lib/municipio";
import { clientsService, propertiesService } from "@/services";
import type { Client, ClientStage, ClientTemperature, ClientWrite } from "@/services/interfaces/clients";

const COLUMNS: { id: ClientStage; label: string; dot: string }[] = [
  { id: "nuevo", label: "Nuevo contacto", dot: "#9AA6B2" },
  { id: "calificando", label: "Calificando", dot: "#0A3D62" },
  { id: "visitas", label: "En visitas", dot: "#0A3D62" },
  { id: "negociando", label: "Negociando", dot: "#0A3D62" },
  { id: "cerrado", label: "Cerrado", dot: "#1E8E5A" },
];

export default function ClientsPage() {
  const { token } = useAuth();
  const { viewAgenteId } = useAgentView();
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("");
  const [tempFilter, setTempFilter] = useState<ClientTemperature[]>([]);
  const [showDiscarded, setShowDiscarded] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients", debouncedSearch, channelFilter, tempFilter, showDiscarded],
    queryFn: () =>
      clientsService.list(
        {
          q: debouncedSearch || undefined,
          channel: (channelFilter || undefined) as never,
          temp: tempFilter.length ? tempFilter : undefined,
          includeDiscarded: showDiscarded,
        },
        token ?? undefined,
      ),
  });

  const { data: channelCounts } = useQuery({
    queryKey: ["clients-channel-counts"],
    queryFn: () => clientsService.channelCounts(token ?? undefined),
  });

  const { data: allProperties } = useQuery({
    queryKey: ["properties-for-clients"],
    queryFn: () => propertiesService.list(token ?? undefined),
  });

  // Mismo patrón que Inventario: admin trae el dominio completo, "Viendo
  // como" filtra en el cliente (AgentViewProvider).
  const visibleClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter((c) => !viewAgenteId || c.ownerAgenteId === viewAgenteId);
  }, [clients, viewAgenteId]);

  const zoneSuggestions = useMemo(
    () => buildMunicipioOptions((allProperties ?? []).map((p) => p.municipio)).map((m) => m.label),
    [allProperties],
  );

  const selected = visibleClients.find((c) => c.id === selectedId) ?? null;

  const patchMutation = useMutation({
    mutationFn: (payload: ClientWrite) =>
      clientsService.update(selectedId!, payload, token ?? undefined),
    onSuccess: (updated) => {
      queryClient.setQueryData<Client[]>(["clients", debouncedSearch, channelFilter, tempFilter, showDiscarded], (prev) =>
        prev?.map((c) => (c.id === updated.id ? updated : c)),
      );
      queryClient.invalidateQueries({ queryKey: ["clients-channel-counts"] });
    },
  });

  const linkMutation = useMutation({
    mutationFn: (propertyId: string) =>
      clientsService.linkProperty(selectedId!, propertyId, token ?? undefined),
    onSuccess: (updated) => {
      queryClient.setQueryData<Client[]>(["clients", debouncedSearch, channelFilter, tempFilter, showDiscarded], (prev) =>
        prev?.map((c) => (c.id === updated.id ? updated : c)),
      );
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (propertyId: string) =>
      clientsService.unlinkProperty(selectedId!, propertyId, token ?? undefined),
    onSuccess: (updated) => {
      queryClient.setQueryData<Client[]>(["clients", debouncedSearch, channelFilter, tempFilter, showDiscarded], (prev) =>
        prev?.map((c) => (c.id === updated.id ? updated : c)),
      );
    },
  });

  const discardedClients = visibleClients.filter((c) => c.estado === "descartado");
  const discardedCount = discardedClients.length;
  const hasFilters = Boolean(debouncedSearch || channelFilter || tempFilter.length);

  function toggleTemp(t: ClientTemperature) {
    setTempFilter((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  const input =
    "h-9 rounded-[9px] border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 text-[12.5px]";

  return (
    <div className="flex flex-col gap-[18px] px-[26px] py-[26px] pb-11 md:px-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#16212B]">Clientes</h1>
          <p className="mt-1 text-[13px] text-[var(--pa-muted)]">
            {hasFilters
              ? `${visibleClients.length} clientes coinciden con los filtros`
              : `${visibleClients.length} compradores en seguimiento`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          className="flex items-center gap-1.5 rounded-[10px] bg-[var(--pa-navy)] px-4 py-2.5 text-[13px] font-bold text-white"
        >
          <Plus size={16} /> Nuevo cliente
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-3">
        <input
          className={`${input} min-w-[220px] flex-1`}
          placeholder="Buscar por nombre o teléfono"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="relative">
          <button
            type="button"
            onClick={() => setChannelOpen((v) => !v)}
            className={`${input} flex items-center gap-1.5 font-semibold text-[var(--pa-text-secondary)]`}
          >
            {channelFilter
              ? `Canal: ${CLIENT_CHANNEL_META[channelFilter as keyof typeof CLIENT_CHANNEL_META].label}`
              : "Canal de origen"}
            <span className="text-[var(--pa-faint)]">▾</span>
          </button>
          {channelOpen ? (
            <ul className="absolute z-20 mt-1 w-56 max-h-64 overflow-y-auto rounded-lg border border-[var(--pa-border)] bg-white py-1 shadow-[var(--pa-shadow-overlay)]">
              <li>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-[var(--pa-bg)]"
                  onClick={() => {
                    setChannelFilter("");
                    setChannelOpen(false);
                  }}
                >
                  Todos los canales
                </button>
              </li>
              {CLIENT_CHANNEL_ORDER.map((c) => {
                const count = channelCounts?.find((x) => x.canal === c)?.total ?? 0;
                return (
                  <li key={c}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-[12.5px] hover:bg-[var(--pa-bg)]"
                      onClick={() => {
                        setChannelFilter(c);
                        setChannelOpen(false);
                      }}
                    >
                      {CLIENT_CHANNEL_META[c].label}
                      <span className="text-[var(--pa-faint)]">{count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <div className="h-6 w-px bg-[var(--pa-border)]" />

        <div className="flex items-center gap-1.5">
          <span className="text-[11.5px] font-bold text-[var(--pa-faint)]">Temperatura</span>
          {(["cold", "warm", "hot"] as ClientTemperature[]).map((t) => (
            <TemperatureChip
              key={t}
              value={t}
              active={tempFilter.includes(t)}
              onClick={() => toggleTemp(t)}
            />
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[12px] font-semibold text-[var(--pa-text-secondary)]">
            Ver descartados ({discardedCount})
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={showDiscarded}
            onClick={() => setShowDiscarded((v) => !v)}
            className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${
              showDiscarded
                ? "border-[var(--pa-navy)] bg-[var(--pa-navy)]"
                : "border-[var(--pa-border)] bg-[#D7DCE1]"
            }`}
          >
            <span
              className={`absolute top-1/2 h-[15px] w-[15px] -translate-y-1/2 rounded-full bg-white shadow-[0_1px_3px_rgba(16,33,49,.4)] transition-transform ${
                showDiscarded ? "translate-x-[18px]" : "translate-x-[3px]"
              }`}
            />
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--pa-muted)]">Cargando clientes…</p>
      ) : showDiscarded ? (
        <DiscardedClientsTable
          clients={discardedClients}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-x-auto">
          <div
            className="grid min-h-[420px] gap-3"
            style={{ gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(220px, 1fr))` }}
          >
            {COLUMNS.map((col) => {
              const items = visibleClients.filter((c) => c.estado === col.id);
              return (
                <section
                  key={col.id}
                  className="flex min-h-[380px] flex-col rounded-2xl border border-[var(--pa-border)] bg-[var(--pa-surface)]"
                >
                  <header className="flex items-center justify-between border-b border-[var(--pa-border)] px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: col.dot }}
                      />
                      <h2 className="text-[13px] font-bold text-[var(--pa-ink)]">{col.label}</h2>
                    </div>
                    <span className="rounded-full bg-[var(--pa-bg-alt)] px-2 py-0.5 text-[11px] font-bold text-[var(--pa-muted)]">
                      {items.length}
                    </span>
                  </header>
                  <div className="flex max-h-[calc(100vh-300px)] flex-1 flex-col gap-2.5 overflow-y-auto p-2.5">
                    {items.map((c) => (
                      <ClientCard
                        key={c.id}
                        client={c}
                        active={c.id === selectedId}
                        onClick={() => setSelectedId(c.id)}
                      />
                    ))}
                    {items.length === 0 ? (
                      <p className="py-6 text-center text-[12px] font-semibold text-[var(--pa-faint)]">
                        Sin clientes
                      </p>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {selected ? (
        <ClientDetailDrawer
          client={selected}
          allProperties={allProperties ?? []}
          zoneSuggestions={zoneSuggestions}
          busy={patchMutation.isPending || linkMutation.isPending || unlinkMutation.isPending}
          onPatch={(patch) => patchMutation.mutate(patch)}
          onLinkProperty={(id) => linkMutation.mutate(id)}
          onUnlinkProperty={(id) => unlinkMutation.mutate(id)}
          onClose={() => setSelectedId(null)}
        />
      ) : null}

      {newOpen ? (
        <NewClientModal
          token={token ?? undefined}
          onClose={() => setNewOpen(false)}
          onCreated={(id) => {
            setNewOpen(false);
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            queryClient.invalidateQueries({ queryKey: ["clients-channel-counts"] });
            setSelectedId(id);
          }}
        />
      ) : null}
    </div>
  );
}
