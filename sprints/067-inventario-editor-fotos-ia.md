# Sprint 067 — Inventario › Visor y editor de fotos con IA

| Campo | Valor |
|-------|--------|
| **Estado** | `spec` — **no activar dev** hasta que Owner revise el flujo de creación/edición de fotos y proveedor de IA |
| **Fecha spec** | 2026-11-11 |
| **Épica** | E-INV-02 (media enriquecida del inventario) |
| **Repos** | `proagent-web` → `main` · `agente-inmobiliario` → `develop` |
| **Handoff diseño** | [`design_handoff_editor_fotos_ia/`](../design_handoff_editor_fotos_ia/) |
| **Referencia interactiva** | [`Inventario - Editor de Fotos IA.dc.html`](../design_handoff_editor_fotos_ia/Inventario%20-%20Editor%20de%20Fotos%20IA.dc.html) (retoques simulados con CSS; solo UX) |
| **README técnico UX** | [`editor-fotos-ia-README.md`](../design_handoff_editor_fotos_ia/editor-fotos-ia-README.md) |
| **Marca** | [`BRAND.md`](../BRAND.md) — tokens `--pa-*` |
| **Mobile** | **Fuera de alcance** v1 (Expo) |

---

## Objetivo

En **Inventario** → pestaña **Fotos y Video** (`/properties/[id]` o ruta shell v2 equivalente), permitir que el asesor:

1. Abra una foto en una **ventana flotante** (overlay difuminado).
2. **Navegue** entre fotos, **descargue** una sola imagen o el zip existente.
3. Aplique **cuatro retoques con IA** con vista previa, comparación antes/después, deshacer y **guardar** la versión activa en publicación + reel.
4. Vea en la grilla qué fotos tienen versión IA guardada (badge **✦ IA** y contador).

La **foto original en disco nunca se sobrescribe**; el activo publicado cambia al guardar.

---

## Evidencia visual (handoff)

Las capturas están en el repo junto al HTML de referencia.

### 01 — Grilla Fotos y Video

![Grilla con chip de contador IA y acción de ampliar](../design_handoff_editor_fotos_ia/assets/01-grilla-fotos.png)

- Texto de ayuda ampliado: *"Haz clic en una foto para verla en grande, descargarla o retocarla con IA."*
- Chip **"{n} de {N} retocadas con IA"** (solo si `n > 0`).
- Icono **ampliar** al hover/focus; `cursor: zoom-in`.
- Badge **✦ IA** en fotos con versión guardada.

### 02 — Editor abierto (estado inicial)

![Ventana flotante con panel Retoque con IA](../design_handoff_editor_fotos_ia/assets/02-editor-abierto.png)

- Overlay `backdrop-filter: blur(10px)`.
- Topbar: ambiente, índice, Descargar, Cerrar.
- Panel derecho: 4 herramientas + **Guardar en la publicación**.

### 03 — Retoque aplicado (luz y color)

![Vista Retocada tras Mejorar luz](../design_handoff_editor_fotos_ia/assets/03-luz-aplicada.png)

- Segmented **Original | Retocada | Comparar** visible si hay retoques.
- Herramienta en estado **Aplicado** → botón **Deshacer**.
- Toast: *"Mejorando luz · listo"*.

### 04 — Modo Comparar (cortina)

![Comparación Original vs Retocada](../design_handoff_editor_fotos_ia/assets/04-comparar.png)

- Cortina arrastrable; etiquetas Original / Retocada.
- Filmstrip con contorno esmeralda en la foto activa.

### 05 — Quitar objetos (modo pincel)

![Modo pincel con slider y hint](../design_handoff_editor_fotos_ia/assets/05-pincel-quitar-objetos.png)

- Hint: *"Pinta sobre el objeto que quieres quitar"*.
- Slider de tamaño, **Limpiar**, **Quitar** / **Cancelar**.

> Detalle de medidas, colores, teclado y estados: ver [`editor-fotos-ia-README.md`](../design_handoff_editor_fotos_ia/editor-fotos-ia-README.md) (secciones 1–10).

---

