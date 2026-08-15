import Image from "next/image";
import type { ChannelId } from "@/design-system/channels";
import { CHANNEL_META } from "@/design-system/channels";

interface ChannelLogoProps {
  channelId: ChannelId;
  size?: number;
  className?: string;
}

/** Brand logos from /public/channels (local assets; no hotlink). */
export function ChannelLogo({
  channelId,
  size = 20,
  className = "",
}: ChannelLogoProps) {
  const meta = CHANNEL_META[channelId];
  return (
    <Image
      src={meta.logo}
      alt={meta.name}
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
