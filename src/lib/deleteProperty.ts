export function deletePropertyConfirmMessage(titulo: string): string {
  return (
    `¿Eliminar permanentemente «${titulo}»?\n\n` +
    "Se borrará de la base de datos y se quitará de los canales donde esté publicada " +
    "(WASI, Instagram, WhatsApp, Facebook Marketplace). Esta acción no se puede deshacer."
  );
}

export function deletePropertyConfirmTitle(): string {
  return "Eliminar propiedad";
}
