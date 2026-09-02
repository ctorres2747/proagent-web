# HANDOFF TÉCNICO — App Shell v2

**Producto:** ProAgent (Web · Next.js 15 App Router) + ProAgent Mobile (Expo)
**Alcance:** mejoras visuales y de UX sobre el `AppShell` existente. No es un rediseño de la app ni de Captación.
**Versión:** shell-v2 · 2026-09-01
**Artifact:** `design_handoff/shell-v2.dc.html` (+ `support.js`)

---

## A. Resumen de cambios (antes → después)

| # | Antes | Después |
|---|---|---|
| A1 | Ítems nav con `dot` circular genérico | Íconos SVG de línea (stroke 1.9, 20px), uno por destino |
| A2 | Lista plana de 6 ítems | Dos grupos con encabezado: **Operación** (Inicio, Captación, Inventario, Publicación) y **Cartera** (Clientes, Reportes) |
| A3 | Sin señal de carga de trabajo | Badges numéricos: leads nuevos en Captación (esmeralda), conteo de inventario (gris) |
| A4 | Estado activo = solo cambio de color de texto | Estado activo = fondo `--pa-navy-050` + barra indicadora izquierda navy 3px + peso 700 |
| A5 | Ítems disabled indistinguibles de los activables | Disabled a 40% + chip "Pronto"; `aria-disabled`, no focusable |
| A6 | Colapsado = sidebar angosta con dots | Colapsado = **riel de 76px** con ícono + label 9.5px debajo (mismo lenguaje que el bottom nav mobile) |
| A7 | Botón colapsar sin etiqueta | Botón con ícono panel + label "Colapsar"; persistencia en `localStorage` |
| A8 | Sin logo de marca en el riel | Logotipo P/I 34px persistente arriba, en ambos modos |
| A9 | Header con búsqueda placeholder suelta a la izquierda | Header: **título de página** a la izquierda · búsqueda centrada máx. 440px con hint `⌘K` · acciones a la derecha |
| A10 | Sin notificaciones | Campana con punto rojo (solo UI en esta iteración) |
| A11 | UserMenu solo avatar | Avatar + nombre + rol; menú con secciones y separador destructivo |
| A12 | Header 64px, sidebar 224px | Header 60px, sidebar 248px expandida / 76px riel |
| A13 | `max-w-[1440px]` sin padding declarado | `max-w-[1440px]` + padding horizontal 32px (desktop) / 24px (tablet) / 16px (mobile) |
| A14 | Mobile web sin navegación (sidebar oculta) | Hamburger en header → **drawer** izquierdo 288px con overlay |
| A15 | "Más" ocupando slot de nav | "Más" se elimina del nav; su contenido pasa al UserMenu |
| A16 | Filtro admin "Viendo como" mezclado en el header | Se mueve al pie de la sidebar, visible solo para `admin` |

---

## B. Mapa de navegación

### B.1 Ítems (orden exacto)

**Grupo: Operación**

| Orden | Label | Ruta | Visible para | Ícono (lucide) | Badge |
|---|---|---|---|---|---|
| 1 | Inicio | `/` | todos | `home` | — |
| 2 | Captación | `/captacion` | **staff, admin** | `kanban-square` | conteo de leads nuevos, pill esmeralda |
| 3 | Inventario | `/properties` | todos | `building-2` | conteo total, texto gris (no pill) |
| 4 | Publicación | `/publications` | todos | `arrow-up-from-line` | — |

**Labels cortos en el riel.** Con la sidebar colapsada a 76px, el ítem usa un label corto para no truncar. Solo un ítem lo necesita:

| Ítem | Label expandido / drawer | Label en riel (76px) |
|---|---|---|
| Publicación | `Publicación` | `Publicación` (cabe a 9.5px; si con i18n no cupiera, el fallback aprobado es `Publicar`) |
| Resto | igual en ambos | igual en ambos |

El tooltip del riel siempre muestra el label completo, nunca el corto.

**Grupo: Cartera**

| Orden | Label | Ruta | Visible para | Ícono | Estado |
|---|---|---|---|---|---|
| 5 | Clientes | `/clients` | todos | `users` | **disabled** · chip "Pronto" |
| 6 | Reportes | `/reports` | admin | `bar-chart-3` | **disabled** · chip "Pronto" |

**Fuera del nav:** "Más" se elimina. Sus entradas (Ajustes, Ayuda, Cerrar sesión) viven en el UserMenu.

