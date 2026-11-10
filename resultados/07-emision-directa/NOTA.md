# Nota del ejercicio 07
Fecha: 2026-11-10
Versiones usadas (Node, paquetes, Hardhat): Node 26.13.0; ethers 6.17.0; @ethereum-attestation-service/eas-sdk 2.10.0; dotenv 18.0.9; tsx 4.23.15; typescript 7.0.2; @types/node 26.6.5. Sin Hardhat (no hace falta).
Código o datos copiados de otros ejercicios (y de cuál): del 06: src/config, wallets, eas, cadena, esquema, errores y tsconfig; `.env.local` (mismas wallets, copiado por indicación del usuario); resolver y schemaUID en `datos-entrada.json`.
Qué hice: `src/emision.ts` con estimarCosto, emitirAttestation (idempotente), revocarAttestation y certificadoIdDesdeHash; script en cadena y pruebas sin red.
Qué funcionó: los tres criterios de éxito en Base Sepolia. attester = emisorA y el gas salió de su saldo (~0,0000026 ETH); los cuatro casos negativos fallan con mensaje claro; el reintento no duplica.
Qué falló o me sorprendió: `refUID` no sirve para idempotencia (EAS exige que apunte a una attestation existente y no hay índice por contenido). Se resolvió buscando eventos `Attested` desde el bloque de inicio del intento. En `eas.attest()` el SDK solo prepara la transacción y la envía en `wait()`; por eso se puede estimar el gas con `tx.estimateGas()` y simular la pérdida de respuesta.
Nombres de funciones del SDK que difirieron del plan: el plan pedía `emitirAttestation(signer, datos)`; la firma real recibe `eas` conectado, provider, attester, schemaUID, datos y `desdeBloque`. `eas.contract.filters.Attested(...)` y `queryFilter` se usan para la búsqueda.
Decisión para la especificación: la idempotencia necesita un id determinista derivado del hash y un punto de partida en la cadena (bloque). Un producto debería guardar la intención de emisión (certificadoId + bloque) antes de enviar.
Costos o tiempos medidos: emitir ~446.188 de gas estimado; costo máximo estimado 0,0000049 ETH; pagado realmente 0,0000026 ETH (incluye tarifa L1 de datos). Testnet, no representativo de producción.
Preguntas abiertas: ¿cómo se limita el rango de `getLogs` con RPC públicos si pasa mucho tiempo entre intentos? ¿quién fondea la wallet de cada entidad en producción?

Preguntas de comprensión (respuestas breves):
1. Paga el gas la entidad emisora; una entidad cliente necesita ETH en su wallet y alguien que lo reponga.
2. En producción: un proceso de monitoreo con umbral de saldo y reposición, o un relayer que pague por ellas (solo reflexión).
3. Con relayer, el `attester` sería el relayer (o habría que usar attestations delegadas) y el resolver tendría que autorizar a quien firma el mensaje, no a quien envía la transacción.
