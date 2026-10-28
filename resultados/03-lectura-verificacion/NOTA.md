# Nota del ejercicio 03
Fecha: 2026-10-28
Versiones usadas (Node, paquetes, Hardhat): Node 24.21.0; ethers 6.17.0, @ethereum-attestation-service/eas-sdk 2.10.0, dotenv 18.0.9, typescript 7.0.2, tsx 4.23.15, @types/node 26.6.5 (mismas que 01 y 02).
Código o datos copiados de otros ejercicios (y de cuál): del 02: `src/config.ts`, `wallets.ts`, `eas.ts`, `cadena.ts`, `esquema.ts`, tooling y `.env.local` (copia con confirmación del usuario, permisos 600). Datos: schema UID y attestation de ejemplo del 02, en `src/datos-entrada.json`.
Qué hice: verificador con lector inyectable y 6 estados ordenados; directorio (emisorA registrado, emisorB no); `leer.ts`; `crear-casos.ts` para tener en cadena un caso de emisor no registrado y otro de schema ajeno; 11 pruebas.
Qué funcionó: los 5 estados alcanzables en cadena dieron lo esperado con UIDs reales (VALIDO_PENDIENTE_HASH, EMISOR_NO_REGISTRADO, SCHEMA_INCORRECTO, NO_ENCONTRADO y UID mal formado como error controlado). REVOCADO y EXPIRADO cubiertos con lector falso, incluido el orden (revocado gana a expirado y a emisor no registrado).
Qué falló o me sorprendió:
 - Un UID inexistente NO lanza error: `getAttestation` devuelve una estructura vacía con `uid` en ceros (y como `Result` de ethers, tipo arreglo). "No encontrado" = uid en ceros.
 - Un UID mal formado SÍ lanza (INVALID_ARGUMENT de ethers) antes de la red, pero con mensaje técnico; lo validamos nosotros antes con un error propio.
 - Las direcciones hay que compararlas en minúsculas (el attester viene en checksum EIP-55).
 - Si el schema coincide pero los datos no decodifican, se devuelve SCHEMA_INCORRECTO (decisión mía; el plan no lo cubre).
Nombres de funciones del SDK que difirieron del plan: ninguno nuevo. `eas.getAttestation(uid)` devuelve `Attestation` con `revocationTime`, `expirationTime`, `schema`, `attester`, `data`.
Decisión para la especificación: verificador puro con lector inyectable; "no encontrado" siempre con aviso de que no equivale a falso; separar entrada inválida (error) de estado; incluir `aviso` en cada resultado.
Costos o tiempos medidos: lectura por UID ~170–275 ms con el RPC público; sin errores 429 en ~6 lecturas. `npm run casos`: registro de un schema ajeno + 2 attestations (gas no medido aquí).
Preguntas abiertas: ¿`EXPIRADO` por vigenciaHasta debería poder distinguirse de EAS en el estado para el front? Opcional del ejercicio (GraphQL de EASScan para listar por attester) no implementado.
