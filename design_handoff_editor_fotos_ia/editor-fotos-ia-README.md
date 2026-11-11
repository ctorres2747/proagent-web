# Handoff — Visor y editor de fotos con IA (Inventario › Fotos y Video)

> **Solo handoff visual (UX).** Medidas, colores, estados de pantalla y flujo de la maqueta.  
> **No implementar** API, modelo de datos ni reglas de negocio desde este archivo.  
> **Fuente de verdad:** [`sprints/067-inventario-editor-fotos-ia.md`](../sprints/067-inventario-editor-fotos-ia.md) (contrato `fichas_fotos`, `/api/web/properties/...`, cupo, canales, deshacer).

**Producto:** ProAgent Web (Next.js 15, App Router), dentro del shell v2.
**Pantalla:** **`/properties/[id]`** (inventario actual), pestaña **Fotos y Video** — el diseño original decía `/inventory/[id]`; ignorar para dev.
**Qué se agrega:** al hacer clic en una foto se abre una **ventana flotante** sobre la pantalla, con el fondo difuminado. En la ventana se puede ver la foto en grande, navegar entre fotos, descargarla y aplicarle **retoques con IA**:
- Mejorar luz y color
- Enderezar
- Quitar objetos
- Cielo despejado

**Referencia interactiva:** [`Inventario - Editor de Fotos IA.dc.html`](Inventario%20-%20Editor%20de%20Fotos%20IA.dc.html). Retoques simulados con CSS. La maqueta puede mostrar **Deshacer en cada herramienta**; en producción solo se deshace el **último paso** de la cadena (ver sprint).

**Capturas:**
- `01-grilla-fotos.png`: grilla con la acción de ampliar.
- `02-editor-abierto.png`: ventana flotante abierta.
- `03-luz-aplicada.png`: después de aplicar un retoque.
- `04-comparar.png`: comparación Original / Retocada.
- `05-pincel-quitar-objetos.png`: modo pincel de Quitar objetos.

---

## 1. Antes → después

**Ver la foto en grande:** antes no había forma. Ahora al hacer clic en la foto se abre la ventana flotante.

**Descargar:** antes solo se podía bajar el zip de todas las fotos. Ahora también se descarga una sola foto desde la ventana. El zip se mantiene.

**Retocar:** antes no existía. Ahora hay 4 retoques con IA, con vista previa, comparación y opción de deshacer.

**En la grilla:**
- Al pasar el mouse o con el foco, aparece un ícono de ampliar abajo a la derecha. El cursor cambia a `zoom-in`.
- Las fotos retocadas muestran el badge **✦ IA**.
- Junto al texto de ayuda aparece el contador "n de N retocadas con IA".

**Se mantiene sin cambios:** portada, reordenar (flechas y arrastrar), eliminar, número de orden, badge REEL, selector de ambiente y "Descargar fotos (.zip)". Esta iteración no cambia nada de eso.

---

## 2. Cambios en la grilla

**Texto de ayuda:** al texto actual se le agrega al final: "Haz clic en una foto para verla en grande, descargarla o retocarla con IA."

**Chip contador:**
- Va a la derecha del texto de ayuda.
- Fondo `#E6F5EE`, texto `#1E6B47` 13px/700, padding `9px 14px`, radio 10px.
- Lleva el ícono ✦ (sparkles, §9) y el texto "{n} de {total} retocadas con IA".
- Solo se muestra si n > 0. **TBD:** confirmar si se muestra también con n = 0. Recomendación: ocultarlo.

**Miniatura:**
- `cursor: zoom-in`.
- El clic en la imagen abre el editor en esa foto.
- Los controles que ya existen (flechas, ×, selector) llevan `stopPropagation` para no abrir el editor.

**Botón ampliar:**
- 34×34, radio 9px, fondo `rgba(8,26,42,.72)`, ícono maximize de 16px blanco.
- Posición `right:10; bottom:10`. Si choca con el número de orden actual, mover el número a la izquierda o al centro.
- Se muestra con `:hover` y `:focus-visible` de la tarjeta. En táctil se muestra siempre.

