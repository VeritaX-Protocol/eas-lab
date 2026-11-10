import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { EAS } from "../src/eas.js";
import { RAIZ } from "../src/config.js";
import { conectarCadena, ejecutar } from "../src/cadena.js";
import { leerDatosEntrada } from "../src/datos.js";
import { certificadoNuevo } from "../src/ejemplo.js";
import { aJson, firmarOffchain } from "../src/offchain.js";

// Firma off-chain con emisorA (y, para la prueba de la debilidad, con emisorB). No se envía NADA a la cadena.
ejecutar(async () => {
  const cadena = await conectarCadena();
  const { schemaUID } = leerDatosEntrada(cadena.config.chainId);
  const offchain = await new EAS(cadena.config.easAddress).connect(cadena.signers.emisorA).getOffchain();
  mkdirSync(`${RAIZ}salida`, { recursive: true });

  for (const [rol, archivo] of [["emisorA", "cert-offchain.json"], ["emisorB", "cert-offchain-emisorB.json"]] as const) {
    const firmada = await firmarOffchain(offchain, cadena.signers[rol], schemaUID, certificadoNuevo());
    const ruta = `${RAIZ}salida/${archivo}`;
    writeFileSync(ruta, aJson(firmada));
    console.log(`${rol}: salida/${archivo}  UID ${firmada.uid}  (${statSync(ruta).size} bytes)`);
  }
});
