import type { AgentSession } from "@/features/auth/types";

/** First token of display name (not email). */
export function firstName(session: AgentSession | null | undefined): string {
  const raw = session?.nombre?.trim() || session?.username?.trim() || "";
  if (!raw) return "agente";
  const token = raw.split(/\s+/)[0];
  if (token.includes("@")) {
    return token.split("@")[0] || "agente";
  }
  return token;
}

export function agentInitials(session: AgentSession | null | undefined): string {
  const name = session?.nombre?.trim() || session?.username?.trim() || "";
  if (!name) return "PA";
  const parts = name.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "PA";
}

/** Internal Proinversores staff — may see Captación link (Kanban). */
export function isProinversoresStaff(
  session: AgentSession | null | undefined,
): boolean {
  if (!session) return false;
  const email = (session.email ?? session.username).toLowerCase();
  return (
    email.endsWith("@proinversores.com") ||
    email.endsWith("@proinversores.co") ||
    email.includes("@proinversores.")
  );
}
