# Ejercicio 02: schema y primera attestation

## Qué hace
- **Registra el schema del certificado v1** en el SchemaRegistry de Base Sepolia (sin resolver, revocable). Es idempotente: si ya existe, no envía nada.
- **Crea la primera attestation** con `emisorA`, con datos de ejemplo claramente falsos, `recipient` en la dirección cero, sin vencimiento y revocable. Después la lee de la cadena y comprueba que decodifica igual a lo enviado.
- Caso negativo: una attestation contra un schema inexistente falla con un error claro.

Conceptos: un schema es inmutable; su UID es determinista (texto + resolver + revocable); el `recipient` en cero evita vincular a una persona on-chain; los datos se validan antes de enviarse.

## Requisitos
- Ejercicio 01 hecho: el `.env.local` es una **copia** del de `resultados/01-conexion/` (mismas wallets y fondos).
- ETH de prueba en `admin` (registra el schema) y `emisorA` (emite). Todo lo que se escribe es público y permanente: solo datos de ejemplo.

## Cómo correrlo
Desde `resultados/02-schema-attestation/`:

```bash
npm install            # (npm ci) dependencias con versiones fijas
npm run registrar      # registra el schema y guarda el UID en src/schemas.json (por chainId)
npm run attestar       # crea la attestation, imprime UID, gas y enlace a EASScan
npm run negativo       # attestation con schema inexistente: debe fallar con InvalidSchema
npm test               # codificación, validación y UID determinista (sin red)
npm run typecheck      # tsc --noEmit
```

## Salida esperada
- `registrar`: UID calculado `0xab779f9c…3008` (v1), gas usado la primera vez; la segunda dice "ya estaba registrado".
- `attestar`: UID de la attestation, gas, enlace `https://base-sepolia.easscan.org/attestation/view/<uid>` y `Decodificado coincide con lo enviado: true`.

## Casos negativos
| Caso | Resultado |
|---|---|
| `npm run registrar` dos veces | Sin error; la 2.ª no envía transacción |
| `npm run negativo` | Falla con `InvalidSchema` (selector `0xbf37b20e`) |
| `hashDatos` de longitud incorrecta | Rechazado por `codificarDatos` antes de enviar (prueba) |
| `npm run attestar` sin registrar | Mensaje: ejecutar primero `npm run registrar` |

## Estructura
`src/` (config, wallets, carga del SDK, `esquema.ts` con el schema y su codificación, `schemas.ts`/`schemas.json` con el UID por chainId, `cadena.ts`) · `scripts/` · `test/` · `NOTA.md`.
