import { EAS } from "./eas.js";

/** Attestation ya "aplanada": campos con nombre, sin depender del tipo Result de ethers. */
export interface AttestationLeida {
  uid: string;
  schema: string;
  time: bigint;
  expirationTime: bigint;
  revocationTime: bigint;
  attester: string;
  recipient: string;
  data: string;
}

/**
 * Lo único que el verificador necesita de la cadena. Al ser una interfaz, las pruebas
 * le pasan un lector falso y cubren todos los estados sin red ni gas.
 */
export interface LectorAttestation {
  leer(uid: string): Promise<AttestationLeida>;
}

/** Lector real: usa eas.getAttestation(uid). OJO: con un UID inexistente NO lanza, devuelve ceros. */
export function crearLectorEAS(eas: EAS): LectorAttestation {
  return {
    async leer(uid: string): Promise<AttestationLeida> {
      const a = await eas.getAttestation(uid);
      // Copiamos campo a campo: el SDK devuelve un Result de ethers (arreglo con nombres).
      return {
        uid: a.uid,
        schema: a.schema,
        time: a.time,
        expirationTime: a.expirationTime,
        revocationTime: a.revocationTime,
        attester: a.attester,
        recipient: a.recipient,
        data: a.data,
      };
    },
  };
}
