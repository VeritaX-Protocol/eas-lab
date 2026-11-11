import { createRequire } from "node:module";
import type * as EasSdk from "@ethereum-attestation-service/eas-sdk";

/**
 * Carga del SDK de EAS (copiado del ejercicio 01).
 *
 * Problema: el build ESM del SDK (2.10.0) hace `import { isEqual } from 'lodash'`, y lodash
 * es CommonJS sin exports nombrados, así que Node falla con
 * "does not provide an export named 'isEqual'".
 * Solución: cargar el build CommonJS con createRequire. Los TIPOS siguen viniendo del
 * paquete (import type se borra al compilar), así que no perdemos tipado.
 */
const require = createRequire(import.meta.url);
const sdk = require("@ethereum-attestation-service/eas-sdk") as typeof EasSdk;

export const EAS = sdk.EAS;
export type EAS = EasSdk.EAS;
export const SchemaRegistry = sdk.SchemaRegistry;
export type SchemaRegistry = EasSdk.SchemaRegistry;
export const SchemaEncoder = sdk.SchemaEncoder;
export type SchemaEncoder = EasSdk.SchemaEncoder;
export const ZERO_ADDRESS: string = sdk.ZERO_ADDRESS;
export const ZERO_BYTES32: string = sdk.ZERO_BYTES32;
export const NO_EXPIRATION: bigint = sdk.NO_EXPIRATION;
