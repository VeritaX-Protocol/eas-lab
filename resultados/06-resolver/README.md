# Ejercicio 06: resolver de emisores autorizados

## Propósito
En EAS cualquiera puede emitir attestations con un schema. Este ejercicio añade control de acceso: un **contrato resolver** que EAS consulta en cada emisión y revocación del schema. Si el resolver responde `false`, la transacción se revierte.

Aquí el resolver (`EmisoresAutorizados`) solo deja emitir a direcciones que el `owner` autorizó. Se prueba en local con Hardhat y luego en Base Sepolia.

Lo que se aprende:
- El resolver queda fijo en el schema: cambiarlo implica registrar un schema nuevo con otro UID.
- El UID depende de la dirección del resolver (texto + resolver + revocable), por eso este schema, con el mismo texto del ejercicio 02, tiene un UID distinto.
- Un emisor desautorizado ya no puede emitir, pero **sí puede revocar** lo que emitió antes (`onRevoke` siempre devuelve `true`; EAS ya limita la revocación a quien emitió).

> El contrato es de aprendizaje y **no está auditado**. En producción haría falta auditoría, owner multisig y política de rotación.

## Componentes
Este ejercicio ya no es solo scripts de TypeScript: mezcla un proyecto Hardhat 3 con el código del ejercicio anterior.

| Componente | Qué hace |
|---|---|
| `contracts/EmisoresAutorizados.sol` | El resolver. Hereda `SchemaResolver` de EAS. `autorizar(emisor, estado)` y `transferirOwner(nuevo)` solo los puede llamar el owner; `onAttest` exige que el `attester` esté autorizado; `onRevoke` siempre permite. |
| `test/EmisoresAutorizados.ts` | Pruebas con el ejecutor de Node sobre la red simulada de Hardhat: despliegan EAS, el registro de schemas y el resolver, y cubren owner, no-owner, emisor autorizado, no autorizado, desautorizado que sí revoca y `transferirOwner`. |
| `hardhat.config.ts` | Hardhat 3, Solidity `0.8.29` (la versión exacta que fija EAS 1.9.0) y dos redes: `hardhatMainnet` (simulada) y `baseSepolia` (http, stack OP). Las llaves vienen de `.env.local`. |
| `ignition/modules/EmisoresAutorizados.ts` | Módulo de Hardhat Ignition que despliega el resolver con dos parámetros: `eas` y `owner`. |
| `ignition/parameters.baseSepolia.json` | Parámetros públicos del despliegue en Base Sepolia (predesplegado de EAS y dirección del owner). |
| `ignition/deployments/chain-84532/` | Registro del despliegue ya hecho; `deployed_addresses.json` guarda la dirección del resolver. |
| `scripts/registrar-schema-resolver.ts` | Registra el schema (mismo texto del 02, `revocable = true`) apuntando al resolver. Es idempotente y guarda el UID en `src/datos.json`. |
| `scripts/probar-en-testnet.ts` | Recorre en cadena: autorizar a `emisorA` → emite → `emisorB` rechazado → desautorizar a `emisorA` → rechazado al emitir → **sí** revoca lo anterior. |
| `scripts/direcciones.ts` | Imprime las direcciones públicas de las wallets de prueba (nunca las llaves). |
| `src/` | Capa TypeScript con `ethers` y el SDK de EAS: configuración, wallets, conexión (`cadena.ts`), schema, emisión de ejemplo, decodificación de errores y lectura/escritura de `datos.json`. Es copia ampliada del ejercicio 04. |
| `src/datos.json` | Por cadena (`84532`): dirección del resolver, UID del schema del 02 y UID del schema nuevo. |

Estado registrado en Base Sepolia (`chain-84532`):
- Resolver: `0xD05Dbb898f3eaF7BA2Be9Dde428ff318a413DC5F`
- Schema con resolver: `0x8e0c03555e5183d402a4cd059a104f47955f034b412e52e25bc830a5982d381b`

## Requisitos
- **Node 22.13 o superior** (requisito de Hardhat 3).
- Ejercicios 01 y 02 hechos: el schema del 02 es el texto base.
- Un archivo `.env.local` en esta carpeta (nunca se sube al repositorio) con:
  ```
  RPC_URL=https://sepolia.base.org
  CHAIN_ID=84532
  EAS_ADDRESS=0x4200000000000000000000000000000000000021
  SCHEMA_REGISTRY_ADDRESS=0x4200000000000000000000000000000000000020
  PRIVATE_KEY_ADMIN=...
  PRIVATE_KEY_EMISOR_A=...
  PRIVATE_KEY_EMISOR_B=...
  ```
  Puedes copiarlo del ejercicio 04. **Solo llaves de testnet.**
- ETH de prueba de Base Sepolia en `admin` (despliega, registra el schema y autoriza) y en `emisorA` (emite y revoca). `emisorB` solo intenta, y su intento falla antes de enviarse.

## Cómo correrlo
Desde `resultados/06-resolver/`:

```bash
npm install            # (npm ci)
npm run typecheck      # tsc --noEmit
npm test               # pruebas del contrato en red local simulada (sin red ni gas)
npm run build          # compila el contrato (hardhat build)
```

Despliegue y prueba en Base Sepolia (los pasos 1 y 2 ya están hechos y registrados; repítelos solo si quieres un resolver nuevo):

```bash
# 1. Desplegar el resolver con Ignition (verifica el comando en la documentación de Hardhat)
npx hardhat ignition deploy ignition/modules/EmisoresAutorizados.ts \
  --network baseSepolia --parameters ignition/parameters.baseSepolia.json
# 2. Copiar la dirección desplegada a "resolver" en src/datos.json, luego:
npm run registrar      # registra el schema con resolver y guarda su UID
# 3. La prueba de punta a punta en cadena
npm run probar
```

Cada `npm run probar` emite una attestation y revoca otra, y gasta ETH de prueba.

## Salida esperada
`npm test`: las 6 pruebas en verde.

`npm run probar`: seis pasos numerados. Los pasos 3 y 5 imprimen `OK, rechazado como se esperaba` con el motivo, y el paso 6 imprime `OK, revocada` con su `revocationTime`.

## Estructura
`contracts/` · `test/` · `ignition/` · `scripts/` · `src/` · `hardhat.config.ts` · `package.json`. Las carpetas `artifacts/` y `cache/` son salida de compilación y no se suben al repositorio.
