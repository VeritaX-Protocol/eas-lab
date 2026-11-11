import { writeFileSync } from "node:fs";
import { Contract, formatEther, getBytes, hexlify, randomBytes, type JsonRpcProvider } from "ethers";
import { EAS } from "../src/eas.js";
import { RAIZ } from "../src/config.js";
import { conectarCadena, ejecutar } from "../src/cadena.js";
import { leerDatosEntrada } from "../src/datos.js";
import { certificadoIdDesdeHash, armarSolicitud } from "../src/emision.js";
import type { DatosCertificado } from "../src/esquema.js";
import { aJsonResultados, leerMuestra, type OperacionMedida } from "../src/medicion.js";

const REPS = Number(process.env.REPS ?? 20);
const ABI_RESOLVER = ["function autorizar(address emisor, bool estado)"];
const bytes32 = (): string => hexlify(randomBytes(32));

function certificado(): DatosCertificado {
  const hashDatos = bytes32();
  return { certificadoId: certificadoIdDesdeHash(hashDatos), plantillaArweaveId: "EJEMPLO-NO-ES-UNA-TX-REAL-DE-ARWEAVE", hashPlantilla: bytes32(), hashDatos, codigoCurso: "CURSO-PRUEBA-009", fechaEmision: BigInt(Math.floor(Date.now() / 1000)), vigenciaHasta: 0n };
}

/** Lo que devuelve cada envío: el hash para pedir el recibo y el tamaño de los datos enviados. */
interface Envio { hash: string; bytes: number }

/** Repite `REPS` veces y mide cada transacción. Para si el saldo ya no alcanza (y lo marca como incompleto). */
async function medir(provider: JsonRpcProvider, pagador: string, op: Omit<OperacionMedida, "muestras" | "completo">, enviar: (i: number) => Promise<Envio>): Promise<OperacionMedida> {
  const res: OperacionMedida = { ...op, muestras: [], completo: true };
  for (let i = 0; i < REPS; i++) {
    const ultimo = res.muestras.at(-1)?.totalWei ?? 0n;
    if ((await provider.getBalance(pagador)) < ultimo * 3n) { res.completo = false; console.log(`   saldo bajo: se detiene en ${i} de ${REPS}`); break; }
    const e = await enviar(i);
    res.muestras.push(await leerMuestra(provider, e.hash, e.bytes));
  }
  const m = res.muestras;
  console.log(`${op.nombre}: ${m.length} muestras, gas prom ${m.reduce((a, x) => a + x.gas, 0n) / BigInt(m.length || 1)}`);
  return res;
}

ejecutar(async () => {
  const cadena = await conectarCadena();
  const { resolver, schemaUID } = leerDatosEntrada(cadena.config.chainId);
  const { admin, emisorA } = cadena.signers;
  const provider = cadena.provider;
  const easA = new EAS(cadena.config.easAddress).connect(emisorA);
  const easAdmin = new EAS(cadena.config.easAddress).connect(admin);
  const resolverAdmin = new Contract(resolver, ABI_RESOLVER, admin);
  const ops: OperacionMedida[] = [];
  const bytesDe = (datos: string | undefined): number => getBytes(datos ?? "0x").length;

  const autorizar = async (estado: boolean): Promise<Envio> => {
    const tx = await resolverAdmin.getFunction("autorizar")(emisorA.address, estado);
    await tx.wait();
    return { hash: tx.hash as string, bytes: bytesDe(tx.data as string) };
  };

  // 3. Autorizar (llamada al resolver): se ALTERNA activar/desactivar, porque cada uno cambia el valor guardado
  // (false->true y true->false) y su gas es distinto. Repetir autorizar(true) solo mediría el primero.
  console.log("1. autorizar / desautorizar emisorA (admin paga)");
  await autorizar(false); // punto de partida conocido (sin medir)
  const act: OperacionMedida = { id: "autorizar", nombre: "Autorizar un emisor (activar)", certificadosPorTx: 0, muestras: [], completo: true };
  const des: OperacionMedida = { id: "desautorizar", nombre: "Desautorizar un emisor (desactivar)", certificadosPorTx: 0, muestras: [], completo: true };
  for (let i = 0; i < REPS; i++) {
    const a = await autorizar(true);
    act.muestras.push(await leerMuestra(provider, a.hash, a.bytes));
    const d = await autorizar(false);
    des.muestras.push(await leerMuestra(provider, d.hash, d.bytes));
  }
  console.log(`autorizar: ${act.muestras.length} muestras; desautorizar: ${des.muestras.length} muestras`);
  ops.push(act, des);
  await autorizar(true); // emisorA queda autorizado para las pruebas siguientes (sin medir)

  // 1 y 2. Attestation directa y revocación
  console.log("2. attestation directa con resolver (emisorA paga)");
  const uids: string[] = [];
  ops.push(await medir(provider, emisorA.address, { id: "attest", nombre: "Attestation directa con resolver", certificadosPorTx: 1 }, async () => {
    const tx = await easA.attest(armarSolicitud(schemaUID, certificado()));
    uids.push(await tx.wait());
    return { hash: tx.receipt!.hash, bytes: bytesDe(tx.data.data) };
  }));
  console.log("3. revocación");
  ops.push(await medir(provider, emisorA.address, { id: "revocar", nombre: "Revocación", certificadosPorTx: 1 }, async (i) => {
    const tx = await easA.revoke({ schema: schemaUID, data: { uid: uids[i]! } });
    await tx.wait();
    return { hash: tx.receipt!.hash, bytes: bytesDe(tx.data.data) };
  }));

  // 5. Attestation en lote (multiAttest, 10 por transacción)
  console.log("4. attestation en lote de 10 (emisorA paga)");
  ops.push(await medir(provider, emisorA.address, { id: "multiattest10", nombre: "Attestation en lote de 10", certificadosPorTx: 10 }, async () => {
    const data = Array.from({ length: 10 }, () => armarSolicitud(schemaUID, certificado()).data);
    const tx = await easA.multiAttest([{ schema: schemaUID, data }]);
    await tx.wait();
    return { hash: tx.receipt!.hash, bytes: bytesDe(tx.data.data) };
  }));
  await autorizar(false); // limpieza: emisorA vuelve a quedar desautorizado

  // 4. Timestamp (modo off-chain). Solo guarda el bytes32, así que el gas no depende de qué UID sea; admin paga.
  for (const n of [1, 10, 100]) {
    console.log(`5. timestamp ${n === 1 ? "individual" : `en lote de ${n}`} (admin paga)`);
    ops.push(await medir(provider, admin.address, { id: `timestamp${n}`, nombre: n === 1 ? "Timestamp individual" : `Timestamp en lote de ${n}`, certificadosPorTx: n }, async () => {
      const tx = n === 1 ? await easAdmin.timestamp(bytes32()) : await easAdmin.multiTimestamp(Array.from({ length: n }, bytes32));
      await tx.wait();
      return { hash: tx.receipt!.hash, bytes: bytesDe(tx.data.data) };
    }));
  }

  const salida = { red: "Base Sepolia", chainId: cadena.config.chainId, fecha: new Date().toISOString(), repeticiones: REPS, operaciones: ops };
  writeFileSync(`${RAIZ}resultados.json`, aJsonResultados(salida));
  console.log(`resultados.json guardado. Saldos: emisorA ${formatEther(await provider.getBalance(emisorA.address))} ETH, admin ${formatEther(await provider.getBalance(admin.address))} ETH`);
});
