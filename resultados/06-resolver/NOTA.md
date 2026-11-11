# Nota del ejercicio 06
Fecha: 2026-11-10 (nota escrita después de hacer el ejercicio, a partir del código, el README y el registro del despliegue)
Versiones usadas (Node, paquetes, Hardhat): Node 26.13.0; Hardhat 3.21.2; Solidity 0.8.29 (la que fija EAS 1.9.0); hardhat-ignition 3.1.9; hardhat-viem 3.1.0; viem 2.57.16; @ethereum-attestation-service/eas-contracts 1.9.0; eas-sdk 2.10.0; @openzeppelin/contracts 5.3.0; ethers 6.17.0; dotenv 18.0.9; tsx 4.23.15; typescript 7.0.2; @types/node 26.6.5.
Código o datos copiados de otros ejercicios (y de cuál): del 04: capa `src/` (config, wallets, cadena, eas, esquema, emisión de ejemplo, errores) y `.env.local`. Del 02: el texto del schema y su UID (`schemaUIDEjercicio02`).
Qué hice: escribí el resolver `EmisoresAutorizados` (hereda `SchemaResolver`), sus 6 pruebas sobre la red simulada de Hardhat, el módulo de Ignition y su despliegue en Base Sepolia, el registro del schema con resolver y una prueba de punta a punta en cadena.
Qué funcionó: dirección del resolver `0xD05Dbb898f3eaF7BA2Be9Dde428ff318a413DC5F`; schema con resolver `0x8e0c03555e5183d402a4cd059a104f47955f034b412e52e25bc830a5982d381b`. Emite el autorizado, rechaza al no autorizado y al desautorizado, y el desautorizado sí revoca lo anterior.
Qué falló o me sorprendió: el mismo texto de schema con otro resolver da otro UID (el UID incluye el resolver). El resolver queda fijo en el schema: cambiarlo exige un schema nuevo. Gas de despliegue y de `autorizar`: no los dejé anotados en su momento; se pueden leer del recibo en el explorador o con el ejercicio 09 (`autorizar` ≈ 47.776 de gas al activar). Errores de compilación: no quedó registro.
Nombres de funciones del SDK que difirieron del plan: no quedó registro detallado; las pruebas de contrato usan hardhat-viem y los scripts usan ethers con el SDK de EAS.
Decisión para la especificación: el control de quién emite se puede hacer en cadena con un resolver; el owner debería ser un multisig, con política de rotación y auditoría antes de producción.
Costos o tiempos medidos: ver ejercicio 09 (autorizar 47.776, desautorizar 25.864, attestation con resolver 436.915 de gas).
Preguntas abiertas: ¿quién es el owner en producción y cómo se rota? ¿se necesita un mecanismo para dar de baja a un emisor y marcar lo que emitió?

Preguntas de comprensión:
1. Cuando la entidad envía la transacción directamente, el `attester` que ve el resolver es la dirección de esa entidad (quien llama a EAS). Se confirma en el ejercicio 07.
2. `onRevoke` devuelve siempre `true` porque EAS ya limita la revocación a quien emitió; así un emisor desautorizado todavía puede retirar lo que emitió antes.
3. Si el owner es una sola wallet, perder o filtrar su llave deja el control en manos ajenas o bloqueado. En producción se reduce con un multisig, rotación de llaves y `transferirOwner`.
