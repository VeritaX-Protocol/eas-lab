# Ejercicio 08: off-chain firmado, timestamp y revocación

**Bloque:** consola | **Dificultad:** media | **Tiempo:** 3 h | **Depende de:** 02, 03

## Objetivo

Crear una attestation firmada sin enviarla a la cadena, anclar su fecha con un timestamp (individual y por lote) y revocarla, para entender el modo B.

## Qué vas a entender

- Una attestation off-chain es un archivo firmado; no cuesta gas y no es pública.
- El timestamp on-chain prueba que existía en cierta fecha; la revocación off-chain se marca en el contrato.
- El resolver **no aplica** a lo off-chain: cualquiera puede firmar un archivo con el mismo formato.

## Instrucciones para Claude Code

### Archivos a crear

- `ejercicios/08-offchain/firmar-offchain.js`
- `ejercicios/08-offchain/verificar-offchain.js`
- `ejercicios/08-offchain/timestamp.js`
- `ejercicios/08-offchain/offchain.test.js`

### Pasos

1. Con el SDK (módulo off-chain), firmar con `emisorA` una attestation del mismo schema. Guardar el resultado como JSON (`salida/cert-offchain.json`).
2. `verificar-offchain.js`: comprobar la firma del archivo y **luego** comprobar que la llave firmante está en `shared/directorio.json`. Este segundo paso es el que reemplaza al resolver.
3. Anclar la fecha: llamar a la función de timestamp de EAS con el UID (individual). Leer de vuelta la fecha anclada.
4. Anclar un lote de 10 UIDs con la función de timestamp múltiple y comparar el gas por certificado contra el individual.
5. Revocación off-chain: marcar el UID como revocado y verificar que el estado se refleja al consultarlo.
6. Prueba de la debilidad: firmar el mismo formato con `emisorB`. La firma es válida criptográficamente, pero el verificador debe responder `EMISOR_NO_REGISTRADO`.

Verifica en el SDK los nombres actuales de las funciones off-chain, de timestamp y de revocación.

## Criterio de éxito

- El archivo firmado verifica correctamente y se detecta cualquier modificación.
- Se obtiene la fecha anclada y la revocación off-chain se refleja.
- Se muestra la tabla de gas: individual contra lote de 10.
- El caso `emisorB` se rechaza por directorio, no por firma.

## Preguntas de comprensión

1. ¿Qué pasa con un certificado off-chain si perdemos la base de datos y nadie guardó el archivo?
2. ¿Qué cosa garantizaba el resolver que aquí tenemos que reemplazar?
3. ¿Para qué tipos de certificado convendría este modo?

## Qué anotar

Gas individual y por lote, tamaño del archivo firmado, nombres reales de funciones, y cualquier limitación encontrada al verificar sin la cadena.
