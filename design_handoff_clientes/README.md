# Handoff — Clientes (Kanban de compradores)

**Producto:** ProAgent Web (Next.js 15, App Router), dentro del shell v2.
**Ruta:** `/clients`. El ítem **Clientes** del riel pasa de *disabled* ("Pronto") a activo.
**Quién lo ve:** la asesora, con **sus propios clientes**; **el admin puede ver la cartera de cualquier asesora** (ver §0.1).
**Referencia visual:** `Clientes - Kanban.dc.html` (interactiva: filtros, panel lateral, cambio de estado, vincular inmuebles).
**Capturas:** `screenshots/01-tablero.png`, `02-panel-detalle.png`, `03-panel-descartar.png`, `04-referencia-tarjeta.png`.

**Regla general:** no se introducen colores, tipografías ni patrones nuevos. Todo reutiliza el Kanban de Captación, la vista Inventario ajustada y la guía de marca. (Excepción consciente: el modal de motivo de descarte obligatorio en §6.2 — no existe hoy en Captación, es una pieza de interacción nueva aprobada a propósito.)

---

## 0. Decisiones confirmadas (revisión 2026-10-04, con Cristhian)

Esta sección resuelve los puntos que quedaron en TBD en la versión original del handoff (§11). Donde contradiga el resto del documento, **esta sección manda**.

### 0.1 Admin ve la cartera de cada asesora
`clientes` tiene `visibility: "all"` en `nav-config.ts` (no `"staff"` ni `"admin"`), y el selector global **"Viendo como {asesor}"** del Sidebar (`ViewingAsSelect.tsx`) va a aparecer en esta pantalla automáticamente apenas se active la ruta. Para que funcione de verdad (y no quede un control visible sin efecto), el API de Clientes debe soportar **`view_as_agente_id`**, mismo patrón que ya usan Captación e Inventario — ver §8.

### 0.2 Logos de Ciencuadras y Metrocuadrado
Confirmado contra el código: **no existen hoy** (`design-system/portals.ts` solo define `"facebook" | "mercadolibre"`). Hay que conseguir los 2 SVG oficiales antes de implementar el badge con logo real — mientras tanto usar el respaldo de siglas (CC / M²) que ya prevé §3.2. Nombre/URL real del portal confirmado: **Ciencuadras — www.ciencuadras.com** (no "Cienicuadras"; si ese typo aparece en otra documentación del proyecto, es un error viejo a corregir aparte).

### 0.3 Tipo de inmueble buscado — alineado al catálogo real de Inventario
Cambia de `'apartamento'|'casa'|'lote'|'local'|'oficina'` (el de la v1 del handoff) a los 5 tipos que ya usa la ficha de Inventario (`PROPERTY_TYPES` en `properties/[id]/page.tsx`):

```ts
type PropertyTypeSought = 'Apartamento' | 'Casa' | 'Apartaestudio' | 'Oficina' | 'Local';
```

(Se quita "Lote", que no está en el catálogo real de Inventario hoy; se agrega "Apartaestudio", que sí existe en fichas reales de producción.)

### 0.4 Zonas de interés — texto libre con sugerencias, no chips fijos
§6.3 decía "chips multiselección" sobre una lista fija de 6 barrios. Cambia a: **campo de texto libre que permite varios valores** (ej. tags/pills que se van agregando a medida que la asesora escribe y confirma), con un **dropdown de autocompletar** que sugiere municipios/barrios ya existentes en el catálogo real de Inventario (el mismo que alimenta el filtro "Municipio" — Sabaneta, Envigado, Itagüí, La Estrella, Suba, Fontibón, Kennedy, Bosa, y lo que haya cargado). La asesora puede escribir una zona que no esté sugerida (ej. un barrio nuevo) sin que la bloquee.

### 0.5 Actividad pasada vs. próxima cita — separados
La tarjeta del Kanban **solo muestra actividad pasada** (ej. "Hace 2h", nunca una cita futura). El ejemplo "Hoy, visita 4:00 p. m." de la v1 del handoff se quita de la tarjeta. En su lugar, el **panel de detalle gana una sección nueva "Próxima cita"** (fecha + hora, campo simple) — ver §6.6. Integración con Google Calendar queda documentada como mejora futura, fuera de esta iteración (el proyecto ya tiene una cuenta de servicio de Google en uso para Entrega Inmobiliaria/Drive, así que no es descabellado más adelante).

