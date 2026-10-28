import { hexlify, isHexString, randomBytes } from "ethers";
import { SchemaEncoder } from "./eas.js";

/**
 * Schema del certificado, versión 1.
 * OJO: un schema es INMUTABLE. Cambiar una sola letra de este texto produce otro UID
 * (el UID es el hash de texto + resolver + revocable). Si te equivocas de campo, se
 * registra una versión 2 nueva; la v1 queda en la cadena para siempre.
 */
export const VERSION_ESQUEMA = 1;
export const ESQUEMA_CERTIFICADO =
  "bytes32 certificadoId, string plantillaArweaveId, bytes32 hashPlantilla, bytes32 hashDatos, string codigoCurso, uint64 fechaEmision, uint64 vigenciaHasta";

/** Datos del certificado tal como los usa el resto del código (tipados, sin `any`). */
export interface DatosCertificado {
  certificadoId: string; // 32 bytes aleatorios en hex (0x + 64 caracteres)
  plantillaArweaveId: string;
  hashPlantilla: string; // 32 bytes en hex
  hashDatos: string; // 32 bytes en hex (hash con sal; ejercicio 05)
  codigoCurso: string;
  fechaEmision: bigint; // Unix, segundos
  vigenciaHasta: bigint; // Unix, segundos; 0n = sin vencimiento
}

const MAX_UINT64 = (1n << 64n) - 1n;

/** Identificador interno aleatorio: no contiene ni deriva de ningún dato de la persona. */
export function nuevoCertificadoId(): string {
  return hexlify(randomBytes(32));
}

function exigirBytes32(nombre: string, valor: string): void {
  if (!isHexString(valor, 32)) {
    throw new Error(`${nombre} debe ser bytes32 (0x + 64 hex); recibí "${valor}"`);
  }
}

function exigirUint64(nombre: string, valor: bigint): void {
  if (valor < 0n || valor > MAX_UINT64) {
    throw new Error(`${nombre} debe estar entre 0 y 2^64-1; recibí ${valor}`);
  }
}

/**
 * Valida ANTES de codificar. Los errores salen aquí, con un mensaje claro y sin gastar
 * gas, en lugar de fallar dentro del codificador o, peor, en la cadena.
 */
export function validarDatos(d: DatosCertificado): void {
  exigirBytes32("certificadoId", d.certificadoId);
  exigirBytes32("hashPlantilla", d.hashPlantilla);
  exigirBytes32("hashDatos", d.hashDatos);
  exigirUint64("fechaEmision", d.fechaEmision);
  exigirUint64("vigenciaHasta", d.vigenciaHasta);
  if (d.codigoCurso.length === 0) throw new Error("codigoCurso no puede estar vacío");
}

/** Convierte los datos en el `bytes` que va dentro de la attestation. */
export function codificarDatos(d: DatosCertificado): string {
  validarDatos(d);
  const encoder = new SchemaEncoder(ESQUEMA_CERTIFICADO);
  // El orden y los tipos deben coincidir EXACTAMENTE con el texto del schema.
  return encoder.encodeData([
    { name: "certificadoId", value: d.certificadoId, type: "bytes32" },
    { name: "plantillaArweaveId", value: d.plantillaArweaveId, type: "string" },
    { name: "hashPlantilla", value: d.hashPlantilla, type: "bytes32" },
    { name: "hashDatos", value: d.hashDatos, type: "bytes32" },
    { name: "codigoCurso", value: d.codigoCurso, type: "string" },
    { name: "fechaEmision", value: d.fechaEmision, type: "uint64" },
    { name: "vigenciaHasta", value: d.vigenciaHasta, type: "uint64" },
  ]);
}

/** Operación inversa: lee los bytes de una attestation y devuelve los datos tipados. */
export function decodificarDatos(data: string): DatosCertificado {
  const encoder = new SchemaEncoder(ESQUEMA_CERTIFICADO);
  const mapa = new Map<string, unknown>();
  for (const item of encoder.decodeData(data)) mapa.set(item.name, item.value.value);
  const texto = (n: string): string => String(mapa.get(n));
  const entero = (n: string): bigint => BigInt(String(mapa.get(n)));
  return {
    certificadoId: texto("certificadoId"),
    plantillaArweaveId: texto("plantillaArweaveId"),
    hashPlantilla: texto("hashPlantilla"),
    hashDatos: texto("hashDatos"),
    codigoCurso: texto("codigoCurso"),
    fechaEmision: entero("fechaEmision"),
    vigenciaHasta: entero("vigenciaHasta"),
  };
}
