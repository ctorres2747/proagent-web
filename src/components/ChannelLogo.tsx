import type { ChannelId } from "@/design-system/channels";
import { CHANNEL_META } from "@/design-system/channels";

interface ChannelLogoProps {
  channelId: ChannelId;
  size?: number;
  className?: string;
}

/**
 * Brand logos in a fixed square frame.
 * Uses native <img> (not next/image) so SVG stays vector — next/image
 * can rasterize SVGs and look pixelated at card sizes.
 */
export function ChannelLogo({
  channelId,
  size = 20,
  className = "",
}: ChannelLogoProps) {
  const meta = CHANNEL_META[channelId];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local SVG must stay vector
    <img
      src={meta.logo}
      alt={meta.name}
      width={size}
      height={size}
      draggable={false}
      className={`block shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