### 0.6 Motivos de descarte — se agrega uno (quedan 6)
Se suma **"Crédito no aprobado"** a los 5 originales (distinto de "Sin presupuesto": acá el cliente sí tenía plata pensada vía crédito, pero el banco se lo negó — dato coherente con que ya se captura "Forma de pago: Crédito" en la ficha). Lista final en §6.2.

---

## 1. Estructura de la página

1. **Topbar:** breadcrumb "Cartera / Clientes", campana y avatar. Sin título, buscador ni CTA duplicados (igual que Inventario).
2. **Encabezado:** `<h1>` "Clientes" 24px/800. Subtítulo "{n} compradores en seguimiento" (con filtros activos: "{n} clientes coinciden con los filtros"). CTA "+ Nuevo cliente" (navy, a la derecha).
3. **Barra de filtros:** una sola tarjeta blanca (ver §4).
4. **Tablero:** 5 columnas (ver §2).
5. **Panel lateral:** se abre al hacer clic en una tarjeta (ver §6).
6. **Botón flotante del Asistente IA:** el del shell, sin cambios.

---

## 2. Columnas y estados

| Orden | Estado (`stage`) | Label | Punto del header |
|---|---|---|---|
| 1 | `nuevo` | Nuevo contacto | `#9AA6B2` |
| 2 | `calificando` | Calificando | `#0A3D62` |
| 3 | `visitas` | En visitas | `#0A3D62` |
| 4 | `negociando` | Negociando | `#0A3D62` |
| 5 | `cerrado` | Cerrado | `#1E8E5A` |
| — | `descartado` | Descartado | `#C23B2B` |

- **Descartado** es un estado válido de la ficha, pero **no es columna visible por defecto**. Aparece como 6.ª columna al final solo si el interruptor "Ver descartados" está activo.
- Las columnas **no** usan colores de temperatura: el punto indica la etapa, no la urgencia.
- **Sin drag-and-drop.** El estado se cambia solo desde el panel lateral.

**Columna** (igual que Captación): tarjeta blanca, borde `1px #E4E8EC`, radio 16px. Header con padding `13px 14px`, borde inferior, punto de 8px + nombre 13px/700 + contador en badge (`#EEF0F3`, texto `#5B6B79` 11px/700, radio 10px). Cuerpo con padding 10px, `gap:10px`, `min-height:380px`, `max-height: calc(100vh - 300px)` y scroll vertical propio.
**Columna vacía:** "Sin clientes" centrado, 12px/600 `#9AA6B2`.
**Grid:** `repeat(N, minmax(220px, 1fr))`, `gap:12px`. Si no caben (por ejemplo, 6 columnas en una pantalla angosta), el contenedor del tablero scrollea horizontalmente. La página en sí no.

---

## 3. Tarjeta de cliente

Fondo blanco, borde `1px #E4E8EC`, radio 12px, padding 12px. Sombra **solo en hover**: `0 6px 18px rgba(16,33,49,.10)`. Toda la tarjeta es clicable y abre el panel.

De arriba a abajo:
1. **Fila superior:**
   - Avatar de 32px con iniciales (`#EEF0F3` / `#45525E`, 11.5px/800).
   - Nombre 13px/700, máximo 2 líneas (luego se corta).
   - Debajo del nombre, última actividad 11px `#9AA6B2` (ej. "Hace 2 h", "Hoy, visita 4:00 p. m.").
   - Badge de canal en la esquina superior derecha (ver §3.2), en el mismo lugar del logo de portal en Captación.
2. **Presupuesto:** "$ {mín} – {máx} M", 14px/800 `#0A3D62`, una línea. Millones con separador de miles `es-CO` (ej. `$ 900 – 1.300 M`).
3. **Búsqueda:** "{tipos} · {zonas}", 11.5px/600 `#45525E`, una línea con elipsis.
4. **Solo en Descartado:** "Motivo: {motivo}", 11px/700 `#C23B2B`.
5. **Pie:** indicador de temperatura a la izquierda; a la derecha, chip de inmuebles vinculados si los hay (`#EAF0F5` / `#0A3D62`, 10.5px/700, radio 6px; texto "F-34" o "F-34 +1").

