/**
 * ProAgent design tokens — shared across the ProAgent suite (mobile, web,
 * AgenteInmobiliario). Mirror of the CSS custom properties in
 * `app/globals.css` (`--pa-*`). Values from the desktop hi-fi handoff.
 */
export const tokens = {
  color: {
    navy: "#0A3D62",
    navyHover: "#0C4A78",
    navyPressed: "#082F4C",
    navy050: "#EAF0F5",
    accent: "#1E8E5A",
    emeraldBright: "#2FC98A",
    emeraldInk: "#06331F",
    warning: "#D9A227",
    warningInk: "#B5651D",
    danger: "#C23B2B",
    ink: "#16212B",
    textSecondary: "#45525E",
    textMuted: "#9AA6B2",
    muted: "#5B6B79",
    faint: "#9AA6B2",
    surface: "#FFFFFF",
    bg: "#F6F7F9",
    bgAlt: "#EEF0F3",
    border: "#E4E8EC",
    successBg: "#E6F5EC",
    warningBg: "#FCEEE0",
    dangerBg: "#FBE7E4",
    infoBg: "#E7EEF4",
    onNavyPrimary: "#FFFFFF",
    onNavySecondary: "rgba(255,255,255,0.72)",
    onNavyMuted: "rgba(255,255,255,0.42)",
    onNavyDisabled: "rgba(255,255,255,0.34)",
    focusRing: "#7FE3B8",
  },
  font: {
    sans: "var(--font-plus-jakarta), system-ui, sans-serif",
  },
  radius: {
    sm: "8px",
    md: "10px",
    lg: "12px",
    xl: "16px",
    pill: "20px",
  },
} as const;

export type Tokens = typeof tokens;