**Badge ✦ IA:**
- Arriba a la derecha. Fondo `#2FC98A`, texto `#06331F` 11px/800, padding `4px 8px`, radio 7px.
- Si la foto también es REEL, se apila debajo del badge REEL con `gap:6px`.
- Se muestra cuando la foto tiene una versión retocada **guardada**.

**Accesibilidad:**
- La miniatura es un `<button aria-label="Ampliar foto {n}: {ambiente}">`.
- `Enter` o `Space` abren el editor.

---

## 3. Ventana flotante: estructura y medidas

```
┌ overlay (fixed, inset 0) — rgba(10,30,50,.42) + backdrop-filter: blur(10px) ─────────────┐
│   ┌ ventana  min(1320px, 100%) × min(820px, 100%) — #0B1620, radio 18 ────────────────┐  │
│   │ TOPBAR 56px: [Ambiente / Foto n de N · código] [Original|Retocada|Comparar] [⬇][×] │  │
│   ├───────────────────────────────────────────────────────────┬─────────────────────┤  │
│   │  ‹   ┌───────── FOTO (4:3, contain-cover) ─────────┐   › │ RETOQUE CON IA       │  │
│   │      │                                              │     │ ☀ Mejorar luz  [Aplicar]│
│   │      └──────────────────────────────────────────────┘     │ ⊞ Enderezar    [Aplicar]│
│   ├───────────────────────────────────────────────────────────┤ ⌫ Quitar obj.  [Pincel]│
│   │ FILMSTRIP 76px: miniaturas 68×50                           │ ☁ Cielo        [Aplicar]│
│   │                                                           │ [Guardar en la publicación]│
│   └───────────────────────────────────────────────────────────┴─────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**Overlay:**
- `position:fixed; inset:0; z-index:50`, padding 24px.
- Fondo `rgba(10,30,50,.42)` con `backdrop-filter: blur(10px)` (+ `-webkit-`). La pantalla de trabajo se ve difuminada detrás.
- Si el navegador no soporta blur, se usa de fallback `rgba(10,30,50,.7)`.
- El clic en el overlay (fuera de la ventana) cierra.

**Ventana:**
- `width:min(1320px,100%)`, `height:min(820px,100%)`.
- Fondo `#0B1620`, radio 18px, `overflow:hidden`, sombra `0 30px 80px rgba(8,26,42,.45)`.
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` = título del ambiente.

**Entrada:** opacidad 0 → 1 y `scale(.98)` → 1 en 180ms ease-out. El overlay hace solo fade. Con `prefers-reduced-motion` va sin animación.

**Columnas:**
- Zona de foto: `flex:1; min-width:0`.
- Panel de IA: `width: clamp(270px, 26vw, 330px)`, fondo blanco.

**Scroll del body:** bloqueado mientras la ventana está abierta.

### 3.1 Topbar (56px, borde inferior `rgba(255,255,255,.08)`, padding `0 20px`, gap 16)

**Título:**
- Línea 1: ambiente de la foto, 15px/800 blanco, nowrap. Si no tiene ambiente: "Foto {n}".
- Línea 2: "Foto {n} de {N} · {código}", 12px/600 `rgba(255,255,255,.6)`.

**Segmented:** solo se muestra si la foto tiene retoques (en borrador o guardados).
- Contenedor: fondo `rgba(255,255,255,.08)`, radio 10px, padding 3px.
- Botones: 34px de alto, padding `0 14px`, 13px/700.
- Activo: fondo blanco, texto `#0A3D62`. Inactivo: transparente, texto `rgba(255,255,255,.75)`.
- Opciones:
  - **Original:** foto sin retoques.
  - **Retocada** (por defecto después de aplicar un retoque): foto con los retoques.
  - **Comparar:** cortina antes/después (§5).

