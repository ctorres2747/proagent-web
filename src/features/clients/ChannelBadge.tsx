"use client";

import { Briefcase, MoreHorizontal, UserPlus } from "lucide-react";
import { CLIENT_CHANNEL_META } from "@/design-system/clientChannels";
import type { ClientChannel } from "@/services/interfaces/clients";

/** Badge del canal de origen — mismo lugar que el logo de portal en Captación
 * (LeadCard), pero cubre los 7 canales de Clientes (handoff §3.2). */
export function ChannelBadge({
  channel,
  channelOther,
  size = "sm",
}: {
  channel: ClientChannel;
  channelOther?: string | null;
  size?: "sm" | "md";
}) {
  const meta = CLIENT_CHANNEL_META[channel];
  const title = channel === "otro" && channelOther ? `Otro: ${channelOther}` : meta.label;
  const dims = size === "sm" ? "h-5 min-w-[22px] px-1.5" : "h-6 min-w-[26px] px-2";
  // Facebook/MercadoLibre son isotipos cuadrados; Ciencuadras/Metrocuadrado
  // son logos tipo wordmark (rectangulares) -- w-auto respeta su proporción
  // real en vez de aplastarlos en un cuadrado de ícono.
  const logoHeight = size === "sm" ? "h-3" : "h-3.5";

  let content: React.ReactNode;
  if (meta.logo) {
    // eslint-disable-next-line @next/next/no-img-element -- SVG vector
    content = (
      <img src={meta.logo} alt={meta.label} className={`${logoHeight} w-auto max-w-[52px] object-contain`} />
    );
  } else if (channel === "referido") {
    content = <UserPlus size={12} strokeWidth={2.2} className="text-[#45525E]" />;
  } else if (channel === "colegaje") {
    content = <Briefcase size={12} strokeWidth={2.2} className="text-[#45525E]" />;
  } else if (channel === "otro") {
    content = <MoreHorizontal size={12} className="text-[#45525E]" />;
  } else {
    content = (
      <span className="text-[9.5px] font-extrabold text-[#45525E]">{meta.fallback}</span>
    );
  }

  return (
    <span
      title={title}
      className={`inline-flex items-center justify-center rounded-[6px] border border-[var(--pa-border)] bg-[var(--pa-bg)] ${dims}`}
    >
      {content}
    </span>
  );
}
