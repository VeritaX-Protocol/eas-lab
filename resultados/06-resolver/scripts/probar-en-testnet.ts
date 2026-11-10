import { Contract } from "ethers";
import { EAS } from "../src/eas.js";
import { conectarCadena, ejecutar, type Cadena } from "../src/cadena.js";
import { leerDatos } from "../src/datos.js";
import { describirError } from "../src/errores.js";
import { emitirCertificadoDeEjemplo } from "../src/emitir.js";

const ABI_RESOLVER = [
  "function autorizar(address emisor, bool estado)",
  "function autorizado(address) view returns (bool)",
];

function easPara(cadena: Cadena, rol: keyof Cadena["signers"]): EAS {
  const eas = new EAS(cadena.config.easAddress);
  eas.connect(cadena.signers[rol]);
  return eas;
}

/** Exige que la emisión FALLE (EAS lo detecta al estimar gas: no se envía ni cuesta). */
async function exigirRechazo(titulo: string, cadena: Cadena, rol: keyof Cadena["signers"], schemaUID: string): Promise<void> {
  try {
    await emitirCertificadoDeEjemplo(easPara(cadena, rol), schemaUID, true);
  } catch (error) {
    console.log(`  OK, rechazado como se esperaba: ${titulo}\n     -> ${describirError(error)}`);
    return;
  }
  throw new Error(`INESPERADO: "${titulo}" fue aceptado`);
}

ejecutar(async () => {
  const cadena = await conectarCadena();
  const { resolver, schemaUID } = leerDatos(cadena.config.chainId);
  if (!resolver || !schemaUID) throw new Error("Faltan resolver o schemaUID: corre npm run registrar");
  const dirA = cadena.signers.emisorA.address;
  const comoAdmin = new Contract(resolver, ABI_RESOLVER, cadena.signers.admin);
  const autorizado = async (): Promise<boolean> => (await comoAdmin.getFunction("autorizado")(dirA)) as boolean;

  console.log("1. admin autoriza a emisorA");
  const tx1 = await comoAdmin.getFunction("autorizar")(dirA, true);
  const r1 = await tx1.wait();
  console.log(`   autorizado=${await autorizado()} (gas de autorizar: ${r1?.gasUsed})`);

  console.log("2. emisorA (autorizado) emite");
  const emision = await emitirCertificadoDeEjemplo(easPara(cadena, "emisorA"), schemaUID, true);
  console.log(`   OK. UID ${emision.uid} (gas ${emision.gas})`);

  console.log("3. emisorB (no autorizado) intenta emitir");
  await exigirRechazo("emisorB sin autorización", cadena, "emisorB", schemaUID);

  console.log("4. admin desautoriza a emisorA");
  await (await comoAdmin.getFunction("autorizar")(dirA, false)).wait();
  console.log(`   autorizado=${await autorizado()}`);

  console.log("5. emisorA (desautorizado) intenta emitir");
  await exigirRechazo("emisorA desautorizado", cadena, "emisorA", schemaUID);

  console.log("6. emisorA (desautorizado) revoca lo que emitió antes");
  const rev = await easPara(cadena, "emisorA").revoke({ schema: schemaUID, data: { uid: emision.uid } });
  await rev.wait();
  const att = await easPara(cadena, "emisorA").getAttestation(emision.uid);
  if (att.revocationTime === 0n) throw new Error("La attestation no quedó revocada");
  console.log(`   OK, revocada (revocationTime ${att.revocationTime}, gas ${rev.receipt?.gasUsed})`);
});
