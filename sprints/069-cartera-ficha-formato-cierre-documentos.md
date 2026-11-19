# Sprint 069 — Cartera Clientes: formato numérico, cierre y documentos

| Campo | Valor |
|-------|--------|
| **Estado** | **`ready_for_dev`** — Owner 2026-11-19 |
| **Prioridad** | Por encima de 068 (Owner) |
| **Épica** | Cartera / demanda (compradores) |
| **Repos** | `proagent-web` → `main` · `agente-inmobiliario` → `develop` |
| **Ruta web** | **`/clients`** — ficha (`ClientDetailModal`) |
| **Mobile** | **Fuera de alcance** v1 |

---

## Objetivo

Mejorar la ficha del cliente en **Clientes (Cartera)** con:

1. Lectura de **números con separador de miles** (puntos, locale `es-CO`) donde aplique en la ficha.
2. **`fecha_cierre`** obligatoria cuando el cliente pasa a estado **`cerrado`**.
3. **Adjuntos del cliente**: subir, listar, descargar y borrar (solo dueño).
4. **Fix** miniatura de inmueble vinculado (producción, API real).

---

## Decisiones cerradas (Owner 2026-11-19)

| # | Tema | Decisión |
|---|------|----------|
| 1 | Formato numérico | Todos los numéricos **visibles** en la ficha; **solo en lectura** (inputs siguen valor crudo al editar) |
| 2 | Fecha cierre | Campo del **cliente**; aplica con `estado = cerrado`; **obligatoria** al entrar en Cerrado; **solo fecha** (sin hora); misma zona UI que primer contacto / próxima cita |
| 3 | Documentos | Solo **web**; almacenamiento **en servidor API** (no Google Drive / no canal Entrega) |
| 4 | Etiqueta documento | Texto **libre** al subir (ej. Compraventa, Certificado de libertad) |
| 5 | Borrar documento | Solo **`owner_agente_id`** del cliente (admin **no** borra archivos ajenos en v1) |
| 6 | Límites | **10 MB** por archivo; **20** archivos máx. por cliente; tipos: **PDF, JPG, PNG, DOC, DOCX, XLS, XLSX** |
| 7 | Bug portada | Confirmado en producción: URL relativa `/fotos/...` sin host de API |

---

## T1 — API (`agente-inmobiliario` → `develop`)

### 1.1 Migración / modelo

- Tabla `clientes`: columna `fecha_cierre` (`DATE`, nullable).
- Tabla `cliente_documentos`:
  - `id`, `cliente_id` (FK, ON DELETE CASCADE)
  - `etiqueta` (TEXT, obligatoria, trim, máx. 120)
  - `nombre_original` (TEXT)
  - `archivo` (TEXT — ruta relativa bajo directorio dedicado, ej. `clientes_docs/<uuid>.<ext>`)
  - `mime_type`, `tamano_bytes`
  - `subido_por_agente_id`, `fecha_subida`
- Directorio en disco: p. ej. `CLIENTES_DOCS_DIR` junto a `FOTOS_DIR` (gitignore); **no** montar como estático público.

### 1.2 Reglas de negocio

- **`update_cliente`**: si `estado` nuevo es `cerrado` → exigir `fecha_cierre` (en el mismo PATCH o ya persistida); si falta → **422** mensaje claro en español.
- Si estado deja de ser `cerrado`, `fecha_cierre` puede quedar histórica o limpiarse — **v1: conservar** el valor (solo obligatorio al estar en `cerrado` en validación de transición).
- Documentos: CRUD acotado a cliente accesible vía `get_cliente_for_agent` (mismas reglas E-INV-01 / equipo admin lectura; **borrar** solo si `agente.id == owner_agente_id` del cliente).

### 1.3 Endpoints `/api/web/clients/{id}/...`

| Método | Ruta | Notas |
|--------|------|--------|
| — | `GET/PATCH` cliente existentes | Incluir `fecha_cierre` en schema; validación cierre en PATCH |
| `GET` | `.../documents` | Lista metadatos (sin bytes) |
| `POST` | `.../documents` | `multipart`: `file` + `etiqueta`; validar MIME/ext y tamaño |
| `GET` | `.../documents/{doc_id}/download` | Stream con `Content-Disposition`; JWT obligatorio |
| `DELETE` | `.../documents/{doc_id}` | Solo dueño; borra fila + archivo en disco |

### 1.4 Inmuebles vinculados — portada

