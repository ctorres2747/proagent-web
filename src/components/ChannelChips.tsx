import { CHANNEL_META, STATUS_META } from "@/design-system/channels";
import type { PropertyChannel } from "@/services/interfaces/properties";
import { ChannelLogo } from "@/components/ChannelLogo";

/** Compact per-channel status chips with logos. */
export function ChannelChips({ channels }: { channels: PropertyChannel[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {channels.map((c) => (
        <span
          key={c.id}
          title={`${CHANNEL_META[c.id].name}: ${STATUS_META[c.status].label}`}
          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-bold ${STATUS_META[c.status].chip}`}
        >
          <ChannelLogo channelId={c.id} size={18} />
          <span className="sr-only">{CHANNEL_META[c.id].name}</span>
        </span>
      ))}
    </div>
  );
}
