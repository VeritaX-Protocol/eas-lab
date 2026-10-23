# Ejercicio 01: conexión, wallets y fondos

**Bloque:** consola | **Dificultad:** baja | **Tiempo:** 1 a 2 h | **Depende de:** nada

## Objetivo

Dejar listo el proyecto base, generar las wallets de prueba, conectarse a Base Sepolia y comprobar que el contrato de EAS responde.

## Qué vas a entender

- Qué es un *provider* (lee la cadena) y qué es un *signer* (firma y paga).
- Por qué se valida el `chainId` antes de hacer cualquier cosa.
- Por qué las llaves van en un archivo ignorado por git.

## Instrucciones para Claude Code

### Archivos a crear

- `package.json` con `"type": "module"` y las dependencias de `LEEME.md` que se necesiten ahora (`ethers`, `@ethereum-attestation-service/eas-sdk`, `dotenv`).
- `.gitignore` (incluye `node_modules`, `.env.local`, `*.db`) y `.env.example` (solo nombres de variables).
- `shared/config.js`: carga variables de entorno y exporta la configuración de la cadena (`RPC_URL`, `CHAIN_ID`, `EAS_ADDRESS`, `SCHEMA_REGISTRY_ADDRESS`). Si falta una variable, lanza un error claro.
- `shared/wallets.js`: devuelve los signers por rol (`admin`, `emisorA`, `emisorB`) conectados al provider.
- `ejercicios/01-conexion/generar-wallets.js`: genera las 3 wallets y escribe las llaves en `.env.local` **solo si el archivo no existe**. Imprime únicamente las direcciones públicas.
- `ejercicios/01-conexion/conectar.js`: ver pasos.

### Pasos

1. Inicializar el proyecto y la estructura de carpetas de `LEEME.md`.
2. Ejecutar `generar-wallets.js`. Pedirle al usuario que fondee con ETH de prueba `admin` y `emisorA` (`emisorB` puede quedar sin fondos o con poco).
3. En `conectar.js`:
   - Crear el provider y consultar `getNetwork()`. **Abortar si el chainId no es 84532.**
   - Imprimir el número de bloque actual.
   - Imprimir el saldo de cada wallet (en ETH, solo direcciones, nunca llaves).
   - Verificar que hay código desplegado en `EAS_ADDRESS` y en `SCHEMA_REGISTRY_ADDRESS` (`getCode` distinto de `0x`).
   - Instanciar `EAS` del SDK, conectarlo a un signer y leer su versión (verificar el nombre real de la función en el SDK).

## Criterio de éxito

- El script imprime chainId `84532`, un bloque reciente y saldos mayores que cero para `admin` y `emisorA`.
- Confirma que hay código en las dos direcciones de EAS y muestra la versión.
- `.env.local` no aparece en `git status`.

## Casos negativos

- Con `CHAIN_ID` o RPC de otra red: el script se detiene con un mensaje claro.
- Sin `.env.local`: mensaje que indica ejecutar primero `generar-wallets.js`.
- Ejecutar `generar-wallets.js` dos veces **no** debe sobrescribir las llaves.

## Preguntas de comprensión (para ti)

1. ¿Qué diferencia hay entre provider y signer?
2. ¿Qué pasaría si apuntaras por error a mainnet con una llave real?
3. ¿Por qué las direcciones de EAS van en configuración y no dentro del código?

## Qué anotar

Versión de Node y de los paquetes, RPC usado, faucet que funcionó, dirección de EAS confirmada y versión del contrato.

## Advertencias

- El RPC público tiene límites. Si hay errores 429, espera o usa otro RPC de prueba.
- Los faucets suelen limitar por dirección y por día.
