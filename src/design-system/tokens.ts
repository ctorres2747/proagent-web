/**
 * ProAgent design tokens — shared across the ProAgent suite (mobile, web,
 * AgenteInmobiliario). Mirror of the CSS custom properties in
 * `app/globals.css` (`--pa-*`). Values from the desktop hi-fi handoff.
 */
export const tokens = {
  color: {
    navy: "#0A3D62",
    navyHover: "#0C4A78",
    accent: "#1E8E5A",
    warning: "#D97B2B",
    warningInk: "#B5651D",
    danger: "#C23B2B",
    ink: "#16212B",
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
