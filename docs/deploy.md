# Deploy ProAgent Web (producción)

Sprint 009 — URL pública recomendada: **`https://app.proinversores.bond`**

Stack actual en el VPS Hetzner (`167.233.52.184`):

| Servicio | Host | Proceso local | systemd |
|----------|------|---------------|---------|
| API (FastAPI) | `https://agente.proinversores.bond` | `127.0.0.1:8000` | `agente` |
| **ProAgent Web** | `https://app.proinversores.bond` | `127.0.0.1:3000` | `proagent-web` |

HTTPS lo termina **Caddy** (Let's Encrypt). Zona DNS operativa: **`proinversores.bond`** (Cloudflare DNS only).  
`https://app.proinversores.com` **no está provisionado** — era solo un ejemplo aspiracional.

---

## Path A — mismo VPS + Caddy (recomendado)

### 1. DNS (Cloudflare)

1. Zona `proinversores.bond` → registro **A** `app` → `167.233.52.184`.
2. Modo **DNS only** (igual que `agente`), sin proxy naranja si Caddy gestiona el certificado en el VPS.

### 2. Node.js en el VPS

Node **20+** (probado con 22 en desarrollo):

```bash
node -v   # debe ser >= 20
```

### 3. Código y build

```bash
sudo mkdir -p /opt/proagent-web
sudo chown "$USER:$USER" /opt/proagent-web
git clone https://github.com/ctorres2747/proagent-web.git /opt/proagent-web
cd /opt/proagent-web
git checkout main
npm ci

# NEXT_PUBLIC_* se embebe en el build — definir ANTES de build:
export NEXT_PUBLIC_API_URL=https://agente.proinversores.bond
npm run build
```

Opcional: guardar en `.env.production.local` (no commitear):

```env
NEXT_PUBLIC_API_URL=https://agente.proinversores.bond
```

> Si cambias `NEXT_PUBLIC_API_URL`, debes **volver a ejecutar `npm run build`** y reiniciar el servicio.

### 4. systemd

```bash
sudo cp deploy/proagent-web.service /etc/systemd/system/
# Editar User/WorkingDirectory si no usas ubuntu ni /opt/proagent-web
sudo systemctl daemon-reload
sudo systemctl enable --now proagent-web
sudo systemctl status proagent-web
```

El unit escucha solo en `127.0.0.1:3000` (no expone Node a internet directamente).

### 5. Caddy

Añadir el bloque de [`deploy/caddy-snippet.conf`](../deploy/caddy-snippet.conf) a `/etc/caddy/Caddyfile` (junto al site de `agente.proinversores.bond`):

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

### 6. Backend — `PROAGENT_WEB_URL` (Kanban handoff)

En el `.env` del backend (`agente-inmobiliario` en el VPS):

```env
PROAGENT_WEB_URL=https://app.proinversores.bond
```

Sin slash final. Luego:

```bash
sudo systemctl restart agente
```

El Kanban lee esta URL vía `GET /api/dashboard/config` y abre  
`{PROAGENT_WEB_URL}/properties/{ficha_id}` (Sprint 005/006 handoff).

### 7. Smoke rápido

1. `curl -sI https://app.proinversores.bond` → `200` o redirect a login.
2. Abrir en navegador → `/login` → credenciales agente → inventario carga.
3. Desde Kanban (con sesión): **Publicar** en un lead → abre ProAgent Web en la ficha.

### 8. Actualizar deploy

```bash
cd /opt/proagent-web
git pull origin main
npm ci
export NEXT_PUBLIC_API_URL=https://agente.proinversores.bond
npm run build
sudo systemctl restart proagent-web
```

---

## Path B — Vercel (u otro PaaS)

1. Conectar el repo `proagent-web` en Vercel.
2. **Environment variables** (Production):
   - `NEXT_PUBLIC_API_URL` = `https://agente.proinversores.bond`
3. Custom domain: `app.proinversores.bond` (CNAME o A según el proveedor).
4. En el VPS backend: `PROAGENT_WEB_URL=https://app.proinversores.bond` + `systemctl restart agente`.

Mismas reglas: `NEXT_PUBLIC_*` requiere **redeploy** si cambia la URL de la API.

---

## Variables de entorno

| Variable | Cuándo | Ejemplo prod |
|----------|--------|--------------|
| `NEXT_PUBLIC_API_URL` | **Build** (y dev local) | `https://agente.proinversores.bond` |
| `NEXT_PUBLIC_USE_MOCKS` | Build (opcional) | vacío o `false` en prod |
| `PROAGENT_WEB_URL` | Runtime en **backend** VPS | `https://app.proinversores.bond` |

Ver [`.env.example`](../.env.example) en este repo.

---

## Troubleshooting

| Síntoma | Revisar |
|---------|---------|
| Web carga pero login falla | `NEXT_PUBLIC_API_URL` en el build; API `agente` activo; CORS (`allow_origins=["*"]` en FastAPI). |
| Kanban no abre Web | `PROAGENT_WEB_URL` en `.env` del backend + `systemctl restart agente`. |
| 502 en `app.*` | `systemctl status proagent-web`; puerto 3000 en `127.0.0.1`. |
| Certificado TLS | `journalctl -u caddy`; DNS `app` apuntando al VPS. |

---

## Referencias

- Sprint spec: `proagent-mobile/sprints/009-deploy-proagent-web.md`
- Frontera Kanban ↔ ProAgent: `agente-inmobiliario/docs/frontera-kanban-proagent.md`
- Handoff auth: ruta `/auth/handoff` en esta app
