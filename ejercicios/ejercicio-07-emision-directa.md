# Ejercicio 07: emisión directa (la entidad firma y paga su propio gas)

**Bloque:** consola | **Dificultad:** media | **Tiempo:** 2 a 3 h | **Depende de:** 02, 06

## Objetivo

Construir el módulo reutilizable que emite y revoca attestations enviando la transacción directamente desde la wallet de la entidad (`emisorA`), que paga su propio gas. Sin relayer ni attestations delegadas (quedan fuera por ahora).

## Qué vas a entender

- Con envío directo el `attester` es quien envía la transacción, y por eso es la dirección que el resolver autoriza.
- La entidad necesita ETH para el gas. Qué pasa cuando no tiene saldo y cómo se detecta antes de enviar.
- Cómo evitar duplicados si la respuesta del RPC se pierde (idempotencia) y cómo se reintenta con seguridad.

## Instrucciones para Claude Code

### Archivos a crear

- `shared/emision.js`: funciones `emitirAttestation(signer, datos)`, `revocarAttestation(signer, uid)` y `estimarCosto(signer, datos)`.
- `resultados/07-emision-directa/emitir.js`
- `resultados/07-emision-directa/emision.test.js`

### Pasos

1. `emisorA` emite una attestation con el schema **con resolver** del ejercicio 06. Verifica en el SDK el nombre y la forma exactos de las funciones de envío.
2. Leer la attestation y verificar: `attester` es `emisorA` y el gas lo pagó `emisorA` (comparar su saldo antes y después).
3. Antes de enviar, `estimarCosto` calcula el gas estimado y comprueba que el saldo alcanza. Si no alcanza, falla con un mensaje claro y sin enviar nada.
4. Idempotencia: usar un `refUID` o una referencia propia derivada del hash del certificado, de modo que si el envío se repite (respuesta perdida, reintento) se detecte la attestation ya existente en lugar de crear otra. Simular la pérdida de respuesta.
5. Pruebas negativas:
   - `emisorB` (no autorizado) intenta emitir: lo rechaza el resolver.
   - `emisorA` sin saldo: falla antes de enviar.
   - Revocar con una wallet distinta de quien emitió: falla.
   - Reintentar un envío ya confirmado: no crea un duplicado.

## Criterio de éxito

- El `attester` registrado es `emisorA` y el gas salió de su saldo.
- Los cuatro casos negativos fallan con mensajes claros.
- Un reintento no produce dos attestations.

## Preguntas de comprensión

1. ¿Quién paga el gas en este modelo y qué implica para una entidad cliente?
2. ¿Cómo se mantiene fondeada la wallet de cada entidad en producción?
3. ¿Qué cambiaría si más adelante se agregara un relayer? (Solo reflexión: no se implementa.)

## Qué anotar

Gas pagado por la entidad, nombres reales de funciones del SDK, y cómo se resolvió la idempotencia.

## Advertencias

- En producción la llave de cada entidad estaría protegida (KMS o HSM), no en un archivo. Aquí se simula.
- Las attestations delegadas y el relayer quedan **fuera de alcance** por ahora. Si se retoman, se agrega un ejercicio nuevo.
