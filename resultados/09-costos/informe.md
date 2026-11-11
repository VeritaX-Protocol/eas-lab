# Informe de costos (ejercicio 09)

Medido en **Base Sepolia (testnet)** el 2026-11-10, 20 repeticiones por operación.

> **Los precios de testnet NO son representativos.** El ETH de testnet no vale nada y su precio del gas y de la parte L1 no se parecen a los de mainnet. Lo comparable son las **unidades de gas** y los **bytes enviados**. Los valores en ETH de abajo son solo lo que costó en testnet.

## Costo por operación (una transacción)
Costo total = parte L2 (gas × precio efectivo) + parte L1 (`l1Fee` del recibo crudo, publicación de datos en la L1).

| Operación | Muestras | Gas prom (mín – máx) | Bytes enviados | ETH testnet prom | % L1 |
|---|---|---|---|---|---|
| Autorizar un emisor (activar) | 20 | 47776 (47776 – 47776) | 68 | 0.0000002867 | 0% |
| Desautorizar un emisor (desactivar) | 20 | 25864 (25864 – 25864) | 68 | 0.0000001552 | 0% |
| Attestation directa con resolver | 20 | 436915 (436905 – 436917) | 708 | 0.0000026217 | 0% |
| Revocación | 20 | 109820 (109809 – 109821) | 100 | 0.0000006589 | 0% |
| Attestation en lote de 10 | 20 | 3823025 (3822995 – 3823079) | 6596 | 0.0000229382 | 0% |
| Timestamp individual | 20 | 50832 (50822 – 50834) | 36 | 0.0000003050 | 0% |
| Timestamp en lote de 10 | 20 | 272644 (272615 – 272663) | 388 | 0.0000016359 | 0% |
| Timestamp en lote de 100 | 20 | 2483572 (2483473 – 2483665) | 3268 | 0.0000149014 | 0% |

## Costo por certificado
Cada lote se divide entre sus certificados. Es un **rango**, no un número único.

| Modo | Gas por cert. prom (mín – máx) | Bytes por cert. | ETH testnet por cert. prom (mín – máx) | USD por cert. |
|---|---|---|---|---|
| Attestation directa con resolver | 436915 (436905 – 436917) | 708 | 0.0000026217 (0.0000026214 – 0.0000026263) | — |
| Revocación | 109820 (109809 – 109821) | 100 | 0.0000006589 (0.0000006589 – 0.0000006589) | — |
| Attestation en lote de 10 | 382301 (382299 – 382307) | 660 | 0.0000022938 (0.0000022938 – 0.0000022938) | — |
| Timestamp individual | 50832 (50822 – 50834) | 36 | 0.0000003050 (0.0000003049 – 0.0000003050) | — |
| Timestamp en lote de 10 | 27264 (27261 – 27266) | 39 | 0.0000001636 (0.0000001636 – 0.0000001636) | — |
| Timestamp en lote de 100 | 24835 (24834 – 24836) | 33 | 0.0000001490 (0.0000001490 – 0.0000001490) | — |

Ahorro de gas por certificado frente al modo individual:
- Attestation en lote de 10 vs directa: **12%**
- Timestamp en lote de 10 vs individual: **46%**
- Timestamp en lote de 100 vs individual: **51%**

## Escenarios de volumen mensual
| Modo | Certificados al mes | Gas total | ETH testnet (mín – máx) | USD |
|---|---|---|---|---|
| Attestation directa con resolver | 100 | 43691500 | 0.0002621730 (0.0002621430 – 0.0002626280) | — |
| Attestation directa con resolver | 1000 | 436915000 | 0.0026217301 (0.0026214300 – 0.0026262797) | — |
| Attestation directa con resolver | 10000 | 4369150000 | 0.0262173008 (0.0262143000 – 0.0262627969) | — |
| Attestation en lote de 10 | 100 | 38230100 | 0.0002293815 (0.0002293797 – 0.0002293847) | — |
| Attestation en lote de 10 | 1000 | 382301000 | 0.0022938150 (0.0022937970 – 0.0022938474) | — |
| Attestation en lote de 10 | 10000 | 3823010000 | 0.0229381500 (0.0229379700 – 0.0229384740) | — |
| Timestamp individual | 100 | 5083200 | 0.0000304993 (0.0000304932 – 0.0000305004) | — |
| Timestamp individual | 1000 | 50832000 | 0.0003049932 (0.0003049320 – 0.0003050040) | — |
| Timestamp individual | 10000 | 508320000 | 0.0030499320 (0.0030493200 – 0.0030500400) | — |
| Timestamp en lote de 10 | 100 | 2726400 | 0.0000163587 (0.0000163569 – 0.0000163598) | — |
| Timestamp en lote de 10 | 1000 | 27264000 | 0.0001635866 (0.0001635690 – 0.0001635978) | — |
| Timestamp en lote de 10 | 10000 | 272640000 | 0.0016358664 (0.0016356900 – 0.0016359780) | — |
| Timestamp en lote de 100 | 100 | 2483500 | 0.0000149014 (0.0000149008 – 0.0000149020) | — |
| Timestamp en lote de 100 | 1000 | 24835000 | 0.0001490144 (0.0001490084 – 0.0001490199) | — |
| Timestamp en lote de 100 | 10000 | 248350000 | 0.0014901436 (0.0014900838 – 0.0014901990) | — |

No incluye revocaciones (dependen del porcentaje de certificados revocados) ni autorizar emisores (una vez por entidad).

## Parámetros que hay que actualizar antes de poner precios
Edita `parametros.json` y vuelve a correr `npm run informe`. Faltan: **precioEthUsd, precioGasGwei, l1FeeEthPorByte**, por eso la columna USD está vacía (no se inventan precios).
- `precioEthUsd`: precio actual del ETH en USD (fuente actual, mainnet).
- `precioGasGwei`: precio del gas en la L2 (Base mainnet) en gwei, de una fuente actual. Se multiplica por las unidades de gas medidas.
- `l1FeeEthPorByte`: costo de publicar un byte en la L1, en ETH, de una fuente actual. Se multiplica por los bytes por certificado.

Además conviene repetir la medición en mainnet-fork o con datos reales de producción y revisar si cambian los costos de datos de la L1 (EIP-4844 y posteriores).