Descripción de íconos si no se usa lucide:
- `home` — casa de línea, techo triangular sobre cuerpo rectangular.
- `kanban-square` — tres barras verticales de distinta altura alineadas abajo.
- `building-2` — edificio con dintel superior y una línea divisoria horizontal.
- `arrow-up-from-line` — flecha vertical hacia arriba.
- `users` — dos siluetas de persona, la trasera parcial.
- `bar-chart-3` — cuatro barras verticales de distinta altura sobre una base.

### B.2 Encabezados de grupo
Texto 10px / 700 / `letter-spacing: .09em` / uppercase / `--pa-text-muted`. Padding `14px 12px 8px`. En modo riel (colapsado) los encabezados se ocultan y se sustituyen por un divisor `1px` a `rgba(255,255,255,.14)`.

### B.3 Comportamiento responsive

| Breakpoint | Navegación |
|---|---|
| `≥ 1280px` (xl) | Sidebar expandida 248px por defecto; el usuario puede colapsar a riel |
| `1024–1279px` (lg) | Sidebar **colapsada a riel 76px** por defecto; expandible manualmente |
| `768–1023px` (md) | Riel 76px, no expandible in-place; al expandir se comporta como overlay sobre el contenido |
| `< 768px` (mobile web) | Sidebar oculta. **Hamburger** (izq. del header) abre un **drawer** de 288px con overlay `rgba(16,33,49,.45)`. Cierra con tap fuera, `Esc`, o swipe izquierda |

**Decisión: mobile web usa drawer, no bottom bar.** El bottom bar es el patrón de la app Expo; replicarlo en la web crea dos barras (drawer del navegador + tab bar) y compite con la UI del navegador. El drawer además soporta los grupos y badges sin recortes.

---

## C. Layout — medidas

| Medida | Valor | Token propuesto |
|---|---|---|
| Sidebar expandida | `248px` | `--pa-shell-sidebar-w` |
| Sidebar colapsada (riel) | `76px` | `--pa-shell-rail-w` |
| Drawer mobile | `288px` | `--pa-shell-drawer-w` |
| Altura header | `60px` | `--pa-shell-header-h` |
| Padding horizontal header | `28px` desktop · `20px` tablet · `16px` mobile | — |
| Padding horizontal main | `32px` desktop · `24px` tablet · `16px` mobile | `--pa-shell-main-px` |
| Padding vertical main | `28px` top · `60px` bottom | — |
| Max-width contenido | `1440px` (se mantiene) | `--pa-shell-content-max` |
| Alto ítem nav (expandido) | `40px` (padding `10px 12px`) | — |
| Gap entre ítems nav | `2px` | — |
| Gap entre grupos | `20px` (via padding del encabezado) | — |
| Ítem nav en riel | `60 × 56px`, gap ícono-label `5px` | — |
| Label de riel — ancho máximo | `56px` a 9.5px/700 antes de truncar | — |
| Radio ítem nav | `10px` expandido · `12px` riel | `--pa-radius-md` |
| Radio botones / inputs header | `9px` / `10px` | `--pa-radius-sm` |
| Radio tarjetas de contenido | `16px` | `--pa-radius-lg` |
| Sombra UserMenu / drawer | `0 1px 2px rgba(16,33,49,.06), 0 12px 32px rgba(16,33,49,.12)` | `--pa-shadow-overlay` |
| Sombra header al hacer scroll | `0 1px 0 rgba(16,33,49,.06)` | `--pa-shadow-header` |
| Borde divisorio | `1px solid #E4E8EC` | `--pa-border` |

Transición de ancho de sidebar: `width 180ms cubic-bezier(.4,0,.2,1)`.

---

## D. Componentes del shell

### D.1 Logo / marca
- Placa `34 × 34px`, radio `10px`, fondo `#FFFFFF` sobre la sidebar navy.
- Marca P/I en navy dentro de la placa.
- Expandido: placa + "ProAgent" 14.5px/800 + "by Proinversores" 9.5px/600 uppercase a `rgba(255,255,255,.5)`.
- Riel: solo la placa, centrada, `margin-bottom: 14px`.
- Enlace a `/`. `aria-label="ProAgent — ir a Inicio"`.

### D.2 Ítem nav — expandido

