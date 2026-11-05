# Nota del ejercicio 04
Fecha: 2026-10-28
Versiones usadas (Node, paquetes, Hardhat): Node 24.21.0; ethers 6.17.0, @ethereum-attestation-service/eas-sdk 2.10.0, dotenv 18.0.9, typescript 7.0.2, tsx 4.23.15, @types/node 26.6.5.
Código o datos copiados de otros ejercicios (y de cuál): del 03: config, wallets, eas, cadena, esquema, directorio(+json), lector, verificador, entrada(+datos-entrada.json), tooling y `.env.local` (copia con confirmación del usuario, permisos 600). De la emisión del 02 salió `src/emitir.ts`. El verificador del 03 se modificó aquí: nuevo campo `fechaRevocacion` y fecha ISO en el detalle de REVOCADO.
Qué hice: ciclo emitir → verificar → revocar → verificar, más tres negativas; traductor de errores del contrato por selector; 3 pruebas.
Qué funcionó:
 - Attestation revocada: 0x4c3c44738e45e7c4afb1ee63534d5c61612e53cc9f5bfdf94dc2f40ef5954149; antes VALIDO_PENDIENTE_HASH, después REVOCADO (2026-10-28T19:42:09Z).
 - Gas de la revocación: 104850 (la emisión cuesta 429516).
 - Errores de los casos negativos (selector → nombre, verificados con keccak y contra eas-contracts):
   · emisorB revoca la de emisorA: AccessDenied (0x4ca88867)
   · doble revocación: AlreadyRevoked (0x905e7107)
   · schema no revocable (UID 0x162a6976c67abc1c28dd085546f4dd113d0fea721f9273715b92c49f23546b46): Irrevocable (0x157bd4c3)
Qué falló o me sorprendió:
 - ethers reporta los tres como "execution reverted (unknown custom error)" con el selector en `data="0x…"`; hay que traducirlos a mano (src/errores.ts).
 - Las revocaciones inválidas fallan en estimateGas, antes de enviar: no gastan gas.
 - En un schema no revocable, la attestation también debe emitirse con revocable=false (si no, EAS la rechaza con Irrevocable al emitir).
 - Cada ejecución de `npm run revocar` deja 3 attestations nuevas on-chain (no es idempotente, a propósito: necesita una attestation fresca).
Nombres de funciones del SDK que difirieron del plan: `eas.revoke({ schema, data: { uid } })` → `Transaction<void>`; exige el UID del schema además del UID de la attestation.
Decisión para la especificación: una revocación equivocada NO se deshace: se emite una attestation nueva y se registra el motivo (off-chain, en la base de datos del emisor), dejando la revocada como historial. Todos los schemas del producto serán revocable=true (principio 5), porque un schema no revocable no permite corregir errores ni retirar certificados fraudulentos, y no se puede cambiar después. Si el emisor pierde su llave, nadie más puede revocar (solo el attester original): hay que gestionar la llave como crítica y prever, en la especificación, un mecanismo (resolver o llave de recuperación) — queda abierto.
Costos o tiempos medidos: revocar 104850 gas; emitir 429516 gas.
Preguntas abiertas: ¿cómo revocar si el emisor pierde la llave? ¿Un resolver del ejercicio 06 puede permitir que un admin revoque en nombre de la entidad?