### 3.1 Temperatura (indicador)

Se asigna a mano desde el panel y es **independiente de la columna**: comunica urgencia, no etapa. Se muestra como un chip con **1, 2 o 3 barras + etiqueta** sobre el fondo suave de la guía de marca. Se distingue por forma y por color, así que funciona aunque el color no se perciba. El contorno de la tarjeta queda neutro.

| Temperatura | `temp` | Barras llenas | Color barras | Texto | Fondo | Token guía |
|---|---|---|---|---|---|---|
| Caliente | `hot` | 3 | `#C23B2B` | `#C23B2B` | `#FBE7E4` | Error / Danger bg |
| Tibio | `warm` | 2 | `#D97B2B` | `#B5651D` | `#FCEEE0` | Advertencia / Warning bg |
| Frío | `cold` | 1 | `#5F86A6` | `#0A3D62` | `#E7EEF4` | Info bg |

- Barras: 3 rectángulos de 3px de ancho y alturas 5 / 8 / 11px, `gap:2px`, alineados abajo, radio 1px. Las barras no llenas van en `#D7DCE1`.
- Chip: 11px/700, padding `3px 8px 3px 7px`, radio 6px, `gap:6px`.

**Nota de color:** la especificación inicial traía ámbar `#d9a227`. Se usa `#D97B2B` porque es la Advertencia de la guía de marca. Frío pasa de gris a la familia Info, porque el gris se confundía con el borde normal de la tarjeta.

**Variante alternativa** (el mockup la tiene como ajuste `tempStyle = 'borde'`, solo para comparar): sin chip, con contorno de 1.5px del color de temperatura. **No implementar**; queda documentada como descartada.

### 3.2 Canal de origen

Campo **obligatorio, de selección única**. Badge: alto 20px, ancho mínimo 22px, padding `0 6px`, radio 6px, fondo `#F6F7F9`, borde `1px #E4E8EC`. Tooltip (`title`) con el nombre completo.

| `channel` | Label | Contenido del badge |
|---|---|---|
| `facebook` | Facebook | **Logo oficial** (14px de alto) |
| `mercadolibre` | MercadoLibre | **Logo oficial** |
| `ciencuadras` | Ciencuadras | **Logo oficial** |
| `metrocuadrado` | Metrocuadrado | **Logo oficial** |
| `referido` | Referido | Ícono persona con "+" (12px, trazo 2.2, `#45525E`) |
| `colegaje` | Colegaje | Ícono maletín (12px, trazo 2.2, `#45525E`) |
| `otro` | Otro | Ícono tres puntos (12px, `#45525E`). Requiere texto libre `channelOther`; el tooltip muestra "Otro: {texto}" |

- **TBD (bloqueante visual):** usar **los mismos archivos de logo que ya usa Captación**. Si no existen, conseguir SVG del kit de prensa de cada portal. Mientras tanto, como respaldo, se muestran las siglas FB · ML · CC · M² (9.5px/800 `#45525E`).
- Los SVG exactos de los 3 íconos están en el archivo de referencia; copiarlos tal cual.

---

## 4. Barra de filtros

Tarjeta blanca, borde `#E4E8EC`, radio 12px, padding 12px, flex con `gap:10px` y `flex-wrap`. Todos los controles miden 36px de alto.

1. **Buscador:** fondo `#F6F7F9`, radio 9px, placeholder "Buscar por nombre o teléfono". Busca por nombre (sin distinguir mayúsculas ni tildes) o por teléfono (compara solo dígitos, así que "300 555" encuentra "3005550142").
2. **Canal de origen:** dropdown de selección única. Lista "Todos los canales" + los 7 canales, cada uno con su badge y su **conteo de clientes**. Con un canal elegido, el chip dice "Canal: {nombre}" con fondo `#EAF0F5`, borde y texto navy.
3. Divisor vertical de 1px.
4. **Temperatura:** label "Temperatura" (11.5px/700 `#9AA6B2`) + 3 chips **multiselección** con las barras. Activo: fondo y texto del color de esa temperatura (§3.1), borde de 1px de su color. Inactivo: blanco, borde `#E4E8EC`.
5. Espacio flexible.
6. **"Ver descartados ({n})":** interruptor de 32×18 (encendido navy, apagado `#D7DCE1`). Agrega o quita la columna Descartado.