| Estado | Fondo | Texto/ícono | Extra |
|---|---|---|---|
| default | transparente | `rgba(255,255,255,.72)` | peso 600 |
| hover | `rgba(255,255,255,.07)` | `#FFFFFF` | transición 120ms |
| active | `rgba(255,255,255,.12)` | `#FFFFFF` | peso 700 + barra izquierda `3 × 20px` radio `0 3px 3px 0` en `--pa-emerald` |
| focus-visible | igual que hover | — | `outline: 2px solid #7FE3B8; outline-offset: 2px` |
| disabled | transparente | `rgba(255,255,255,.34)` | chip "Pronto" 9.5px/700, `cursor: default`, `aria-disabled="true"`, `tabindex="-1"` |

### D.3 Ítem nav — riel (colapsado)
- `60 × 56px`, flex columna, ícono 19px + label 9.5px/700.
- Active: fondo `#FFFFFF`, contenido `--pa-navy` (inversión completa; no lleva barra indicadora).
- Hover: `rgba(255,255,255,.08)`.
- Tooltip a la derecha tras 400ms con el label completo (`role="tooltip"`).
- Badge posicionado `top:6px; right:7px`, mín. `16 × 16px`.

### D.4 Botón colapsar
- Pie de la sidebar, sobre el bloque de usuario, separado por `1px solid rgba(255,255,255,.12)`.
- Expandido: ícono `panel-left-close` 14px + "Colapsar menú" 11.5px/600 a `rgba(255,255,255,.5)`.
- Riel: solo ícono `panel-left-open`, centrado, área táctil `44 × 44px`.
- Persistir en `localStorage` bajo `pa.shell.collapsed` (`"1" | "0"`). Leer en el cliente tras montar para no romper SSR; render inicial = expandido en `xl`, riel en `lg`.
- Atajo de teclado: `[` alterna el estado.

### D.5 Barra de búsqueda
- **Solo UI en esta iteración.** Ver §H.
- Header centrado, `max-width: 440px`, alto `34px`, fondo `--pa-bg-subtle`, borde `--pa-border`, radio `10px`.
- Ícono lupa 15px `--pa-text-muted`, placeholder "Buscar propiedad, cliente o código" 12.5px, hint `⌘K` en chip `1.5px 5px` fondo blanco borde `--pa-border`.
- Click o `⌘K` / `Ctrl+K` abre un modal con estado vacío: "La búsqueda global llega en la próxima versión" + accesos directos a Inventario y Captación. **No** hacer que parezca un input roto.
- En `< 768px` la barra se sustituye por un botón-ícono lupa de `44 × 44px` que abre el mismo modal.

### D.6 CTA del header
- Label: **"+ Nueva propiedad"** (se conserva). Ícono `plus` 14px + texto 12.5px/700.
- Fondo `--pa-navy`, texto blanco, padding `10px 16px`, radio `9px`.
- Hover `#0C4A78`, active `#082F4C`, focus `outline: 2px solid #0A3D62; outline-offset: 2px`.
- Ruta `/properties/new`.
- Contextual: en `/captacion` el CTA cambia a **"+ Nuevo lead"** → `/captacion/new`. En el resto de rutas se mantiene "+ Nueva propiedad".
- `< 768px`: se reduce a botón circular `44 × 44px` solo con el `+`.

### D.7 UserMenu
Disparador (pie de sidebar, expandido): tarjeta `rgba(255,255,255,.07)` radio 12px con avatar 32px circular esmeralda + iniciales, nombre 12.5px/700 truncado, rol 10.5px/600 a `rgba(255,255,255,.55)`, chevron 14px. En riel: solo el avatar 36px.

Panel: ancho `232px`, fondo blanco, radio `12px`, sombra `--pa-shadow-overlay`, anclado arriba-derecha del disparador con `8px` de offset.

| Sección | Ítems |
|---|---|
| Cabecera | Nombre completo 13px/700 + email 11.5px/500 `--pa-text-muted` |
| Cuenta | Mi perfil `/account` · Ajustes `/settings` · Notificaciones `/settings/notifications` |
| Soporte | Ayuda `/help` · Novedades `/changelog` |
| Separador | `1px solid --pa-border` |
| Destructivo | Cerrar sesión — texto `--pa-danger`, hover fondo `#FDF0EE` |

Estados de ítem: hover `--pa-bg-subtle`; focus `outline: 2px solid --pa-navy; outline-offset: -2px`. Cierra con `Esc`, click fuera o selección. `role="menu"` + `role="menuitem"`, navegación con flechas, foco devuelto al disparador al cerrar.

