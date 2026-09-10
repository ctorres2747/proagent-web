import { Check, Clock, Loader2, Minus, X } from "lucide-react";

import { CHANNEL_META } from "@/design-system/channels";
import type { ChannelId } from "@/design-system/channels";
import { ChannelLogo } from "@/components/ChannelLogo";
import {
  channelIndicatorAriaLabel,
  channelIndicatorForPublication,
  publicationDisplayChannels,
  type ChannelIndicatorKind,
} from "@/lib/publicationDisplay";
import type { Publication } from "@/services/interfaces/publications";

const BADGE_BASE =
  "absolute -bottom-0.5 -right-1 flex items-center justify-center rounded-full ring-2 ring-[var(--pa-surface)]";

function ChannelStatusBadge({ kind }: { kind: ChannelIndicatorKind }) {
  switch (kind) {
    case "published":
      return (
        <span
          className={`${BADGE_BASE} h-[18px] w-[18px] bg-[#1E8E5A] shadow-[0_1px_3px_rgba(30,142,90,.35)]`}
          aria-hidden
        >
          <Check size={11} strokeWidth={3} className="text-white" />
        </span>
      );
    case "error":
      return (
        <span
          className={`${BADGE_BASE} h-[18px] w-[18px] bg-[var(--pa-danger)] shadow-[0_1px_3px_rgba(194,59,43,.3)]`}
          aria-hidden
        >
          <X size={11} strokeWidth={3} className="text-white" />
        </span>
      );
    case "progress":
      return (
        <span
          className={`${BADGE_BASE} h-[18px] w-[18px] bg-white shadow-[0_1px_3px_rgba(16,33,49,.12)]`}
          aria-hidden
        >
          <Loader2 size={12} className="animate-spin text-[#D97706]" />
        </span>
      );
    case "scheduled":
      return (
        <span
          className={`${BADGE_BASE} h-[18px] w-[18px] bg-[#D97706] shadow-[0_1px_3px_rgba(217,119,6,.3)]`}
          aria-hidden
        >
          <Clock size={10} strokeWidth={2.5} className="text-white" />
        </span>
      );
    default:
      return (
        <span
          className={`${BADGE_BASE} h-[18px] w-[18px] bg-[#9AA6B2] shadow-[0_1px_2px_rgba(16,33,49,.1)]`}
          aria-hidden
        >
          <Minus size={11} strokeWidth={3} className="text-white" />
        </span>
      );
  }
}

/** Íconos de canal con badge de estado para la lista de Publicación. */
export function PublicationChannelIndicators({
  publication,
  connectedChannelIds,
}: {
  publication?: Publication;
  connectedChannelIds?: ChannelId[];
}) {
  const channels = publicationDisplayChannels(publication, connectedChannelIds);
  if (!channels.length) {
    return <span className="text-[11px] text-[var(--pa-faint)]">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {channels.map((channelId) => {
        const kind = channelIndicatorForPublication(
          channelId,
          publication,
          connectedChannelIds,
        );
        if (!kind) return null;
        const label = channelIndicatorAriaLabel(channelId, kind);
        return (
          <span
            key={channelId}
            title={label}
            aria-label={label}
            className="relative inline-flex shrink-0"
          >
            <ChannelLogo channelId={channelId} size={28} />
            <ChannelStatusBadge kind={kind} />
            <span className="sr-only">{CHANNEL_META[channelId].name}</span>
          </span>
        );
      })}
    </div>
  );
}
