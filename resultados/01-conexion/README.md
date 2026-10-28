# Ejercicio 01: conexión, wallets y fondos

## Qué hace
Prepara el terreno para el resto del laboratorio:
- Genera 3 wallets de prueba (`admin`, `emisorA`, `emisorB`) y guarda sus llaves en `.env.local` (ignorado por git).
- Se conecta a Base Sepolia y **aborta si el chainId no es el configurado** (84532).
- Muestra el bloque actual y el saldo de cada wallet, comprueba que hay contratos en las direcciones de EAS y del registro de schemas, y lee la versión de EAS con el SDK.

Conceptos: *provider* (solo lectura) vs *signer* (firma y paga), validación de chainId, llaves fuera del repositorio.

## Requisitos
- Node.js 22.13+ (probado con 24.21.0).
- ETH de prueba de Base Sepolia en `admin` y `emisorA` (faucet). `emisorB` puede quedar sin fondos.

## Cómo correrlo
Desde `resultados/01-conexion/`:

```bash
npm install            # instala dependencias (versiones fijas)
npm run wallets        # UNA sola vez: crea .env.local e imprime solo las direcciones
# fondea admin y emisorA en un faucet de Base Sepolia
npm run conectar       # conecta y verifica todo
npm test               # pruebas de la configuración (node:test)
npm run typecheck      # tsc --noEmit
```

La configuración pública (RPC, chainId, direcciones de EAS) sale de `.env.example` y queda copiada en `.env.local`; se puede cambiar ahí, no en el código.

## Salida esperada de `npm run conectar`
chainId `84532`, un bloque reciente, saldos (mayores que 0 para `admin` y `emisorA`), "código presente" para EAS y SchemaRegistry, y la versión del contrato EAS (`1.4.1-beta.3`).

## Casos negativos
| Caso | Resultado |
|---|---|
| Sin `.env.local` | Mensaje: ejecutar primero `npm run wallets` |
| `CHAIN_ID=1 npm run conectar` | Aborta: el RPC responde 84532, se esperaba 1 |
| `RPC_URL=https://mainnet.base.org npm run conectar` | Aborta: el RPC responde 8453 |
| `npm run wallets` por segunda vez | No sobrescribe las llaves |

## Estructura
`src/` (config, wallets, carga del SDK) · `scripts/` (generar-wallets, conectar) · `test/` · `NOTA.md` (aprendizajes y hallazgos).
