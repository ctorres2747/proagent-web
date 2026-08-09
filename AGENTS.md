# AGENTS.md — ProAgent Web

Contexto para agentes de Cursor (Cloud/Desktop) que trabajen en `proagent-web`.

## Qué es este repo

Producto **web comercial** de ProAgent (Proinversores) para agentes
inmobiliarios. Cliente **desacoplado** del backend: el host se inyecta con
`NEXT_PUBLIC_API_URL`. Ver `README.md` para arranque, rutas y arquitectura.

Parte de un workspace multi-repo:

| Repo | Rol |
|---|---|
| `proagent-web` (este) | Web comercial (Next.js). PRs base → `main`. |
| `proagent-mobile` | App móvil Expo (Android-first). PRs base → `main`. |
| `agente-inmobiliario` | FastAPI + Kanban interno + scrapers + motores de publicación. API móvil/web en `develop`. |

## Reglas obligatorias

- **Stack fijo:** Next.js 15 App Router + TS estricto + Tailwind v4 + TanStack
  Query + tokens ProAgent. No cambiar de stack sin el Owner.
- **No backend paralelo.** El backend es `agente-inmobiliario`. El cliente
  consume **`/api/web/*`** (módulo `backend/web/`; auth + properties con reglas
  E-INV-01). El puente histórico `/api/mobile/*` quedó atrás.
- **Cliente HTTP desacoplado:** cambiar de host = cambiar `NEXT_PUBLIC_API_URL`,
  nada más. Al migrar a `/api/web/*`, tocar **solo** `src/services/http/*`.
- **NO** usar Expo Web como producto comercial. **NO** copiar
  `AgenteInmobiliario.html`.

## Frontera público / privado (decisión de producto cerrada)

ProAgent Web **nunca** incluye:

- Scrapers MercadoLibre / Facebook
- Kanban interno de captación de leads
- Email diario / pipeline de captación

Comparte la **misma tabla `fichas`** (misma fuente de datos), pero es **otra
superficie de UI**. Toda esa lógica vive solo en `agente-inmobiliario`.

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
- Siguiente cola natural: `backend/web/` + `/api/web/*`, **E-INV-01** (inventario
  Kanban→ProAgent + reglas admin) y **E-WEB-01** (asistente de publicación).
