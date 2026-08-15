# ProAgent Web

Producto web comercial de **ProAgent** (Created by Proinversores) para agentes
inmobiliarios. Es un cliente **desacoplado** del backend ProAgent: el host de la
API se inyecta en runtime (`NEXT_PUBLIC_API_URL`), de modo que el mismo build
puede apuntar a dev local, al VPS actual o a un VPS dedicado en el futuro.

Este repo implementa **E-PLAT-01** (fundaciones / scaffold).

## Stack

- **Next.js 15** (App Router) + **TypeScript** estricto
- **Tailwind CSS v4**
- **TanStack Query** para data fetching
- **Plus Jakarta Sans** (fuente) + tokens ProAgent (navy `#0A3D62`, accent `#1E8E5A`, bg `#F6F7F9`)
- Auth JWT con token en `localStorage`; cliente HTTP propio (`fetch`)

## Requisitos

- Node.js 20+ (probado con Node 22)

## Arranque

```bash
npm install
cp .env.example .env.local   # opcional
npm run dev                  # http://localhost:3000
```

### Modos

| `NEXT_PUBLIC_API_URL` | Comportamiento |
|---|---|
| vacío (o `NEXT_PUBLIC_USE_MOCKS=true`) | 100% mocks, sin backend. Sesión admin automática (se omite el login). |
| definido (ej. `http://localhost:8000`) | HTTP real contra el backend ProAgent; login JWT en `/login`. |

## Scripts

```bash
npm run dev        # dev server (turbopack)
npm run build      # build de producción (turbopack)
npm run start      # servir el build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

## Deploy (producción)

Guía paso a paso (VPS + Caddy + systemd): [`docs/deploy.md`](docs/deploy.md).

URL pública recomendada: `https://app.proinversores.bond` · API: `https://agente.proinversores.bond`

## Rutas

- `/login` — login JWT (se omite en modo mocks); admite `?next=` con path relativo allowlist
- `/auth/handoff` — intercambio de code opaco del Kanban → sesión JWT + redirect
- `/` — dashboard del agente
- `/properties` — listado de propiedades (fichas)
- `/properties/[id]` — detalle de propiedad
- `/publications` — placeholder del asistente de publicación (E-WEB-01)

## Arquitectura

```text
src/
  app/                      # App Router (pantallas delgadas)
    (app)/                  # área autenticada: RequireAuth + AppShell
    login/                  # login JWT
    layout.tsx globals.css  # fonts + Providers + tokens --pa-*
  components/               # Providers, AppShell, RequireAuth
  config/env.ts             # selección mocks vs HTTP
  design-system/tokens.ts   # tokens (espejo de --pa-*)
  features/auth/            # AuthProvider + tipos (AgentSession, role)
  services/
    interfaces/             # contratos (auth, properties)
    mocks/                  # implementación mock
    http/                   # implementación HTTP (adapters)
    index.ts                # locator: USE_HTTP_API ? http : mocks
```

### API: `/api/web/*`

Los adapters HTTP consumen **`/api/web/*`** (módulo `backend/web/` en
`agente-inmobiliario`): `auth/login`, `auth/me`, `properties` (+ `/{id}`), con
reglas de inventario E-INV-01 por rol. Migrar de host = cambiar
`NEXT_PUBLIC_API_URL`; las pantallas no dependen del transporte (solo
`src/services/http/*`).

## Frontera de producto (público vs privado)

ProAgent Web es **producto comercial público** (junto con ProAgent Mobile).
**No** incluye ni incluirá:

- Scrapers de MercadoLibre / Facebook
- Kanban interno de captación de leads
- Email diario de leads / pipeline de captación

Comparte la **misma fuente de datos** (`fichas`) que el sistema interno, pero es
**otra superficie de UI**. La lógica de captación vive únicamente en
`agente-inmobiliario` y nunca se expone aquí.

**Decisión 2026-08-13** (canónico:
[`frontera-kanban-proagent.md`](https://github.com/ctorres2747/agente-inmobiliario/blob/develop/docs/frontera-kanban-proagent.md)):

- Alta **manual** de propiedades → esta web (visible también en mobile).
- Ficha creada en mobile → aparece en `/properties` aquí.
- “Publicar” desde un lead en el Kanban crea ficha → debe listarse en esta
  tabla; la publicación/republicación manual del inventario se hace aquí (y en
  mobile). A futuro el botón del Kanban abrirá esta web.

### Ownership / roles (MVP)

- Roles: **admin** y **asesor** (Coordinador después).
- Un asesor ve solo lo suyo (`owner_agente_id`); un admin `@proinversores` ve las
  propiedades de los agentes del dominio. Las reglas de inventario admin son
  **E-INV-01**.
