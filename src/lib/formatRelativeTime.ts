/** "Hace 2h" / "Ayer" / "Hace 3 días" — solo actividad PASADA (nunca una cita
 * futura, ver handoff Clientes §0.5). */
export function formatRelativeTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return null;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "short",
  }).format(d);
}

/** "Hoy, 4:00 p. m." / "Mañana, 10:00 a. m." / "12 oct, 3:00 p. m." — para
 * la próxima cita (siempre futura), solo se usa en el panel, nunca en la
 * tarjeta del Kanban. */
export function formatAppointment(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const hora = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  const hoy = new Date();
  const esMismoDia = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (esMismoDia(d, hoy)) return `Hoy, ${hora}`;
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);
  if (esMismoDia(d, manana)) return `Mañana, ${hora}`;
  const fecha = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "short",
  }).format(d);
  return `${fecha}, ${hora}`;
}
