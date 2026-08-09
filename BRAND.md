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
| Esmeralda | `#1E8E5A` | `--pa-accent` |

### Semánticos
| Rol | Hex | Token |
|---|---|---|
| Éxito | `#1E8E5A` | `--pa-accent` |
| Advertencia | `#D97B2B` | `--pa-warning` |
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

### Fondo general en degradado
Degradado azulado muy sutil derivado del navy de marca (hue 240, igual que
`#0A3D62`); token `--pa-bg-app`:

```css
radial-gradient(120% 100% at 0% 0%, oklch(97% 0.008 240) 0%, oklch(95% 0.014 240) 100%)
```

Es una **extensión** de la paleta (no un color base) para dar profundidad al
**fondo general** de la app, sobre todo donde hay muchas tarjetas blancas. Se
aplica al **body + contenedor raíz** de:

- **ProAgent Web** (fondo general de toda la app), y
- las **interfaces internas densas** (dashboard/Kanban de `agente-inmobiliario`).

Solo afecta al fondo: el resto de superficies (tarjetas, inputs, chips) siguen
en blanco / `#F6F7F9` sólido. La **app móvil** mantiene el fondo plano
`#F6F7F9` (pantalla compacta, una mano) salvo decisión futura.

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
- **Sidebar (web):** ítem activo en navy con texto blanco; inactivo texto
  `#45525E` peso 600.
- **Tab bar (móvil):** ítems faint; acción central elevada en navy (círculo).

---

## Implementación por repo

La paleta vive como tokens en cada stack; los nombres `--pa-*` son la
referencia canónica:

- **`proagent-web`** (Next.js + Tailwind v4): variables CSS `--pa-*` en
  `src/app/globals.css` + `src/design-system/tokens.ts`. Fuente Plus Jakarta
  Sans vía `next/font`.
- **`proagent-mobile`** (Expo/RN): `src/design-system/` (tokens) + Plus Jakarta
  Sans (`@expo-google-fonts/plus-jakarta-sans`).
- **`agente-inmobiliario`** (dashboard `frontend/AgenteInmobiliario.html`):
  mismos hex; es el único que usa el **fondo alternativo** (degradado) por ser
  una interfaz densa interna.

Al crear o ajustar UI en cualquiera de los tres, seguir esta guía. Si un valor
no está aquí, derivarlo de estos tokens antes de inventar uno nuevo.
