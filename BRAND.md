# Guía de Marca Proinversores

Fuente única de diseño para **Proinversores** y sus productos digitales:
**ProAgent (móvil)**, **ProAgent Web** y las **herramientas internas**
(`agente-inmobiliario`: dashboard/Kanban de captación). Todas las apps deben
verse como el mismo producto en distintas superficies.

> Este archivo se mantiene **idéntico en los 3 repos** (`proagent-web`,
> `proagent-mobile`, `agente-inmobiliario`). Si cambia la marca, actualízalo en
> los tres. Versión 1 — color, tipografía, espaciado y componentes UI.

---

## 01 · Logo

**Pendiente de definir.** El símbolo/logo de Proinversores está en revisión y
no forma parte de esta guía todavía. Mientras tanto, usar únicamente la
**wordmark en texto**: **Pro**inversores — `Pro` en navy `#0A3D62` peso 800,
`inversores` en ink `#16212B` peso 500. Esta sección se actualizará cuando se
apruebe una dirección final.

---

## 02 · Color

### Marca
| Rol | Hex | Token |
|---|---|---|
| Navy primario | `#0A3D62` | `--pa-navy` |
| Navy hover | `#0C4A78` | `--pa-navy-hover` |
| Navy pressed | `#082F4C` | `--pa-navy-pressed` |
| Esmeralda | `#1E8E5A` | `--pa-accent` |

### Semánticos
| Rol | Hex | Token |
|---|---|---|
| Éxito | `#1E8E5A` | `--pa-accent` |
| Advertencia | `#D9A227` | `--pa-warning` |
| Error | `#C23B2B` | `--pa-danger` |

### Neutros / texto
| Rol | Hex | Token |
|---|---|---|
| Ink (texto principal) | `#16212B` | `--pa-ink` |
| Muted (texto secundario) | `#5B6B79` | `--pa-muted` |
| Faint (texto terciario) | `#9AA6B2` | `--pa-faint` |
| Borde | `#E4E8EC` | `--pa-border` |

### Superficies y fondos
| Rol | Hex | Token |
|---|---|---|
| Surface (tarjetas) | `#FFFFFF` | `--pa-surface` |
| Fondo | `#F6F7F9` | `--pa-bg` |
| Fondo alt | `#EEF0F3` | `--pa-bg-alt` |

### Fondos suaves de estado
| Rol | Hex | Token | Texto sugerido |
|---|---|---|---|
| Éxito bg | `#E6F5EC` | `--pa-success-bg` | `#1E8E5A` |
| Warning bg | `#FCEEE0` | `--pa-warning-bg` | `#B5651D` (`--pa-warning-ink`) |
| Danger bg | `#FBE7E4` | `--pa-danger-bg` | `#C23B2B` |
| Info bg | `#E7EEF4` | `--pa-info-bg` | `#0A3D62` |

**Regla de color semántico:** rojo solo para error/urgente, verde solo para
éxito/disponible, naranja solo para pendiente/atención. **Nunca** usar estos
tres como color decorativo o de fondo general.

### Superficie navy — app shell

El navy deja de ser solo color de acento y pasa a ser **fondo del marco de la
aplicación** (sidebar web, riel de navegación, drawer móvil web). Esto exige
una escala de texto sobre navy y un acento que funcione sobre ese fondo. Los
hex de marca base **no cambian**; los tokens de abajo extienden la paleta
existente.

| Rol | Hex | Token |
|---|---|---|
| Navy pressed | `#082F4C` | `--pa-navy-pressed` |
| Navy 050 (superficie clara derivada) | `#EAF0F5` | `--pa-navy-050` |
| Esmeralda brillante (solo sobre navy) | `#2FC98A` | `--pa-emerald-bright` |
| Esmeralda ink (texto sobre brillante) | `#06331F` | `--pa-emerald-ink` |
| Anillo de foco (solo sobre navy) | `#7FE3B8` | `--pa-focus-ring` |

**Texto sobre navy** (sidebar, riel, drawer):

| Rol | Valor | Token |
|---|---|---|
| Primario (activo) | `#FFFFFF` | `--pa-on-navy-primary` |
| Secundario (normal) | `rgba(255,255,255,0.72)` | `--pa-on-navy-secondary` |
| Muted (encabezados de grupo) | `rgba(255,255,255,0.42)` | `--pa-on-navy-muted` |
| Disabled | `rgba(255,255,255,0.34)` | `--pa-on-navy-disabled` |

**Reglas shell:**

- La esmeralda brillante `#2FC98A` es **solo para acentos sobre navy** (badges
  de conteo, indicador de ítem activo, avatar). Sobre fondo claro se sigue
  usando la esmeralda de marca `#1E8E5A` (`--pa-accent`).
- Todo texto sobre esmeralda brillante va en `#06331F` (`--pa-emerald-ink`),
  **nunca** en blanco (blanco sobre `#2FC98A` no alcanza contraste AA).
- El anillo de foco `#7FE3B8` se usa **solo sobre navy**. Sobre superficies
  claras el foco es el navy primario (`--pa-navy`).
- Error / destructivo / punto de notificación: seguir `--pa-danger` (`#C23B2B`),
  no inventar rojos alternos.

