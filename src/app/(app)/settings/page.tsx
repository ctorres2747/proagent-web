"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { agentInitials } from "@/lib/agentDisplay";
import { CHANNEL_META, CHANNEL_ORDER, type ChannelId } from "@/design-system/channels";
import { ChannelLogo } from "@/components/ChannelLogo";
import { PasswordInput } from "@/components/PasswordInput";
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
            Instagram (también se usa para conectar el canal de Instagram)
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

function ToggleSwitch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-[var(--pa-accent)]" : "bg-[var(--pa-border)]"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function ChannelRow({
  connection,
  token,
  instagramHandle,
  onGoToProfile,
  onSaved,
  onError,
}: {
  connection: ChannelConnection;
  token?: string;
  instagramHandle: string;
  onGoToProfile: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  const id = connection.channelId;
  const meta = CHANNEL_META[id];
  // Facebook (Marketplace) no tiene credenciales propias — "conectar" ahí
  // solo marca la fila como lista (mode "pool", ver connectPool más abajo).
  // Los demás canales (wasi/instagram/whatsapp) siempre operan en "own": el
  // toggle Pool/Mis credenciales se quitó de la UI (ver sesión 2026-08-23).
  const [mode, setMode] = useState<"own" | "pool">(id === "facebook" ? "pool" : "own");
  const [wasiCompany, setWasiCompany] = useState("");
  const [wasiToken, setWasiToken] = useState("");
  const [wasiUser, setWasiUser] = useState("");
  const [catalogId, setCatalogId] = useState("");
  const [catalogToken, setCatalogToken] = useState("");
  const [instagramBusinessId, setInstagramBusinessId] = useState("");
  const [instagramToken, setInstagramToken] = useState("");
  const [driveParentFolder, setDriveParentFolder] = useState("");
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

  // Solo lo usa Facebook (Marketplace no tiene credenciales propias — "Guardar
  // conexión" ahí solo marca la fila como lista, mode "pool").
  const connectPool = () => {
    patchMutation.mutate({ status: "connected", mode: "pool" });
  };

  // "Editar" (own ya conectado) y "Conectar con mis datos" (sin conectar o
  // heredado de la cuenta compartida) abren el mismo panel, precargado con
  // lo que haya guardado —
  // el token NUNCA se precarga (el backend tampoco lo devuelve): se deja en
  // blanco y, si el asesor no escribe uno nuevo, el backend conserva el
  // actual (mismo criterio que Stripe/Twilio: nunca se re-muestra un secreto
  // ya guardado, solo se reemplaza si se pega uno nuevo).
  const openEditPanel = () => {
    setMode("own");
    setWasiCompany(connection.credentials?.wasiIdCompany ?? "");
    setWasiUser(connection.credentials?.wasiIdUser ?? "");
    setCatalogId(connection.credentials?.catalogId ?? "");
    setInstagramBusinessId(connection.credentials?.instagramBusinessId ?? "");
    setDriveParentFolder(
      connection.credentials?.driveParentFolderUrl ??
        connection.credentials?.driveParentFolderId ??
        "",
    );
    setWasiToken("");
    setCatalogToken("");
    setInstagramToken("");
    setExpanded(true);
  };

  const connectOwn = () => {
    if (id === "instagram" && !instagramHandle.trim()) {
      onError("Agrega tu Instagram en la pestaña Perfil antes de conectar este canal");
      return;
    }
    if (id === "instagram" && !instagramBusinessId.trim()) {
      onError("Indica el ID de cuenta Business de Instagram");
      return;
    }
    if (id === "instagram" && !instagramToken.trim() && !connection.credentials?.instagramTokenLast4) {
      onError("Indica el token de acceso de Meta para Instagram");
      return;
    }
    if (id === "whatsapp" && !catalogToken.trim() && !connection.credentials?.catalogTokenLast4) {
      onError("Indica el token de acceso de Meta para el catálogo");
      return;
    }
    const credentials: NonNullable<Parameters<typeof channelsService.patch>[1]["credentials"]> =
      {};
    if (id === "wasi") {
      credentials.wasiIdCompany = wasiCompany || null;
      credentials.wasiToken = wasiToken || null;
      credentials.wasiIdUser = wasiUser || null;
    } else if (id === "instagram") {
      credentials.instagramAccount = instagramHandle.trim() || null;
      credentials.instagramBusinessId = instagramBusinessId || null;
      credentials.instagramToken = instagramToken || null;
    } else if (id === "whatsapp") {
      credentials.catalogId = catalogId || null;
      credentials.catalogToken = catalogToken || null;
    }
    patchMutation.mutate({ status: "connected", mode: "own", credentials });
  };

  const connectEntrega = () => {
    if (!driveParentFolder.trim()) {
      onError("Indica el link o ID de la carpeta padre en Google Drive");
      return;
    }
    patchMutation.mutate({
      status: "connected",
      mode: "own",
      credentials: { driveParentFolderId: driveParentFolder.trim() },
    });
  };

  const disconnect = () => {
    patchMutation.mutate({ status: "not_connected" });
    setExpanded(false);
  };

  const canConfigure = id !== "web" && connection.status !== "unavailable";
  const isEntrega = id === "entrega";

  // Confirmación de que hay un token guardado, sin exponerlo (mismo patrón
  // que Stripe/GitHub: últimos 4 caracteres). Solo aplica en modo own.
  const tokenLast4 =
    id === "wasi"
      ? connection.credentials?.wasiTokenLast4
      : id === "instagram"
        ? connection.credentials?.instagramTokenLast4
        : id === "whatsapp"
          ? connection.credentials?.catalogTokenLast4
          : null;
  const showTokenBadge =
    connection.status === "connected" && connection.mode === "own" && tokenLast4;

  // Facebook (pool) siempre tiene "algo" para prender — no pide credenciales
  // propias. Entrega usa la carpeta guardada. Los demás necesitan un token
  // ya guardado (persiste tras desconectar, ver fix 2026-08-29) para poder
  // prenderse de nuevo sin reabrir el panel.
  const hasSavedSetup =
    id === "facebook" ||
    (isEntrega ? Boolean(connection.credentials?.driveParentFolderId) : Boolean(tokenLast4));

  // El interruptor es el control principal para excluir/incluir el canal de
  // Canales/Estado en Publicación (pedido de Cristhian, 2026-08-29) — sin
  // pisar la configuración guardada. Apagar siempre desconecta. Prender:
  // si ya hay algo guardado, reconecta directo (sin reabrir el panel); si
  // nunca se configuró nada, no hay con qué prender — abre el panel para
  // cargar credenciales por primera vez.
  const handleToggle = (next: boolean) => {
    if (!next) {
      disconnect();
      return;
    }
    if (id === "facebook") {
      connectPool();
      return;
    }
    if (hasSavedSetup) {
      patchMutation.mutate({ status: "connected", mode: connection.mode ?? "own" });
      return;
    }
    openEditPanel();
  };

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
            {showTokenBadge ? (
              <p className="mt-0.5 text-[11px] text-[var(--pa-muted)]">
                Token: <span className="font-mono">····{tokenLast4}</span>
              </p>
            ) : null}
            {connection.issue ? (
              <p className="mt-1 text-[12px] text-[var(--pa-warning-ink)]">
                {connection.issue}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass}`}
          >
            {statusLabel}
          </span>
          {canConfigure ? (
            <ToggleSwitch
              checked={connection.status === "connected"}
              onChange={handleToggle}
              disabled={patchMutation.isPending}
              label={`${connection.status === "connected" ? "Desconectar" : "Conectar"} ${meta.name}`}
            />
          ) : null}
        </div>
      </div>

      {canConfigure ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {connection.status !== "connected" ? (
            <>
              <button
                type="button"
                onClick={() => (expanded ? setExpanded(false) : openEditPanel())}
                className="rounded-lg border border-[var(--pa-navy)] px-3 py-1.5 text-[12px] font-semibold text-[var(--pa-navy)]"
              >
                {expanded
                  ? "Ocultar"
                  : isEntrega
                    ? "Configurar carpeta"
                    : "Conectar con mis datos"}
              </button>
            </>
          ) : (
            <>
              {id !== "facebook" && !isEntrega ? (
                <button
                  type="button"
                  onClick={() => {
                    if (expanded) {
                      setExpanded(false);
                    } else {
                      openEditPanel();
                    }
                  }}
                  className="rounded-lg border border-[var(--pa-navy)] px-3 py-1.5 text-[12px] font-semibold text-[var(--pa-navy)]"
                >
                  {expanded
                    ? "Ocultar"
                    : connection.mode === "own"
                      ? "Editar"
                      : "Conectar con mis datos"}
                </button>
              ) : null}
              {isEntrega ? (
                <button
                  type="button"
                  onClick={() => (expanded ? setExpanded(false) : openEditPanel())}
                  className="rounded-lg border border-[var(--pa-navy)] px-3 py-1.5 text-[12px] font-semibold text-[var(--pa-navy)]"
                >
                  {expanded ? "Ocultar" : "Editar carpeta padre"}
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {expanded && canConfigure ? (
        <div className="mt-4 space-y-3 border-t border-[var(--pa-border)] pt-4">
          {id === "wasi" && mode === "own" ? (
            <div className="space-y-1.5">
              <div className="grid gap-2 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-[var(--pa-muted)]">
                    ID company
                  </span>
                  <input
                    placeholder="Ej: 25696111"
                    value={wasiCompany}
                    onChange={(e) => setWasiCompany(e.target.value)}
                    name="wasi-id-company"
                    autoComplete="off"
                    className="w-full rounded-lg border border-[var(--pa-border)] px-2 py-1.5 text-[13px]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-[var(--pa-muted)]">
                    Token
                  </span>
                  <PasswordInput
                    value={wasiToken}
                    onChange={setWasiToken}
                    placeholder={
                      connection.status === "connected" && connection.mode === "own"
                        ? "Dejar vacío para no cambiarlo"
                        : ""
                    }
                    autoComplete="new-password"
                    name="wasi-token"
                    inputClassName="w-full rounded-lg border border-[var(--pa-border)] px-2 py-1.5 pr-8 text-[13px]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-[var(--pa-muted)]">
                    ID user
                  </span>
                  <input
                    placeholder="Ej: 259967"
                    value={wasiUser}
                    onChange={(e) => setWasiUser(e.target.value)}
                    name="wasi-id-user"
                    autoComplete="off"
                    className="w-full rounded-lg border border-[var(--pa-border)] px-2 py-1.5 text-[13px]"
                  />
                </label>
              </div>
              {connection.status === "connected" && connection.mode === "own" ? (
                <p className="text-[11px] text-[var(--pa-muted)]">
                  El token ya guardado no se muestra por seguridad. Déjalo vacío para
                  conservarlo, o pega uno nuevo para reemplazarlo.
                </p>
              ) : null}
            </div>
          ) : null}

          {id === "instagram" && mode === "own" ? (
            <div className="space-y-2">
              {instagramHandle.trim() ? (
                <p className="text-[13px] text-[var(--pa-muted)]">
                  Se usará tu Instagram de perfil:{" "}
                  <span className="font-semibold text-[var(--pa-ink)]">{instagramHandle}</span>
                  {" · "}
                  <button
                    type="button"
                    onClick={onGoToProfile}
                    className="font-semibold text-[var(--pa-navy)] underline underline-offset-2"
                  >
                    cambiarlo en Perfil
                  </button>
                </p>
              ) : (
                <p className="text-[13px] text-[var(--pa-warning-ink)]">
                  No tienes Instagram en tu perfil.{" "}
                  <button
                    type="button"
                    onClick={onGoToProfile}
                    className="font-semibold underline underline-offset-2"
                  >
                    Agrégalo en Perfil
                  </button>{" "}
                  para conectar este canal.
                </p>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-[var(--pa-muted)]">
                    ID de cuenta Business
                  </span>
                  <input
                    placeholder="Ej: 17841400958506775"
                    value={instagramBusinessId}
                    onChange={(e) => setInstagramBusinessId(e.target.value)}
                    name="instagram-business-id"
                    autoComplete="off"
                    className="w-full rounded-lg border border-[var(--pa-border)] px-2 py-1.5 text-[13px]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-[var(--pa-muted)]">
                    Token de acceso Meta
                  </span>
                  <PasswordInput
                    value={instagramToken}
                    onChange={setInstagramToken}
                    placeholder={
                      connection.status === "connected" && connection.mode === "own"
                        ? "Dejar vacío para no cambiarlo"
                        : ""
                    }
                    autoComplete="new-password"
                    name="instagram-token"
                    inputClassName="w-full rounded-lg border border-[var(--pa-border)] px-2 py-1.5 pr-8 text-[13px]"
                  />
                </label>
              </div>
              {connection.status === "connected" && connection.mode === "own" ? (
                <p className="text-[11px] text-[var(--pa-muted)]">
                  El token ya guardado no se muestra por seguridad. Déjalo vacío para
                  conservarlo, o pega uno nuevo para reemplazarlo.
                </p>
              ) : null}
            </div>
          ) : null}

          {id === "whatsapp" && mode === "own" ? (
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-[var(--pa-muted)]">
                    ID catálogo Meta
                  </span>
                  <input
                    placeholder="Ej: 1568921391356201"
                    value={catalogId}
                    onChange={(e) => setCatalogId(e.target.value)}
                    name="whatsapp-catalog-id"
                    autoComplete="off"
                    className="w-full rounded-lg border border-[var(--pa-border)] px-2 py-1.5 text-[13px]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-[var(--pa-muted)]">
                    Token de acceso Meta
                  </span>
                  <PasswordInput
                    value={catalogToken}
                    onChange={setCatalogToken}
                    placeholder={
                      connection.status === "connected" && connection.mode === "own"
                        ? "Dejar vacío para no cambiarlo"
                        : ""
                    }
                    autoComplete="new-password"
                    name="whatsapp-catalog-token"
                    inputClassName="w-full rounded-lg border border-[var(--pa-border)] px-2 py-1.5 pr-8 text-[13px]"
                  />
                </label>
              </div>
              {connection.status === "connected" && connection.mode === "own" ? (
                <p className="text-[11px] text-[var(--pa-muted)]">
                  El token ya guardado no se muestra por seguridad. Déjalo vacío para
                  conservarlo, o pega uno nuevo para reemplazarlo.
                </p>
              ) : null}
            </div>
          ) : null}

          {id === "facebook" ? (
            <p className="text-[12px] text-[var(--pa-muted)]">
              Marketplace usa el worker de la PC (Opción B). Marca como conectado
              si ya tienes la cola configurada.
            </p>
          ) : null}

          {id === "entrega" ? (
            <div className="space-y-2">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-[var(--pa-muted)]">
                  Carpeta padre (link o ID)
                </span>
                <input
                  value={driveParentFolder}
                  onChange={(e) => setDriveParentFolder(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/…"
                  className="w-full rounded-lg border border-[var(--pa-border)] px-2 py-1.5 text-[13px]"
                />
              </label>
              <p className="text-[11px] text-[var(--pa-muted)]">
                Los archivos se guardan en la cuenta de Google Drive conectada
                al backend (configurada en el VPS). Esta carpeta define dónde
                queda todo organizado — se creará{" "}
                <strong>Captaciones_Proinversores</strong> automáticamente
                dentro de ella.
              </p>
            </div>
          ) : null}

          <button
            type="button"
            disabled={patchMutation.isPending}
            onClick={() => {
              if (id === "entrega") connectEntrega();
              else if (mode === "pool") connectPool();
              else if (id === "facebook") {
                patchMutation.mutate({ status: "connected", mode: "own" });
              } else connectOwn();
            }}
            className="rounded-lg bg-[var(--pa-navy)] px-3 py-2 text-[12px] font-bold text-white"
          >
            {connection.status === "connected" ? "Actualizar conexión" : "Guardar conexión"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ChannelsTab({
  token,
  onGoToProfile,
  onSaved,
  onError,
}: {
  token?: string;
  onGoToProfile: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["channel-connections"],
    queryFn: () => channelsService.list(token),
  });
  // Mismo query key que ProfileTab — React Query lo cachea/comparte, así que
  // entrar directo a la pestaña Canales no duplica el fetch de perfil.
  const { data: profile } = useQuery({
    queryKey: ["agent-profile"],
    queryFn: () => profileService.get(token),
  });
  const instagramHandle = profile?.instagramHandle ?? "";

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
  const conectados = (data ?? []).filter((c) => c.status === "connected").length;

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-[var(--pa-muted)]">
        Conecta solo los canales que usarás al publicar. Por defecto todos están
        apagados hasta que los actives.
      </p>
      {conectados === 0 ? (
        <div className="rounded-xl border border-[var(--pa-warning-ink)]/30 bg-[var(--pa-warning-bg)] px-4 py-3 text-[13px] text-[var(--pa-warning-ink)]">
          Todavía no tienes ningún canal conectado — no vas a poder publicar
          hasta que conectes al menos uno. Recomendado: conecta{" "}
          <strong>WASI</strong> con tus propias credenciales.
        </div>
      ) : null}
      {CHANNEL_ORDER.map((id: ChannelId) => {
        const conn = byId.get(id);
        if (!conn) return null;
        return (
          <ChannelRow
            key={id}
            connection={conn}
            token={token}
            instagramHandle={instagramHandle}
            onGoToProfile={onGoToProfile}
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
            onGoToProfile={() => setTab("perfil")}
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
