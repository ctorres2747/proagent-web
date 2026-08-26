# Seguridad — npm audit (proagent-web)

| Campo | Valor |
|-------|--------|
| Estado | **done** — Sprint **047** (merge PR web) |
| Prioridad | **P0** (Owner 2026-08-15: no construir/desplegar dejando highs sin plan) |
| Detectado | 2026-08-15 (deploy VPS Sprint 009 — `npm ci`) |
| Remediado | 2026-08-26 — `overrides` postcss + sharp en `package.json` |
| Repo | `proagent-web` (`main`) |
| Entorno | build prod en `/opt/proagent-web` + CI local |

## Hallazgo original

`npm audit` reportaba **3 vulnerabilidades high**.  
**No** se usó `npm audit fix --force` (propone `next@16.x`, breaking).

### Detalle (audit 2026-08-15 / reproducido 2026-08-26)

| Paquete | Severidad | Cómo entra | Advisories (resumen) |
|---------|-----------|------------|----------------------|
| **postcss** `<=8.5.22` (en árbol: `next` trae `postcss@8.4.31`) | high | dependencia de **`next@15.5.23`** | XSS en stringify CSS; lecturas vía `sourceMappingURL` / source maps ([GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93), [GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q), [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp), [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849)) |
| **sharp** `<0.35.0` (en árbol: `sharp@0.34.5` vía Next) | high | dependencia de **`next`** | libvips CVEs ([GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj)) |
| (3er conteo audit) | high | mismo grafo Next/postcss/sharp | reportado por npm como parte del mismo cluster |

Nota: el `postcss@8.5.26` de **devDependencies** (Tailwind) no era el vulnerable; el problema estaba en el **postcss anidado de Next**.

## Remediación aplicada (Sprint 047)

**Next 15.5.24** sigue declarando `postcss@8.4.31` en sus dependencias; no hay patch de Next 15 que traiga versiones sanas. Se optó por **`overrides`** en `package.json` (soportado por npm, sin saltar a Next 16):

```json
"overrides": {
  "postcss": "^8.5.26",
  "sharp": "^0.35.4"
}
```

### Versiones finales (`npm ls`)

| Paquete | Versión resuelta |
|---------|------------------|
| `next` | 15.5.23 |
| `postcss` (incl. anidado en `next`) | 8.5.26 |
| `sharp` | 0.35.4 |

### Verificación

- `npm audit` → **0 vulnerabilities**
- `npm run typecheck` → OK
- `npm run build` → OK (Next 15.5.23 + Turbopack)

## Pendiente Owner (Parte B)

1. Merge PR web → `main`.
2. Redeploy `app.proinversores.bond` según [`docs/deploy.md`](./deploy.md).
3. Smoke mínimo: login → inventario → abrir wizard publicación (una pantalla).

## Política Owner

1. Queda **documentado y priorizado P0**.
2. Prohibido `npm audit fix --force` en VPS/CI sin PR de review.
3. Remediación = sprint/ticket dedicado: upgrade Next (o overrides auditados) + `npm audit` limpio + `typecheck`/`build` + redeploy `app.proinversores.bond`.
4. Hasta cerrar: smoke de producto puede continuar, pero el fix de seguridad **no se diluye** detrás de features.

## Referencias

- Deploy: [`docs/deploy.md`](./deploy.md)
- Sprint: [`proagent-mobile/sprints/047-npm-audit-next-deps.md`](https://github.com/ctorres2747/proagent-mobile/blob/main/sprints/047-npm-audit-next-deps.md)
- Package pin: `next@^15.5.23` + overrides postcss/sharp en `package.json`