Especificación de layout e interacción del shell: [`proagent-web/design_handoff/shell-v2-README.md`](https://github.com/ctorres2747/proagent-web/blob/main/design_handoff/shell-v2-README.md) (Sprint 052).

### Fondo alternativo — dashboards densos

Degradado azulado muy sutil derivado del navy de marca (hue 240, igual que
`#0A3D62`); token `--pa-bg-app`:

```css
radial-gradient(120% 100% at 0% 0%, oklch(97% 0.008 240) 0%, oklch(95% 0.014 240) 100%)
```

Es una **extensión** de la paleta (no un color base) para dar profundidad en
**interfaces densas** con muchas tarjetas blancas (p. ej. Kanban / captación
interna en `agente-inmobiliario`).

**Dónde aplica:**

| Superficie | Fondo |
|---|---|
| **ProAgent Web** | Plano `#F6F7F9` (`--pa-bg`) — **sin** degradado en body |
| **ProAgent Mobile** | Plano `#F6F7F9` (`--pa-bg`) |
| **Dashboard / Kanban interno** (`agente-inmobiliario`) | Degradado `--pa-bg-app` en body + contenedor raíz |

Solo afecta al fondo del canvas: tarjetas, inputs y chips siguen en blanco /
`#F6F7F9` sólido.

---

## 03 · Tipografía

**Plus Jakarta Sans** — única familia tipográfica en toda la marca (pesos
400 / 500 / 600 / 700 / 800).

| Estilo | Tamaño · peso | Uso |
|---|---|---|
| Display | 32 · 800 | Portadas / hero |
| H1 | 22 · 800 | Título de sección |
| H2 | 19 · 800 | Subtítulo |
| Body strong | 14 · 700 | Texto destacado del cuerpo |
| Body | 14 · 400 | Párrafos y descripciones |
| Caption | 12 · 600 | Etiquetas y metadatos (color muted) |
| Micro / overline | 11 · 700 | Overlines y badges (uppercase, `letter-spacing: 0.04em`, color faint) |

**Wordmark provisional** (mientras se define el logo): **Pro**inversores —
`Pro` navy 800, `inversores` ink 500, `letter-spacing: -0.01em`.

---

## 04 · Espaciado y radios

- **Escala de espaciado (base 4px):** 4 (xs) · 8 (sm) · 12 (md) · 16 (lg) ·
  20 (xl) · 24 (2xl).
- **Radios de borde:** 6 (sm) · 12 (md) · 14 (lg) · 16 (xl) · `999px` (pill).
- Sombras muy sutiles; botones pill o bloque.

---

## 05 · Componentes

### Botones
- **Primario:** fondo navy `#0A3D62`, texto blanco, peso 700, radio 10.
- **Secundario / ghost:** fondo `#EEF0F3`, borde `#E4E8EC`, texto ink, peso 600.
- **Texto / link:** navy, peso 700, sin fondo.
- **Pill:** navy, texto blanco, radio pill (`999px`).
- **Deshabilitado:** fondo `#EEF0F3`, texto faint `#9AA6B2`.

### Badges de estado
Fondo suave + texto del estado, radio 6, peso 700, 11px. Siempre con **texto**
(nunca solo color):
`Publicado` (éxito), `En proceso` (warning), `Error` (danger),
`Sin publicar` (neutro `#EEF0F3`/`#5B6B79`), `Info` (info bg / navy).

### Chips de filtro
- Inactivo: fondo `#F6F7F9`, borde `#E4E8EC`, texto `#45525E`, peso 600, radio pill, con `▾`.
- Activo/seleccionado: fondo navy, texto blanco, peso 700.

### Tarjeta e input
- **Tarjeta:** surface blanco, borde `#E4E8EC`, radio 14, padding 14.
- **Input:** fondo `#F6F7F9`, borde `#E4E8EC`, radio 10, padding 11×14; label
  11px peso 700 color muted.

### Navegación
- **App shell v2 (ProAgent Web):** sidebar / riel / drawer en `--pa-navy`; ítems
  con íconos SVG; activo con barra `--pa-emerald-bright` sobre navy; UserMenu
  en pie de sidebar. Handoff: `design_handoff/shell-v2-README.md`.
- **Tab bar (ProAgent Mobile):** 5 ítems; acción central elevada en navy;
  label **Inventario** (no “Propiedades”); activo con píldora `--pa-navy-050`.
  Sin Captación en mobile.

---

## Implementación por repo

La paleta vive como tokens en cada stack; los nombres `--pa-*` son la
referencia canónica:

- **`proagent-web`** (Next.js + Tailwind v4): variables CSS `--pa-*` en
  `src/app/globals.css` + `src/design-system/tokens.ts`. Fuente Plus Jakarta
  Sans vía `next/font`. Fondo **plano** `--pa-bg`; tokens § Superficie navy
  para el app shell (Sprint 052).
- **`proagent-mobile`** (Expo/RN): `src/design-system/` (tokens) + Plus Jakarta
  Sans (`@expo-google-fonts/plus-jakarta-sans`). Portar tokens § Superficie navy
  donde aplique (bottom nav, estados activos).
- **`agente-inmobiliario`** (dashboard `frontend/AgenteInmobiliario.html`):
  mismos hex; usa el **fondo alternativo** (degradado `--pa-bg-app`) por ser
  interfaz densa interna.

Al crear o ajustar UI en cualquiera de los tres, seguir esta guía. Si un valor
no está aquí, derivarlo de estos tokens antes de inventar uno nuevo.
