import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { RAIZ } from "../src/config.js";
import { EAS, NO_EXPIRATION, SchemaEncoder, SchemaRegistry, ZERO_ADDRESS } from "../src/eas.js";
import { conectarCadena, ejecutar } from "../src/cadena.js";
import { codificarDatos, nuevoCertificadoId } from "../src/esquema.js";
import { datosDeEntrada } from "../src/entrada.js";

const RUTA_CASOS = `${RAIZ}src/casos.json`;
const ESQUEMA_AJENO = "string nota"; // schema distinto del certificado, solo para la prueba

/**
 * Crea en la cadena los dos casos que el 02 no tenía, para probar el verificador con la realidad:
 *  - attestation de emisorB (NO está en el directorio) con nuestro schema -> EMISOR_NO_REGISTRADO
 *  - attestation de emisorA con OTRO schema                               -> SCHEMA_INCORRECTO
 * Se ejecuta una vez: guarda los UIDs en src/casos.json y no repite si ya existe.
 */
ejecutar(async () => {
  if (existsSync(RUTA_CASOS)) {
    console.log(`Ya existe src/casos.json, no se crea nada:\n${readFileSync(RUTA_CASOS, "utf8")}`);
    return;
  }
  const { config, signers } = await conectarCadena();
  const { schemaUID } = datosDeEntrada(config.chainId);

  // Schema ajeno (admin lo registra; si ya existía, su UID es el mismo y se salta el registro).
  const registro = new SchemaRegistry(config.schemaRegistryAddress);
  registro.connect(signers.admin);
  const uidAjeno = SchemaRegistry.getSchemaUID(ESQUEMA_AJENO, ZERO_ADDRESS, true);
  try {
    await registro.getSchema({ uid: uidAjeno });
  } catch (error) {
    if (!(error instanceof Error && error.message.includes("Schema not found"))) throw error;
    await (await registro.register({ schema: ESQUEMA_AJENO, resolverAddress: ZERO_ADDRESS, revocable: true })).wait();
  }

  const datos = codificarDatos({
    certificadoId: nuevoCertificadoId(),
    plantillaArweaveId: "EJEMPLO-NO-ES-UNA-TX-REAL-DE-ARWEAVE",
    hashPlantilla: "0x" + "11".repeat(32),
    hashDatos: "0x" + "22".repeat(32),
    codigoCurso: "CURSO-PRUEBA-001",
    fechaEmision: BigInt(Math.floor(Date.now() / 1000)),
    vigenciaHasta: 0n,
  });

  const easB = new EAS(config.easAddress);
  easB.connect(signers.emisorB);
  const emisorNoRegistrado = await (
    await easB.attest({ schema: schemaUID, data: { recipient: ZERO_ADDRESS, expirationTime: NO_EXPIRATION, revocable: true, data: datos } })
  ).wait();

  const easA = new EAS(config.easAddress);
  easA.connect(signers.emisorA);
  const otroSchema = await (
    await easA.attest({
      schema: uidAjeno,
      data: {
        recipient: ZERO_ADDRESS,
        expirationTime: NO_EXPIRATION,
        revocable: true,
        data: new SchemaEncoder(ESQUEMA_AJENO).encodeData([{ name: "nota", value: "ejemplo de otro schema", type: "string" }]),
      },
    })
  ).wait();

  const casos = { chainId: config.chainId.toString(), emisorNoRegistrado, otroSchema, schemaAjeno: uidAjeno };
  writeFileSync(RUTA_CASOS, JSON.stringify(casos, null, 2) + "\n");
  console.log("Casos creados y guardados en src/casos.json:", casos);
});
