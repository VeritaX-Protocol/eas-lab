# Nota del ejercicio 08
Fecha: 2026-11-10
Versiones usadas (Node, paquetes, Hardhat): Node 26.13.0; ethers 6.17.0; @ethereum-attestation-service/eas-sdk 2.10.0; dotenv 18.0.9; tsx 4.23.15; typescript 7.0.2; @types/node 26.6.5. Sin Hardhat.
Código o datos copiados de otros ejercicios (y de cuál): del 07: src/config, wallets, eas (ampliado con Offchain), cadena, esquema, errores, tsconfig y `.env.local`. Del 03: src/directorio.ts y directorio.json (solo `emisorA` registrado). Del 02: schema UID en `datos-entrada.json`.
Qué hice: firmar off-chain con emisorA y emisorB, verificar sin cadena (firma + directorio), anclar timestamp individual y por lote, y revocar off-chain.
Qué funcionó: todos los criterios de éxito. Cualquier cambio al contenido se detecta; la fecha anclada y la revocación se leen de vuelta; el archivo de emisorB se rechaza por directorio.
Qué falló o me sorprendió: el archivo firmado NO declara quién firmó; la dirección se recupera de la firma (`verifyTypedData`). Por eso, si alguien cambia datos y UID a la vez, la firma resulta de otra dirección y se rechaza por el directorio, no como FIRMA_INVALIDA. El SDK serializa bigint, y el JSON normal no los admite: se guardan como `{"$bigint": "..."}`. La verificación no necesita red, pero hay que conocer la versión del dominio EIP-712 (viene en el propio archivo) y comprobar dirección de EAS y chainId contra la configuración.
Nombres de funciones del SDK que difirieron del plan: el plan decía "módulo off-chain" sin nombres. Reales: `eas.getOffchain()`, `offchain.signOffchainAttestation(params, signer, {verifyOnchain})`, `offchain.verifyOffchainAttestationSignature(attester, firmada)` (exige el attester: hay que recuperarlo antes), `eas.timestamp`, `eas.multiTimestamp`, `eas.getTimestamp`, `eas.revokeOffchain`, `eas.getRevocationOffchain(user, uid)`. Las opciones de firma exigen `verifyOnchain` explícito.
Decisión para la especificación: lo off-chain solo sirve con un directorio de emisores confiable y versionado que el verificador consulte; sin él, cualquiera "emite". Anclar por lote reduce el gas por certificado casi a la mitad.
Costos o tiempos medidos: archivo firmado 2.439 bytes. Gas: timestamp individual 50.834; lote de 10: 272.639 en total, 27.263 por certificado (54% del individual); revocación off-chain 51.391. Testnet, no representativo.
Preguntas abiertas: ¿dónde se guardan los archivos firmados y quién los respalda? ¿cómo se publica el directorio de entidades de forma verificable?

Preguntas de comprensión:
1. Si se pierde la base de datos y nadie guardó el archivo, el certificado off-chain no se puede recuperar: la cadena solo tiene el UID (y el timestamp), no el contenido, y no se puede reconstruir sin la sal.
2. El resolver garantizaba que solo emisores autorizados pudieran emitir; aquí lo reemplaza la comprobación del directorio en el verificador.
3. Conviene para certificados de bajo riesgo, de gran volumen o sin necesidad de ser públicos, donde el costo por certificado pesa más que la verificación pública sin archivo.