## Alcance / fuera de alcance

### Dentro (v1)

| Área | Entrega |
|------|---------|
| Grilla | Clic en imagen → editor; controles existentes con `stopPropagation`; badge ✦ y contador |
| Modal editor | Navegación circular, filmstrip, descarga unitaria, 4 ops IA, comparar, guardar |
| Backend | Versiones `draft` / `saved`, pasos encadenados, ownership E-INV-01 |
| Publicación | Al guardar, la URL activa de la foto en ficha/publicación/reel usa la versión retocada |

### Fuera (v1)

- Amoblado virtual, cambio de pisos/paredes, generación desde cero.
- Retoque en lote ("mejorar todas").
- Re-publicación automática en canales al guardar (solo **aviso** en pestaña Canales — TBD v1.1).
- App Expo.
- Recorte/rotación manual no-IA.

---

## Decisiones cerradas para dev (TBD → decisión)

| # | Tema | Decisión v1 |
|---|------|-------------|
| 1 | Contador IA con `n=0` | **Ocultar** el chip |
| 2 | Descargar en Comparar | Descarga versión **retocada** |
| 3 | Cerrar con borrador | **Confirmar** "Salir sin guardar" |
| 4 | Navegar mientras procesa | **Sí** + spinner en miniatura del filmstrip |
| 5 | Cielo sin `room_label` | Habilitar herramienta; error amigable si no hay cielo |
| 6 | Deshacer pasos | Solo el **último** paso de la cadena (re-render backend) |
| 7 | Límite diario retoques | **50 por asesor** (configurable env) |
| 8 | Proveedor IA | **TBD Owner** — implementar interfaz `PhotoEditProvider`; stub en dev |
| 9 | Web &lt; 768px | Pantalla completa + sheet inferior (misma spec §10 README) |

---

## Modelo de datos (propuesta)

Tablas nuevas o extensión de metadata de fotos existente (`fichas.fotos` JSON + archivos en `FOTOS_DIR`):

```text
ficha_foto_versions
  id, ficha_id, foto_ref (uuid/path), status (draft|saved|discarded)
  active (bool), url/path, created_by_agente_id, created_at, saved_at

ficha_foto_edit_steps
  id, version_id, op, mask_path?, result_path, provider, duration_ms, status
```

**Regla:** `original` = archivo inicial inmutable bajo `FOTOS_DIR`. `active` apunta al path servido en `/fotos/...` y en reel.

Contrato TypeScript (web) — ver README §11; alinear `room_label` con `REEL_ROOM_LABEL_OPTIONS` / `room_label` ya en API web.

---

## API sugerida (`/api/web`, E-INV-01)

