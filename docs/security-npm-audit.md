# Seguridad — npm audit (proagent-web)

| Campo | Valor |
|-------|--------|
| Estado | **en curso** — Sprint **047** [`proagent-mobile/sprints/047-npm-audit-next-deps.md`](https://github.com/ctorres2747/proagent-mobile/blob/main/sprints/047-npm-audit-next-deps.md) |
| Prioridad | **P0** (Owner 2026-08-15: no construir/desplegar dejando highs sin plan) |
| Detectado | 2026-08-15 (deploy VPS Sprint 009 — `npm ci`) |
| Repo | `proagent-web` (`main`) |
| Entorno | build prod en `/opt/proagent-web` + CI local |

## Hallazgo

`npm audit` reporta **3 vulnerabilidades high**.  
**No** correr `npm audit fix --force` a ciegas: propone `next@16.3.1` (**breaking**).

### Detalle (audit 2026-08-15)

| Paquete | Severidad | Cómo entra | Advisories (resumen) |
|---------|-----------|------------|----------------------|
| **postcss** `<=8.5.22` (en árbol: `next` trae `postcss@8.4.31`) | high | dependencia de **`next@15.5.23`** | XSS en stringify CSS; lecturas vía `sourceMappingURL` / source maps ([GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93), [GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q), [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp), [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849)) |
| **sharp** `<0.35.0` (en árbol: `sharp@0.34.5` vía Next) | high | dependencia de **`next`** | libvips CVEs ([GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj)) |
| (3er conteo audit) | high | mismo grafo Next/postcss/sharp | reportado por npm como parte del mismo cluster |

Nota: el `postcss@8.5.26` de **devDependencies** (Tailwind) no es el vulnerable; el problema está en el **postcss anidado de Next**.

## Política Owner

1. Queda **documentado y priorizado P0**.
2. Prohibido `npm audit fix --force` en VPS/CI sin PR de review.
3. Remediación = sprint/ticket dedicado: upgrade Next (o overrides auditados) + `npm audit` limpio + `typecheck`/`build` + redeploy `app.proinversores.bond`.
4. Hasta cerrar: smoke de producto puede continuar, pero el fix de seguridad **no se diluye** detrás de features.

## Trabajo Dev (Sprint 047)

Ver spec: [`proagent-mobile/sprints/047-npm-audit-next-deps.md`](https://github.com/ctorres2747/proagent-mobile/blob/main/sprints/047-npm-audit-next-deps.md).

- [ ] Reproducir `npm audit` en `main` limpio; pegar reporte en el PR.
- [ ] Elegir remediación **sin** `--force` ciego (preferir Next patch/minor que traga postcss/sharp sanos; si hace falta Next 16, changelog + plan de migración).
- [ ] Valorar `overrides` en `package.json` solo si está soportado y no rompe build.
- [ ] `npm run typecheck` + `npm run build` OK.
- [ ] Redeploy VPS (`docs/deploy.md` §8) tras merge.
- [ ] `npm audit` → 0 high (o excepción escrita por Owner).

## Referencias

- Deploy: [`docs/deploy.md`](./deploy.md)
- Package pin actual: `next@^15.5.23` en `package.json`