**Descargar:**
- Botón de 40px de alto, borde `rgba(255,255,255,.18)`, radio 10px, ícono download de 16px + "Descargar".
- Descarga **la versión que se está viendo**: la original o la retocada. **TBD:** confirmar. Recomendación: así; en Comparar, descarga la retocada.
- Nombre del archivo: `{código}-{n}-{ambiente-slug}{-ia}.jpg`. Ej. `F-129-2-cocina-ia.jpg`.

**Cerrar:** 40×40, fondo `rgba(255,255,255,.08)`, hover `.16`, ícono X, `title="Cerrar (Esc)"`, `aria-label="Cerrar"`.

### 3.2 Zona de foto

**Contenedor:**
- `flex:1; padding:16px 68px`, con la foto centrada.
- Caja de la foto: `max-width:1100px; aspect-ratio:4/3; max-height:100%`, radio 12px, fondo negro.
- **En producción usar `object-fit: contain`**, para ver la foto completa sin recorte. La maqueta usa `cover` solo por estética.

**Flechas ‹ ›:**
- Círculos de 48px, fondo `rgba(255,255,255,.1)`, hover `.2`, ícono chevron de 20px.
- Posición `left/right:16px`, centradas en vertical.
- La navegación es circular (de la última pasa a la primera).

**Filmstrip:**
- 76px de alto, borde superior `rgba(255,255,255,.08)`, gap 8, centrado.
- Miniaturas de 68×50, radio 8px.
- Activa: `outline:2px solid #2FC98A; outline-offset:2px`, opacidad 1. Las demás, opacidad .6.
- Las retocadas llevan un punto ✦ de 16px en `#2FC98A` arriba a la derecha.
- Con más de 12 fotos: scroll horizontal, manteniendo visible la activa.

**Al cambiar de foto:** se sale de Comparar y del pincel, se borra el trazo y la vista vuelve a "Retocada" si la foto tiene retoques.

### 3.3 Panel "Retoque con IA"

**Encabezado:**
- Padding `16px 18px 12px`, borde inferior `#EEF0F3`.
- Título con el ícono ✦ en `#2FC98A` y "Retoque con IA" 16px/800 `#0A3D62`.
- Debajo: "La foto original siempre se conserva.", 12.5px `#5B6B79`.

**Lista de herramientas:** padding `12px 14px`, gap 8. **Todo cabe sin scroll** en una ventana de 820px de alto.

**Tarjeta de herramienta:**
- Borde 1px `#E4E8EC`, radio 12px, padding `10px 12px`. Es una sola fila con:
  - Ícono: 32×32, radio 9px, fondo `#EAF0F5`, ícono `#0A3D62`.
  - Nombre: 13.5px/700, nowrap.
  - Subtítulo: 11.5px `#5B6B79`, una línea con elipsis. El texto completo va en `title`.
  - Botón a la derecha: 30px de alto, padding `0 12px`, radio 8px, 12px/700, nowrap.
- **Estado normal:** botón primario (fondo `#0A3D62`, texto blanco).
- **Estado aplicado:** borde `#2FC98A`, fondo `#F2FBF7`, subtítulo "Aplicado". El botón pasa a "Deshacer", con fondo blanco y texto `#45525E`.
- **Estado deshabilitado:** opacidad .55, botón con fondo `#EEF0F3` y texto `#9AA6B2`, sin acción. El subtítulo explica el motivo.
- **Mientras procesa:** todos los botones quedan inactivos (§6).

**Pie:**
- Padding `12px 14px`, fondo `#FAFBFC`, borde superior `#EEF0F3`.
- **Guardar en la publicación:** 40px de alto, radio 10px, 13.5px/800, blanco, nowrap.
  - Activo (fondo `#0A3D62`) solo si hay retoques sin guardar.
  - Si no, fondo `#C9D0D7` con `cursor:not-allowed`.
  - Después de guardar, el botón muestra "Guardada ✓".
