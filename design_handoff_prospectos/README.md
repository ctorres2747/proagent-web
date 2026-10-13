# Handoff — Prospectos (bandeja previa a Clientes)

**Producto:** ProAgent Web (Next.js 15, App Router), shell v2.  
**Ruta:** `/prospects`  
**Sprint:** [`proagent-mobile/sprints/065-prospectos-bandeja.md`](../../proagent-mobile/sprints/065-prospectos-bandeja.md) (fuente de verdad AC + API).  
**Quién lo ve:** la asesora, **solo sus prospectos** (`owner_agente_id`).  
**Referencia visual:** `Prospectos - Bandeja.dc.html` (interactivo).  
**Capturas (añadir al repo):** `screenshots/01-bandeja.png`, `02-calificar.png`, `03-menu-pausar.png`, `04-duplicado.png`.

---

## Relación con Clientes (obligatorio)

Leer **`design_handoff_clientes/`** en paralelo.

| Handoff Design (original) | Producto actual (2026-10-13) |
|---------------------------|------------------------------|
| Calificar → columna «Nuevo contacto» | Calificar → columna **Calificado** (`estado = calificando`) |
| Columna «Nuevo contacto» en Kanban | **Eliminada** — clientes nuevos nacen en Calificado |

Al convertir un prospecto, la web debe crear/actualizar cliente vía **`POST/PATCH /api/web/clients`** con `estado: calificando` y mostrar aviso tipo: «{Nombre} pasó a Clientes · Calificado».

---

## 1. Concepto

Los prospectos **llegan solos desde los portales** (integración existente o ingest API). La bandeja prioriza **tiempo sin interacción**. Cada prospecto termina así:

| Resultado | Qué pasa |
|-----------|----------|
| **Calificar** | Cliente en **Calificado**; sale de la bandeja |
| **Descartar** | Motivo obligatorio; sale de la bandeja |
| **Duplicado** | Se une a cliente existente; mensaje en actividad; sale de la bandeja |
| **Pausar** | Pestaña «En pausa» hasta la fecha |

No hay CTA «Nuevo prospecto».

---

## 2. Riel

- Ítem **Prospectos**, ícono bandeja:

```html
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h14l2 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6Z"/><path d="M3 13h5l1.5 3h5L16 13h5"/></svg>
```

- **Badge esmeralda** (estilo Captación): número **Sin revisar**; oculto si 0.
- Orden: Inicio · Captación · Inventario · Publicación · *(divisor)* · **Prospectos** · Clientes.
- **Dev + Design:** actualizar el riel en **todas** las pantallas del shell, incl. `Clientes - Kanban.dc.html` si sigue usándose como referencia.

---

## 3. Estructura de página

1. **Topbar:** `Cartera / Prospectos`, campana, avatar.
2. **Encabezado:** `Prospectos` 24px/800; subtítulo «Llegan automáticamente desde los portales. Califícalos para pasarlos a Clientes.»
3. **Segmented:** Sin revisar (n) · Contactados (n) · En pausa (n) · Todos (n) — default Sin revisar.
4. **Filtros (tarjeta):** buscador «Buscar por nombre, teléfono o código de inmueble» (teléfono solo dígitos); chips canal únicos: Todos · FB · ML · CC · M² con conteos.
5. **Tabla agrupada** (§4).

---

## 4. Tabla

### 4.1 Columnas

`grid-template-columns: minmax(170px,1.2fr) 40px minmax(160px,2fr) 92px 186px; gap:12px;`

| Columna | Contenido |
|---------|-----------|
| Prospecto | Avatar 26px, nombre 12.5px/700, teléfono 11px `#5B6B79`; chip «Duplicado» si aplica (§7) |
| Canal | Badge portal; nombre en `title` |
| Interés | Chip código inmueble + mensaje una línea elipsis; tooltip `{código} · {título}` |
| Interacción | Tiempo §4.3 + tipo 10.5px `#9AA6B2` |
| Acciones | Llamar · WhatsApp · Calificar · ⋯ |

Encabezado: `#FAFBFC`, 11px/700 mayúsculas `#9AA6B2`. Filas ~48px, `8px 20px`, borde superior `#EEF0F3`.

