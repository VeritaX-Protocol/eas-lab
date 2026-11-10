# Ejercicio 07: emisión directa

## Qué hace
Construye el módulo que emite y revoca attestations **enviando la transacción directamente desde la wallet de la entidad** (`emisorA`), que paga su propio gas. No hay relayer ni attestations delegadas.

Concepto: con envío directo, el `attester` es quien envía la transacción, y por eso es la dirección que el resolver del ejercicio 06 autoriza.

`src/emision.ts` ofrece:
- `estimarCosto`: estima el gas **sin enviar** y comprueba que el saldo alcanza. Si el resolver rechaza la emisión o falta saldo, falla antes de enviar.
- `emitirAttestation`: emite de forma **idempotente**. Antes de enviar busca si el certificado ya está en la cadena; si ya existe, devuelve su UID y no envía nada.
- `revocarAttestation`: revoca (EAS solo lo permite a quien emitió).
- `certificadoIdDesdeHash`: el `certificadoId` se deriva del hash con sal (ejercicio 05), así un reintento reconoce el mismo certificado. Nunca contiene datos personales.

**Cómo funciona la idempotencia:** EAS no permite buscar attestations por su contenido, y `refUID` solo acepta UIDs de attestations que ya existen. Por eso se guarda el número de bloque en que empieza el intento (`desdeBloque`) y, antes de reenviar, se revisan los eventos `Attested` de ese emisor y schema desde ese bloque, comparando el `certificadoId`. Límite: hay que conservar `desdeBloque` entre reintentos, y el RPC público limita el rango de bloques de `getLogs`.

## Requisitos
- Ejercicios 02 y 06 hechos. `datos-entrada.json` trae el resolver y el schema UID del 06.
- `.env.local` en esta carpeta, copia del del ejercicio 06 (mismas wallets). Nunca se sube al repositorio. `.env.example` lista las variables.
- ETH de Base Sepolia en `emisorA` (emite) y en `admin` (autoriza y desautoriza). `emisorB` no necesita fondos.
- Node 22.13 o superior.

## Cómo correrlo
Desde `resultados/07-emision-directa/`:

```bash
npm install            # (npm ci)
npm test               # pruebas sin red: estimarCosto y certificadoId
npm run typecheck      # tsc --noEmit
npm run emitir         # el ejercicio completo en Base Sepolia
```
`npm run emitir` gasta ETH de prueba: `admin` envía 4 transacciones (autorizar y desautorizar) y `emisorA` envía 2 emisiones.

## Salida esperada
1. `emisorA` emite; `attester = emisorA ✔` y se muestra cuánto ETH salió de su saldo.
2. `estimarCosto` muestra el gas estimado y el costo máximo, sin enviar.
3. Se simula perder la respuesta del RPC: el reintento detecta la attestation existente y no envía nada.
4. Cuatro casos negativos, todos con `OK, falló como se esperaba`:
   - `emisorB` (no autorizado): `InvalidAttestation`.
   - Emisor autorizado sin saldo: `Saldo insuficiente`, sin enviar nada.
   - `emisorB` revoca lo de `emisorA`: `AccessDenied`.
   - Reintentar un envío ya confirmado: sigue habiendo 1 attestation.
5. Limpieza: `emisorA` queda desautorizado otra vez.

## Estructura
`src/` (`emision.ts` es lo nuevo; `datos.ts` lee `datos-entrada.json`; el resto es copia del 06: config, wallets, eas, cadena, esquema, errores) · `scripts/emitir.ts` · `test/emision.test.ts` · `datos-entrada.json` · `NOTA.md`.