Los filtros se combinan con AND. Persistirlos en la URL (`?q=&canal=&temp=hot,warm&descartados=1`).

---

## 5. Modelo de datos

```ts
type ClientStage = 'nuevo' | 'calificando' | 'visitas' | 'negociando' | 'cerrado' | 'descartado';
type Channel = 'facebook' | 'mercadolibre' | 'ciencuadras' | 'metrocuadrado' | 'referido' | 'colegaje' | 'otro';
type Temperature = 'hot' | 'warm' | 'cold';
type PropertyTypeSought = 'Apartamento' | 'Casa' | 'Apartaestudio' | 'Oficina' | 'Local'; // §0.3, igual a Inventario

interface Client {
  id: string;
  agentId: string;              // asesora dueña
  name: string;
  phone: string;                // guardar solo dígitos, formatear al mostrar
  channel: Channel;             // obligatorio
  channelOther?: string;        // obligatorio si channel === 'otro'
  temperature: Temperature;     // por defecto 'warm' al crear (TBD, ver §7)
  stage: ClientStage;
  discardReason?: DiscardReason; // obligatorio si stage === 'descartado'
  budgetMin: number;            // COP enteros
  budgetMax: number;
  zones: string[];              // texto libre con sugerencias — §0.4, no chips fijos
  propertyTypes: PropertyTypeSought[];
  paymentMethod: 'contado' | 'credito' | 'mixto';
  linkedPropertyIds: string[];  // fichas de Inventario
  notes: string;
  nextAppointmentAt?: string;   // próxima cita agendada — §0.5 / §6.6, opcional
  lastActivityAt: string;       // SOLO actividad pasada, nunca la próxima cita
  createdAt: string;
}

type DiscardReason =
  | 'compro_otro_asesor'
  | 'sin_presupuesto'
  | 'credito_no_aprobado'  // nuevo — §0.6
  | 'no_responde'
  | 'ya_no_busca'
  | 'otro';

interface ClientStageEvent {     // historial, para métricas
  clientId: string;
  from: ClientStage | null;
  to: ClientStage;
  at: string;
  byAgentId: string;
}
```

**Por qué el historial:** el objetivo de negocio es comparar **cuántos clientes llegan por cada canal y cuántos cierran**. Registrar cada cambio de estado en `ClientStageEvent` desde el primer día permite calcular conversión y tiempos por canal sin migraciones después. El dashboard de canales queda **fuera de alcance** de esta iteración, pero los datos deben capturarse ya.

---

## 6. Panel lateral de detalle

Igual que el patrón de Captación y del Asistente:
- **Contenedor:** fijo a la derecha, ancho 400px (máx. `92vw`), fondo blanco, borde izquierdo `#E4E8EC`, sombra `-8px 0 32px rgba(16,33,49,.14)`.
- **Overlay:** `rgba(16,33,49,.28)` detrás del panel.
- **Cierre:** con la ×, con clic en el overlay o con `Esc`. Al cerrar, el foco vuelve a la tarjeta.
- **Cuerpo:** scrollea en vertical y nunca en horizontal (`overflow-x:hidden`). Los campos que estén lado a lado en flex llevan `min-width:0`.
- **Secciones:** separadas por borde `#EEF0F3`. Título de sección 11px/800, uppercase, `letter-spacing:.06em`, `#9AA6B2`. Etiquetas de campo 11px/700 `#5B6B79`.
- **Guardado automático** al cambiar cada campo (con debounce de 500ms en textos). No hay botón "Guardar". Si falla, mostrar el error en línea en el campo.

### 6.1 Encabezado (fijo, no scrollea)
- Avatar de 40px + nombre 15px/800 + teléfono 12.5px/600 · badge de canal + nombre del canal.
- Botón cerrar de 32px, con hover `#F6F7F9`.
- **Selector de temperatura:** 3 botones iguales en fila, de 36px de alto, con barras y etiqueta. El activo usa el fondo, el texto y el borde de su temperatura (§3.1).

