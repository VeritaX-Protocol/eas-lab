# eas-lab

**Laboratorio conceptual. No es código de producto.**

Ejercicios cortos y desechables para entender cómo funciona **EAS (Ethereum Attestation Service)** en Base y qué sigue vigente hoy: esquemas, resolvers, revocación y attestations dentro y fuera de la cadena. El objetivo es tener criterio al diseñar el motor propio de [VeritaX Protocol](https://github.com/VeritaX-Protocol) (que corre sobre Stellar) y los posibles adaptadores futuros, no construir el producto.

- **Red:** Base Sepolia (testnet), con llaves de prueba. Sin fondos reales.
- **Lo explorado puede diferir del diseño final.** Las decisiones y el código de este laboratorio no se reutilizan como producto; sus conclusiones alimentan el diseño.
- **Organización:** visión general del proyecto y mapa de repositorios en el [README de VeritaX-Protocol](https://github.com/VeritaX-Protocol).

Cada ejercicio es un proyecto TypeScript autocontenido en `resultados/NN-nombre/`. Reglas, preparación y plantilla de nota: [LEEME.md](LEEME.md).

## Ejercicios y estado

| # | Ejercicio | Qué se aprende | Estado |
|---|---|---|---|
| 01 | [Conexión, wallets y fondos](ejercicios/ejercicio-01-conexion.md) | Provider vs signer, chainId, contratos de EAS | Hecho · [resultado](resultados/01-conexion/) |
| 02 | [Schema y primera attestation](ejercicios/ejercicio-02-schema-attestation.md) | Qué es un schema, UID determinista, crear una attestation | Hecho · [resultado](resultados/02-schema-attestation/) |
| 03 | [Lectura y verificación](ejercicios/ejercicio-03-lectura-verificacion.md) | Leer por UID y devolver un estado claro | Hecho · [resultado](resultados/03-lectura-verificacion/) |
| 04 | [Revocación](ejercicios/ejercicio-04-revocacion.md) | Schemas revocables y estado revocado | Hecho · [resultado](resultados/04-revocacion/) |
| 05 | [Hash con sal](ejercicios/ejercicio-05-hash-con-sal.md) | Qué va a la cadena y qué no | Hecho · [resultado](resultados/05-hash-con-sal/) |
| 06 | [Resolver de emisores](ejercicios/ejercicio-06-resolver.md) | Contrato que autoriza emisores (Hardhat 3) | Hecho · [resultado](resultados/06-resolver/) |
| 07 | [Emisión directa](ejercicios/ejercicio-07-emision-directa.md) | La entidad firma y paga; idempotencia | Hecho · [resultado](resultados/07-emision-directa/) |
| 08 | [Off-chain firmado](ejercicios/ejercicio-08-offchain.md) | Attestations fuera de la cadena, timestamp | Pendiente |
| 09 | [Medición de costos](ejercicios/ejercicio-09-costos.md) | Gas por operación y por certificado | Pendiente |
| 99 | [Cierre](ejercicios/99-cierre.md) | Consolidar decisiones | Pendiente |

**Ruta sugerida:** 01 → 02 → 03 → 04, luego 05 (independiente), 06 → 07, 08, y 09 al final. Los ejercicios 01 a 05 se recomiendan en modo B (tú escribes el código y Claude revisa).

## Lo explorado hasta ahora

Tomado de las notas de los ejercicios 01 a 04 (Base Sepolia, valores de testnet):

- Los contratos de EAS y del registro de schemas ya están desplegados en Base Sepolia, y no hay que desplegarlos.
- El SDK de EAS (2.10.0) falló al cargarse como módulo ESM en Node; se resolvió cargando su versión CommonJS.
- Un schema se identifica por un UID calculable de antemano, que coincidió con el que devolvió la cadena.
- Consultar un UID inexistente **no** lanza error: devuelve una estructura vacía, y "no encontrado" equivale a UID en ceros.
- Revocar cuesta ~104.850 de gas, frente a ~429.516 de emitir. Las revocaciones inválidas (otra cuenta, doble revocación, schema no revocable) fallan antes de enviarse y no gastan gas.
- Gas medido en testnet: registrar un schema ~213.800 y crear una attestation ~429.516. Los costos de testnet no son representativos de producción.

## Pregunta abierta de interés

Registrar un esquema de ejemplo y comprobar si se traduce sin cambios entre el formato del motor propio de VeritaX y EAS. Está por probar y no hay conclusión todavía.

## Fuera de este laboratorio

Arweave, PDF/QR, cifrado de datos e interfaces web no se tratan aquí.
