import { createRequire } from "node:module";
import type * as EasSdk from "@ethereum-attestation-service/eas-sdk";

/**
 * Carga del SDK de EAS.
 *
 * Problema: el build ESM del SDK (2.10.0) hace `import { isEqual } from 'lodash'`, y lodash
 * es CommonJS sin exports nombrados, así que Node falla con
 * "does not provide an export named 'isEqual'".
 * Solución: cargar el build CommonJS del SDK con createRequire. Los TIPOS siguen viniendo
 * del paquete (import type se borra al compilar), así que no perdemos tipado.
 */
const require = createRequire(import.meta.url);
const sdk = require("@ethereum-attestation-service/eas-sdk") as typeof EasSdk;

export const EAS = sdk.EAS;
export type EAS = EasSdk.EAS;
