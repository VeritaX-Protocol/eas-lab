# Ejercicio 09: medir los costos

## Propósito
Medir cuánto cuesta cada operación del sistema en Base Sepolia, para poder estimar el costo por certificado y decidir entre emitir uno a uno, por lotes, o anclar solo un timestamp. Cada operación se repite 20 veces y se guarda el mínimo, el máximo y el promedio (el gas varía un poco entre transacciones).

Operaciones medidas: autorizar y desautorizar un emisor (resolver del 06), attestation directa, revocación, attestation en lote de 10, y timestamp individual, en lote de 10 y en lote de 100.

El costo total de una transacción en la red OP-stack (Base) es:

`gas × precio efectivo (parte L2) + l1Fee (publicar los datos en la L1)`

El `l1Fee` solo aparece en el recibo crudo (`eth_getTransactionReceipt`), no en el de ethers; por eso se lee con una llamada RPC directa.

> **Los precios de testnet no son representativos.** Lo comparable son las unidades de gas y los bytes. El informe no inventa precios en USD: la columna queda vacía hasta que rellenes `parametros.json`.

## Componentes
| Componente | Qué hace |
|---|---|
| `src/medicion.ts` | Lógica de medición: lee el recibo crudo (gas, precio efectivo, `l1Fee`), calcula estadística (mín/máx/prom) y serializa/lee `resultados.json`. |
| `src/` (resto) | Capa de ejercicios anteriores: configuración, wallets, conexión, esquema, emisión y errores (del 07). |
| `scripts/medir.ts` | Ejecuta las operaciones en cadena y escribe `resultados.json`. Variable `REPS` (por defecto 20). Si el saldo no alcanza, para y marca la operación como incompleta. |
| `scripts/informe.ts` | Lee `resultados.json` y `parametros.json`, escribe `informe.md`. No usa red. |
| `parametros.json` | Precios externos: `precioEthUsd`, `precioGasGwei`, `l1FeeEthPorByte`. Están en `null` a propósito. |
| `datos-entrada.json` | Dirección del resolver y UID del schema con resolver (del 06, vía 07). |
| `resultados.json` / `informe.md` | Salida de la medición y su informe (el de este repositorio es del 2026-11-10). |
| `test/medicion.test.ts` | 5 pruebas de la estadística y la serialización, sin red. |

## Requisitos
- **Node 22 o superior** (probado con 26.13.0).
- Ejercicios 06 y 07 hechos: el resolver y el schema ya están desplegados en Base Sepolia.
- Un `.env.local` en esta carpeta (no se sube al repositorio) con `RPC_URL`, `CHAIN_ID`, `EAS_ADDRESS`, `SCHEMA_REGISTRY_ADDRESS`, `PRIVATE_KEY_ADMIN`, `PRIVATE_KEY_EMISOR_A` y `PRIVATE_KEY_EMISOR_B`. Cópialo del ejercicio 08. **Solo llaves de testnet.**
- ETH de prueba: `emisorA` paga attestations y revocaciones; `admin` paga autorizaciones y timestamps.

## Cómo correrlo
```bash
npm install
npm run typecheck
npm test               # sin red
npm run medir          # en cadena, ~160 transacciones; REPS=3 npm run medir para una prueba corta
npm run informe        # genera informe.md
```
`medir` gasta ETH de prueba (en la última corrida, unas 0.0006 ETH entre ambas wallets) y sobrescribe `resultados.json`.

Para ver costos en USD: rellena `parametros.json` con precios actuales de mainnet y vuelve a correr `npm run informe`.

## Salida esperada
Resultados medidos (gas promedio por transacción):

| Operación | Gas | Por certificado |
|---|---|---|
| Autorizar / desautorizar emisor | 47.776 / 25.864 | (una vez por entidad) |
| Attestation directa | 436.915 | 436.915 |
| Revocación | 109.820 | 109.820 |
| Attestation en lote de 10 | 3.823.025 | 382.301 (−12%) |
| Timestamp individual | 50.832 | 50.832 |
| Timestamp en lote de 10 | 272.644 | 27.264 (−46%) |
| Timestamp en lote de 100 | 2.483.572 | 24.835 (−51%) |

El informe completo, con rangos y escenarios de 100, 1.000 y 10.000 certificados al mes, está en `informe.md`. En Base Sepolia el `l1Fee` es de unos cientos de wei (casi 0%); en mainnet pesa mucho más y depende de los bytes enviados, así que no se puede extrapolar desde aquí.

## Estructura
`src/` · `scripts/` · `test/` · `parametros.json` · `datos-entrada.json` · `resultados.json` · `informe.md` · `NOTA.md`
