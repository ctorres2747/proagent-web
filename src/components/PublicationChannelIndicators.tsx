import { CHANNEL_META } from "@/design-system/channels";
import { ChannelLogo } from "@/components/ChannelLogo";
import {
  channelIndicatorAriaLabel,
  channelIndicatorForPublication,
  type ChannelIndicatorKind,
} from "@/lib/publicationDisplay";
import type { Publication } from "@/services/interfaces/publications";

const INDICATOR_CLASS: Record<ChannelIndicatorKind, string> = {
  published: "text-[var(--pa-accent)]",
  pending: "text-[#D97706]",
  error: "text-[var(--pa-danger)]",
  progress: "text-[#D97706]",
  scheduled: "text-[#D97706]",
};

function IndicatorIcon({ kind }: { kind: ChannelIndicatorKind }) {
  const className = `h-3 w-3 shrink-0 ${INDICATOR_CLASS[kind]}`;
  if (kind === "published") {
    return (
      <svg viewBox="0 0 20 20" className={className} aria-hidden>
        <path
          fill="currentColor"
          d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
        />
      </svg>
    );
  }
  if (kind === "error") {
    return (
      <svg viewBox="0 0 20 20" className={className} aria-hidden>
        <path
          fill="currentColor"
          d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
        />
      </svg>
    );
  }
  if (kind === "progress") {
    return (
      <span
        className={`inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${INDICATOR_CLASS[kind]}`}
        aria-hidden
      />
    );
  }
  // pending / scheduled — alerta amarilla
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5.75a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0v-4.5A.75.75 0 0 0 10 5.75Zm0 8a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
      />
    </svg>
  );
}

/** Íconos de canal con check / alerta / error para la lista de Publicación (Sprint 045). */
export function PublicationChannelIndicators({
  publication,
}: {
  publication?: Publication;
}) {
  if (!publication?.selectedChannels?.length) {
    return <span className="text-[11px] text-[var(--pa-faint)]">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {publication.selectedChannels.map((channelId) => {
        const kind = channelIndicatorForPublication(channelId, publication);
        if (!kind) return null;
        const label = channelIndicatorAriaLabel(channelId, kind);
        return (
          <span
            key={channelId}
            title={label}
            aria-label={label}
            className="inline-flex items-center gap-0.5"
          >
            <ChannelLogo channelId={channelId} size={18} />
            <IndicatorIcon kind={kind} />
            <span className="sr-only">{CHANNEL_META[channelId].name}</span>
          </span>
        );
      })}
    </div>
  );
}