- Debajo: "Reemplaza la foto en la publicación y en el reel.", 11.5px `#5B6B79`, centrado.

---

## 4. Herramientas de IA

| # | Herramienta | Ícono | Subtítulo | Botón | Aplica a | Parámetros al servicio |
|---|---|---|---|---|---|---|
| 1 | Mejorar luz y color | sun | Exposición, sombras y balance | Aplicar | Todas | `{ op: 'enhance_light' }` |
| 2 | Enderezar | grid / ruler | Paredes y marcos verticales | Aplicar | Todas | `{ op: 'straighten' }` (corrige verticales y recorta los bordes) |
| 3 | Quitar objetos | eraser | Cables, carros, desorden | Pincel | Todas | `{ op: 'remove_objects', mask: PNG }` (§4.1) |
| 4 | Cielo despejado | cloud | Cielo gris → azul | Aplicar | Solo exteriores | `{ op: 'sky_replace' }` |

**Exteriores:** son las fotos con ambiente `fachada`, `patio`, `terraza`, `balcon` o `zona_comun`. En las demás, la herramienta se ve deshabilitada con el subtítulo "Solo fotos exteriores".
- **TBD:** si no tiene ambiente, ¿se habilita? Recomendación: sí, y si el servicio no detecta cielo, avisar "No se detectó cielo en esta foto".

**Los retoques se acumulan:** se aplican en el orden en que se piden, siempre sobre el último resultado. Por ejemplo, luz → quitar objetos → enderezar.

**Deshacer en una herramienta:** quita **ese** retoque. El backend re-renderiza la cadena sin él, o vuelve al resultado anterior si era el último.
- **Recomendación para la v1:** guardar cada paso intermedio y permitir deshacer solo el último. Los demás botones quedan en "Aplicado" sin opción de deshacer hasta quitar los posteriores.
- **TBD:** confirmar con backend.

### 4.1 Quitar objetos (pincel)

1. Clic en **Pincel**:
   - Se activa el modo pincel. La tarjeta queda resaltada (borde `#2FC98A`), con el subtítulo "Pinta sobre la foto".
   - Debajo aparece la fila **Pincel** con un slider de tamaño (20–90 px, por defecto 44) y el link "Limpiar".
   - Sobre la foto aparece la indicación centrada arriba "Pinta sobre el objeto que quieres quitar" (fondo `rgba(8,26,42,.82)`, 13px/700, radio 10px).
   - El cursor cambia a `crosshair`. En producción, mejor un cursor circular del tamaño del pincel.
2. **Pintar:** con mouse down + move, o con touch. El trazo se ve en `rgba(47,201,138,.45)`, con forma redonda y del diámetro del slider.
   - **Implementación:** un `<canvas>` del tamaño de la foto mostrada, con `lineCap: round` y `globalCompositeOperation: source-over`.
   - Al enviar, la máscara se re-escala a la resolución original: PNG en blanco y negro, blanco = zona a borrar.
3. **Botón del modo pincel:**
   - Sin trazo: "Cancelar" (gris), sale del modo.
   - Con trazo: **"Quitar"** (primario), envía la máscara.
   - "Limpiar" borra el trazo sin salir del modo.
4. **Al terminar:** el trazo desaparece, se sale del modo y la tarjeta queda como aplicada. Su botón pasa a **"Otro"** para quitar otro objeto, lo que vuelve al paso 1 sobre el resultado.
5. **Atajos:** `Esc` sale del modo pincel (no cierra la ventana) y `[` / `]` cambian el tamaño del pincel. **TBD.**

---

## 5. Comparar (cortina antes/después)