Prefijo propuesto (ajustar a convención existente de fotos web):

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/web/properties/{id}/photos/{fotoId}/edits` | `{ op, mask? }` multipart → `{ versionId, stepId, status: processing }` |
| `GET` | `.../edits/{stepId}` | Poll estado → `{ status, previewUrl? }` (1.5s o SSE) |
| `DELETE` | `.../versions/{versionId}/steps/last` | Deshacer último paso |
| `POST` | `.../versions/{versionId}/save` | Promueve a activa + actualiza ficha/reel refs |
| `DELETE` | `.../versions/{versionId}` | Descarta borrador |
| `GET` | `.../photos/{fotoId}/download?version=original\|active` | Redirect URL firmada; nombre `§3.1 README` |

**Auth:** mismo JWT que inventario; asesor solo sus fichas; admin dominio `@proinversores`.

---

## Tickets

### T1 — Backend (`agente-inmobiliario` → `develop`)

- Migración + capa `photo_edits` (provider plugable).
- Jobs async (cola en proceso o worker liviano; timeout 60s).
- Endpoints § API; tests pytest (happy path + ownership + límite diario).
- Al `save`: actualizar referencia de foto activa sin borrar original; reel usa misma URL.

**AC T1**

- [ ] Original en disco intacto tras guardar retocado.
- [ ] Cadena de ops acumulativas; deshacer último paso.
- [ ] `remove_objects` acepta máscara PNG reescalada.
- [ ] `sky_replace` rechazado o skip con mensaje claro en interiores.
- [ ] 404/403 según E-INV-01.

### T2 — Web (`proagent-web` → `main`)

- Componentes: `PhotoEditorModal`, grilla con badges/contador, integración en pestaña Fotos.
- Lucide icons (§9 README).
- Canvas pincel + máscara; comparador `clip-path`.
- Cliente HTTP + TanStack Query (poll step).
- `prefers-reduced-motion`, focus trap, teclado §8.

**AC T2**

- [ ] Todos los AC de producto § abajo en desktop ≥1100px.
- [ ] Responsive 768–1100 según README §10.
- [ ] `npm run typecheck` + `npm run build` OK.

### T3 — Smoke Owner

- Ficha real F-129 (o demo): aplicar luz → comparar → guardar → verificar portada/reel preview.
- Verificar zip de fotos sigue incluyendo activas.
- Documentar proveedor IA elegido o modo stub.

---

## Criterios de aceptación (producto)

Copiados y numerados del handoff; el dev marca en el PR.

- [ ] **AC-01** Clic en imagen de grilla abre editor; flechas/×/selector de ambiente no abren editor.
- [ ] **AC-02** Hover/focus muestra icono ampliar; retocadas muestran badge ✦ IA.
- [ ] **AC-03** Modal centrado, blur, cierra con ×, Esc, clic en overlay (con confirmación si borrador).
- [ ] **AC-04** Navegación circular (‹ ›, filmstrip, ← →); activa con outline `#2FC98A`.
- [ ] **AC-05** Descargar usa versión visible; nombre `{código}-{n}-{ambiente-slug}{-ia}.jpg`.
- [ ] **AC-06** Cuatro herramientas + Guardar visibles sin scroll en 820px alto.
- [ ] **AC-07** Procesamiento: overlay escaneo + spinner; bloqueo de otras ops; toast "· listo".
- [ ] **AC-08** Aplicado → Deshacer revierte último paso de esa herramienta en la cadena.
- [ ] **AC-09** Pincel: trazo visible, Limpiar, Quitar solo con trazo, Otro para segunda pasada.
- [ ] **AC-10** Cielo despejado deshabilitado en interiores (`room_label` no exterior).
- [ ] **AC-11** Segmented Original/Retocada/Comparar solo si hay retoques; cortina draggable + teclado.
- [ ] **AC-12** Guardar activo solo con borrador; tras guardar grilla/reel usan retocada.
- [ ] **AC-13** Original siempre visible/descargable.
- [ ] **AC-14** Focus trap; al cerrar foco vuelve a miniatura origen.
- [ ] **AC-15** Error de proveedor: mensaje + Reintentar; foto sin cambios.

---

## Riesgos y dependencias

| Riesgo | Mitigación |
|--------|------------|
| Costo/latencia IA | Límite diario + cola serial por foto |
| Canales desincronizados | Aviso en Canales "fotos actualizadas — republicar" (v1.1 si no entra en T2) |
| Rutas inventario | Confirmar path final (`/properties` vs `/inventory`) al implementar T2 |
| HTML `.dc` | Requiere visor DC; en dev abrir el `.dc.html` del handoff |

---

## Checklist Manager (antes de `ready_for_dev`)

- [ ] Owner elige proveedor IA (o aprueba stub + fase 2).
- [ ] Owner valida capturas vs producción actual de grilla.
- [ ] Owner confirma límite 50/día y política de re-publicación en canales.
- [ ] Actualizar [`SPRINT.md`](../SPRINT.md) cuando se active.

---

## Referencias

| Recurso | Path |
|---------|------|
| HTML interactivo | `design_handoff_editor_fotos_ia/Inventario - Editor de Fotos IA.dc.html` |
| README UX completo | `design_handoff_editor_fotos_ia/editor-fotos-ia-README.md` |
| Capturas 01–05 | `design_handoff_editor_fotos_ia/assets/*.png` |
| Fotos API actual | `agente-inmobiliario` `backend/web/router.py` + `ficha_fotos.py` |
