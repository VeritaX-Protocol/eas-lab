# eas-lab

Laboratorio de calentamiento de **EAS (Ethereum Attestation Service)** de la organización VeritaXProtocol. Son ejercicios cortos y desechables en **Base Sepolia** (testnet, llaves de prueba) para aprender las bases antes de construir el producto.

> Cada ejercicio es un proyecto TypeScript autocontenido en `resultados/NN-nombre/`. Reglas, preparación y plantilla de nota: [LEEME.md](LEEME.md).

## Tabla de contenido

| # | Ejercicio | Qué se aprende | Nivel | Tiempo |
|---|---|---|---|---|
| 01 | [Conexión, wallets y fondos](ejercicios/ejercicio-01-conexion.md) | Provider vs signer, chainId, contratos de EAS | Baja | 1–2 h |
| 02 | [Schema y primera attestation](ejercicios/ejercicio-02-schema-attestation.md) | Qué es un schema, UID determinista, crear una attestation | Baja | 2 h |
| 03 | [Lectura y verificación](ejercicios/ejercicio-03-lectura-verificacion.md) | Leer por UID y devolver un estado claro | Media | 2–3 h |
| 04 | [Revocación](ejercicios/ejercicio-04-revocacion.md) | Schemas revocables y estado revocado | Baja | 1–2 h |
| 05 | [Hash con sal](ejercicios/ejercicio-05-hash-con-sal.md) | Qué va a la cadena y qué no | Media | 2–3 h |
| 06 | [Resolver de emisores](ejercicios/ejercicio-06-resolver.md) | Contrato que autoriza emisores (Hardhat 3) | Alta | 4–6 h |
| 07 | [Emisión directa](ejercicios/ejercicio-07-emision-directa.md) | La entidad firma y paga; idempotencia | Media | 2–3 h |
| 08 | [Off-chain firmado](ejercicios/ejercicio-08-offchain.md) | Attestations fuera de la cadena, timestamp | Media | 3 h |
| 09 | [Medición de costos](ejercicios/ejercicio-09-costos.md) | Gas por operación y por certificado | Media | 2–3 h |
| 99 | [Cierre](ejercicios/99-cierre.md) | Consolidar decisiones | – | 1 h |

**Ruta sugerida:** 01 → 02 → 03 → 04, luego 05 (independiente), 06 → 07, 08, y 09 al final. Los ejercicios 01 a 05 se recomiendan en modo B (tú escribes el código y Claude revisa).

## Fuera de este laboratorio

Arweave, PDF/QR, cifrado de datos e interfaces web se tratan en otros repositorios de la organización.