### D.8 Filtro admin "Viendo como"
**Se conserva**, reubicado al pie de la sidebar, encima del UserMenu, y **solo para `role === 'admin'`**.
- Expandido: fila `rgba(255,255,255,.07)` radio 10px con label "Viendo como" 10px/700 uppercase y el valor 12px/700 blanco + chevron. Abre un select con los agentes.
- Riel: ícono `eye` con punto ámbar `--pa-warning` cuando hay una suplantación activa.
- Cuando está activo (viendo como otro), mostrar una franja ámbar de 28px bajo el header: "Estás viendo como **{nombre}**" + "Salir". Contraste mínimo AA sobre `#FFF6E5`.

---

## E. Tokens / estilos

### E.1 Tokens canónicos (BRAND.md §02 + § Superficie navy)

> **Actualizado 2026-09-01:** tokens reconciliados con `BRAND.md` en los 3 repos.
> Si un nombre difiere entre este handoff y BRAND.md, **gana BRAND.md**.

| Token propuesto | Valor (observado) | Uso en el shell |
|---|---|---|
| `--pa-navy` | `#0A3D62` | Fondo sidebar/riel, CTA, texto activo |
| `--pa-emerald` | `#2FC98A` | Badge de leads, indicador activo, avatar |
| `--pa-text` | `#16212B` | Título de página, labels de contenido |
| `--pa-text-secondary` | `#45525E` | Íconos del header |
| `--pa-text-muted` | `#9AA6B2` | Placeholder, conteos, encabezados de grupo |
| `--pa-border` | `#E4E8EC` | Divisores, bordes de input y botón |
| `--pa-bg` | `#F6F7F9` | Fondo del área de contenido |
| `--pa-surface` | `#FFFFFF` | Header, subnav, tarjetas |

### E.2 Tokens nuevos a crear

| Token | Valor | Nota |
|---|---|---|
| `--pa-navy-050` | `#EAF0F5` | Fondo de ítem activo en superficies claras (drawer, subnav, bottom nav) |
| `--pa-navy-hover` | `#0C4A78` | Hover del CTA |
| `--pa-navy-active` | `#082F4C` | Pressed del CTA |
| `--pa-emerald-ink` | `#06331F` | Texto sobre esmeralda (contraste 8.9:1) |
| `--pa-danger` | `#C23B2B` | Cerrar sesión, punto de notificaciones (BRAND §02) |
| `--pa-warning` | `#D9A227` | Estado borrador, franja "Viendo como" |
| `--pa-on-navy-primary` | `#FFFFFF` | Texto activo sobre navy |
| `--pa-on-navy-secondary` | `rgba(255,255,255,.72)` | Texto default sobre navy |
| `--pa-on-navy-muted` | `rgba(255,255,255,.42)` | Encabezados de grupo sobre navy |
| `--pa-on-navy-disabled` | `rgba(255,255,255,.34)` | Ítems disabled sobre navy |
| `--pa-shell-sidebar-w` | `248px` | — |
| `--pa-shell-rail-w` | `76px` | — |
| `--pa-shell-drawer-w` | `288px` | — |
| `--pa-shell-header-h` | `60px` | — |
| `--pa-shell-content-max` | `1440px` | — |
| `--pa-shadow-overlay` | `0 1px 2px rgba(16,33,49,.06), 0 12px 32px rgba(16,33,49,.12)` | — |
| `--pa-focus-ring` | `#7FE3B8` | Focus sobre navy |

### E.3 Tipografía (Plus Jakarta Sans)

| Elemento | Tamaño | Peso |
|---|---|---|
| Wordmark "ProAgent" | 14.5px | 800 |
| Bajada "by Proinversores" | 9.5px | 600, uppercase, `.06em` |
| Encabezado de grupo nav | 10px | 700, uppercase, `.09em` |
| Label nav expandido | 13px | 600 (700 activo) |
| Label nav en riel | 9.5px | 700 (800 activo) |
| Badge | 9.5–10.5px | 800 |
| Título de página (header) | 15px | 800 |
| Input de búsqueda | 12.5px | 500 |
| CTA header | 12.5px | 700 |
| Nombre en UserMenu | 12.5px | 700 |
| Rol en UserMenu | 10.5px | 600 |

---

## F. Comportamiento / interacción

### F.1 Click y rutas activas