- Capa inferior: la **original**. Capa superior: la **retocada**, recortada con `clip-path: inset(0 0 0 {split}%)`. Es decir, la original queda a la izquierda y la retocada a la derecha.
- **Línea divisoria:** 2px blanca. **Manija:** círculo de 40px blanco, ícono ‹› en `#0A3D62`, sombra `0 4px 14px rgba(0,0,0,.35)`.
- **Arrastre:** desde cualquier punto de la foto, con mouse y touch (`pointer events` con `setPointerCapture`). El valor `split` va de 0 a 100 y empieza en 50.
- **Etiquetas:** "Original" arriba a la izquierda (fondo `rgba(8,26,42,.75)`) y "Retocada" arriba a la derecha (fondo `#2FC98A`, texto `#06331F`). Ambas en 12px/800, padding `5px 10px`, radio 8px.
- **Accesibilidad:** la manija es `role="slider"` con `aria-valuenow`, y se mueve con ← / → de a 5%. Mientras se está en Comparar, las flechas del teclado mueven la cortina y no cambian de foto.
- Al entrar a Comparar se apaga el pincel.

---

## 6. Procesamiento

- **Sobre la foto:**
  - Capa `rgba(8,26,42,.45)` con una franja de escaneo: degradado `transparent 40% → rgba(47,201,138,.28) 50% → transparent 60%`, que baja en 1.4s lineal en loop.
  - Al centro, una tarjeta `rgba(8,26,42,.88)`, radio 12px, padding `14px 20px`, con un spinner de 18px (borde `rgba(255,255,255,.25)` y la parte superior en `#2FC98A`) y el texto:
    - "Mejorando luz…"
    - "Enderezando…"
    - "Quitando objetos…"
    - "Cambiando cielo…"
- Mientras procesa: se bloquean las herramientas, Guardar, el pincel y el segmented. Se puede navegar a otra foto y el proceso sigue en segundo plano. **TBD:** confirmar. Recomendación: sí, y en el filmstrip mostrar un spinner pequeño sobre la miniatura que está procesando.
- **Al terminar:**
  - Se muestra la vista "Retocada".
  - Aparece un aviso de 2.6s "{Acción} · listo", dentro de la ventana, abajo al centro (a 96px del borde): fondo `#16212B`, texto 13px/600 blanco, radio 12px.
- **Error:**
  - Aviso "No se pudo {acción}. Intenta de nuevo.", con la opción **Reintentar**.
  - La foto queda como estaba antes.
- **Tiempo máximo:** 60 s. Después, se considera error.
- **TBD:** proveedor de IA. Opciones: un servicio de edición de imágenes con inpainting (para quitar objetos y cambiar el cielo) más una corrección automática de luz, que puede ser local (sharp / auto-levels) para abaratar.

---

## 7. Guardar y versiones

- **Mientras no se guarde, los retoques son un borrador.** Viven en el editor y en el backend como una versión `draft`.
- **Guardar en la publicación:**
  - La versión retocada pasa a ser la **foto activa** de la publicación: grilla, canales, portada de Instagram y reel.
  - La original se conserva y se puede volver a ella con el segmented "Original" → Guardar. **TBD:** o con una acción "Restaurar original". Recomendación: agregarla luego en el menú de la foto.
  - Aviso: "Foto actualizada en la publicación".
- **Cerrar con un borrador sin guardar:** confirmar con "Tienes retoques sin guardar en {n} foto(s). ¿Salir sin guardar?" → [Seguir editando] [Salir sin guardar].
  - **TBD:** la maqueta no lo pide; en producción se recomienda.
- **Fotos ya publicadas en canales:** guardar no re-publica automáticamente. **TBD:** recomendación: mostrar en Canales el aviso "Hay fotos actualizadas. Vuelve a publicar para reflejarlas".

---

## 8. Teclado y foco

| Tecla | Acción |
|---|---|
| `Esc` | Sale del modo pincel; si no está activo, cierra la ventana (con confirmación si hay borrador) |
| `←` / `→` | Foto anterior / siguiente. En Comparar, mueve la cortina |
| `Tab` | Recorre topbar → flechas → filmstrip → herramientas → Guardar, con el foco atrapado en la ventana |

