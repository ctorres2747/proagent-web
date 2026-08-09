"use client";

export default function PublicationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--pa-navy)]">Publicaciones</h1>
      <p className="mt-1 text-sm text-[var(--pa-muted)]">
        El flujo de publicación multicanal de escritorio (WASI · Facebook ·
        Instagram · WhatsApp · Web) llega en{" "}
        <span className="font-medium text-[var(--pa-ink)]">E-WEB-01</span>.
      </p>

      <div className="mt-6 rounded-2xl border border-dashed border-[var(--pa-border)] bg-[var(--pa-surface)] p-10 text-center">
        <div className="text-sm font-medium text-[var(--pa-ink)]">
          Placeholder — E-WEB-01
        </div>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--pa-muted)]">
          Aquí vivirá el asistente de publicación: selección de propiedad,
          contenido, canales, vista previa y resultados.
        </p>
      </div>
    </div>
  );
}
