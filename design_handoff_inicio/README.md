# Handoff — Inicio: Panel de desempeño del asesor (opción 1a)

**Producto:** ProAgent Web (Next.js 15, App Router) dentro del shell v2 (riel navy + topbar).
**Ruta:** `/` (ítem **Inicio** del riel, activo).
**Quién lo ve:** solo el asesor autenticado, con **sus propios datos**. Sin vista de equipo ni ranking en esta iteración.
**Referencia visual:** [`Inicio-Panel-Desempeno.dc.html`](./Inicio-Panel-Desempeno.dc.html) → artboard **1a "Tarjetas de meta + comparativo"**. La **1b queda descartada** (no implementar).
**Sprint Dev:** [`proagent-mobile/sprints/062-inicio-panel-desempeno-1a.md`](https://github.com/ctorres2747/proagent-mobile/blob/main/sprints/062-inicio-panel-desempeno-1a.md).
**Capturas:** `screenshots/01-inicio-mes.png`, `02-inicio-ano-corrido.png`.

---

## 1. Estructura de la página

De arriba a abajo, dentro del área de contenido (padding `26px 32px 44px`, `gap:18px` entre bloques):

1. **Encabezado de página**: saludo + subtítulo del periodo, a la izquierda; selector de mes y toggle Mes / Año corrido, a la derecha.
2. **Tarjeta "Avance hacia la meta"**: anillo grande con el % global + 4 anillos pequeños, uno por indicador.
3. **4 tarjetas KPI** en una fila: Propiedades captadas · Propiedades publicadas · Leads recibidos · Tasa de conversión.
4. **Fila inferior**, en grid `1.7fr / 1fr`:
   - Izquierda: **comparativo** (en Mes: septiembre vs. agosto; en Año corrido: gráfico mes a mes).
   - Derecha: **Pendientes**, 4 acciones.
5. **Botón flotante del Asistente IA**: el mismo del shell, sin cambios.

**Topbar:** solo el breadcrumb "Inicio", la campana y el avatar. No lleva título duplicado, buscador ni CTA, igual que en Inventario.

---

## 2. Periodo: Mes / Año corrido

| | Mes | Año corrido |
|---|---|---|
| Periodo | Mes seleccionado. Por defecto, el **último mes cerrado**; el mes en curso debe poder elegirse en el selector | 1 de enero hasta el último mes cerrado |
| Subtítulo | "Tu gestión de {mes} {año}, comparada con {mes anterior}" | "Lo corrido de {año} · enero a {mes}" |
| Selector de mes | Visible (dropdown) | Oculto |
| Meta de referencia | Meta mensual | **Meta acumulada a la fecha** (meta mensual × meses transcurridos) |
| Chip de cada KPI | Diferencia vs. mes anterior | Brecha vs. meta a la fecha |
| Bloque comparativo | Barras mes actual vs. mes anterior | Columnas mes a mes con línea de meta |

Toggle: segmented control con contenedor `#EEF0F3`, padding 3px, radio 10px. Segmento activo con fondo blanco, texto `#0A3D62` 700 y sombra `0 1px 3px rgba(16,24,32,.12)`; inactivo en `#5B6B79` 600. Persistir la elección en la URL (`?periodo=mes|anio`).

---

## 3. Indicadores y cálculo

| KPI | Fórmula | Fuente | Subtexto |
|---|---|---|---|
| Propiedades captadas | Propiedades **creadas en Inventario** por el asesor en el periodo | Inventario | "Registradas en Inventario" (en Año corrido: "Meta anual {n}") |
| Propiedades publicadas | Propiedades con **al menos un envío exitoso** a un portal en el periodo. Cada propiedad cuenta una sola vez, aunque se publique en varios portales | Publicación | "Enviadas a portales" |
| Leads recibidos | Leads **asignados al asesor** con fecha de creación en el periodo | Captación | "Entraron por Captación" |
| Tasa de conversión | Leads que pasaron a **Captado** ÷ leads recibidos en el periodo × 100 | Captación | "{captados} de {recibidos} leads captados" |

Formato: enteros sin decimales. La conversión lleva 1 decimal con coma (`14,1%`). Diferencias de conversión en puntos (`▲ 3,4 pts`).

### % de avance por KPI
`pct = actual / meta × 100`. Se muestra redondeado. El valor puede pasar de 100% (ej. `107%`), pero las barras y los anillos se dibujan con tope en 100%.

### % global ("Avance hacia la meta")
Promedio simple de los 4 `pct`, cada uno con **tope en 100** antes de promediar. Así, superar una meta no compensa no cumplir otra.

### Color según cumplimiento (barras, anillos y texto de %)
- `≥ 100%`: verde `#1E8E5A`
- `85–99%`: navy `#0A3D62`
- `< 85%`: ámbar `#D97B2B`

---

## 4. Metas

**TBD (bloqueante para datos reales):** hoy no existe un modelo de metas. Se necesita:

- Tabla `asesor_metas`: `asesor_id`, `anio`, `mes`, `captadas`, `publicadas`, `leads`, `conversion_pct`.
- Quién las define: **TBD.** Recomendación: admin/staff, desde una pantalla de ajustes (fuera de alcance de esta iteración; mientras tanto, carga por seed o script).
- Si un mes no tiene meta: la tarjeta muestra el valor actual, oculta la barra y el %, y el subtexto dice "Sin meta definida". Ese KPI queda fuera del promedio global.

Valores de referencia del mock: captadas 8/mes · publicadas 10/mes · leads 60/mes · conversión 15%.

---

## 5. Especificación de componentes

### 5.1 Encabezado
- Saludo: "Hola, {nombre}", 24px/800 `#16212B`.
- Subtítulo: 13px `#5B6B79`.
- Selector de mes: botón con borde `#E4E8EC`, fondo blanco, radio 9px, padding `8px 12px`, texto 12.5px/700 y chevron 12px `#9AA6B2`. Lista los meses del año en curso y del anterior.

### 5.2 Tarjeta "Avance hacia la meta"
Contenedor blanco, borde `#E4E8EC`, radio 16px, padding `18px 22px`, flex horizontal con `gap:18px`.
- **Anillo grande**: 76×76, `r=30`, trazo 9px. Pista `#EEF0F3`, progreso `#1E8E5A`, `stroke-linecap:round`; empieza arriba (`rotate(-90)`). `stroke-dasharray = pct/100 × 188.5, 188.5`. Centro: % global en 17px/800.
- **Texto**: título "Avance hacia la meta" 15px/800 + explicación 12.5px `#5B6B79`. En Mes, el texto nombra la meta superada y lo que falta (ej. "Superaste la de leads; te faltan 1 captación y 1 publicación"). Generarlo desde los datos, no fijo en el código.
- **4 anillos pequeños**, a la derecha, `gap:22px`: 44×44, `r=17`, trazo 5px, circunferencia 106.8. Color según el umbral de §3. Centro: % en 10.5px/800. Etiqueta debajo en 10.5px/600 `#5B6B79`: Captadas · Publicadas · Leads · Conversión.

### 5.3 Tarjetas KPI (×4)
Grid `repeat(4, minmax(0,1fr))`, `gap:14px`. Cada tarjeta: fondo blanco, borde `#E4E8EC`, radio 16px, padding `18px 20px`, columna con `gap:10px`.
1. Fila superior: etiqueta (12.5px/700 `#5B6B79`, se corta con elipsis si no cabe) + **chip**.
2. Valor: 32px/800, `letter-spacing:-.02em`, seguido de "de {meta} meta" (en Año corrido: "de {meta} a la fecha") en 12.5px/600 `#9AA6B2`.
3. Barra de progreso: alto 6px, pista `#EEF0F3`, relleno con el color de §3, radio 3px.
4. Fila inferior: subtexto a la izquierda (11.5px/600 `#9AA6B2`) y "{pct}% de la meta" a la derecha, en el color de §3, 700.

**Chip:** 11px/700, padding `3px 8px`, radio 20px.

| Caso | Fondo / texto | Contenido |
|---|---|---|
| Mes, diferencia ≥ 0 | `#E6F5EE` / `#1E8E5A` | `▲ {dif} vs. ago` |
| Mes, diferencia < 0 | `#FBE7E4` / `#C23B2B` | `▼ {dif} vs. ago` |
| Año corrido, al día | `#E6F5EE` / `#1E8E5A` | `Al día` |
| Año corrido, por debajo | `#FCEEE0` / `#8A4E12` | `Faltan {brecha}` |

En el chip, el mes anterior va abreviado (`ene`, `feb`… `dic`).

### 5.4 Comparativo, vista Mes
Tarjeta blanca, radio 16px, padding `20px 22px`.
- Título "{Mes} vs. {mes anterior}", 15px/800. Leyenda a la derecha: cuadro navy `#0A3D62` = mes actual, cuadro `#C9D7E3` = mes anterior.
- 4 filas, `gap:18px`, grid `170px / 1fr / 92px`:
  - Nombre del KPI, 12.5px/700.
  - Dos barras horizontales apiladas (alto 12px, radio 4px, `gap:5px`): mes actual en `#0A3D62` con su valor en 800; mes anterior en `#C9D7E3` con su valor en 600 `#9AA6B2`. **Escala independiente por fila**: `ancho = valor / (max(actual, anterior) × 1.08)`, con mínimo de 4px.
  - El mismo chip de §5.3.

### 5.5 Comparativo, vista Año corrido
- Título "Mes a mes · enero a {mes}", 15px/800.
- Chips para elegir métrica: **Leads · Captadas · Publicadas** (la conversión no aplica como columna). Activo: fondo navy y texto blanco 700; inactivo: borde `#E4E8EC` y texto `#45525E` 600.
- Columnas: área de 220px de alto, `gap:14px`, una columna por mes, ancho máximo 44px, radio superior 6px. Meses pasados en `#9DB4C7`; último mes en `#0A3D62`. Valor encima de cada columna (11px/700). Etiqueta del mes debajo (11px/600 `#9AA6B2`). Escala: `alto = valor / (max(serie, meta) × 1.18) × 82%`.
- **Línea de meta mensual**: borde superior de 1.5px, punteado, `#1E8E5A`, a la altura de la meta. Etiqueta "Meta mensual {n}" en el **extremo izquierdo** de la línea (10.5px/700 verde, con fondo blanco), para que no tape la columna del último mes.

### 5.6 Pendientes
Tarjeta blanca. Encabezado: "Pendientes" 15px/800 + "{n} acciones" 11.5px/700 `#9AA6B2`. Cada fila lleva borde superior `#EEF0F3` y padding de 12px: punto de 8px + título 13px/700 + subtexto 11.5px `#5B6B79` + enlace "{acción} →" 12px/700 navy.

| Orden | Regla | Punto | Título | Subtexto | Acción → destino |
|---|---|---|---|---|---|
| 1 | Leads del asesor en estado Pendiente | `#C23B2B` | "{n} leads sin contactar" | "{m} llevan más de 48 horas" | Ir a Captación → `/captacion?estado=pendiente` |
| 2 | Propiedades con completitud < 50% | `#D97B2B` | "{n} fichas por debajo de 50%" | Nombres de las 2 primeras + "y {k} más" | Completar → `/properties?filtro=incompletas` |
| 3 | Leads en Captado sin propiedad vinculada | `#0A3D62` | "{n} leads captados sin registrar" | "Aún no están en Inventario" | Registrar → `/properties/new?lead={id}` (si hay más de uno, `/captacion?estado=captado`) |
| 4 | Propiedades con ficha completa y sin publicar | `#1E8E5A` | "{n} propiedades sin publicar" | "Fichas completas, listas para portales" | Publicar → `/publish` |

- Las filas con `n = 0` **no se muestran**. Si todas quedan en 0: estado vacío con el texto "Todo al día. No tienes pendientes." en 12.5px `#5B6B79`.
- El contador del encabezado cuenta solo las filas visibles.
- Los pendientes **no dependen del periodo**: siempre muestran el estado actual.

---

## 6. Estados

- **Cargando:** skeletons con la forma de cada bloque (anillos, tarjetas y barras) en `#EEF0F3`. Evitar que la página salte de tamaño al cargar.
- **Sin datos en el periodo** (asesor nuevo): las tarjetas muestran 0 y la barra vacía. El comparativo muestra "Aún no hay datos de {mes anterior} para comparar".
- **Error de carga:** mensaje en línea dentro del bloque afectado, con botón "Reintentar". El resto de la página sigue usable.

---

## 7. Datos: contrato sugerido

`GET /api/dashboard?periodo=mes&anio=2026&mes=9`

```json
{
  "periodo": { "tipo": "mes", "anio": 2026, "mes": 9, "comparadoCon": { "anio": 2026, "mes": 8 } },
  "kpis": {
    "captadas":   { "actual": 7,    "meta": 8,  "anterior": 5 },
    "publicadas": { "actual": 9,    "meta": 10, "anterior": 11 },
    "leads":      { "actual": 64,   "meta": 60, "anterior": 56 },
    "conversion": { "actual": 14.1, "meta": 15, "anterior": 10.7, "captados": 9, "recibidos": 64 }
  },
  "serieMensual": null,
  "pendientes": {
    "leadsSinContactar": { "total": 12, "masDe48h": 5 },
    "fichasIncompletas": { "total": 3, "muestras": ["Casa en La Estrella", "Lote en La Estrella"] },
    "captadosSinRegistrar": { "total": 2 },
    "sinPublicar": { "total": 4 }
  }
}
```

Con `periodo=anio`: `anterior` llega en `null`; `meta` es la meta acumulada a la fecha; se agrega `metaAnual`; y `serieMensual` trae `{ "leads": [...], "captadas": [...], "publicadas": [...], "metaMensual": { "leads": 60, ... } }`, con un valor por mes desde enero.

Todos los cálculos se hacen en el servidor y quedan **filtrados por el asesor autenticado**. El cliente no recibe datos de otros asesores.

---

## 8. Fuera de alcance

- Vista de equipo, ranking entre asesores y filtro "Viendo como" en esta página.
- Pantalla para administrar metas (ver §4).
- Comparación contra el año anterior y tendencia de 12 meses.
- Exportar a PDF o Excel.
- Contenido del Asistente IA (solo se mantiene el botón).

---

## 9. Criterios de aceptación

- [ ] El riel muestra Inicio como activo en `/`.
- [ ] El topbar no repite título, buscador ni CTA.
- [ ] Por defecto se muestra el último mes cerrado, comparado con el mes anterior.
- [ ] El toggle Mes / Año corrido cambia subtítulo, metas, chips y bloque comparativo, y se conserva en la URL.
- [ ] Los 4 KPI usan las fórmulas de §3. Publicadas cuenta cada propiedad una sola vez aunque esté en varios portales.
- [ ] El % global es el promedio de los 4 % con tope en 100 cada uno.
- [ ] Barras y anillos usan los colores por umbral de §3. Un valor sobre 100% se dibuja lleno sin desbordar.
- [ ] Los chips muestran ▲/▼ y el color correcto según el signo; la conversión se expresa en puntos con coma decimal.
- [ ] En Año corrido, los chips de métrica cambian las columnas y la línea de meta. La etiqueta de meta no tapa ninguna columna.
- [ ] Las filas de Pendientes con 0 no aparecen, y cada enlace lleva a la ruta y el filtro indicados.
- [ ] Ningún dato de otro asesor llega al cliente.
- [ ] Si falta la meta de un KPI, se ve "Sin meta definida" y ese KPI queda fuera del % global.
