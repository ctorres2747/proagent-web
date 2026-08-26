/** Opciones Entrega Inmobiliaria — espejo de `backend/entrega_drive_options.py`. */

export const DRIVE_PARKING_OPTIONS = [
  { value: "sin_parqueadero", label: "Sin parqueadero" },
  { value: "privado_cubierto", label: "Privado cubierto" },
  { value: "privado_descubierto", label: "Privado descubierto" },
  { value: "comunal_cubierto", label: "Comunal asignado cubierto" },
  { value: "comunal_descubierto", label: "Comunal asignado descubierto" },
  { value: "sorteo_comunal", label: "Por sorteo / comunal" },
  { value: "visitantes", label: "Parqueadero visitantes" },
] as const;

export const DRIVE_PROPERTY_LIENS_OPTIONS = [
  { value: "ninguna", label: "Sin afectaciones / libre de gravámenes" },
  { value: "hipoteca", label: "Hipoteca" },
  { value: "afectacion_vivienda_familiar", label: "Afectación a vivienda familiar" },
  { value: "patrimonio_familia", label: "Patrimonio de familia" },
  { value: "hipoteca_vivienda_familiar", label: "Hipoteca + afectación a vivienda familiar" },
  { value: "hipoteca_patrimonio_familia", label: "Hipoteca + patrimonio de familia" },
  { value: "usufructo", label: "Usufructo" },
  { value: "servidumbre", label: "Servidumbre" },
  { value: "embargo", label: "Embargo" },
  { value: "leasing_habitacional", label: "Leasing habitacional" },
  { value: "fiducia", label: "Fiducia inmobiliaria" },
  { value: "sucesion_en_tramite", label: "Sucesión / herencia en trámite" },
  { value: "proceso_judicial", label: "Proceso judicial / litigio" },
  { value: "limitacion_registro", label: "Otra limitación al dominio (registro)" },
  { value: "otra", label: "Otra afectación" },
] as const;