| Ruta | Ítem activo |
|---|---|
| `/` | Inicio |
| `/captacion`, `/captacion/*` | Captación |
| `/properties`, `/properties/[id]`, `/properties/new` | **Inventario** |
| `/publications`, `/publications/*` | Publicación |

**Corrección respecto al brief:** `/properties/[id]` marca **Inventario** activo, no Publicación — el detalle de una propiedad pertenece al inventario. El flujo de publicación se marca activo solo bajo `/publications/*`. Si el detalle abre el asistente de publicación como sub-ruta (`/properties/[id]/publish`), esa sub-ruta sí marca Publicación.

**Nota rutas (Owner 2026-09-01):** la app usa `/publications` (no `/publish`); el handoff visual puede decir `/publish` — implementación = rutas reales del repo.

Matching: `pathname === href || pathname.startsWith(href + '/')`, evaluando primero la coincidencia más larga para que `/` no capture todo.

### F.2 Teclado

| Tecla | Acción |
|---|---|
| `Tab` | Recorre: skip-link → logo → ítems nav activables → colapsar → UserMenu → header |
| `[` | Alterna sidebar expandida / riel |
| `⌘K` / `Ctrl+K` | Abre el modal de búsqueda |
| `Esc` | Cierra drawer, UserMenu o modal (el más superficial primero) |
| `↑ ↓` | Navega dentro del UserMenu abierto |

Skip-link "Saltar al contenido" como primer elemento focusable, visible solo en focus, salta a `#main`.

### F.3 Focus
`outline: 2px solid var(--pa-focus-ring); outline-offset: 2px` sobre navy; `outline-color: var(--pa-navy)` sobre superficies claras. Nunca `outline: none` sin sustituto. El foco se atrapa dentro del drawer y del modal mientras estén abiertos, y regresa al disparador al cerrar.

### F.4 Transiciones
- Ancho de sidebar: `180ms cubic-bezier(.4,0,.2,1)`.
- Fondo/color de ítems: `120ms ease-out`.
- Drawer: entrada `220ms cubic-bezier(.2,.8,.2,1)`, overlay fade `160ms`.
- UserMenu: `120ms` opacidad + `translateY(4px → 0)`.
- Todo lo anterior respeta `@media (prefers-reduced-motion: reduce)` → duración `0ms`.

### F.5 Scroll
- La sidebar no scrollea con el contenido (`position: sticky; top: 0; height: 100dvh`).
- La lista de nav scrollea internamente si no cabe (`overflow-y: auto`, scrollbar de 8px `#D7DCE1`).
- El header es sticky y gana `--pa-shadow-header` cuando `scrollY > 0`.

### F.6 Estados de carga
Mientras el rol del usuario no ha resuelto, renderizar los ítems de nav como skeletons (`rgba(255,255,255,.08)`, radio 10px, altura 40px) en vez de mostrar y luego ocultar Captación — evita el parpadeo de un ítem que el usuario no debería ver.

---

## G. Paridad con la app mobile (Expo)

| # | Cambio en web | ¿Aplica en Expo? | Detalle |
|---|---|---|---|
| A1 | Íconos SVG reales | **Sí** | Reemplazar los dots por el mismo set de íconos |
| A2 | Agrupación Operación / Cartera | No | El bottom nav es plano por naturaleza |
| A3 | Badges de conteo | **Parcial** | Solo si el ítem existe en mobile. Captación **no** va en mobile → sin badge |
| A4 | Estado activo con píldora | **Sí** | Píldora `--pa-navy-050` + label 800 en navy, mismo lenguaje que el riel |
| A5 | Disabled con chip "Pronto" | **Sí** | Aplica a Clientes |
| A6 | Riel colapsado | No | No aplica |
| A7–A8 | Colapsar / logo en sidebar | No | El logo vive en el header de cada pantalla |
| A9 | Header con título + búsqueda centrada | **Parcial** | Mobile: título a la izquierda + ícono lupa a la derecha |
| A10 | Campana de notificaciones | **Sí** | Ícono en el header, punto `--pa-danger` |
| A11 | UserMenu enriquecido | **Sí** | Como pantalla "Más" / perfil, no como popover |
| A12–A13 | Medidas del shell | No | Mobile usa sus propias medidas |
| A14 | Drawer | No | Mobile ya tiene bottom nav |
| A15 | Eliminar "Más" del nav | **No** | En mobile **se conserva** "Más" — es el único acceso a perfil y ajustes |
| A16 | Filtro "Viendo como" | No | Solo web staff/admin |
| E.2 | Tokens nuevos | **Sí** | Portar a la constante de tema de Expo |

