# SPRINT activo — ProAgent Web

| Campo | Valor |
|-------|--------|
| **ID activo (dev)** | **`069`** — Cartera ficha (formato, cierre, documentos) |
| **Estado** | **`ready_for_dev`** — Owner 2026-11-19 |
| **Spec** | [`sprints/069-cartera-ficha-formato-cierre-documentos.md`](sprints/069-cartera-ficha-formato-cierre-documentos.md) |
| **Base** | 067 mergeado (API #503/#504, web #162) |
| **Handoff** | [`design_handoff_editor_fotos_ia/`](design_handoff_editor_fotos_ia/) — actualizar o captura en PR T2 (§5 spec 068) |
| **PR spec** | [#164](https://github.com/ctorres2747/proagent-web/pull/164) |
| **Actualizado** | 2026-11-19 |

## Qué hacer ahora (Dev)

Sprint **069** en curso (Cartera). **068** Seedream queda en cola hasta merge 069.

1. **T1 — `agente-inmobiliario` → `develop`:** fecha cierre, documentos, portada vinculada — PR companion.
2. **T2 — `proagent-web` → `main`:** ficha clientes (tras T1 mergeable o stack).

Mobile **fuera de alcance** 069.

## Owner (paralelo, no bloquea Dev)

- Smoke 067 simulador si aún no.
- §6 BytePlus cuando T1 esté en VPS y T3 stub OK.

## Historial reciente (web)

| Sprint | Tema | Estado |
|--------|------|--------|
| 068 | Fidelidad + Seedream | **`ready_for_dev`** — implementar T1→T2 |
| 067 | Editor fotos IA | código en `main`/`develop`; smoke Owner opcional en paralelo |