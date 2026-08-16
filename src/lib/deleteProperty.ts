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