### G.1 Bottom nav de Expo — especificación final

Orden y labels (5 ítems, **sin Captación**):

| Pos | Label | Ruta Expo | Ícono | Nota |
|---|---|---|---|---|
| 1 | Inicio | `/(tabs)/index` | `home` | — |
| 2 | Inventario | `/(tabs)/properties` | `building-2` | **Cambia de "Propiedades" a "Inventario"** para igualar la web |
| 3 | Publicación | `/(tabs)/publish` | `plus` | **Ítem central elevado — se conserva** |
| 4 | Clientes | `/(tabs)/clients` | `users` | disabled + chip "Pronto" |
| 5 | Más | `/(tabs)/more` | `menu` | perfil, ajustes, ayuda, cerrar sesión |

Especificación visual:
- Alto de la barra `80px` + safe-area inferior; fondo `--pa-surface`, borde superior `--pa-border`.
- Ítem: alto táctil mínimo **48px**, ícono 20px, label 10.5px.
- Activo: píldora `--pa-navy-050`, radio 12px, ícono y label en `--pa-navy`, label peso 800.
- Inactivo: `--pa-text-muted`, label peso 600.
- Ítem central: círculo 52px `--pa-navy`, `+` blanco 20px stroke 2.6, sombra `0 8px 16px rgba(10,61,98,.35)`, desplazado `-14px` en vertical; label "Publicación" debajo.
- Badges: mismo formato que la web (mín. `16 × 16px`, esmeralda, texto `--pa-emerald-ink`) — reservado para uso futuro.

**Referencia de implementación:** `BottomNav v2.dc.html` en la raíz del proyecto (ya construido). Único ajuste pendiente ahí: renombrar "Captación" → "Más" y "Inmuebles" → "Inventario" para cumplir esta tabla.

---

## H. Fuera de alcance

Explícitamente **no** entran en shell-v2:

1. **Búsqueda global funcional** — la barra es UI + modal de estado vacío. Indexación, ranking y resultados: iteración aparte.
2. **CRM de Clientes** — el ítem queda disabled con chip "Pronto"; no hay rutas ni pantallas.
3. **Reportes** — igual que Clientes.
4. **Centro de notificaciones** — la campana muestra el punto rojo pero abre un popover con estado vacío. Sin backend, sin marcado de leídas.
5. **Migración de Captación, cutover del Kanban y feature flags** — sin cambios; Captación sigue siendo un ítem de nav visible solo para staff.
6. **Scrapers, sincronización de portales o cualquier lógica de backend.**
7. **Rediseño del contenido de las pantallas** (Inicio, Inventario, Publicación) — el contenido de los mockups es de referencia para juzgar proporciones, no una especificación.
8. **Modo oscuro** — TBD. Recomendación: los tokens `--pa-on-navy-*` ya abstraen la superficie navy, lo que deja el shell listo para un tema oscuro más adelante sin refactor.
9. **i18n** — TBD. Los labels están en español fijo. Recomendación: extraerlos a un diccionario ahora, porque el ancho del riel (76px) es el punto que primero se rompe con labels más largos.

---

## I. Criterios de aceptación (QA)

