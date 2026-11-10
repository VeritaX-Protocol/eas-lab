import { formatEther, id, type Provider } from "ethers";
import { NO_EXPIRATION, ZERO_ADDRESS, type EAS } from "./eas.js";
import { codificarDatos, decodificarDatos, type DatosCertificado } from "./esquema.js";

/** Cualquier cosa que sepa decir cuánto ETH tiene una dirección (un Provider real o un doble de prueba). */
export type ConSaldo = Pick<Provider, "getBalance" | "getFeeData">;

export interface Costo {
  gas: bigint;
  /** Gas estimado × precio máximo por unidad: lo peor que puede cobrar la red. */
  wei: bigint;
}

export interface ResultadoEmision {
  uid: string;
  /** true si la attestation ya existía y NO se envió nada (idempotencia). */
  yaExistia: boolean;
}

/** Id determinista del certificado: se deriva del hash con sal (ejercicio 05), nunca de datos personales. */
export function certificadoIdDesdeHash(hashDatos: string): string {
  return id(`veritax-certificado-v1:${hashDatos}`);
}

/** Arma la solicitud de EAS con el `revocable` del schema (el del 06 es revocable). */
export function armarSolicitud(schemaUID: string, datos: DatosCertificado) {
  return {
    schema: schemaUID,
    data: { recipient: ZERO_ADDRESS, expirationTime: NO_EXPIRATION, revocable: true, data: codificarDatos(datos) },
  };
}

/**
 * Estima el gas SIN enviar y comprueba que `direccion` tiene saldo. Si el resolver rechaza la
 * emisión, la estimación revierte aquí; si no alcanza el saldo, lanza un error claro. En ambos
 * casos no se envía nada.
 */
export async function estimarCosto(eas: EAS, provider: ConSaldo, direccion: string, schemaUID: string, datos: DatosCertificado): Promise<Costo> {
  const tx = await eas.attest(armarSolicitud(schemaUID, datos));
  const gas = await tx.estimateGas();
  const fee = await provider.getFeeData();
  const wei = gas * (fee.maxFeePerGas ?? fee.gasPrice ?? 0n);
  const saldo = await provider.getBalance(direccion);
  if (saldo < wei) {
    throw new Error(`Saldo insuficiente en ${direccion}: tiene ${formatEther(saldo)} ETH y la emisión puede costar ${formatEther(wei)} ETH. No se envió nada.`);
  }
  return { gas, wei };
}

/**
 * Busca una attestation de este emisor y schema con el mismo certificadoId, mirando los eventos
 * `Attested` desde `desdeBloque`. EAS no indexa por datos, por eso se guarda el bloque en el que
 * se empezó el intento y se revisa desde ahí.
 */
export async function buscarExistente(eas: EAS, attester: string, schemaUID: string, certificadoId: string, desdeBloque: number): Promise<string | undefined> {
  const filtro = eas.contract.filters.Attested(undefined, attester, undefined, schemaUID);
  for (const evento of await eas.contract.queryFilter(filtro, desdeBloque)) {
    const att = await eas.getAttestation(evento.args.uid);
    if (decodificarDatos(att.data).certificadoId === certificadoId) return evento.args.uid;
  }
  return undefined;
}

/**
 * Emite desde la wallet a la que esté conectado `eas` (el attester paga su gas).
 * Es idempotente: si el certificado ya está en la cadena desde `desdeBloque`, devuelve su UID
 * sin enviar otra transacción. Pasa el MISMO `desdeBloque` en cada reintento.
 */
export async function emitirAttestation(eas: EAS, provider: ConSaldo, attester: string, schemaUID: string, datos: DatosCertificado, desdeBloque: number): Promise<ResultadoEmision> {
  const previo = await buscarExistente(eas, attester, schemaUID, datos.certificadoId, desdeBloque);
  if (previo) return { uid: previo, yaExistia: true };
  await estimarCosto(eas, provider, attester, schemaUID, datos); // falla antes de enviar si no hay saldo o el resolver rechaza
  const uid = await (await eas.attest(armarSolicitud(schemaUID, datos))).wait();
  return { uid, yaExistia: false };
}

/** Revoca. EAS solo lo permite a quien emitió (si no: AccessDenied al estimar el gas). */
export async function revocarAttestation(eas: EAS, schemaUID: string, uid: string): Promise<bigint> {
  const tx = await eas.revoke({ schema: schemaUID, data: { uid } });
  await tx.wait();
  return tx.receipt?.gasUsed ?? 0n;
}
