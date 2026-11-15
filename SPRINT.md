# SPRINT activo — ProAgent Web

| Campo | Valor |
|-------|--------|
| **ID activo (dev)** | **`068`** — Retoque fiel + Seedream (código en stub) |
| **Estado** | **`ready_for_dev`** — activado Owner 2026-11-15 |
| **Spec** | [`sprints/068-retoque-fotos-fidelidad-seedream.md`](sprints/068-retoque-fotos-fidelidad-seedream.md) |
| **Base** | 067 mergeado (API #503/#504, web #162) |
| **Handoff** | [`design_handoff_editor_fotos_ia/`](design_handoff_editor_fotos_ia/) — actualizar o captura en PR T2 (§5 spec 068) |
| **PR spec** | [#164](https://github.com/ctorres2747/proagent-web/pull/164) |
| **Actualizado** | 2026-11-15 |

## Qué hacer ahora (Dev)

Implementar **solo** el sprint 068. Orden obligatorio:

1. **T1 — `agente-inmobiliario` → `develop`:** prompt, `fidelity.py`, quitar `sky_replace`, `custom`, cliente Seedream (default **stub**), tests — PR companion.
2. **T2 — `proagent-web` → `main`:** panel 3 botones + pedido libre; typecheck + build — **después** de T1 mergeable o en stack API-first.
3. **T3 — smoke Owner** con stub (checklist spec); **no** encender Seedream en VPS (eso es §6 Owner).

Mobile **fuera de alcance**. No reabrir invariantes 067 (tabla en spec 068).

## Owner (paralelo, no bloquea Dev)

- Smoke 067 simulador si aún no.
- §6 BytePlus cuando T1 esté en VPS y T3 stub OK.

## Historial reciente (web)

| Sprint | Tema | Estado |
|--------|------|--------|
| 068 | Fidelidad + Seedream | **`ready_for_dev`** — implementar T1→T2 |
| 067 | Editor fotos IA | código en `main`/`develop`; smoke Owner opcional en paralelo |