- [ ] **AC1** — La sidebar muestra los 6 ítems en el orden y agrupación de §B.1; "Más" ya no aparece en el nav web.
- [ ] **AC2** — Captación es visible para `staff` y `admin`, e invisible (no solo deshabilitada) para el resto de roles.
- [ ] **AC3** — Cada ítem muestra su ícono SVG; no queda ningún `dot` circular en la sidebar.
- [ ] **AC4** — El ítem activo muestra fondo, peso 700 y barra indicadora esmeralda; solo un ítem está activo a la vez.
- [ ] **AC5** — En `/properties/[id]` el ítem activo es Inventario, no Publicación.
- [ ] **AC6** — Clientes y Reportes no son clicables ni focusables por `Tab`, y exponen `aria-disabled="true"`.
- [ ] **AC7** — El botón colapsar alterna entre 248px y 76px; el estado sobrevive a un refresh (`localStorage`) y no produce salto de hidratación visible.
- [ ] **AC8** — En modo riel, cada ítem muestra tooltip con su label completo tras 400ms de hover; el tooltip nunca muestra el label corto.
- [ ] **AC8b** — Los labels del riel coinciden exactamente con §B.1 (incluido "Publicación"); no hay strings divergentes entre sidebar, riel y drawer — los tres leen de `nav-config.ts`.
- [ ] **AC9** — El header mide 60px, muestra el título de la página activa, y gana sombra al hacer scroll.
- [ ] **AC10** — `⌘K` (macOS) y `Ctrl+K` (Windows/Linux) abren el modal de búsqueda desde cualquier ruta del shell; `Esc` lo cierra y devuelve el foco.
- [ ] **AC11** — En `/captacion` el CTA del header dice "+ Nuevo lead"; en el resto dice "+ Nueva propiedad".
- [ ] **AC12** — El UserMenu abre con click y con `Enter`, se navega con flechas, cierra con `Esc` y devuelve el foco al disparador.
- [ ] **AC13** — Por debajo de 768px la sidebar está oculta y el hamburger abre un drawer de 288px con overlay; el foco queda atrapado dentro mientras está abierto.
- [ ] **AC14** — En mobile web, todo objetivo táctil del shell (hamburger, lupa, CTA, ítems del drawer) mide **≥ 44 × 44px**.
- [ ] **AC15** — Contraste: texto de nav sobre navy ≥ 4.5:1, labels de riel ≥ 4.5:1, badge esmeralda con texto `--pa-emerald-ink` ≥ 4.5:1. Verificado con axe DevTools sin violaciones críticas.
- [ ] **AC16** — Con `prefers-reduced-motion: reduce` no hay animación de ancho, drawer ni menú.
- [ ] **AC17** — El contenido de `main` respeta `max-width: 1440px` y el padding horizontal de §C en los tres breakpoints.
- [ ] **AC18** — El filtro "Viendo como" solo se renderiza para `admin`; con suplantación activa aparece la franja ámbar bajo el header.

---

## J. Archivos sugeridos en el repo

```
design_handoff/
  shell-v2.dc.html              # artifact visual (este entregable)
  shell-v2-README.md            # este documento
  screenshots/
    01-shell-desktop.png
    02-shell-collapsed.png
    03-shell-usermenu.png
    04-shell-tablet.png
    05-shell-mobile-web.png
    06-shell-mobile-drawer.png
    07-shell-states.png
```

Código sugerido en la app web:

```
src/components/shell/
  AppShell.tsx                  # composición: Sidebar + Header + main
  Sidebar.tsx                   # expandida + riel
  SidebarNavItem.tsx            # estados default/hover/active/disabled
  SidebarGroup.tsx              # encabezado de grupo
  MobileDrawer.tsx              # < md
  Header.tsx
  SearchTrigger.tsx             # barra + modal de estado vacío
  UserMenu.tsx
  ViewingAsSelect.tsx           # solo admin
  nav-config.ts                 # fuente única de ítems: label, href, icon, roles, badge
  use-shell-state.ts            # colapsado + drawer + persistencia
```

`nav-config.ts` es la pieza clave: un solo array tipado alimenta sidebar, riel y drawer, de modo que el orden y los permisos no se dupliquen en tres sitios.

App Expo:

```
components/navigation/
  BottomNav.tsx                 # ver §G.1
  theme/tokens.ts               # portar tokens de §E.2
```

---

## Preguntas abiertas (TBD)

| # | Tema | Recomendación |
|---|---|---|
| TBD-1 | ¿Reportes es un destino real o se elimina? | Mantenerlo disabled: comunica el roadmap sin costo. Si no hay plan a 2 trimestres, quitarlo — un disabled eterno erosiona la confianza en el nav |
| TBD-2 | Origen del conteo de leads del badge | Recomendación: leads en estado "Pendiente" sin asignar. Requiere un endpoint de conteo ligero, con poll cada 60s |
| TBD-3 | Modo oscuro | Fuera de alcance ahora; los tokens ya lo dejan preparado |
| TBD-4 | i18n | Extraer labels a diccionario ya; el riel de 76px es el primer punto de ruptura (ver la tabla de labels cortos en §B.1) |
| TBD-6 | ~~BRAND.md no verificado~~ | **Cerrado** — `BRAND.md` actualizado § Superficie navy + fondo plano web (2026-09-01) |
| TBD-5 | Avatar real vs. iniciales | Iniciales por defecto sobre `--pa-emerald`; soportar foto cuando exista el campo en el perfil |
