# AGENTS.md — ProAgent Web

Contexto para agentes de Cursor (Cloud/Desktop) que trabajen en `proagent-web`.

## Qué es este repo

Producto **web comercial** de ProAgent (Proinversores) para agentes
inmobiliarios — ofrecido al público junto con la app móvil. Cliente
**desacoplado** del backend: el host se inyecta con `NEXT_PUBLIC_API_URL`.
Ver `README.md` para arranque, rutas y arquitectura.

Parte de un workspace multi-repo:

| Repo | Rol |
|---|---|
| `proagent-web` (este) | Web comercial (Next.js). Inventario + publicación. PRs → `main`. |
| `proagent-mobile` | App móvil Expo (Android-first). Mismo inventario. PRs → `main`. |
| `agente-inmobiliario` | FastAPI + Kanban **interno** de captación + scrapers + motores. API `/api/web` y `/api/mobile` en `develop`. |

## Reglas obligatorias

- **Marca / diseño:** seguir [`BRAND.md`](BRAND.md) — guía de marca Proinversores
  (color, tipografía, espaciado, componentes; tokens `--pa-*`). Es la fuente
  única de diseño, idéntica en los 3 repos.
- **Stack fijo:** Next.js 15 App Router + TS estricto + Tailwind v4 + TanStack
  Query + tokens ProAgent. No cambiar de stack sin el Owner.
- **No backend paralelo.** El backend es `agente-inmobiliario`. El cliente
  consume **`/api/web/*`** (módulo `backend/web/`; auth + properties con reglas
  E-INV-01). El puente histórico `/api/mobile/*` quedó atrás.
- **Cliente HTTP desacoplado:** cambiar de host = cambiar `NEXT_PUBLIC_API_URL`,
  nada más. Al migrar a `/api/web/*`, tocar **solo** `src/services/http/*`.
- **NO** usar Expo Web como producto comercial. **NO** copiar
  `AgenteInmobiliario.html`.

## Frontera Kanban ↔ ProAgent (decisión cerrada 2026-08-13)

Canónico:
[`docs/frontera-kanban-proagent.md`](https://github.com/ctorres2747/agente-inmobiliario/blob/develop/docs/frontera-kanban-proagent.md)
en `agente-inmobiliario`.

ProAgent Web **nunca** incluye:

- Scrapers MercadoLibre / Facebook
- Kanban interno de captación de leads
- Email diario / pipeline de captación

| | Kanban (interno) | ProAgent Web (este repo) |
|---|---|---|
| Objeto | Leads | Fichas / propiedades (`fichas`) |
| Alta manual | No (migra aquí) | Sí — fuente de altas manuales del inventario |
| Tras “Publicar” en Kanban | Crea ficha | Esa ficha **debe** listarse en `/properties` |
| Publicación manual del inventario | No | Sí (asistente / panel web; mobile también) |

Mismo inventario que mobile: ficha creada en la app móvil aparece aquí y
viceversa. Destino UX: el botón Publicar del Kanban abrirá este producto en
el flujo de publicación de la ficha (sin romper el flujo actual del Kanban
mientras tanto).

## Roles / ownership

- MVP: **admin** y **asesor** (Coordinador después).
- Asesor ve solo lo suyo (`owner_agente_id`); admin `@proinversores` ve el
  inventario de su dominio (reglas = épica **E-INV-01**).

## Flujo de trabajo

- Ramas: `cursor/<descripcion>-<sufijo>`.
- PRs de la web → `main`. Cambios de API → PR en `agente-inmobiliario`
  (base `develop`; el Owner promueve a `main`/VPS).
- Calidad mínima antes de PR: `npm run typecheck` y `npm run build` OK.
- Commits claros; sin secretos en git (`.env` ignorado, `.env.example` sí se
  trackea).

## Estado

- **E-PLAT-01 (fundaciones/scaffold):** implementado en este repo.
- Inventario `/api/web` + reglas E-INV-01: en curso / disponible según backend
  `develop`.
- Siguiente cola natural: **E-WEB-01** (asistente de publicación real) y, en
  backend, handoff Kanban Publicar → URL de esta web.
