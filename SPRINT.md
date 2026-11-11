# SPRINT activo — ProAgent Web

| Campo | Valor |
|-------|--------|
| **ID activo (dev)** | **`067`** — Editor de fotos IA |
| **Spec** | [`sprints/067-inventario-editor-fotos-ia.md`](sprints/067-inventario-editor-fotos-ia.md) |
| **Estado 067** | `ready_for_dev` (Owner: merge spec PR #160, 2026-11-11) |
| **Handoff** | [`design_handoff_editor_fotos_ia/`](design_handoff_editor_fotos_ia/) (solo UX) |
| **Actualizado** | 2026-11-11 |

## Qué hacer ahora (Dev)

1. **T1** `agente-inmobiliario` → `develop`: migración `archivo_original`, API edits, `PhotoEditProvider` stub, cupo, pytest.
2. **T2** `proagent-web` → `main`: modal editor + grilla (spec § AC); HTTP solo rutas `/api/web/properties/...`.
3. **T3** smoke Owner al cerrar T1+T2.

Handoff visual: [`design_handoff_editor_fotos_ia/`](design_handoff_editor_fotos_ia/). Contrato: spec 067 (no el README §11–12).

## Historial reciente (web)

| Sprint | Tema | Estado |
|--------|------|--------|
| 067 | Inventario editor fotos IA | `ready_for_dev` |
