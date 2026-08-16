"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { agentInitials } from "@/lib/agentDisplay";
import { CHANNEL_META, CHANNEL_ORDER, type ChannelId } from "@/design-system/channels";
import { ChannelLogo } from "@/components/ChannelLogo";
import { ProfilePhotoCropModal } from "@/components/ProfilePhotoCropModal";
import { Toast } from "@/components/Toast";
import { channelsService, profileService } from "@/services";
import type { AgentProfile } from "@/services/interfaces/profile";
import type { ChannelConnection } from "@/services/interfaces/channels";

type Tab = "perfil" | "canales";

function profileToSessionPatch(profile: AgentProfile) {
  return {
    nombre: profile.nombre,
    nombrePreferido: profile.nombrePreferido,
    fotoPerfilUrl: profile.fotoPerfilUrl,
    telefono: profile.telefono,
    instagramHandle: profile.instagramHandle,
    bioCorta: profile.bioCorta,
  };
}

function ProfileTab({
  token,
  onSaved,
  onError,
}: {
  token?: string;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const { updateSession } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["agent-profile"],
    queryFn: () => profileService.get(token),
  });

  const [form, setForm] = useState({
    nombre: "",
    nombrePreferido: "",
    telefono: "",
    instagramHandle: "",
    bioCorta: "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);

  useEffect(() => {
    if (!data) return;
    setForm({
      nombre: data.nombre ?? "",
      nombrePreferido: data.nombrePreferido ?? "",
      telefono: data.telefono ?? "",
      instagramHandle: data.instagramHandle ?? "",
      bioCorta: data.bioCorta ?? "",
    });
    setAvatarUrl(data.fotoPerfilUrl);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      profileService.update(
        {
          nombre: form.nombre.trim() || null,
          nombrePreferido: form.nombrePreferido.trim() || null,
          telefono: form.telefono.trim() || null,
          instagramHandle: form.instagramHandle.trim() || null,
          bioCorta: form.bioCorta.trim() || null,
        },
        token,
      ),
    onSuccess: (profile) => {
      updateSession(profileToSessionPatch(profile));
      onSaved("Perfil guardado");
    },
    onError: (err) => {
      onError(err instanceof Error ? err.message : "No se pudo guardar el perfil");
    },
  });

  const photoMutation = useMutation({
    mutationFn: (file: File) => profileService.uploadPhoto(file, token),
    onSuccess: (profile) => {
      setAvatarUrl(profile.fotoPerfilUrl);
      updateSession(profileToSessionPatch(profile));
      onSaved("Foto actualizada");
    },
    onError: (err) => {
      onError(err instanceof Error ? err.message : "No se pudo subir la foto");
    },
  });

  if (isLoading) {
    return <p className="text-[13px] text-[var(--pa-muted)]">Cargando perfil…</p>;
  }
  if (isError || !data) {
    return (
      <p className="text-[13px] text-[var(--pa-danger)]">
        No se pudo cargar tu perfil.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {cropFile ? (
        <ProfilePhotoCropModal
          file={cropFile}
          busy={photoMutation.isPending}
          onCancel={() => setCropFile(null)}
          onConfirm={(file) => {
            setCropFile(null);
            photoMutation.mutate(file);
          }}
        />
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[var(--pa-bg-alt)] text-xl font-bold text-[#45525E]">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setAvatarUrl(null)}
              />
            ) : (
              agentInitials({
                id: data.id,
                username: data.username,
                nombre: form.nombre || data.nombre,
                role: "asesor",
              })
            )}
          </div>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setCropFile(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={photoMutation.isPending}
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-[var(--pa-border)] bg-[var(--pa-surface)] px-3 py-2 text-[13px] font-semibold text-[var(--pa-ink)] hover:bg-[var(--pa-bg)] disabled:opacity-50"
          >
            {photoMutation.isPending ? "Subiendo…" : "Cambiar foto"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
            Nombre completo
          </span>
          <input
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            className="w-full rounded-lg border border-[var(--pa-border)] bg-[var(--pa-surface)] px-3 py-2 text-[14px]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
            Nombre preferido
          </span>
          <input
            value={form.nombrePreferido}
            onChange={(e) =>
              setForm((f) => ({ ...f, nombrePreferido: e.target.value }))
            }
            className="w-full rounded-lg border border-[var(--pa-border)] bg-[var(--pa-surface)] px-3 py-2 text-[14px]"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
            Correo (solo lectura)
          </span>
          <input
            value={data.email}
            readOnly
            className="w-full cursor-not-allowed rounded-lg border border-[var(--pa-border)] bg-[var(--pa-bg)] px-3 py-2 text-[14px] text-[var(--pa-muted)]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
            Teléfono
          </span>
          <input
            value={form.telefono}
            onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
            placeholder="300 123 4567"
            className="w-full rounded-lg border border-[var(--pa-border)] bg-[var(--pa-surface)] px-3 py-2 text-[14px]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
            Instagram (perfil público)
          </span>
          <input
            value={form.instagramHandle}
            onChange={(e) =>
              setForm((f) => ({ ...f, instagramHandle: e.target.value }))
            }
            placeholder="@tuusuario"
            className="w-full rounded-lg border border-[var(--pa-border)] bg-[var(--pa-surface)] px-3 py-2 text-[14px]"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[12px] font-semibold text-[var(--pa-muted)]">
            Bio corta
          </span>
          <textarea
            value={form.bioCorta}
            onChange={(e) => setForm((f) => ({ ...f, bioCorta: e.target.value }))}
            rows={2}
            maxLength={160}
            className="w-full resize-none rounded-lg border border-[var(--pa-border)] bg-[var(--pa-surface)] px-3 py-2 text-[14px]"
          />
        </label>
      </div>

      <button
        type="button"
        disabled={saveMutation.isPending}
        onClick={() => saveMutation.mutate()}
        className="rounded-lg bg-[var(--pa-navy)] px-4 py-2.5 text-[13px] font-bold text-white hover:opacity-95 disabled:opacity-50"
      >
        {saveMutation.isPending ? "Guardando…" : "Guardar perfil"}
      </button>
    </div>
  );
}

function ChannelRow({
  connection,
  token,
  onSaved,
  onError,
}: {
  connection: ChannelConnection;
  token?: string;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  const id = connection.channelId;
  const meta = CHANNEL_META[id];
  const [mode, setMode] = useState<"own" | "pool">("pool");
  const [wasiCompany, setWasiCompany] = useState("");
  const [wasiToken, setWasiToken] = useState("");
  const [wasiUser, setWasiUser] = useState("");
  const [instagramAccount, setInstagramAccount] = useState("");
  const [catalogId, setCatalogId] = useState("");
  const [expanded, setExpanded] = useState(false);

  const patchMutation = useMutation({
    mutationFn: (body: Parameters<typeof channelsService.patch>[1]) =>
      channelsService.patch(id, body, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["channel-connections"] });
      onSaved(`${meta.name} actualizado`);
    },
    onError: (err) => {
      onError(err instanceof Error ? err.message : "No se pudo actualizar el canal");
    },
  });

  const statusLabel =
    connection.status === "connected"
      ? "Conectado"
      : connection.status === "unavailable"
        ? "No disponible"
        : "Sin conectar";

  const statusClass =
    connection.status === "connected"
      ? "bg-[var(--pa-success-bg)] text-[var(--pa-accent)]"
      : connection.status === "unavailable"
        ? "bg-[var(--pa-bg-alt)] text-[var(--pa-faint)]"
        : "bg-[var(--pa-warning-bg)] text-[var(--pa-warning-ink)]";

  const connectPool = () => {
    patchMutation.mutate({ status: "connected", mode: "pool" });
  };

  const connectOwn = () => {
    const credentials: NonNullable<Parameters<typeof channelsService.patch>[1]["credentials"]> =
      {};
    if (id === "wasi") {
      credentials.wasiIdCompany = wasiCompany || null;
      credentials.wasiToken = wasiToken || null;
      credentials.wasiIdUser = wasiUser || null;
    } else if (id === "instagram") {
      credentials.instagramAccount = instagramAccount || null;
    } else if (id === "whatsapp") {
      credentials.catalogId = catalogId || null;
    }
    patchMutation.mutate({ status: "connected", mode: "own", credentials });
  };

  const disconnect = () => {
    patchMutation.mutate({ status: "not_connected" });
    setExpanded(false);
  };

  const canConfigure = id !== "web" && connection.status !== "unavailable";

  return (
    <div className="rounded-xl border border-[var(--pa-border)] bg-[var(--pa-surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <ChannelLogo channelId={id} size={36} />
          <div>
            <p className="text-[14px] font-bold text-[var(--pa-ink)]">{meta.name}</p>
            {meta.subtitle ? (
              <p className="text-[12px] text-[var(--pa-muted)]">{meta.subtitle}</p>
            ) : null}
            <p className="mt-0.5 text-[12px] text-[var(--pa-muted)]">
              {connection.accountName}
            </p>
            {connection.issue ? (
              <p className="mt-1 text-[12px] text-[var(--pa-warning-ink)]">
                {connection.issue}
              </p>
            ) : null}
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      {canConfigure ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {connection.status !== "connected" ? (
            <>
              {(id === "wasi" || id === "instagram" || id === "whatsapp") && (
                <button
                  type="button"
                  disabled={patchMutation.isPending}
                  onClick={connectPool}
                  className="rounded-lg border border-[var(--pa-border)] px-3 py-1.5 text-[12px] font-semibold hover:bg-[var(--pa-bg)]"
                >
                  Usar pool Proinversores
                </button>
              )}
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="rounded-lg border border-[var(--pa-navy)] px-3 py-1.5 text-[12px] font-semibold text-[var(--pa-navy)]"
              >
                {expanded ? "Ocultar credenciales" : "Conectar con mis datos"}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={patchMutation.isPending}
              onClick={disconnect}
              className="rounded-lg border border-[var(--pa-danger)]/40 px-3 py-1.5 text-[12px] font-semibold text-[var(--pa-danger)]"
            >
              Desconectar
            </button>
          )}
        </div>
      ) : null}

      {expanded && canConfigure ? (
        <div className="mt-4 space-y-3 border-t border-[var(--pa-border)] pt-4">
          {(id === "wasi" || id === "instagram" || id === "whatsapp") && (
            <div className="flex gap-3 text-[12px]">
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  checked={mode === "pool"}
                  onChange={() => setMode("pool")}
                />
                Pool Proinversores
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  checked={mode === "own"}
                  onChange={() => setMode("own")}
                />
                Mis credenciales
              </label>
            </div>
          )}

          {id === "wasi" && mode === "own" ? (
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                placeholder="ID company"
                value={wasiCompany}
                onChange={(e) => setWasiCompany(e.target.value)}
                className="rounded-lg border border-[var(--pa-border)] px-2 py-1.5 text-[13px]"
              />
              <input
                placeholder="Token"
                type="password"
                value={wasiToken}
                onChange={(e) => setWasiToken(e.target.value)}
                className="rounded-lg border border-[var(--pa-border)] px-2 py-1.5 text-[13px]"
              />
              <input
                placeholder="ID user"
                value={wasiUser}
                onChange={(e) => setWasiUser(e.target.value)}
                className="rounded-lg border border-[var(--pa-border)] px-2 py-1.5 text-[13px]"
              />
            </div>
          ) : null}

          {id === "instagram" && mode === "own" ? (
            <input
              placeholder="Cuenta Instagram (@usuario)"
              value={instagramAccount}
              onChange={(e) => setInstagramAccount(e.target.value)}
              className="w-full rounded-lg border border-[var(--pa-border)] px-2 py-1.5 text-[13px]"
            />
          ) : null}

          {id === "whatsapp" && mode === "own" ? (
            <input
              placeholder="ID catálogo Meta"
              value={catalogId}
              onChange={(e) => setCatalogId(e.target.value)}
              className="w-full rounded-lg border border-[var(--pa-border)] px-2 py-1.5 text-[13px]"
            />
          ) : null}

          {id === "facebook" ? (
            <p className="text-[12px] text-[var(--pa-muted)]">
              Marketplace usa el worker de la PC (Opción B). Marca como conectado
              si ya tienes la cola configurada.
            </p>
          ) : null}

          <button
            type="button"
            disabled={patchMutation.isPending}
            onClick={() => {
              if (mode === "pool") connectPool();
              else if (id === "facebook") {
                patchMutation.mutate({ status: "connected", mode: "own" });
              } else connectOwn();
            }}
            className="rounded-lg bg-[var(--pa-navy)] px-3 py-2 text-[12px] font-bold text-white"
          >
            Guardar conexión
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ChannelsTab({
  token,
  onSaved,
  onError,
}: {
  token?: string;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["channel-connections"],
    queryFn: () => channelsService.list(token),
  });

  if (isLoading) {
    return <p className="text-[13px] text-[var(--pa-muted)]">Cargando canales…</p>;
  }
  if (isError) {
    return (
      <p className="text-[13px] text-[var(--pa-danger)]">
        No se pudieron cargar los canales.
      </p>
    );
  }

  const byId = new Map((data ?? []).map((c) => [c.channelId, c]));

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-[var(--pa-muted)]">
        Conecta solo los canales que usarás al publicar. Por defecto todos están
        apagados hasta que los actives.
      </p>
      {CHANNEL_ORDER.map((id: ChannelId) => {
        const conn = byId.get(id);
        if (!conn) return null;
        return (
          <ChannelRow
            key={id}
            connection={conn}
            token={token}
            onSaved={onSaved}
            onError={onError}
          />
        );
      })}
    </div>
  );
}

export default function SettingsPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>("perfil");
  const [toast, setToast] = useState<{ message: string; type?: "error" } | null>(
    null,
  );

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8">
      <header className="mb-6">
        <h1 className="text-[22px] font-extrabold text-[var(--pa-ink)]">
          Configuración
        </h1>
        <p className="mt-1 text-[13px] text-[var(--pa-muted)]">
          Tu perfil y las conexiones de publicación por canal.
        </p>
      </header>

      <div className="mb-6 flex gap-1 rounded-xl border border-[var(--pa-border)] bg-[var(--pa-bg)] p-1 w-fit">
        {(
          [
            ["perfil", "Perfil"],
            ["canales", "Canales"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors ${
              tab === id
                ? "bg-[var(--pa-surface)] text-[var(--pa-ink)] shadow-sm"
                : "text-[var(--pa-muted)] hover:text-[var(--pa-ink)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl">
        {tab === "perfil" ? (
          <ProfileTab
            token={token ?? undefined}
            onSaved={(message) => setToast({ message })}
            onError={(message) => setToast({ message, type: "error" })}
          />
        ) : (
          <ChannelsTab
            token={token ?? undefined}
            onSaved={(message) => setToast({ message })}
            onError={(message) => setToast({ message, type: "error" })}
          />
        )}
      </div>

      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      ) : null}
    </div>
  );
}
