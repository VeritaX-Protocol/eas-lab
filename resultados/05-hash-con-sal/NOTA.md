# Nota del ejercicio 05
Fecha: 2026-11-06
Versiones usadas (Node, paquetes, Hardhat): Node 24.21.0; @noble/hashes 2.4.0, typescript 7.0.2, tsx 4.23.15, @types/node 26.6.5.
Código o datos copiados de otros ejercicios (y de cuál): solo `tsconfig.json` y `.gitignore` del 04. Sin wallets ni `.env.local`.
Qué hice: `src/hash.ts`, 8 pruebas, demo del ataque, README.
Qué funcionó: 8/8 pruebas, `tsc --noEmit` limpio. Demo: cédula inventada 734562 recuperada sin sal en 3,7 s; recorrer 1 millón toma 4,8 s (~4,8 µs/hash); extrapolado a 100 millones ≈ 478 s (~8 min). Con sal: 1 millón de intentos sin acierto en 9,8 s (~102.000 intentos/s) y ≈ 3,6e64 años para cubrir 2^256 sales.
Qué falló o me sorprendió:
 - En @noble/hashes 2.x los imports llevan extensión: `@noble/hashes/sha3.js` y `utils.js` (sin `.js` fallaba en versiones nuevas); el export es `keccak_256`.
 - El plan decía `shared/hash.js`; por la regla 7 de LEEME vive en `src/hash.ts`.
 - La cifra sin sal es de JS puro en una CPU; una GPU es varios órdenes de magnitud más rápida, así que 100 millones de cédulas caen en segundos o menos.
Nombres de funciones del SDK que difirieron del plan: no aplica (sin SDK de EAS).
Decisión para la especificación:
 - Normalización: NFC + trim + espacios colapsados + mayúsculas `es`; NO se quitan tildes (JOSÉ ≠ JOSE). Se normalizan nombre, tipoDoc, numeroDoc y codigoCurso; fechaEmision, certificadoId, hashPlantilla y sal se usan tal cual (deben venir ya en formato fijo).
 - Formato canónico: `JSON.stringify(["cert-v1", nombre, tipoDoc, numeroDoc, codigoCurso, fechaEmision, certificadoId, hashPlantilla, sal])` en UTF-8, keccak-256 → bytes32. La sal va dentro del arreglo. Cambiar este formato exige subir el prefijo de versión.
 - Un campo vacío o ausente lanza error (más estricto que solo `undefined`).
 - `hashDatos` de esta función puede reemplazar el valor de ejemplo del ejercicio 02.
Costos o tiempos medidos: ver arriba (demo).
Preguntas abiertas: ¿qué formato fijo exigir a fechaEmision y hashPlantilla (hay que validarlo o confiar en el emisor)? ¿Dónde y cómo se guarda cada sal (cifrada junto a los datos personales)?

## Respuestas a las preguntas de comprensión
1. Una sal global, si se filtra, permite atacar todos los certificados a la vez (y precomputar tablas); con sal única el atacante debe atacar cada certificado por separado y dos certificados con los mismos datos no producen el mismo hash.
2. Para que "  José   Pérez " y "JOSÉ PÉREZ" (o la misma tilde en NFC/NFD) den el mismo hash; si no, la verificación fallaría por diferencias de escritura, no de identidad.
3. El hash queda en la cadena pero ya no se puede comprobar contra ningún dato: el certificado se vuelve inverificable (aunque tampoco revela nada).
