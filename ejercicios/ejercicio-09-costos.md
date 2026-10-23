# Ejercicio 09: medición de costos

**Bloque:** consola | **Dificultad:** media | **Tiempo:** 2 a 3 h | **Depende de:** 02, 06, 07, 08

## Objetivo

Medir cuánto cuesta cada operación y producir una tabla que sirva para fijar precios.

## Qué vas a entender

- En una L2 del stack OP el costo tiene dos partes: la ejecución en la L2 y la publicación de datos en la L1.
- El precio del gas en testnet no representa el de producción. Lo que sí es comparable son las **unidades de gas** y el tamaño de los datos.
- El costo por certificado debe verse como un rango, no como un número único.

## Instrucciones para Claude Code

### Archivos a crear

- `resultados/09-costos/medir.js`
- `resultados/09-costos/resultados.json` (salida)
- `resultados/09-costos/informe.md` (tabla legible)

### Operaciones a medir (20 repeticiones cada una, con promedio, mínimo y máximo)

1. Attestation directa con resolver (la entidad paga su gas).
2. Revocación.
3. Autorizar un emisor (llamada al resolver).
4. Timestamp individual contra lote de 10 y de 100 (modo off-chain).
5. Attestation en lote (función de varias attestations del SDK, verificar el nombre).

### Qué registrar por operación

- Unidades de gas usadas y precio efectivo del gas.
- Costo total en ETH de la transacción. En redes del stack OP el recibo trae además campos de la parte L1 (por ejemplo `l1Fee`); léelos del recibo crudo con una llamada JSON-RPC a `eth_getTransactionReceipt` si el SDK no los expone, y confirma los nombres reales.
- Tamaño de los datos enviados.

### Pasos

1. Ejecutar las mediciones con los wallets de prueba.
2. Calcular costo por certificado en cada modo.
3. Parametrizar el precio del ETH y el del gas en el informe (valores de entrada editables). Para precios de mainnet, el usuario debe consultar una fuente actual; no los inventes.
4. Generar `informe.md` con la tabla y tres escenarios de volumen (por ejemplo, 100, 1.000 y 10.000 certificados al mes).

## Criterio de éxito

- Una tabla con costo por operación y por certificado, con rango.
- El informe declara que los precios de testnet no son representativos y qué parámetros deben actualizarse antes de poner precios.

## Preguntas de comprensión

1. ¿Qué parte del costo depende del tamaño de los datos?
2. ¿Por qué el lote reduce el costo por certificado?
3. ¿Cómo cubrirías en tu precio la variación del gas?

## Qué anotar

Unidades de gas por operación, ahorro del lote, y el supuesto de precio que se usará en el modelo de negocio.
