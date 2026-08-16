import { resolveScrapePortal } from "@/design-system/portals";

interface PortalLogoProps {
  portal: string;
  size?: number;
  className?: string;
  /** Si true, muestra el nombre junto al logo (drawer). */
  showLabel?: boolean;
}

/**
 * Logo oficial del portal de captación (Facebook / MercadoLibre).
 * Mismo patrón que ChannelLogo: SVG nativo para nitidez en cards compactas.
 */
export function PortalLogo({
  portal,
  size = 16,
  className = "",
  showLabel = false,
}: PortalLogoProps) {
  const meta = resolveScrapePortal(portal);

  if (!meta) {
    return (
      <span
        className={`text-[11px] text-[var(--pa-muted)] ${className}`}
        title={portal}
      >
        {portal}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      title={meta.name}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG vector */}
      <img
        src={meta.logo}
        alt={meta.name}
        aria-label={meta.name}
        width={size}
        height={size}
        draggable={false}
        className="block shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
      {showLabel ? (
        <span className="text-[11px] font-semibold text-[var(--pa-muted)]">
          {meta.name}
        </span>
      ) : null}
    </span>
  );
}
