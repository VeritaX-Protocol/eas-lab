import { ESQUEMA_CERTIFICADO } from "../src/esquema.js";
import { EAS, SchemaRegistry, ZERO_ADDRESS } from "../src/eas.js";
import { conectarCadena, ejecutar, type Cadena } from "../src/cadena.js";
import { cargarDirectorio } from "../src/directorio.js";
import { emitirCertificadoDeEjemplo } from "../src/emitir.js";
import { datosDeEntrada } from "../src/entrada.js";
import { describirError } from "../src/errores.js";
import { crearLectorEAS } from "../src/lector.js";
import { verificarAttestation, type ResultadoVerificacion } from "../src/verificador.js";

/** Un EAS conectado al signer que se indique (el que firma es el que paga y el que figura como attester/revoker). */
function easPara(cadena: Cadena, rol: keyof Cadena["signers"]): EAS {
  const eas = new EAS(cadena.config.easAddress);
  eas.connect(cadena.signers[rol]);
  return eas;
}

function verificar(cadena: Cadena, schemaUID: string, uid: string): Promise<ResultadoVerificacion> {
  return verificarAttestation(uid, {
    lector: crearLectorEAS(easPara(cadena, "emisorA")),
    schemaUID,
    directorio: cargarDirectorio(),
  });
}

/** Registra (idempotente) el schema IDÉNTICO pero con revocable=false. Solo para la prueba negativa 3. */
async function registrarSchemaNoRevocable(cadena: Cadena): Promise<string> {
  const registro = new SchemaRegistry(cadena.config.schemaRegistryAddress);
  registro.connect(cadena.signers.admin);
  const uid = SchemaRegistry.getSchemaUID(ESQUEMA_CERTIFICADO, ZERO_ADDRESS, false);
  try {
    await registro.getSchema({ uid });
  } catch (error) {
    if (!(error instanceof Error && error.message.includes("Schema not found"))) throw error;
    await (await registro.register({ schema: ESQUEMA_CERTIFICADO, resolverAddress: ZERO_ADDRESS, revocable: false })).wait();
  }
  return uid;
}

/**
 * Intenta revocar y exige que FALLE. EAS rechaza en la estimación de gas (antes de enviar),
 * así que estos intentos no cuestan gas. Si la revocación pasara, es un bug y se aborta.
 */
async function exigirFallo(titulo: string, rol: keyof Cadena["signers"], cadena: Cadena, schema: string, uid: string): Promise<void> {
  try {
    await (await easPara(cadena, rol).revoke({ schema, data: { uid } })).wait();
  } catch (error) {
    console.log(`  OK, falló como se esperaba: ${titulo}\n     -> ${describirError(error)}`);
    return;
  }
  throw new Error(`INESPERADO: la revocación "${titulo}" fue aceptada`);
}

ejecutar(async () => {
  const cadena = await conectarCadena();
  const { schemaUID } = datosDeEntrada(cadena.config.chainId);

  console.log("1. Emitir una attestation nueva con emisorA");
  const a = await emitirCertificadoDeEjemplo(easPara(cadena, "emisorA"), schemaUID, true);
  console.log(`   UID: ${a.uid} (gas ${a.gas})`);

  console.log("2. Verificar antes de revocar");
  const antes = await verificar(cadena, schemaUID, a.uid);
  console.log(`   estado: ${antes.estado}`);
  if (antes.estado !== "VALIDO_PENDIENTE_HASH") throw new Error(`Se esperaba VALIDO_PENDIENTE_HASH y salió ${antes.estado}`);

  // Otra attestation que quedará viva, para probar que emisorB no puede revocar la de emisorA
  // sin que el resultado se mezcle con "ya revocada".
  const viva = await emitirCertificadoDeEjemplo(easPara(cadena, "emisorA"), schemaUID, true);

  console.log("3. Revocar con emisorA (el attester original)");
  const tx = await easPara(cadena, "emisorA").revoke({ schema: schemaUID, data: { uid: a.uid } });
  await tx.wait();
  console.log(`   revocada. Gas usado: ${tx.receipt?.gasUsed ?? "?"}`);

  console.log("4. Verificar después de revocar");
  const despues = await verificar(cadena, schemaUID, a.uid);
  console.log(`   estado: ${despues.estado}\n   detalle: ${despues.detalle}`);
  if (despues.estado !== "REVOCADO") throw new Error(`Se esperaba REVOCADO y salió ${despues.estado}`);

  console.log("5. Pruebas negativas (cada una debe fallar de forma controlada)");
  await exigirFallo("emisorB intenta revocar la attestation de emisorA", "emisorB", cadena, schemaUID, viva.uid);
  await exigirFallo("emisorA intenta revocar por segunda vez", "emisorA", cadena, schemaUID, a.uid);

  const schemaNoRevocable = await registrarSchemaNoRevocable(cadena);
  const fija = await emitirCertificadoDeEjemplo(easPara(cadena, "emisorA"), schemaNoRevocable, false);
  console.log(`   (schema no revocable ${schemaNoRevocable}; attestation ${fija.uid})`);
  await exigirFallo("emisorA intenta revocar en un schema no revocable", "emisorA", cadena, schemaNoRevocable, fija.uid);

  console.log("\nListo. Attestation revocada:", a.uid, "| viva (no revocada):", viva.uid);
});
