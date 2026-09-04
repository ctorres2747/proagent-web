# Handoff — Correcciones vista Inventario (header + filtros + tabla)

**Contexto:** ajustes puntuales sobre la vista Inventario ya implementada (Next.js 15 / shell C: riel + subnav). No es un rediseño; corrige duplicaciones y densidad detectadas en QA visual.

**Sprint:** 053 — ver [`proagent-mobile/sprints/053-inventario-header-ux.md`](https://github.com/ctorres2747/proagent-mobile/blob/main/sprints/053-inventario-header-ux.md).

**Artifact Owner:** [`inventario-ajustes.dc.html`](./inventario-ajustes.dc.html) (export Claude Design; nombre original: `Inventario - Ajustes.dc.html`).

**Fuera de alcance (Owner 2026-09-03):** subnav lateral 228px ("Todos / Publicados / Faltan datos") — aparece en el mock solo como contexto visual.

---

## A. Resumen antes → después

| # | Antes | Después |
|---|---|---|
| 1 | Topbar global mostraba "Inventario" (título) y la página repetía el mismo `<h1>` debajo | El topbar **ya no lleva título de página** — solo breadcrumb ("Operación / Inventario"), búsqueda global (`⌘K`), campana y avatar. El único título es el `<h1>` de la página |
| 2 | Barra de búsqueda en el topbar duplicada con la búsqueda contextual de Inventario | Se **elimina la búsqueda contextual duplicada** del header; queda la búsqueda **de vista** dentro de la tarjeta de filtros. La búsqueda **global** del header se **conserva** (modal placeholder hasta implementación real) |
| 3 | Botón "+ Nueva propiedad" en el topbar y otro "Nueva propiedad" junto a Tarjetas/Tabla | Se **elimina el CTA del topbar** en todas las vistas. CTA contextual solo en el **cuerpo** de cada pantalla (Inventario: crear ficha manual; Captación: + Nuevo lead) |
| 4 | Bloque de paginación encima de la tabla, generando franja vacía | Paginación **solo debajo** de la tabla (conservar flechas ‹ ›) |
| 5 | Filtros sueltos sobre fondo gris | Buscador + filtros agrupados en **una tarjeta** blanca. Chip "Faltan datos" ámbar; dropdowns Tipo/Municipio/Estado/Precio con chevron |
| 6 | Columna "Canales" en la tabla de Inventario | **Se elimina** (vista tarjetas también). Detalle de canales sigue en Publicación |
| 7 | Logo del riel no alinea a 60px con el header | Contenedor del logo = **60px** alto, alineado con `--pa-shell-header-h` |

---

## B. Topbar global (todas las vistas)

Altura: `60px`. Contenido:

1. **Breadcrumb** — grupo + página (ej. `Operación` / `Inventario`), 13px.
2. **Búsqueda global** centrada (modal `⌘K`; placeholder actual OK).
3. Spacer (mobile: hamburger + breadcrumb).
4. **Campana** + **avatar** (36px, abre UserMenu).

**No lleva:** título de página duplicado ni CTA global.

---

## C. Cuerpo — Inventario

Ver sprint 053 § Parte B para AC completos (encabezado, tarjeta filtros, tabla, paginación).

---

## D. QA

- [ ] Ningún título de página duplicado entre header y `<h1>` del contenido.
- [ ] Un solo CTA "Nueva propiedad" en Inventario; crea ficha y abre `/properties/[id]`.
- [ ] Paginación solo debajo de tabla/lista; flechas conservadas.
- [ ] Sin columna/chips Canales en inventario (web tabla + tarjetas).
- [ ] Búsqueda global sigue accesible (`⌘K` / ícono mobile).
- [ ] Logo riel alineado 60px con header.
