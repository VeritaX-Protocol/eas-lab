import { readFileSync } from "node:fs";
import { RAIZ } from "./config.js";

interface DatosCadena {
  schemaUID: string;
  attestationEjemplo: string;
}

/** Datos que arrastra este ejercicio del 02 (ver datos-entrada.json), por chainId. */
export function datosDeEntrada(chainId: bigint): DatosCadena {
  const todos = JSON.parse(readFileSync(`${RAIZ}src/datos-entrada.json`, "utf8")) as Record<string, DatosCadena>;
  const datos = todos[chainId.toString()];
  if (!datos) throw new Error(`datos-entrada.json no tiene datos para chainId ${chainId}`);
  return datos;
}
