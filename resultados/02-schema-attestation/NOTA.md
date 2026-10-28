# Nota del ejercicio 02
Fecha: 2026-10-27
Versiones usadas (Node, paquetes, Hardhat): Node 24.21.0; ethers 6.17.0, @ethereum-attestation-service/eas-sdk 2.10.0, dotenv 18.0.9, typescript 7.0.2, tsx 4.23.15, @types/node 26.6.5 (mismas que el 01).
Código o datos copiados de otros ejercicios (y de cuál): del 01: `src/config.ts`, `src/wallets.ts`, `src/eas.ts` (ampliado con SchemaRegistry, SchemaEncoder y constantes), tooling, y `.env.local` (copia con confirmación del usuario, permisos 600). La guarda de chainId del 01 pasó a `src/cadena.ts`.
Qué hice: schema v1 en `src/esquema.ts` con validación y codificación/decodificación tipadas; `registrar-schema` idempotente; `crear-attestation` con ida y vuelta de verificación; caso negativo; pruebas.
Qué funcionó:
 - Schema UID (chainId 84532): 0xab779f9c4f2c7b74c641b47d18859882c218f6ef598e05686721b14b6d913008 (gas 213800).
 - Attestation UID: 0x0ab8937683b61e06eea1d360ece4423874bab9d91c474920750ae5b42fa0edb7 (gas 429516), attester emisorA, recipient 0x0.
 - El UID calculado localmente coincidió con el que devolvió la cadena. Segunda ejecución de `registrar`: sin error ni transacción.
 - EASScan: tras seguir redirecciones, /schema/view/… y /attestation/view/… dan 200 (las primeras peticiones sueltas dieron 302/500 mientras indexaba). Su API GraphQL devuelve la attestation con attester y `decodedDataJson` que coinciden con lo enviado.
Qué falló o me sorprendió:
 - `SchemaRegistry.getSchema()` lanza "Schema not found" si el UID no existe, en vez de devolver uid en ceros; se atrapa ese mensaje exacto.
 - El revert de un schema inexistente llega como "unknown custom error" de ethers; el selector 0xbf37b20e es `InvalidSchema()` (verificado con keccak). Se extrae para dar un mensaje legible.
 - Una attestation consume ~430k gas, más del doble que registrar el schema.
Nombres de funciones del SDK que difirieron del plan: `SchemaRegistry.getSchemaUID` es estática; `register()` y `attest()` devuelven `Transaction<string>` y el UID sale de `await tx.wait()`. Se mantiene la carga CJS del SDK por el problema de lodash (ver NOTA 01).
Decisión para la especificación: separar validación de tipos (antes de enviar) de la codificación; comprobar existencia con getSchema antes de registrar; guardar UIDs de schema por chainId.
Costos o tiempos medidos: registrar schema 213800 gas; attestation 429516 gas (Base Sepolia).
Preguntas abiertas: ¿se puede reducir el gas de la attestation (menos strings, p. ej. plantillaArweaveId como bytes32)? Se medirá en el ejercicio 09.
