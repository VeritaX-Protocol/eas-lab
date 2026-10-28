# Nota del ejercicio 01
Fecha: 2026-10-27
Versiones usadas (Node, paquetes, Hardhat): Node 24.21.0, npm 11.19.0; ethers 6.17.0, @ethereum-attestation-service/eas-sdk 2.10.0, dotenv 18.0.9, typescript 7.0.2, tsx 4.23.15, @types/node 26.6.5.
Código o datos copiados de otros ejercicios (y de cuál): ninguno.
Qué hice: proyecto TS autocontenido; `generar-wallets.ts` (3 wallets, `.env.local` con permisos 600, no sobrescribe); `conectar.ts` (valida chainId, bloque, saldos, código en EAS y SchemaRegistry, versión de EAS); pruebas de la configuración.
Qué funcionó: conexión a Base Sepolia (RPC https://sepolia.base.org), chainId 84532; EAS 0x4200…0021 y SchemaRegistry 0x4200…0020 tienen código (2059 bytes cada uno: parecen proxies con el mismo código); versión del contrato EAS: 1.4.1-beta.3.
Qué falló o me sorprendió:
 1. El build ESM del SDK falla en Node ("lodash does not provide an export named 'isEqual'"). Solución: `src/eas.ts` carga el build CommonJS con `createRequire` y conserva los tipos.
 2. Con `staticNetwork` en ethers, `getNetwork()` NO consulta al nodo y la guarda de chainId no abortaba con `CHAIN_ID=1`. Quitado; ahora aborta (probado con CHAIN_ID=1 y con RPC de Base mainnet).
 3. `.env.local` copiado quedaba con permisos 644; ahora `chmod 600` antes de escribir llaves.
Nombres de funciones del SDK que difirieron del plan: `EAS.getVersion()` existe tal cual; `connect(signer)` devuelve `this`.
Decisión para la especificación: validar el chainId contra el nodo siempre antes de firmar; cargar el SDK por CJS mientras el build ESM esté roto.
Costos o tiempos medidos: n/a.
Preguntas abiertas: faucet usado (pendiente de fondear admin y emisorA); `npm` omitió scripts de instalación de esbuild/secp256k1 y todo funcionó igual.
