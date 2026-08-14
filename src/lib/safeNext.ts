/**
 * Allowlist for post-auth redirects (handoff + login `next` param).
 * Blocks open redirects: absolute URLs, protocol-relative paths, etc.
 */

const ALLOWED_PATH_PATTERNS: RegExp[] = [
  /^\/$/,
  /^\/properties$/,
  /^\/properties\/\d+$/,
  /^\/publications$/,
];

/** Returns a safe relative path or null if the value is not allowed. */
export function sanitizeNextPath(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;

  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("\\")) return null;
  if (/[\x00-\x1f]/.test(trimmed)) return null;

  const pathname = trimmed.split(/[?#]/)[0];
  if (!ALLOWED_PATH_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return null;
  }

  return pathname;
}

/** Build `/login` with an optional safe `next` query param. */
export function loginUrlWithNext(next: string | null | undefined): string {
  const safe = sanitizeNextPath(next);
  if (!safe) return "/login";
  return `/login?next=${encodeURIComponent(safe)}`;
}
