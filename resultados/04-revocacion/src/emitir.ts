import { keccak256, toUtf8Bytes } from "ethers";
import { NO_EXPIRATION, ZERO_ADDRESS, type EAS } from "./eas.js";
import { codificarDatos, nuevoCertificadoId } from "./esquema.js";

export interface Emision {
  uid: string;
  gas: bigint;
}

/**
 * Emite una attestation de ejemplo con el signer al que esté conectado `eas`.
 * Copiado y adaptado de crear-attestation.ts del ejercicio 02. Datos claramente falsos.
 * `revocable` debe coincidir con el schema: en un schema no revocable, EAS rechaza
 * (Irrevocable) una attestation marcada como revocable.
 */
export async function emitirCertificadoDeEjemplo(eas: EAS, schemaUID: string, revocable: boolean): Promise<Emision> {
  const data = codificarDatos({
    certificadoId: nuevoCertificadoId(),
    plantillaArweaveId: "EJEMPLO-NO-ES-UNA-TX-REAL-DE-ARWEAVE",
    hashPlantilla: keccak256(toUtf8Bytes("plantilla-de-ejemplo")),
    hashDatos: keccak256(toUtf8Bytes("datos-de-ejemplo-NO-REALES")),
    codigoCurso: "CURSO-PRUEBA-004",
    fechaEmision: BigInt(Math.floor(Date.now() / 1000)),
    vigenciaHasta: 0n,
  });
  const tx = await eas.attest({
    schema: schemaUID,
    data: { recipient: ZERO_ADDRESS, expirationTime: NO_EXPIRATION, revocable, data },
  });
  const uid = await tx.wait();
  return { uid, gas: tx.receipt?.gasUsed ?? 0n };
}
