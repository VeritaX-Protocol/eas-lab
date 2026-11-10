import { verifyTypedData, ZeroAddress, ZeroHash, type HDNodeWallet, type Wallet } from "ethers";
import { type Offchain, type SignedOffchainAttestation } from "./eas.js";
import { buscarEntidad, type Directorio } from "./directorio.js";
import { codificarDatos, type DatosCertificado } from "./esquema.js";

export type EstadoOffchain = "VALIDO" | "FIRMA_INVALIDA" | "EMISOR_NO_REGISTRADO";

export interface Verificacion {
  estado: EstadoOffchain;
  /** Dirección que firmó, recuperada de la firma (el archivo NO la declara). */
  firmante?: string;
  entidad?: string;
}

/** Firma sin enviar nada a la cadena. No cuesta gas y el resultado es solo un archivo. */
export async function firmarOffchain(offchain: Offchain, signer: Wallet | HDNodeWallet, schemaUID: string, datos: DatosCertificado): Promise<SignedOffchainAttestation> {
  return offchain.signOffchainAttestation(
    {
      schema: schemaUID,
      recipient: ZeroAddress,
      time: BigInt(Math.floor(Date.now() / 1000)),
      expirationTime: 0n,
      revocable: true,
      refUID: ZeroHash,
      data: codificarDatos(datos),
    },
    signer,
    { verifyOnchain: false }, // off-chain: nada se consulta ni se envía a la cadena
  );
}

/** JSON con bigint (el JSON normal no los soporta): se guardan como {"$bigint": "123"}. */
export function aJson(firmada: SignedOffchainAttestation): string {
  return JSON.stringify(firmada, (_k, v: unknown) => (typeof v === "bigint" ? { $bigint: v.toString() } : v), 2);
}

export function deJson(texto: string): SignedOffchainAttestation {
  return JSON.parse(texto, (_k, v: unknown) => {
    const marca = v as { $bigint?: string } | null;
    return marca && typeof marca === "object" && typeof marca.$bigint === "string" ? BigInt(marca.$bigint) : v;
  }) as SignedOffchainAttestation;
}

/**
 * Verifica en dos pasos:
 *  1. la firma: recupera quién firmó y comprueba que el UID corresponde a los datos
 *     (cualquier cambio en el contenido rompe uno de los dos);
 *  2. que ese firmante esté en el directorio. Este paso reemplaza al resolver, que NO aplica a lo off-chain.
 * Una firma válida de una llave desconocida da EMISOR_NO_REGISTRADO, no VALIDO.
 */
export function verificarOffchain(offchain: Offchain, firmada: SignedOffchainAttestation, directorio: Directorio): Verificacion {
  let firmante: string;
  try {
    const { signature, domain, types, message } = firmada;
    firmante = verifyTypedData(domain, types, message, signature); // quién firmó este contenido
    if (!offchain.verifyOffchainAttestationSignature(firmante, firmada)) return { estado: "FIRMA_INVALIDA" };
  } catch {
    return { estado: "FIRMA_INVALIDA" };
  }
  const entidad = buscarEntidad(directorio, firmante);
  if (!entidad) return { estado: "EMISOR_NO_REGISTRADO", firmante };
  return { estado: "VALIDO", firmante, entidad: entidad.nombre };
}
