export function deletePropertyConfirmMessage(titulo: string): string {
  return (
    `¿Seguro que quieres eliminar «${titulo}»?\n\n` +
    "La propiedad se borrará de forma permanente de ProAgent y también se eliminará " +
    "de los canales donde esté publicada (WASI, Instagram, WhatsApp y Facebook Marketplace).\n\n" +
    "Esta acción no se puede deshacer."
  );
}

export function deletePropertyConfirmTitle(): string {
  return "Eliminar propiedad";
}

export function deletePropertyPendingNoticeMessage(variant: "list" | "detail"): string {
  if (variant === "detail") {
    return (
      "Eliminando de Marketplace… la propiedad se borrará automáticamente al " +
      "confirmarse (puede tardar unos minutos)."
    );
  }
  return (
    "Una propiedad se está terminando de eliminar en segundo plano " +
    "(cerrando el anuncio de Marketplace) — puede tardar unos minutos en " +
    "desaparecer de esta lista."
  );
}
