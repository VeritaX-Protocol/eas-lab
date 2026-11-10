import { ESQUEMA_CERTIFICADO } from "../src/esquema.js";
import { SchemaRegistry } from "../src/eas.js";
import { conectarCadena, ejecutar } from "../src/cadena.js";
import { guardarDatos, leerDatos } from "../src/datos.js";

// Registra (idempotente) el MISMO texto del ejercicio 02, pero apuntando al resolver.
ejecutar(async () => {
  const cadena = await conectarCadena();
  const datos = leerDatos(cadena.config.chainId);
  if (!datos.resolver) throw new Error("Falta el resolver en src/datos.json (despliega con Ignition primero)");

  const uid = SchemaRegistry.getSchemaUID(ESQUEMA_CERTIFICADO, datos.resolver, true);
  console.log(`UID calculado:       ${uid}`);
  console.log(`UID del ejercicio 02: ${datos.schemaUIDEjercicio02}`);
  if (uid === datos.schemaUIDEjercicio02) throw new Error("El UID coincide con el del 02: el resolver no entró en el cálculo");

  const registro = new SchemaRegistry(cadena.config.schemaRegistryAddress);
  registro.connect(cadena.signers.admin);
  try {
    await registro.getSchema({ uid });
    console.log("Ya estaba registrado; no se envía nada.");
  } catch (error) {
    if (!(error instanceof Error && error.message.includes("Schema not found"))) throw error;
    const tx = await registro.register({ schema: ESQUEMA_CERTIFICADO, resolverAddress: datos.resolver, revocable: true });
    const devuelto = await tx.wait();
    console.log(`Registrado. UID de la cadena: ${devuelto} (gas ${tx.receipt?.gasUsed})`);
    if (devuelto !== uid) throw new Error("El UID de la cadena no coincide con el calculado");
  }
  guardarDatos(cadena.config.chainId, { schemaUID: uid });
  console.log("UID guardado en src/datos.json");
});
