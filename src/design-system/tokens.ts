/**
 * ProAgent design tokens — conceptually shared with ProAgent Mobile.
 * These mirror the CSS custom properties declared in `app/globals.css`
 * (`--pa-*`) so they can also be consumed from TS/JS when needed.
 */
export const tokens = {
  color: {
    navy: "#0A3D62",
    accent: "#1E8E5A",
    warning: "#D97B2B",
    danger: "#C23B2B",
    bg: "#F6F7F9",
    surface: "#FFFFFF",
    ink: "#0F172A",
    muted: "#64748B",
    border: "#E2E8F0",
  },
  font: {
    sans: "var(--font-plus-jakarta), system-ui, sans-serif",
  },
  radius: {
    md: "12px",
    lg: "16px",
  },
} as const;

export type Tokens = typeof tokens;
