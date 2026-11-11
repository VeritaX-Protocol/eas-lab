import { readFileSync } from "node:fs";
import { RAIZ } from "./config.js";

/** Datos que arrastra este ejercicio del 06 (ver datos-entrada.json). */
export interface DatosEntrada {
  resolver: string;
  schemaUID: string;
}

export function leerDatosEntrada(chainId: bigint): DatosEntrada {
  const todos = JSON.parse(readFileSync(`${RAIZ}datos-entrada.json`, "utf8")) as Record<string, DatosEntrada>;
  const datos = todos[chainId.toString()];
  if (!datos) throw new Error(`No hay datos para chainId ${chainId} en datos-entrada.json`);
  return datos;
}
