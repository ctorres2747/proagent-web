import Image from "next/image";
import type { ChannelId } from "@/design-system/channels";
import { CHANNEL_META } from "@/design-system/channels";

interface ChannelLogoProps {
  channelId: ChannelId;
  size?: number;
  className?: string;
}

/**
 * Brand logos in a fixed square frame so circular/glyph marks align
 * with square app-icon assets across cards and chips.
 */
export function ChannelLogo({
  channelId,
  size = 20,
  className = "",
}: ChannelLogoProps) {
  const meta = CHANNEL_META[channelId];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[22%] ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={meta.logo}
        alt={meta.name}
        width={size}
        height={size}
        className="block h-full w-full object-contain"
      />
    </span>
  );
}