### 4.2 Franjas de prioridad

Orden visual (ocultar vacías); dentro de franja orden **`lastInteractionAt` ascendente** (más urgente arriba):

| Franja | Regla | Borde/punto | Fondo header | Texto header |
|--------|-------|-------------|--------------|--------------|
| Más de 48 h | ≥ 48 h | `#C23B2B` | `#FBE7E4` | `#C23B2B` |
| 24–48 h | 24–47 h | `#D97B2B` | `#FCEEE0` | `#8A4E12` |
| < 24 h | < 24 h | `#1E8E5A` | `#E6F5EE` | `#1E8E5A` |
| En pausa | `status=paused` | `#C9D0D7` | `#F1F3F5` | `#5B6B79` |

Fila: `box-shadow: inset 3px 0 0 {color}`.

### 4.3 Texto de tiempo

- `< 1 h`: «Ahora»; `< 24 h`: «Hace {n} h»; ≥ 24 h: «Hace {n} día(s)».
- Color/peso: ≥48h `#C23B2B`/800; 24–47h `#B5651D`/800; <24h `#45525E`/600.
- Pausa: «Hasta {d MMM}», fila fondo `#FAFBFC`.

### 4.4 Interacción

Actualiza `lastInteractionAt`: recepción, llamada/WhatsApp desde ProAgent, mensaje nuevo por integración. Pausar/reanudar **no** cuentan.

---

## 5. Acciones

### 5.1 Fila (30×30, radio 8px, borde `#E4E8EC`)

- **Llamar:** `tel:+57{dígitos}` → Contactado, `lastInteractionType=call`.
- **WhatsApp:** `https://wa.me/57{dígitos}` → Contactado, `whatsapp`.
- **Calificar:** primario navy → modal §6.
- **⋯:** menú §5.2.

### 5.2 Menú ⋯ (224px, radio 12px)

Pausar 3 días / 1 semana / 1 mes · Reanudar · Marcar duplicado · Descartar (rojo).

### 5.3 Aviso Deshacer

Barra inferior centrada, `#16212B`, 6 s, «Deshacer» `#7FE3B8` → `POST .../undo`.

---

## 6. Ficha de calificación

Modal 640px, overlay `rgba(16,33,49,.45)`, Esc / clic fuera / ×.

Campos obligatorios: temperatura (iconos como Clientes), presupuesto min/max millones COP, zonas chips (prellenar desde inmueble), tipos inmueble (prellenar), forma de pago segmented.

Pie: «Falta: …» `#8A4E12` mientras incompleto; **Convertir en cliente** deshabilitado hasta válido.

**Al convertir:** cliente `calificando`, inmueble vinculado, mensaje en actividad, toast «{Nombre} pasó a Clientes · **Calificado**».

---

## 7. Duplicados

Detección por teléfono (dígitos) vs clientes activos del mismo owner → chip «Duplicado». Modal 520px, lista clientes, preselect «Mismo teléfono». Confirmar → actividad `merged_prospect` en cliente.

---

## 8. Descartar

Modal 520px; motivos: No es comprador · Sin presupuesto · No responde · Spam · Otro. API 422 sin motivo.

---

## 9. Modelo (TypeScript referencia)

Ver sprint § T1 — enums en API web snake_case.

---

## 10. API (implementación)

Prefijo canónico: **`/api/web/prospects`** (no `/api/prospects` suelto). Detalle en sprint 065.

---

## 11. Fuera de alcance

Alta manual, reasignar asesora, dashboard calidad canal, push, construir integración portal desde cero.

---

## 12. Criterios de aceptación (UX)

Copia operativa en sprint 065 T3; sustituir cualquier mención a «Nuevo contacto» por **Calificado (`calificando`)**.

---

## 13. TBD

| # | Tema | Recomendación |
|---|------|----------------|
| 1 | Logos 4 portales | Mismos que Captación/Clientes |
| 2 | Etiqueta «Volvió de pausa» 24 h | Sí |
| 3 | Buscador clientes en duplicado | Coincidencias arriba + buscador |
| 4 | Umbrales 24/48 h configurables | Fijos v1 |
