import { EAS } from "../src/eas.js";
import { conectarCadena, ejecutar } from "../src/cadena.js";
import { cargarDirectorio } from "../src/directorio.js";
import { datosDeEntrada } from "../src/entrada.js";
import { crearLectorEAS } from "../src/lector.js";
import { UidInvalidoError, verificarAttestation } from "../src/verificador.js";

// Uso: npm run leer -- <uid>      (sin argumento usa la attestation de ejemplo del ejercicio 02)
ejecutar(async () => {
  const { config, provider } = await conectarCadena();
  const uid = process.argv[2] ?? datosDeEntrada(config.chainId).attestationEjemplo;

  const eas = new EAS(config.easAddress);
  eas.connect(provider); // solo lectura: basta un provider, no hace falta signer

  const inicio = Date.now();
  try {
    const r = await verificarAttestation(uid, {
      lector: crearLectorEAS(eas),
      schemaUID: datosDeEntrada(config.chainId).schemaUID,
      directorio: cargarDirectorio(),
    });
    // bigint no es serializable a JSON: se pasa a texto.
    console.log(JSON.stringify(r, (_k, v: unknown) => (typeof v === "bigint" ? v.toString() : v), 2));
    console.log(`(lectura: ${Date.now() - inicio} ms)`);
  } catch (error) {
    // UID mal formado: error controlado, sin stack trace.
    if (error instanceof UidInvalidoError) {
      console.error(`Entrada inválida: ${error.message}`);
      process.exitCode = 2;
      return;
    }
    throw error;
  }
});
