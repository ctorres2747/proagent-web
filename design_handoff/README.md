# Design handoff — ProAgent Web

## Shell unificado + Captación (Claude Design, 2026-08-15)

- Archivo: [`ProAgent-Web-standalone.dc.html`](./ProAgent-Web-standalone.dc.html)
- Origen: Claude Design (Owner)
- Uso: referencia visual para Dev. **No** es código de producto Next.js.

### Pantallas en el artifact
- Shell nav: Inicio · Captación · Propiedades · Publicar · Clientes · Más
- Captación: columnas Pendiente / En contacto / Captado / Descartado + detalle lead + CTA Publicar
- Flujo publicar (contenido → fotos → canales → personalizar → preview → resultados)

### Notas Manager
- Captación gated staff Proinversores
- Brand navy `#0A3D62` + tokens alineados a BRAND
- Publicar desde Captado → misma app (wizard), no drawer legacy Kanban

### Regla Owner
- **ProAgent Mobile no incluye Captación/Kanban**, ni para staff Proinversores. Captación = Web staff (+ HTML hasta cutover).

---

## App Shell v2 (Claude Design, 2026-09-01)

- Artifact: [`shell-v2.dc.html`](./shell-v2.dc.html) (+ [`support.js`](./support.js) stub para export Claude Design)
- Spec técnica: [`shell-v2-README.md`](./shell-v2-README.md)
- Screenshots: [`screenshots/`](./screenshots/) (`01`–`07`)
- Sprint: **052** — mejoras nav/sidebar/header; ver `BRAND.md` § Superficie navy

### Pantallas en el artifact (01–07)
- Desktop sidebar expandida / riel colapsado
- UserMenu, tablet, mobile web, drawer
- Estados de componentes + bottom nav Expo (paridad)
