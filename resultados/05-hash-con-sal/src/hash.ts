import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex, randomBytes, utf8ToBytes } from "@noble/hashes/utils.js";

// Prefijo de versión del formato canónico. Si el formato cambia, se cambia el
// prefijo (cert-v2) para no romper la verificación de los certificados viejos.
export const VERSION_FORMATO = "cert-v1";

export interface DatosCertificado {
  nombre: string;
  tipoDoc: string;
  numeroDoc: string;
  codigoCurso: string;
  fechaEmision: string;
  certificadoId: string;
  hashPlantilla: string;
  sal: string;
}

// Campos en el orden fijo en que entran al hash. No reordenar.
const CAMPOS: ReadonlyArray<keyof DatosCertificado> = [
  "nombre", "tipoDoc", "numeroDoc", "codigoCurso",
  "fechaEmision", "certificadoId", "hashPlantilla", "sal",
];

// Campos de texto libre que se normalizan; el resto se usa tal cual.
const NORMALIZADOS: ReadonlySet<keyof DatosCertificado> =
  new Set(["nombre", "tipoDoc", "numeroDoc", "codigoCurso"]);

// NFC + trim + espacios colapsados + mayúsculas en español.
// NO se quitan las tildes: "JOSÉ" y "JOSE" son nombres distintos.
export function normalizar(texto: string): string {
  return texto.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleUpperCase("es");
}

// 32 bytes aleatorios criptográficos, en hexadecimal (64 caracteres, sin 0x).
export function generarSal(): string {
  return bytesToHex(randomBytes(32));
}

// Valida que el campo exista, sea texto y no esté vacío; devuelve el valor.
function exigir(datos: Partial<Record<keyof DatosCertificado, unknown>>, campo: keyof DatosCertificado): string {
  const valor = datos[campo];
  if (typeof valor !== "string" || valor.trim() === "") {
    throw new Error(`Campo obligatorio ausente o vacío: ${campo}`);
  }
  return valor;
}

// Representación canónica: arreglo JSON [versión, ...campos en orden fijo].
// Al ir cada campo como elemento aparte, "AB"+"C" ya no se confunde con "A"+"BC".
export function representacionCanonica(datos: DatosCertificado): string {
  const valores = CAMPOS.map((c) => {
    const v = exigir(datos, c);
    return NORMALIZADOS.has(c) ? normalizar(v) : v;
  });
  return JSON.stringify([VERSION_FORMATO, ...valores]);
}

// keccak-256 de la representación canónica en UTF-8, como bytes32 (0x + 64 hex).
export function calcularHashDatos(datos: DatosCertificado): string {
  return "0x" + bytesToHex(keccak_256(utf8ToBytes(representacionCanonica(datos))));
}

// keccak-256 de un texto cualquiera (lo usa la demo del ataque sin sal).
export function keccakTexto(texto: string): string {
  return "0x" + bytesToHex(keccak_256(utf8ToBytes(texto)));
}