### 6.2 Estado
- Grid de 3×2 botones: las 5 etapas + Descartado. Etapa activa: fondo navy y texto blanco. Descartado va siempre en texto rojo; activo, con fondo `#FBE7E4` y borde rojo.
- **Descartar exige motivo:** al pulsar Descartado **no** cambia el estado. Primero se abre un bloque (`#F6F7F9`, radio 10px) con el título "Elige un motivo para descartar", la ayuda en rojo "Obligatorio. El cliente no se descarta hasta elegir un motivo.", los chips de motivo y "Cancelar". El estado pasa a `descartado` solo al elegir un motivo.
- Motivos (§0.6): Compró con otro asesor · Sin presupuesto · Crédito no aprobado · No responde · Ya no busca · Otro.
- Si el cliente ya está descartado, el bloque muestra "Motivo del descarte" con el motivo activo, y se puede cambiar.
- Si se pasa de Descartado a una etapa, se borra `discardReason`.

### 6.3 Datos de búsqueda
- **Presupuesto:** dos inputs ("Mín" y "Máx") en millones de COP, solo números, valor en 13px/700 navy. Validar `mín ≤ máx`; si no se cumple, mostrar un error en línea.
- **Zonas de interés (§0.4):** campo de texto libre que admite varios valores (tags/pills a medida que se agregan), con autocompletar que sugiere del catálogo real de municipios/barrios de Inventario. No bloquea escribir una zona no sugerida.
- **Tipo de inmueble:** chips multiselección con el catálogo real de Inventario — Apartamento, Casa, Apartaestudio, Oficina, Local (§0.3).
- **Forma de pago:** segmented Contado / Crédito / Mixto, en el mismo estilo que el toggle Tarjetas/Tabla.
- Chip activo: fondo `#EAF0F5`, borde y texto navy, 700. Inactivo: blanco, borde `#E4E8EC`, `#45525E`.

### 6.4 Inmuebles de interés
- Contador a la derecha del título.
- Buscador "Vincular por código o título del inventario". Al enfocarlo o escribir, despliega hasta 4 resultados del Inventario **no vinculados** a este cliente: miniatura con el código, título, precio en navy y acción "Vincular". Sin coincidencias: "Sin resultados en el inventario".
- Lista de vinculados: miniatura de 52×44 (foto de portada de la ficha; respaldo `#EEF0F3` con el código), título de 2 líneas, precio 12.5px/800 navy y acción "Desvincular" (`#45525E`, hover `#C23B2B`).
- Sin vinculados: "Aún no hay inmuebles vinculados."
- Un inmueble puede estar vinculado a varios clientes.

### 6.5 Notas
Textarea libre (`#F6F7F9`, radio 10px, mínimo 96px de alto, redimensionable en vertical), igual que en Captación.

### 6.6 Próxima cita (nueva — §0.5)
Campo opcional, fecha + hora (`nextAppointmentAt`). Si está definida, se usa como ayuda visual en el panel (ej. "Próxima cita: hoy 4:00 p. m."); **no se muestra en la tarjeta del Kanban** (la tarjeta solo muestra actividad pasada, §3). Sin integración con Google Calendar en esta iteración — queda documentado como mejora futura.

---

## 7. Crear cliente
"+ Nuevo cliente" abre el mismo panel lateral en modo creación. Son obligatorios **nombre, teléfono y canal de origen** (y el texto de "Otro" si aplica). El cliente nace en `nuevo`, con temperatura `warm` por defecto (**TBD**, confirmar con negocio). Los demás campos son opcionales.

---

## 8. API sugerida

- `GET /api/clients?q=&channel=&temp=&includeDiscarded=&view_as_agente_id=` → lista del asesor autenticado, o de quien indique `view_as_agente_id` si quien pide es admin (§0.1, mismo patrón que Captación/Inventario).
- `GET /api/clients/channel-counts?view_as_agente_id=` → conteos para el dropdown de canal.
- `POST /api/clients` → crear (valida los campos obligatorios).
- `PATCH /api/clients/:id` → actualización parcial. Si cambia `stage`, crea un `ClientStageEvent` en la misma transacción. Rechaza `stage: 'descartado'` sin `discardReason` (422).
- `POST /api/clients/:id/properties/:propertyId` / `DELETE …` → vincular o desvincular.
- `GET /api/properties/search?q=` → reutilizar la búsqueda de Inventario.

