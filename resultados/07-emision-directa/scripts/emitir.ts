import { Contract, HDNodeWallet, Wallet, formatEther, keccak256, randomBytes, toUtf8Bytes } from "ethers";
import { EAS } from "../src/eas.js";
import { conectarCadena, ejecutar, type Cadena } from "../src/cadena.js";
import { leerDatosEntrada } from "../src/datos.js";
import { describirError } from "../src/errores.js";
import type { DatosCertificado } from "../src/esquema.js";
import { decodificarDatos } from "../src/esquema.js";
import { armarSolicitud, certificadoIdDesdeHash, emitirAttestation, estimarCosto, revocarAttestation } from "../src/emision.js";

const ABI_RESOLVER = ["function autorizar(address emisor, bool estado)", "function autorizado(address) view returns (bool)"];

/** Certificado de ejemplo (datos falsos). Su id sale del hash con sal, así un reintento lo reconoce. */
function certificadoNuevo(): DatosCertificado {
  const hashDatos = keccak256(randomBytes(32)); // hace de "hash con sal" del ejercicio 05
  return {
    certificadoId: certificadoIdDesdeHash(hashDatos),
    plantillaArweaveId: "EJEMPLO-NO-ES-UNA-TX-REAL-DE-ARWEAVE",
    hashPlantilla: keccak256(toUtf8Bytes("plantilla-de-ejemplo")),
    hashDatos,
    codigoCurso: "CURSO-PRUEBA-007",
    fechaEmision: BigInt(Math.floor(Date.now() / 1000)),
    vigenciaHasta: 0n,
  };
}

const easDe = (cadena: Cadena, signer: Wallet | HDNodeWallet): EAS => new EAS(cadena.config.easAddress).connect(signer);

/** Exige que la operación FALLE y muestra el motivo; si se acepta, es un error del ejercicio. */
async function exigirFallo(titulo: string, operacion: () => Promise<unknown>): Promise<void> {
  try {
    await operacion();
  } catch (error) {
    console.log(`  OK, falló como se esperaba: ${titulo}\n     -> ${describirError(error)}`);
    return;
  }
  throw new Error(`INESPERADO: "${titulo}" fue aceptado`);
}

ejecutar(async () => {
  const cadena = await conectarCadena();
  const { resolver, schemaUID } = leerDatosEntrada(cadena.config.chainId);
  const { admin, emisorA, emisorB } = cadena.signers;
  const provider = cadena.provider;
  const comoAdmin = new Contract(resolver, ABI_RESOLVER, admin);
  const emitidasPorA = easDe(cadena, emisorA);
  const autorizar = async (direccion: string, estado: boolean): Promise<void> => {
    await (await comoAdmin.getFunction("autorizar")(direccion, estado)).wait();
  };

  console.log("0. admin autoriza a emisorA (el 06 lo dejó desautorizado)");
  await autorizar(emisorA.address, true);

  console.log("1. emisorA emite directo y paga su propio gas");
  const cert = certificadoNuevo();
  const saldoAntes = await provider.getBalance(emisorA.address);
  const desde = await provider.getBlockNumber();
  const emision = await emitirAttestation(emitidasPorA, provider, emisorA.address, schemaUID, cert, desde);
  const att = await emitidasPorA.getAttestation(emision.uid);
  const pagado = saldoAntes - (await provider.getBalance(emisorA.address));
  if (att.attester !== emisorA.address) throw new Error(`attester inesperado: ${att.attester}`);
  console.log(`   UID ${emision.uid}\n   attester = emisorA ✔  | gas salió de su saldo: ${formatEther(pagado)} ETH (incluye la tarifa L1 de datos)`);

  console.log("2. estimarCosto antes de enviar (otro certificado, no se envía)");
  const costo = await estimarCosto(emitidasPorA, provider, emisorA.address, schemaUID, certificadoNuevo());
  console.log(`   gas estimado ${costo.gas}, costo máximo ${formatEther(costo.wei)} ETH`);

  console.log("3. idempotencia: se pierde la respuesta del RPC y se reintenta");
  const cert2 = certificadoNuevo();
  const desde2 = await provider.getBlockNumber();
  await (await emitidasPorA.attest(armarSolicitud(schemaUID, cert2))).wait(); // se confirma, pero "la respuesta se pierde"
  console.log("   (envío confirmado; el script descarta el UID, como si el RPC no hubiera respondido)");
  const reintento = await emitirAttestation(emitidasPorA, provider, emisorA.address, schemaUID, cert2, desde2);
  if (!reintento.yaExistia) throw new Error("El reintento creó un duplicado");
  console.log(`   OK, el reintento detectó la attestation existente (${reintento.uid}) y no envió nada`);

  console.log("4. pruebas negativas");
  await exigirFallo("emisorB (no autorizado) intenta emitir", () =>
    emitirAttestation(easDe(cadena, emisorB), provider, emisorB.address, schemaUID, certificadoNuevo(), desde));

  const sinSaldo = Wallet.createRandom(provider); // wallet nueva: 0 ETH
  await autorizar(sinSaldo.address, true); // la autorizamos para que el único motivo de fallo sea el saldo
  await exigirFallo("emisor autorizado pero sin saldo", () =>
    emitirAttestation(easDe(cadena, sinSaldo), provider, sinSaldo.address, schemaUID, certificadoNuevo(), desde));
  await autorizar(sinSaldo.address, false);

  await exigirFallo("emisorB intenta revocar lo que emitió emisorA", () => revocarAttestation(easDe(cadena, emisorB), schemaUID, emision.uid));

  console.log("   reintentar un envío ya confirmado no duplica:");
  const otra = await emitirAttestation(emitidasPorA, provider, emisorA.address, schemaUID, cert, desde);
  const filtro = emitidasPorA.contract.filters.Attested(undefined, emisorA.address, undefined, schemaUID);
  let copias = 0;
  for (const e of await emitidasPorA.contract.queryFilter(filtro, desde)) {
    if (decodificarDatos((await emitidasPorA.getAttestation(e.args.uid)).data).certificadoId === cert.certificadoId) copias++;
  }
  if (!otra.yaExistia || copias !== 1) throw new Error(`Se esperaba 1 attestation y hay ${copias}`);
  console.log(`   OK, sigue habiendo 1 attestation con ese certificadoId`);

  console.log("5. limpieza: admin desautoriza a emisorA");
  await autorizar(emisorA.address, false);
  console.log(`   emisorA autorizado=${await comoAdmin.getFunction("autorizado")(emisorA.address)}`);
});