- En `list_inmuebles_vinculados` / `cliente_to_web_out`: `portada_url` con **URL absoluta** igual que inventario (`_photo_url` / `PUBLIC_BASE_URL` o helper compartido en `backend/web/mappers.py`).

### 1.5 Tests pytest

- PATCH a `cerrado` sin `fecha_cierre` → 422.
- PATCH a `cerrado` con fecha → OK; GET devuelve campo.
- Upload/list/download/delete documento (happy path + 400 tamaño/MIME + 403 borrar no-dueño).
- `linked_properties[].portada_url` absoluta cuando hay foto.

---

## T2 — Web (`proagent-web` → `main`)

**Dependencia:** T1 mergeable o en stack API-first.

### 2.1 Formato numérico (solo lectura)

En `ClientDetailModal` (y helpers si aplica):

- Presupuesto: línea resumen con `formatBudget` / `Intl.NumberFormat("es-CO")` visible; inputs min/max **sin** máscara al tipear.
- Precio inmueble vinculado: ya formateado — revisar consistencia.
- Contadores y demás números de solo lectura en la ficha (ej. cantidad inmuebles vinculados) con separador de miles.

**Fuera:** reformatear Excel import/export en este sprint (opcional follow-up).

### 2.2 Fecha de cierre

- Campo fecha en bloque de citas/fechas (junto primer contacto / próxima cita).
- Visible/editable cuando estado es **`cerrado`** (o siempre visible con hint).
- Al mover cliente a **Cerrado** (si el flujo es desde la ficha): exigir fecha antes de guardar; si el estado se cambia en otro control, mismo gate en PATCH.
- Mapear `fecha_cierre` ↔ API en `clientsService`.

### 2.3 Documentos

- Sección **Documentos** en la ficha: lista (etiqueta, nombre archivo, fecha), botón subir (input file + campo etiqueta), descargar, eliminar (solo si viewer es dueño — derivar de `ownerAgenteId` vs sesión).
- Errores 422/400/403 con copy en español (patrón `showActionError` del módulo).

### 2.4 Bug miniatura

- Asegurar `portadaUrl` usable en `<img>` (ideal: absoluta desde API; si no, prefijar `API_URL` en mapper web igual que fotos de inventario).
- Smoke manual: vincular ficha con foto → miniatura visible en producción.

### 2.5 Calidad

- `npm run typecheck` + `npm run build` OK.

---

## Criterios de aceptación (checklist PR)

- [ ] En la ficha, números de solo lectura muestran miles con punto (`es-CO`); presupuesto editable sin máscara.
- [ ] Cliente en **Cerrado** no se guarda sin **fecha de cierre** (web + API).
- [ ] Fecha de cierre solo día (sin hora), misma familia visual que otras fechas del cliente.
- [ ] Subir PDF/imagen/documento con etiqueta libre; listar; descargar archivo correcto.
- [ ] Borrar documento solo como dueño del cliente; admin otro asesor no puede borrar.
- [ ] Rechazo archivo &gt; 10 MB o tipo no permitido con mensaje claro.
- [ ] Tras vincular inmueble con fotos, miniatura visible (prod / API real).
- [ ] Tests API nuevos en verde; sin regresión suite clientes existente.

---

## Fuera de alcance v1

- App móvil (listar/subir documentos).
- Google Drive / carpeta Entrega para documentos de cliente.
- OCR, vista previa inline PDF, firma electrónica.
- Reformato masivo import Excel con miles en celdas.

---

## Orden de implementación

1. **T1** API: migración, validación cierre, documentos, portada absoluta, tests → PR `develop`.
2. **T2** Web: UI fechas/documentos/formato + mapper portada → PR `main` (tras T1 o stack).

---

## Smoke Owner (post-merge)

1. Cliente de prueba → vincular ficha con portada → ver thumb.
2. Pasar a **Cerrado** sin fecha → bloqueo; con fecha → OK.
3. Subir certificado PDF &lt; 10 MB, descargar, borrar como dueño.
4. Login como admin “viendo” otro asesor: puede ver lista; borrar debe fallar si no es dueño (según AC).

---

## Activación

Cuando Owner apruebe este archivo:

1. Cambiar **Estado** a `ready_for_dev`.
2. Actualizar [`SPRINT.md`](../SPRINT.md) y [`sprints/README.md`](README.md) (069 activo; pausar o paralelizar 068 según decisión Owner).