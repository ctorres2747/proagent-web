# SPRINT activo — ProAgent Web

| Campo | Valor |
|-------|--------|
| **ID activo (dev)** | **`067`** — Editor de fotos IA |
| **Spec** | [`sprints/067-inventario-editor-fotos-ia.md`](sprints/067-inventario-editor-fotos-ia.md) |
| **Estado 067** | Código en `develop` / `main` (API #503/#504, web #162); smoke Owner en simulador **pendiente** (no confundir con prod/VPS) |
| **Siguiente** | **`068`** — fidelidad del retoque + contrato Seedream — **`draft`**, no implementar |
| **Spec 068** | [`sprints/068-retoque-fotos-fidelidad-seedream.md`](sprints/068-retoque-fotos-fidelidad-seedream.md) |
| **Handoff** | [`design_handoff_editor_fotos_ia/`](design_handoff_editor_fotos_ia/) (solo UX del 067) |
| **Actualizado** | 2026-11-15 |

## Qué hacer ahora (Dev)

Nada del 068 hasta que el Owner escriba «activar 068» en el PR de la spec. El 067 de implementación ya está en `develop` / `main`.

1. **Owner:** smoke del editor con el simulador (guardar no republica; banner por canal).
2. **Owner:** leer el prompt canónico del 068. Si el texto sirve, comentar «activar 068».
3. Contratar Seedream es el §6 de esa spec. La clave no entra en git. El flag del VPS se queda en `stub` hasta el ensayo de 20 fotos.

## Historial reciente (web)

| Sprint | Tema | Estado |
|--------|------|--------|
| 068 | Prompt de fidelidad + Seedream | `draft` |
| 067 | Inventario editor fotos IA | código mergeado; smoke Owner pendiente |
