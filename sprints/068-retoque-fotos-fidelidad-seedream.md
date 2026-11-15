# Sprint 068 — Retoque de fotos fiel al inmueble + Seedream

| Campo | Valor |
|-------|--------|
| Estado | **`draft`** — no activar Dev hasta el gate §0 |
| Fecha spec | 2026-11-15 |
| Owner | Cristhian |
| Manager | Agent Manager |
| Dev | ProAgent Dev |
| Repos | `agente-inmobiliario` → **`develop`** · `proagent-web` → **`main`** |
| Mobile | **Fuera de alcance** (misma excepción que el sprint 067) |
| Base | Sprint 067 mergeado: API [#503](https://github.com/ctorres2747/agente-inmobiliario/pull/503) / [#504](https://github.com/ctorres2747/agente-inmobiliario/pull/504), web [#162](https://github.com/ctorres2747/proagent-web/pull/162). Spec [`067`](067-inventario-editor-fotos-ia.md) |
| Código vivo | `backend/photo_edit/` (`provider.py`, `ops.py`, `service.py`, `quota.py`) |

---

## §0 — Gate de activación (Owner)

**Este sprint no pasa a `ready_for_dev` hasta que el Owner escriba «activar 068» en el PR de esta spec.**

Eso confirma el texto canónico de §2. No hace falta tener ya la clave de BytePlus para activar el código: sin `ARK_API_KEY` el servidor sigue en el simulador `PhotoEditProviderStub`.

El corte a Seedream en el VPS es otro paso, §6. No se enciende en el mismo PR que el prompt.

---

## Por qué

Las fotos salen a la venta. Un modelo de imagen que “mejora” una sala puede inventar un sofá, un cielo azul o un piso que el comprador no va a encontrar. El simulador del 067 casi no cambia la foto; el modelo real sí puede.

La defensa no es un aviso en pantalla. Es un **prompt fijo**, versionado, que el servidor antepone a cualquier pedido, más un rechazo local de pedidos imposibles y una comprobación de píxeles donde se puede medir.

---

## Decisiones de producto (Owner, 2026-11-15)

| Tema | Decisión |
|------|----------|
| Botones | Quedan **tres**: Mejorar luz y color, Enderezar, Quitar objetos |
| Cielo despejado | **Sale del panel.** Cambiar el clima es ofrecer un exterior que no es el de la visita |
| Texto libre | Un campo para un pedido corto. El servidor le pega delante el prompt de fidelidad. El asesor no puede reemplazar esas reglas |
| Original | Se mantiene `archivo_original` inmutable (067). Guardar sigue sin republicar canales |
| Cupo | 50/día del dueño de la ficha. Un rechazo **local** (no se llamó al modelo) **no** gasta cupo. Un intento que sí llamó al modelo **sí** gasta, aunque la foto se descarte |
| Proveedor | BytePlus ModelArk (Singapur), familia Seedream. Stub por defecto hasta el corte §6 |
| Mobile | No |

### Enmienda respecto al sprint 067

La spec [`067`](067-inventario-editor-fotos-ia.md) dejaba **«Cielo despejado»** en el panel y en `EDIT_OPS`. **El 068 lo supersede:** el botón y `op=sky_replace` salen del producto; el AC del 067 de panel sin scroll a 820 px también queda sin efecto (§1).

---

## Invariantes del 067 — no regresión (Manager)

T1/T2 **no** pueden romper lo ya mergeado en API [#503](https://github.com/ctorres2747/agente-inmobiliario/pull/503) / [#504](https://github.com/ctorres2747/agente-inmobiliario/pull/504) y web [#162](https://github.com/ctorres2747/proagent-web/pull/162), incluidos los fixes Owner posteriores al ACCEPT (banners, cupo atómico):

| Invariante | Comportamiento que debe seguir igual |
|------------|--------------------------------------|
| `archivo_original` | El primer retoque no pisa el upload. Guardar reemplaza solo `fichas_fotos.archivo` del slot |
| Borrador + undo | LIFO con `DELETE .../steps/last`. La web no lanza otro retoque de la misma foto mientras ese paso sigue en curso. El 068 no agrega un lock nuevo en la base |
| Banner canales | `ia_guardado_at` vs `publicaciones_ficha`; se apaga al republicar después del último guardado IA |
| Republicación | Guardar en el editor **no** publica; el usuario republica manualmente |
| Cupo | 50/día por dueño de la ficha; contador atómico (`BEGIN IMMEDIATE`) |
| Aislamiento | `owner_agente_id` / E-INV-01 |

Los tests del 067 que pierden sentido (p. ej. cupo en `sky_replace`) se **reescriben** en T1; el resto debe seguir en verde.

---

## Pipeline `POST .../photos/{fotoId}/edits` (orden obligatorio)

Implementación en `service.py` (T1). No invertir pasos respecto al 068:

1. Auth Bearer + permiso sobre la ficha (dueño / admin dominio).
2. Validar `op` ∈ ops permitidas, máscara si `remove_objects`, `instruction` si `custom`.
3. **Rechazo local §3** (`fidelity.py` / regex): si falla → respuesta sin cupo y **sin** `INSERT` en `ficha_foto_edit_steps`.
4. `consume_quota` del dueño de la ficha (solo si lo anterior pasó). Si el cupo está lleno → **429** en este POST, sin step.
5. `INSERT` del step con `status='processing'` y metadata `op`, `instruction`, `prompt_version`. Esos son los estados que ya persiste el 067: `processing`, `ready`, `error`. No se inventan `pending`, `completed` ni `failed`.
6. Llamada al proveedor (ver «Modelo de ejecución» más abajo).
7. Guardas §4 sobre el JPEG devuelto. Si pasa, el step queda `ready` y el poll sigue mandando `status: "ready"` (la web ya lo traduce a `done`). Si no pasa, el step queda `error` con `errorCode`.

Esto alinea 400/422 sin cupo con el fix del 067 (validación antes de consumir) y añade «sin fila de step» en rechazos locales.

### Política de cupo (referencia para tests)

| Caso | HTTP / estado | ¿Consume cupo? | ¿Nuevo step? |
|------|----------------|----------------|--------------|
| `op` inválido, `sky_replace`, máscara inválida, `custom` vacío o fuera de 8–280 | 400 en el POST | No | No |
| `custom` prohibido (§3) | 422 `fidelity_refused` en el POST | No | No |
| Cupo diario lleno | 429 en el POST. No queda step, así que no hay poll con `errorCode` | No | No |
| El step sigue `processing` más de 60 s | step `error`, `errorCode=timeout` (código que ya usa el poll del 067) | **Sí** | Sí |
| Error de red, 429 de Ark o 5xx | step `error`, `errorCode=provider_error`. Un solo reintento en 429/transitorio, sin un segundo cobro de cupo | **Sí** | Sí |
| El modelo responde `FIDELITY_REFUSED` o §4 descarta el JPEG | step `error` + `errorCode` de §5 | **Sí** | Sí |
| Éxito y preview actualizado | step `ready` | **Sí** | Sí |

Sustituir en T1 el test del 067 que esperaba cupo en error de `sky_replace` por filas de esta tabla.

---

## §1 — Qué cambia en el producto

| Superficie | Cambio |
|------------|--------|
| Panel del editor | Se quita «Cielo despejado». Debajo de los tres botones: texto de ayuda, campo de pedido (8–280 caracteres) y botón **Aplicar pedido** |
| Ayuda visible | «Solo luz, verticales y lo que pintes. El inmueble no se puede cambiar: la foto se publica para la venta.» |
| Placeholder | «Ej: subir un poco las sombras del sofá. No pidas muebles, cielo ni acabados distintos.» |
| API `POST .../edits` | Acepta `op=custom` e `instruction`. `sky_replace` responde **400** y no gasta cupo |
| Servidor | Arma el prompt §2, lo guarda con la versión, llama al proveedor y descarta el resultado si no pasa §4 |
| Canales | Sin cambio: el banner de republicar del 067 sigue igual |

El panel puede hacer scroll. El criterio del 067 de caber sin scroll a 820 px deja de aplicar en cuanto entra el campo de texto.

---

## §2 — Prompt canónico (`listing_fidelity_v1`)

Dev lo copia **tal cual** a `backend/photo_edit/prompts/listing_fidelity_v1.txt`. Cada step guarda `prompt_version = listing_fidelity_v1`. El asesor no edita este texto. El pedido de la operación va solo en `{pedido}`.

```text
Eres el retoque de fotos de un inmueble que se va a publicar para la venta.
La foto de entrada es la evidencia del inmueble real. El resultado tiene que ser el mismo lugar, el mismo día y los mismos materiales.

Puedes:
- corregir exposición, sombras, balance de blancos y color, sin cambiar la hora del día
- enderezar verticales de muros, marcos y puertas que ya están en la foto
- borrar solo lo que está dentro de la máscara blanca (cables, carros, basura u objetos temporales) y reconstruir el fondo que ya se ve alrededor

No puedes:
- agregar, quitar o cambiar muebles, electrodomésticos, camas, decoración, plantas fijas, pisos, muros, techos, ventanas, puertas, fachada o distribución
- inventar cielo, sol, atardecer, vista, piscina, jardín, personas o texto
- ocultar humedad, grietas, daños o cualquier defecto del inmueble
- recortar, ampliar el encuadre o cambiar la proporción de la foto
- poner marcas de agua, logos o texto

Si el pedido pide algo de la lista prohibida, no generes una imagen nueva.
Responde solo con el código FIDELITY_REFUSED.

Pedido de esta foto:
{pedido}
```

### Pedido fijo por botón

| `op` | `{pedido}` |
|------|------------|
| `enhance_light` | Aclara sombras y corrige el balance de blancos. Mantén la hora del día. No agregues luz de sol que no esté en la foto. |
| `straighten` | Endereza las verticales de muros y marcos que ya se ven. No reconstruyas la fachada ni cambies el encuadre. |
| `remove_objects` | Borra únicamente la zona de la máscara blanca. Rellena con la superficie que ya se ve al borde de esa zona. No inventes muebles ni cielo. |
| `custom` | El texto del asesor, recortado, sin el prefijo |

`remove_objects` sigue exigiendo máscara PNG. El proveedor real envía **dos** imágenes: la foto y la máscara. El prompt dice que la zona blanca es lo único borrable.

Si un modelo de consola no acepta la segunda imagen, el PR no se da por cerrado con un dibujo rojo encima de la foto. Se documenta el rechazo y se deja `remove_objects` en el stub hasta tener endpoint que acepte máscara.

**Criterio de cierre T1 (Owner / Manager):** si BytePlus no acepta máscara como segunda imagen en el ensayo §6:

- **Opción A (preferida):** `remove_objects` sigue en **stub** aunque `PHOTO_EDIT_PROVIDER=seedream`; luz, enderezar y `custom` usan Seedream.
- **Opción B:** el endpoint responde **501** o mensaje claro en web («Quitar objetos sigue en simulador hasta soporte de máscara»).
- **Prohibido:** simular máscara pintando encima de la foto en el cliente o en el servidor sin contrato Ark.

---

## §3 — Rechazo local (antes de llamar al modelo y antes del cupo)

`op=custom` con el texto vacío, menor de 8 o mayor de 280 caracteres → **400**, sin cupo, sin fila de step.

`op=sky_replace` → **400** «Cielo despejado ya no está disponible. Cambiar el clima no se puede publicar.» Sin cupo.

`op=custom` que pida un cambio estructural → **422** `fidelity_refused`, sin cupo, sin step. La regla es esta (minúsculas, sin tildes para comparar):

1. Contiene alguna de: `amoblar`, `amueblar`, `virtual staging`, `staging`, `atardecer`, `amanecer`, `cielo azul`, `cielo despejado`, `reemplaza el cielo`, `cambia el cielo`, `cambiar el cielo`, `poner piscina`, `agrega piscina`, `quita el muro`, `tumba el muro`, `quitar humedad`, `tapar grieta`, `ocultar el daño`, `esconder el daño`, `mas grande`, `más grande`, `mas amplio`, `más amplio`, `mas lujoso`, `más lujoso`.
2. O coincide con `(agrega|añade|pon|poner|coloca|cambia|cambiar|quita|quitar|reemplaza)` y, en las siguientes seis palabras, con `(mueble|sofa|sofá|cama|piso|cielo|piscina|jardin|jardín|persona|gente|fachada|ventana|pared)`.
3. Excepción que **sí** pasa: `pon más luz`, `pon mas luz`, `pon luz`, `sube la luz`, `subir la luz`, `aclara`, `aclarar`.

«Aclara la sombra del sofá» pasa. «Pon un sofá» no pasa.

El listado es la red barata. El prompt §2 sigue yendo en todo intento que sí se envía. No hace falta un segundo modelo juez en esta versión.

---

## §4 — Comprobación del resultado (después de la llamada)

Si el modelo respondió, el cupo ya se gastó. Si el resultado no pasa, el step queda `error`, la foto anterior del borrador no se reemplaza y el asesor ve el mensaje.

| Caso | Regla | Código |
|------|--------|--------|
| El cuerpo es `FIDELITY_REFUSED` o no trae imagen | No se escribe JPEG | `fidelity_refused` |
| Proporción distinta más de 1,5 % respecto a la entrada | Se descarta | `framing_changed` |
| `remove_objects` | Se escala el resultado al tamaño de entrada. Fuera de la máscara dilatada 8 px, el error absoluto medio por canal es ≤ 8. Si el modelo repintó la sala, se descarta | `fidelity_rejected` |
| Luz, enderezar, texto libre | Misma proporción y mismo tamaño de salida que la entrada. El diff global no sirve (la luz cambia casi todos los píxeles). La revisión humana en Comparar sigue siendo obligatoria antes de Guardar | — |

Guardar sigue siendo un acto del asesor. Nada de esta versión publica solo.

---

## §5 — Contrato técnico

### API

`POST /api/web/properties/{fichaId}/photos/{fotoId}/edits` (multipart, igual que hoy):

| Campo | Regla |
|-------|--------|
| `op` | `enhance_light` \| `straighten` \| `remove_objects` \| `custom` |
| `instruction` | Obligatorio si `op=custom`. Nombre del campo multipart: **`instruction`** (no alias) |
| `mask` | Obligatorio si `op=remove_objects`. Ignorado en las otras |

**Breaking change controlado:** clientes que envíen `op=sky_replace` reciben **400** (mensaje §3). No hay periodo de compatibilidad.

**Compatibilidad de datos:** steps históricos con `op=sky_replace` en BD pueden seguir en poll/undo para borradores viejos; **no** se crean steps nuevos con esa op. La web deja de mostrar el botón; el historial del modal puede mostrar la etiqueta legada sin ofrecer repetir la op.

**Poll / schemas (`backend/web/schemas.py`):** mantener `errorCode` en el step. Mapa mínimo para T2:

| `errorCode` | Cuándo aparece | Copy orientativo (es) |
|-------------|---------------|------------------------|
| `fidelity_refused` | El modelo contestó `FIDELITY_REFUSED` (hay step). El rechazo local §3 es un 422 del POST y no llega al poll | «Ese pedido cambiaría el inmueble…» |
| `fidelity_rejected` | §4 descartó el JPEG (p. ej. la máscara) | «El retoque cambió partes de la foto que había que dejar iguales.» |
| `framing_changed` | La proporción no coincide | «El retoque cambió el encuadre. La foto quedó igual.» |
| `timeout` | El step pasó de 60 s en `processing` | «El retoque tardó demasiado. Intenta de nuevo.» |
| `provider_error` | Red, 5xx o 429 de Ark ya reintentado | «No se pudo aplicar el retoque. Intenta de nuevo.» |

El cupo agotado no está en esta tabla: responde **429** en el POST y no crea step. El 067, cuando insertaba el step antes de cobrar, usaba `error_code=quota`. Ese step de error ya no se crea.

Opcional en poll: devolver `instruction` truncada (p. ej. 80 chars) en steps `custom` para UX «último pedido»; si se expone, no loguear el texto completo en INFO.

### Migración

En `ficha_foto_edit_steps`:

```sql
ALTER TABLE ficha_foto_edit_steps ADD COLUMN instruction TEXT;
ALTER TABLE ficha_foto_edit_steps ADD COLUMN prompt_version TEXT;
```

Steps viejos quedan con esas columnas en NULL. No se reescriben.

### Proveedor

`PhotoEditProvider.apply` recibe `op`, `source_path`, `mask_path` e `instruction` (el `{pedido}` ya resuelto). El armado del prompt vive en `backend/photo_edit/fidelity.py` (`build_prompt(op, instruction) -> str`).

`get_photo_edit_provider()`:

| `PHOTO_EDIT_PROVIDER` | Clase |
|-----------------------|--------|
| vacío o `stub` | `PhotoEditProviderStub` (default) |
| `seedream` | `PhotoEditProviderSeedream` |

Sin `ARK_API_KEY`, aunque el flag diga `seedream`, se arranca en stub y se deja un log de error. No se cae el proceso.

### Seedream

- `POST {ARK_BASE_URL}/images/generations`
- Default de `ARK_BASE_URL`: `https://ark.ap-southeast.bytepluses.com/api/v3`
- Header `Authorization: Bearer {ARK_API_KEY}`
- Cuerpo JSON: `model` = `ARK_IMAGE_MODEL`, `prompt` = texto §2, `image` = `data:image/jpeg;base64,...` de la foto (y la máscara como segunda imagen solo en `remove_objects`), `response_format` = `b64_json` o `url` (si viene URL, el servidor la descarga y no la guarda en el step), **`watermark`: false**
- Tamaño de salida: el más cercano al de la entrada que el modelo acepte, y después se escala al tamaño original si la proporción pasó §4
- Timeout: el de 067 (60 s)
- La clave no se loguea

### Variables (solo nombres en `.env.example`)

Archivo: **`agente-inmobiliario/.env.example`** (AC T1 — el PR de API debe actualizarlo).

```text
PHOTO_EDIT_PROVIDER=stub
ARK_API_KEY=
ARK_BASE_URL=https://ark.ap-southeast.bytepluses.com/api/v3
ARK_IMAGE_MODEL=
```

La clave real va en el `.env` del VPS. No va al repo, ni al instalador del worker, ni al cliente web. **No loguear** `ARK_API_KEY` ni el prompt completo con datos personales del asesor.

### Modelo de ejecución (decisión Owner antes de T1)

| Modo | Comportamiento |
|------|----------------|
| `stub` | Igual que 067: puede seguir **`run_sync`** en el request si el deploy tiene un solo worker (comportamiento actual). |
| `seedream` | Llamada HTTP hasta **60 s**; **no** bloquear el event loop de uvicorn con varios workers sin plan. |

**Owner elige una fila en la activación (comentario en el PR):**

1. **VPS 1 worker + sync:** mismo patrón que el stub; Seedream corre dentro del `POST` (aceptable si el timeout y la carga lo permiten).
2. **Multi-worker:** hilo/cola + poll obligatorio para provider real (reabre diseño del P2 del 067; T1 documenta en código y tests).

Sin decisión explícita, Dev implementa (1) y deja comentario en `service.py` con el límite conocido.

**Resiliencia Ark:** un reintento solo en **429** o error transitorio (máx. 1), sobre el mismo step, sin un segundo `consume_quota`. El `errorCode` de ese fallo es `provider_error`. El tope de 60 s del step sigue siendo `errorCode=timeout`, el que ya escribe el poll del 067.

### Web

- `src/lib/photoEdit.ts`: quitar `sky_replace` de `PHOTO_EDIT_OPS`. `custom` no es una cuarta tarjeta. Sí necesita textos de «procesando» y «listo», porque el modal llama `photoEditMeta(op)` mientras corre el pedido.
- `PhotoEditorModal.tsx`: campo + Aplicar pedido. El botón deshabilitado si el texto no tiene entre 8 y 280 caracteres, o si ya hay un paso en curso en esa foto.
- `startPhotoEdit` manda el campo multipart `instruction` cuando `op=custom`.
- `mapEditPoll` en `src/services/http/properties.ts` hoy arma `message` solo con `message`, `error` y `detail`. El poll real manda `errorMessage` (`WebPhotoEditStepOut`). T2 tiene que leer `errorMessage` y `errorCode`, o el toast de un retoque fallido sigue diciendo «error».
- Mocks: un pedido bloqueado responde 422; uno permitido devuelve preview como el stub.
- Copy de error 422: «Ese pedido cambiaría el inmueble. Prueba con luz, sombras o un detalle que ya esté en la foto.»

### Handoff visual (Owner)

El handoff [`design_handoff_editor_fotos_ia/`](../design_handoff_editor_fotos_ia/) refleja el panel de **cuatro** botones del 067. **Antes de ACCEPT de T2:**

- Owner actualiza el artifact (HTML o captura) con **tres** botones + campo de pedido + copy §1, **o**
- Manager acepta T2 con captura en el PR que muestre scroll y el pedido libre.

Sin uno de los dos, T2 queda en revisión de UX.

---

## Tickets

### T1 — API (`develop`)

- Prompt §2 en archivo, `build_prompt`, columnas nuevas.
- Rechazo local §3 **antes** de `consume_quota` y antes del `INSERT` del step.
- `sky_replace` fuera de `EDIT_OPS`.
- `PhotoEditProviderSeedream` + selección por env. Default stub.
- Guardas §4.
- Actualizar `agente-inmobiliario/.env.example` (nombres §5).
- Tests en `tests/test_photo_edit.py` y, si aplica, `tests/test_photo_edit_fidelity.py` (regex §3 con casos del spec):
  - [ ] Los tres pedidos fijos contienen el bloque «No puedes» y no piden cambiar el cielo.
  - [ ] «Aclara la sombra del sofá» llega al proveedor con el prefijo.
  - [ ] «Pon un sofá» y «cielo azul» → 422, cupo del día intacto, cero steps nuevos.
  - [ ] `sky_replace` → 400, cupo intacto, cero steps nuevos.
  - [ ] `remove_objects` sin máscara → 400, cupo intacto.
  - [ ] Resultado con otra proporción → step `framing_changed`, preview anterior sigue.
  - [ ] Máscara: píxeles fuera de la zona dilatada alterados → `fidelity_rejected`.
  - [ ] Cliente Seedream de prueba (HTTP mock): `watermark` es false, la foto viaja en base64, no aparece la clave en logs.
  - [ ] Sin `ARK_API_KEY`, `PHOTO_EDIT_PROVIDER=seedream` usa stub.
  - [ ] Migración: columnas nuevas en DB existente sin romper steps viejos.
  - [ ] `prompts/listing_fidelity_v1.txt` empaquetado en deploy (ruta estable en `build_prompt`).

### T2 — Web (`main`)

- Panel de tres botones + pedido libre, copy de §1.
- Typecheck y build.
- [ ] No queda botón «Cielo despejado».
- [ ] Pedido de 3 caracteres no llama a la API.
- [ ] Pedido permitido llama `op=custom` con `instruction`.
- [ ] Mientras corre el pedido libre, el panel muestra el texto de proceso y no rompe `photoEditMeta`.
- [ ] Un poll con `status: "error"` y `errorMessage` muestra ese texto, no la palabra «error».

### T3 — Smoke Owner (con stub, antes del corte)

Recomendado: cerrar **smoke del 067** (simulador) antes de mergear T2 del 068 en `main`.

- Luz y enderezar siguen pudiendo guardarse.
- «Pon una piscina» muestra el error y el cupo no baja.
- Quitar objetos con pincel sigue pidiendo máscara.
- Guardar no republica.
- Banner por canal sigue coherente tras guardar IA (regresión 067).

---

## Checklist Owner / Manager (revisar en el PR de esta spec)

Usar este bloque en la conversación del PR **antes** de escribir «activar 068»:

- [ ] Texto de §2 (`listing_fidelity_v1`) aprobado.
- [ ] Breaking change `sky_replace` y panel de 3 botones aceptados (enmienda 067).
- [ ] Decisión «Modelo de ejecución»: sync 1 worker **o** poll multi-worker.
- [ ] Handoff visual §5 actualizado **o** acuerdo de captura en PR T2.
- [ ] Criterio `remove_objects` + Ark (opción A/B) entendido si el ensayo §6 falla en máscara.
- [ ] Smoke 067 hecho o explícitamente aplazado con riesgo anotado.

Cuando todo lo anterior está marcado, el Owner comenta **«activar 068»** (§0).

---

## §6 — Contratar Seedream (Owner, fuera del PR de código)

La cuenta que corresponde a Proinversores en Colombia es **BytePlus ModelArk**, la nube internacional de ByteDance. La consola de China (Volcengine / 火山方舟) pide cédula o empresa china. No uses la app de Seedance: eso es video.

Seedream 5.5 (`doubao-seedream-5-5-261028`) está publicado en la consola china. En la lista de precios internacional revisada el 15 de noviembre de 2026 aparecen **Seedream 5.0 Pro** (unos **0,045 USD por imagen** de salida) y Lite, no la 5.5. En la consola de Singapur se activa la 5.5 si ya está; si no, **5.0 Pro**. El id exacto se copia al VPS. El prompt de este sprint es el mismo para las dos.

1. Entra a [BytePlus ModelArk](https://www.byteplus.com/en/product/modelark) y crea la cuenta con el correo de Proinversores. No hace falta número de China.
2. Abre la consola en la región **ap-southeast-1** (Singapur). Agrega una tarjeta Visa o Mastercard. Sin tarjeta el modelo no queda activo. Revisa si hay cupo de prueba y úsalo para el ensayo del paso 6, no para producción.
3. En **Model activation** activa el modelo de **imagen** Seedream (5.5 si figura; si no, 5.0 Pro). No actives Seedance.
4. En **API keys** crea una clave. Pégala solo en el `.env` del VPS:
   ```text
   ARK_API_KEY=...
   ARK_BASE_URL=https://ark.ap-southeast.bytepluses.com/api/v3
   ARK_IMAGE_MODEL=<id copiado de la consola>
   PHOTO_EDIT_PROVIDER=stub
   ```
   `PHOTO_EDIT_PROVIDER` se queda en `stub` hasta el paso 7.
5. Confirma en la consola que la llamada de edición acepta imagen de entrada (image-to-image) y una segunda imagen. Si la ficha del modelo es solo texto-a-imagen, no sirve para este sprint.
6. Ensayo de 20 fotos reales, con la clave y el código de T1 ya en el VPS, todavía sin cambiar el flag global: sala oscura, fachada nublada, carro en la calle, cable, foto con humedad visible. Pedidos: luz, enderezar, quitar el carro (con máscara) y uno prohibido («pon un sofá»). Pasa si la humedad sigue visible, el cielo de la fachada no se volvió azul, el carro desaparece sin redibujar la fachada, y el sofá nuevo no llega a la foto.
7. Solo después de ese ensayo: `PHOTO_EDIT_PROVIDER=seedream` y reinicio de uvicorn. Si el ensayo falla, se deja el stub y se anota qué regla del prompt no obedeció el modelo.

Costo de referencia: 0,045 USD por imagen generada en 5.0 Pro. Un fallo de moderación, según la tarifa publicada de BytePlus, no se cobra. El cupo de 50 del asesor lo cuenta ProAgent, no ByteDance.

---

## Orden de PRs (cuando esté activo)

1. API T1 (prompt, rechazos, cliente Seedream, default stub).
2. Web T2.
3. Smoke T3 en stub.
4. Owner hace §6. El cambio de flag en el VPS no es un commit.

---

## Riesgos

| Riesgo | Qué hacer |
|--------|-----------|
| El modelo ignora el prompt en español | Se puede añadir la misma lista de reglas en inglés, sin reglas nuevas, y subir la versión a `listing_fidelity_v1_es_en`. El Owner ve el diff del txt |
| 5.5 no está en Singapur | Se contrata 5.0 Pro. No se abre cuenta china para saltarse eso |
| La máscara no entra como segunda imagen | `remove_objects` permanece en stub. Luz, enderezar y texto libre pueden ir a Seedream |
| El asesor escribe «aclara y de paso cambia el piso» y el filtro local no lo caza | El prompt igual prohíbe el cambio. Comparar antes de Guardar sigue. Si en el ensayo del paso 6 el piso cambia, no se enciende el flag |
| Marca de agua de ByteDance | El cliente manda `watermark: false`. El ensayo mira una esquina ampliada |
