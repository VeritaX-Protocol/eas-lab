import { isHexString } from "ethers";
import { buscarEntidad, type Directorio } from "./directorio.js";
import { ZERO_BYTES32 } from "./eas.js";
import { decodificarDatos, type DatosCertificado } from "./esquema.js";
import type { LectorAttestation } from "./lector.js";

export type Estado =
  | "NO_ENCONTRADO"
  | "SCHEMA_INCORRECTO"
  | "REVOCADO"
  | "EXPIRADO"
  | "EMISOR_NO_REGISTRADO"
  | "VALIDO_PENDIENTE_HASH";

export interface Emisor {
  direccion: string;
  nombre: string | null; // null si no está en el directorio
  nit: string | null;
}

export interface ResultadoVerificacion {
  estado: Estado;
  detalle: string;
  /** Aviso para mostrar al usuario junto al estado (principio 6: estados + disclaimers). */
  aviso: string;
  emisor: Emisor | null;
  fechaEmision: bigint | null; // segundos Unix
  camposDecodificados: DatosCertificado | null;
}

export interface OpcionesVerificacion {
  lector: LectorAttestation;
  schemaUID: string; // el UID de NUESTRO schema en esta cadena
  directorio: Directorio;
  ahora?: bigint; // segundos Unix; se puede fijar en pruebas
}

/** Entrada mal formada: se distingue de "no encontrado" porque ni siquiera se consultó la cadena. */
export class UidInvalidoError extends Error {}

const AVISOS: Record<Estado, string> = {
  NO_ENCONTRADO:
    "No se encontró en esta cadena. Eso NO significa que el certificado sea falso: el código puede estar mal copiado o haberse emitido en otra red.",
  SCHEMA_INCORRECTO: "La attestation existe pero no es un certificado de este sistema.",
  REVOCADO: "El emisor revocó este certificado; ya no tiene validez.",
  EXPIRADO: "El certificado venció.",
  EMISOR_NO_REGISTRADO: "El certificado fue firmado por una entidad que no está registrada en el directorio.",
  VALIDO_PENDIENTE_HASH:
    "Registro válido en la cadena. Falta comparar los datos del titular contra el hash (ejercicio 05): aún no prueba que el documento presentado corresponda.",
};

function resultado(
  estado: Estado,
  detalle: string,
  parcial: Partial<Pick<ResultadoVerificacion, "emisor" | "fechaEmision" | "camposDecodificados">> = {},
): ResultadoVerificacion {
  return { estado, detalle, aviso: AVISOS[estado], emisor: null, fechaEmision: null, camposDecodificados: null, ...parcial };
}

/** Un UID válido son 32 bytes en hex. Se rechaza ANTES de consultar la cadena. */
export function validarUid(uid: string): void {
  if (!isHexString(uid, 32)) {
    throw new UidInvalidoError(`UID mal formado: se esperan 32 bytes en hex (0x + 64 caracteres), recibí "${uid}"`);
  }
}

/**
 * Lee la attestation y devuelve un estado. EL ORDEN IMPORTA: se evalúa de lo más
 * fundamental a lo más fino, y el primer fallo manda. Así un certificado revocado nunca
 * puede aparecer como válido, y no se decodifican datos de un schema ajeno.
 */
export async function verificarAttestation(
  uid: string,
  opciones: OpcionesVerificacion,
): Promise<ResultadoVerificacion> {
  validarUid(uid);
  const ahora = opciones.ahora ?? BigInt(Math.floor(Date.now() / 1000));
  const a = await opciones.lector.leer(uid);

  // 1. ¿Existe? Un UID inexistente devuelve una estructura vacía (uid en ceros), no un error.
  if (a.uid === ZERO_BYTES32) {
    return resultado("NO_ENCONTRADO", "Ninguna attestation tiene ese UID en esta cadena.");
  }

  // 2. ¿Es de nuestro schema? Si no, ni intentamos interpretar sus datos.
  if (a.schema.toLowerCase() !== opciones.schemaUID.toLowerCase()) {
    return resultado("SCHEMA_INCORRECTO", `Pertenece al schema ${a.schema}, no al del certificado.`);
  }

  const entidad = buscarEntidad(opciones.directorio, a.attester);
  const emisor: Emisor = { direccion: a.attester, nombre: entidad?.nombre ?? null, nit: entidad?.nit ?? null };

  let datos: DatosCertificado;
  try {
    datos = decodificarDatos(a.data);
  } catch {
    return resultado("SCHEMA_INCORRECTO", "El schema coincide pero los datos no se pueden decodificar.", { emisor });
  }
  const base = { emisor, fechaEmision: datos.fechaEmision, camposDecodificados: datos };

  // 3. ¿Fue revocado? (revocationTime distinto de 0)
  if (a.revocationTime !== 0n) {
    return resultado("REVOCADO", `Revocado en el timestamp ${a.revocationTime}.`, base);
  }

  // 4. ¿Expiró? Son DOS relojes distintos:
  //    - expirationTime: lo aplica el protocolo EAS (0 = nunca).
  //    - vigenciaHasta: campo propio del certificado, dentro de los datos (0 = sin vencimiento).
  if (a.expirationTime !== 0n && a.expirationTime <= ahora) {
    return resultado("EXPIRADO", `Expiró según EAS (expirationTime ${a.expirationTime}).`, base);
  }
  if (datos.vigenciaHasta !== 0n && datos.vigenciaHasta <= ahora) {
    return resultado("EXPIRADO", `Venció la vigencia del certificado (vigenciaHasta ${datos.vigenciaHasta}).`, base);
  }

  // 5. ¿El emisor está en el directorio?
  if (!entidad) {
    return resultado("EMISOR_NO_REGISTRADO", `El attester ${a.attester} no está en el directorio.`, base);
  }

  return resultado("VALIDO_PENDIENTE_HASH", `Emitido por ${entidad.nombre}; falta comparar el hash de datos.`, base);
}