- **Al abrir:** el foco va al botón Cerrar. **Al cerrar:** vuelve a la miniatura que lo abrió.
- **Foco visible:** `outline: 2px solid #2FC98A; outline-offset: 2px` en todos los controles.
- **Contraste:** el texto blanco sobre `#0B1620` y el texto `#0A3D62` sobre blanco cumplen AA.

---

## 9. Íconos

Usar el mismo set de líneas del resto de ProAgent, con trazo 2–2.4 y `stroke-linecap/linejoin: round`. Si el proyecto usa **lucide-react**:

| Uso | lucide |
|---|---|
| IA / sparkles | `Sparkles` |
| Ampliar | `Maximize2` |
| Descargar | `Download` |
| Cerrar | `X` |
| Anterior / Siguiente | `ChevronLeft` / `ChevronRight` |
| Comparar (manija) | `ChevronsLeftRight` |
| Mejorar luz | `Sun` |
| Enderezar | `Ruler` o `Grid2x2` |
| Quitar objetos | `Eraser` |
| Cielo | `Cloud` |

La maqueta usa glifos de texto (☀ ⊞ ⌫ ☁) solo como placeholder. **En producción usar los íconos de lucide**, en 16px dentro de su caja de 32px.

---

## 10. Responsive

**Más de 1100px:** el layout de la maqueta.

**Entre 768 y 1100px:**
- El overlay pasa a padding 12.
- El panel usa `clamp(270px, 26vw, 330px)`.
- Las flechas se reducen a 40px y la zona de foto a padding `12px 52px`.

**Menos de 768px** (web móvil): **TBD**. Recomendación:
- La ventana ocupa toda la pantalla (`100dvh`, radio 0).
- El panel de IA pasa a ser una **hoja inferior** plegable con las 4 herramientas en una fila de botones de 44px.
- La foto se navega con swipe.
- Comparar se arrastra con el dedo.
- Todos los botones deben medir al menos 44px.

**App móvil (Expo):** fuera de alcance en esta iteración.

---

## 11. Modelo de datos

> **Obsoleto para implementación** — conservado como boceto de diseño. Usar § *Modelo de datos* en [`sprints/067-inventario-editor-fotos-ia.md`](../sprints/067-inventario-editor-fotos-ia.md) (`fichas_fotos.archivo` / `archivo_original`).

```ts
interface PropertyPhoto {
  id: string;
  propertyId: string;
  order: number;                 // 1 = portada
  room?: RoomType;               // ya existe (ambiente del reel)
  originalUrl: string;           // nunca se sobrescribe
  activeVersionId?: string;      // null = se usa la original
  versions: PhotoVersion[];
}

interface PhotoVersion {
  id: string;
  photoId: string;
  status: 'draft' | 'saved' | 'discarded';
  url: string;                   // resultado final de la cadena
  steps: PhotoEditStep[];        // en orden
  createdBy: string;
  createdAt: string;
  savedAt?: string;
}

interface PhotoEditStep {
  op: 'enhance_light' | 'straighten' | 'remove_objects' | 'sky_replace';
  maskUrl?: string;              // solo remove_objects
  resultUrl: string;             // resultado de este paso (para deshacer)
  provider: string;
  durationMs: number;
  status: 'done' | 'error';
}
```

**"Retocada" (badge ✦ IA):** cuando `activeVersionId != null` y esa versión está en `status = 'saved'`.

---

## 12. API sugerida

> **Obsoleto para implementación** — usar solo rutas `/api/web/properties/{fichaId}/photos/{fotoId}/...` del sprint 067.

- `POST /api/photos/:photoId/edits` con `{ op, mask? }` (máscara en multipart) → `{ versionId, stepId, status:'processing' }`.
  - Si no hay borrador, crea uno a partir de la versión activa.
