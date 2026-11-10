import { keccak256, randomBytes, toUtf8Bytes } from "ethers";
import type { DatosCertificado } from "./esquema.js";

/** Certificado de ejemplo (datos falsos); cada llamada genera uno distinto. */
export function certificadoNuevo(): DatosCertificado {
  return {
    certificadoId: keccak256(randomBytes(32)),
    plantillaArweaveId: "EJEMPLO-NO-ES-UNA-TX-REAL-DE-ARWEAVE",
    hashPlantilla: keccak256(toUtf8Bytes("plantilla-de-ejemplo")),
    hashDatos: keccak256(randomBytes(32)), // hace de "hash con sal" del ejercicio 05
    codigoCurso: "CURSO-PRUEBA-008",
    fechaEmision: BigInt(Math.floor(Date.now() / 1000)),
    vigenciaHasta: 0n,
  };
}
