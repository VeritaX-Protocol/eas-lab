# Ejercicio 08: off-chain firmado, timestamp y revocación

## Qué hace
Ilustra el **modo B**: una attestation firmada que **no se envía a la cadena**. Es un archivo JSON (EIP-712) que no cuesta gas y no es público. Después se ancla su fecha con un timestamp y se revoca, que sí van a la cadena pero solo con el UID (32 bytes), nunca con el contenido.

Idea clave: el **resolver no aplica** a lo off-chain. Cualquiera puede firmar un archivo con el mismo formato, así que el verificador debe comprobar él mismo que el firmante esté en el directorio de entidades. Ese paso reemplaza al resolver.

| Script | Qué hace |
|---|---|
| `scripts/firmar-offchain.ts` | Firma con `emisorA` y con `emisorB` (para la prueba de la debilidad) y guarda `salida/cert-offchain*.json`. No toca la cadena. |
| `scripts/verificar-offchain.ts` | Verifica **sin conectarse a la cadena**: 1) la firma y que el UID corresponda a los datos; 2) que el firmante esté en `src/directorio.json`. Prueba el archivo bueno, uno alterado, uno con la firma cambiada y el de `emisorB`. |
| `scripts/timestamp.ts` | Ancla el UID (individual), ancla 10 UIDs (lote) y compara el gas, y revoca off-chain y lee el estado de vuelta. |
| `src/offchain.ts` | `firmarOffchain`, `verificarOffchain` (estados `VALIDO`, `FIRMA_INVALIDA`, `EMISOR_NO_REGISTRADO`) y la lectura/escritura del JSON con bigint. |

## Requisitos
- Ejercicio 02 hecho: `datos-entrada.json` trae el schema UID. El off-chain no usa el resolver del 06.
- `.env.local` en esta carpeta, copia del del ejercicio 07 (mismas wallets). Nunca se sube al repositorio.
- ETH de Base Sepolia en `emisorA` (anclar y revocar). Firmar y verificar no gastan.
- Node 22.13 o superior.

## Cómo correrlo
Desde `resultados/08-offchain/`, en este orden:

```bash
npm install            # (npm ci)
npm test               # pruebas sin red de firma, alteración y directorio
npm run typecheck      # tsc --noEmit
npm run firmar         # crea salida/cert-offchain.json y cert-offchain-emisorB.json
npm run verificar      # sin cadena
npm run timestamp      # envía 3 transacciones de emisorA (individual, lote, revocación)
```

## Salida esperada
- `verificar`: `VALIDO (Entidad de Prueba A)`; el archivo alterado da `FIRMA_INVALIDA`; el de `emisorB` da `EMISOR_NO_REGISTRADO` (la firma es válida, se rechaza por el directorio). Si se sustituye la firma por otra, el firmante recuperado ya no es `emisorA` y también se rechaza por el directorio.
- `timestamp`: fecha anclada leída de vuelta, tabla de gas individual vs lote de 10, y revocación reflejada al consultarla.

## Estructura
`src/` (`offchain.ts`, `ejemplo.ts` y `datos.ts` son nuevos; el resto es copia del 07 y del directorio del 03) · `scripts/` · `test/offchain.test.ts` · `datos-entrada.json` · `salida/` (archivos generados, no se suben) · `NOTA.md`.
