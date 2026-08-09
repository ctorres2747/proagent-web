import { CHANNEL_META, STATUS_META } from "@/design-system/channels";
import type { PropertyChannel } from "@/services/interfaces/properties";

/** Compact per-channel status chips (W / F / I / Wa / Web) colored by state. */
export function ChannelChips({ channels }: { channels: PropertyChannel[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {channels.map((c) => (
        <span
          key={c.id}
          title={`${CHANNEL_META[c.id].name}: ${STATUS_META[c.status].label}`}
          className={`rounded-md px-2 py-1 text-[10px] font-bold ${STATUS_META[c.status].chip}`}
        >
          {CHANNEL_META[c.id].short}
        </span>
      ))}
    </div>
  );
}
