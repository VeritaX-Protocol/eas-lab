import { readFileSync } from "node:fs";
import { formatEther } from "ethers";
import { EAS } from "../src/eas.js";
import { RAIZ } from "../src/config.js";
import { conectarCadena, ejecutar } from "../src/cadena.js";
import { leerDatosEntrada } from "../src/datos.js";
import { certificadoNuevo } from "../src/ejemplo.js";
import { deJson, firmarOffchain } from "../src/offchain.js";

const fecha = (t: bigint): string => `${t} (${new Date(Number(t) * 1000).toISOString()})`;

// Ancla fechas y revoca en la cadena. Solo se envía el UID (32 bytes); el contenido del certificado nunca sale del archivo.
ejecutar(async () => {
  const cadena = await conectarCadena();
  const { schemaUID } = leerDatosEntrada(cadena.config.chainId);
  const emisorA = cadena.signers.emisorA;
  const eas = new EAS(cadena.config.easAddress).connect(emisorA);
  const { uid } = deJson(readFileSync(`${RAIZ}salida/cert-offchain.json`, "utf8"));

  console.log("1. timestamp individual");
  const antes = await eas.getTimestamp(uid);
  console.log(`   antes de anclar: ${antes}  (0 = sin anclar)`);
  const tx1 = await eas.timestamp(uid);
  const anclada = await tx1.wait();
  const gas1 = tx1.receipt?.gasUsed ?? 0n;
  console.log(`   anclada: ${fecha(anclada)}  | leída de vuelta: ${fecha(await eas.getTimestamp(uid))}  | gas ${gas1}`);

  console.log("2. timestamp por lote de 10 UIDs (10 certificados firmados off-chain)");
  const offchain = await eas.getOffchain();
  const uids: string[] = [];
  for (let i = 0; i < 10; i++) uids.push((await firmarOffchain(offchain, emisorA, schemaUID, certificadoNuevo())).uid);
  const tx10 = await eas.multiTimestamp(uids);
  await tx10.wait();
  const gas10 = tx10.receipt?.gasUsed ?? 0n;
  console.log(`   | modo         | gas total | gas por certificado |`);
  console.log(`   | individual   | ${gas1} | ${gas1} |`);
  console.log(`   | lote de 10   | ${gas10} | ${gas10 / 10n} |`);
  console.log(`   el lote cuesta ${(Number(gas10 / 10n) / Number(gas1) * 100).toFixed(0)}% por certificado frente al individual`);

  console.log("3. revocación off-chain");
  console.log(`   antes: ${await eas.getRevocationOffchain(emisorA.address, uid)}  (0 = no revocado)`);
  const rev = await eas.revokeOffchain(uid);
  const t = await rev.wait();
  const leida = await eas.getRevocationOffchain(emisorA.address, uid);
  if (leida === 0n) throw new Error("La revocación no se reflejó");
  console.log(`   revocado el ${fecha(t)}  | leído de vuelta: ${fecha(leida)}  | gas ${rev.receipt?.gasUsed}`);
  const deOtro = await eas.getRevocationOffchain(cadena.signers.emisorB.address, uid);
  console.log(`   consultado como si lo hubiera revocado emisorB: ${deOtro}  (la revocación queda ligada a quien la hizo)`);
  console.log(`   saldo de emisorA: ${formatEther(await cadena.provider.getBalance(emisorA.address))} ETH`);
});