- `GET /api/photos/:photoId/edits/:stepId` → `{ status, resultUrl? }`. Se consulta cada 1.5s, o se usa SSE.
- `DELETE /api/photos/:photoId/versions/:versionId/steps/last` deshace el último paso.
- `POST /api/photos/:photoId/versions/:versionId/save` → la versión pasa a activa.
- `DELETE /api/photos/:photoId/versions/:versionId` descarta el borrador.
- `GET /api/photos/:photoId/download?version=original|active` hace un redirect a la URL firmada, con el nombre de §3.1.

**Reglas:**
- Todo se valida contra la asesora dueña del inmueble.
- **Límite de uso:** **TBD**. Recomendación: 50 retoques por asesora por día, con el mensaje "Llegaste al límite de retoques de hoy".

---

## 13. Fuera de alcance

- Amoblado virtual, cambio de pisos o paredes, y fotos generadas desde cero.
- Retoque en lote ("mejorar todas").
- Re-publicación automática en los canales al guardar.
- Editor en la app Expo.
- Recorte y rotación manual. **TBD:** se pueden agregar luego como herramientas no-IA en el mismo panel.

---

## 14. Criterios de aceptación

- [ ] En la grilla, el clic en la imagen abre la ventana en esa foto; los controles que ya existían siguen funcionando y no abren la ventana.
- [ ] Al pasar el mouse o con el foco aparece el ícono de ampliar; las fotos retocadas muestran el badge ✦ IA.
- [ ] La ventana flota centrada, con la pantalla difuminada detrás; se cierra con ×, con `Esc` o con clic fuera.
- [ ] Las flechas, el filmstrip y `←` / `→` navegan en círculo; la miniatura activa lleva el contorno esmeralda.
- [ ] "Descargar" baja la versión que se está viendo, con el nombre `{código}-{n}-{ambiente}{-ia}.jpg`.
- [ ] Las 4 herramientas y Guardar caben sin scroll en una ventana de 820px de alto.
- [ ] Cada herramienta muestra el estado de procesamiento (escaneo y spinner) y luego un aviso "· listo"; durante el proceso no se puede lanzar otra.
- [ ] Al aplicar una herramienta, su botón cambia a "Deshacer" y deshacer revierte ese retoque.
- [ ] Quitar objetos: el pincel pinta con el tamaño del slider; "Limpiar" borra el trazo; "Quitar" envía la máscara y solo se activa si hay trazo.
- [ ] Cielo despejado aparece deshabilitado en fotos interiores, con el subtítulo "Solo fotos exteriores".
- [ ] Original / Retocada / Comparar aparecen solo si hay retoques; la cortina se arrastra con mouse, con touch y con teclado.
- [ ] Guardar solo se activa con cambios sin guardar; después de guardar, la grilla, el reel y la portada usan la versión retocada.
- [ ] La foto original nunca se pierde y sigue disponible para ver y descargar.
- [ ] El foco queda atrapado dentro de la ventana y al cerrar vuelve a la miniatura que la abrió.
- [ ] Un error del servicio muestra un aviso con Reintentar y deja la foto como estaba.

---

## 15. Pendientes (TBD) — resumen

| # | Tema | Recomendación |
|---|---|---|
| 1 | Proveedor de IA | Servicio de inpainting para objetos y cielo; luz con auto-levels local |
| 2 | Deshacer un paso intermedio | v1: solo el último paso |
| 3 | Descargar en vista Comparar | Descargar la retocada |
| 4 | Confirmar al cerrar con borrador | Sí |
| 5 | Navegar mientras procesa | Sí, con spinner en el filmstrip |
| 6 | Cielo en fotos sin ambiente | Habilitar y avisar si no se detecta cielo |
| 7 | Restaurar original | Agregar al menú de la foto en una iteración posterior |
| 8 | Aviso de re-publicar en Canales | Sí |
| 9 | Límite diario de retoques | 50 por asesora |
| 10 | Web móvil < 768px | Pantalla completa + hoja inferior con las herramientas |