Se filtra por la asesora autenticada, salvo que quien pide sea admin y mande `view_as_agente_id` (§0.1) — ahí se filtra por ese agente en su lugar. Un asesor no-admin que mande `view_as_agente_id` ajeno se ignora (403 o se fuerza al propio id, igual que ya resuelven Captación/Inventario).

---

## 9. Fuera de alcance

- Drag-and-drop entre columnas.
- Dashboard de efectividad por canal (los datos sí se capturan, §5).
- Recordatorios, agenda de visitas e integración con WhatsApp.
- Vista de equipo para staff/admin.
- App móvil (Expo): Clientes sigue *disabled* allí.

---

## 10. Criterios de aceptación

- [ ] `/clients` está activo en el riel; el topbar no duplica título, buscador ni CTA.
- [ ] El tablero muestra las 5 columnas en el orden de §2, cada una con su contador y el texto "Sin clientes" cuando está vacía.
- [ ] Los descartados no aparecen por defecto; "Ver descartados (n)" agrega la columna al final y muestra el motivo en cada tarjeta.
- [ ] La tarjeta muestra avatar, nombre (máx. 2 líneas), última actividad, badge de canal arriba a la derecha, presupuesto en navy, tipos y zonas, indicador de temperatura y chip de inmuebles.
- [ ] La temperatura se ve como chip con barras (3 / 2 / 1) y los colores de la guía (§3.1); el borde de la tarjeta queda neutro; la sombra aparece solo en hover.
- [ ] Facebook, MercadoLibre, Ciencuadras y Metrocuadrado muestran su logo oficial; Referido, Colegaje y Otro, su ícono; el tooltip da el nombre completo.
- [ ] Los filtros (buscador por nombre o dígitos de teléfono, canal con conteos, temperatura multiselección) se combinan y se conservan en la URL.
- [ ] Clic en la tarjeta abre el panel de 400px con overlay; se cierra con ×, overlay o `Esc`; el panel nunca scrollea en horizontal.
- [ ] Cambiar el estado desde el panel mueve la tarjeta de columna al instante y registra un `ClientStageEvent`.
- [ ] Descartar sin motivo es imposible tanto en la UI como en la API (422).
- [ ] El presupuesto valida `mín ≤ máx`; zonas y tipos admiten selección múltiple; la forma de pago es única.
- [ ] Vincular un inmueble lo agrega a la lista y lo quita de los resultados; desvincular lo devuelve.
- [ ] El canal es obligatorio al crear; con "Otro" se exige el texto libre.
- [ ] Ningún cliente de otra asesora llega al cliente web, **salvo que quien consulta sea admin y use `view_as_agente_id`** (§0.1).
- [ ] El selector "Viendo como" del Sidebar funciona en `/clients` igual que en Captación/Inventario.
- [ ] Zonas de interés acepta texto libre con autocompletar sugerido; no bloquea un valor fuera de catálogo (§0.4).
- [ ] Tipo de inmueble buscado usa el catálogo real de Inventario (Apartamento, Casa, Apartaestudio, Oficina, Local) — §0.3.
- [ ] La tarjeta nunca muestra una cita futura, solo actividad pasada; "Próxima cita" vive únicamente en el panel (§0.5, §6.6).

---

## 11. Pendientes (TBD)

Resueltos en la revisión del 2026-10-04 — ver §0. Solo queda abierto:

| # | Tema | Estado |
|---|---|---|
| 1 | Logos oficiales de Ciencuadras y Metrocuadrado | **Sigue pendiente** — hay que conseguir los SVG (§0.2), no existen en el repo hoy |
| 2 | Temperatura por defecto al crear | Resuelto: `warm` (Tibio), confirmado con negocio |
| 3 | Catálogo de zonas | Resuelto (§0.4): texto libre + sugerencias del catálogo de Inventario |
| 4 | ¿Lead captado en Captación → cliente? | Resuelto: no en esta iteración, son flujos distintos (propietarios vs. compradores) |
