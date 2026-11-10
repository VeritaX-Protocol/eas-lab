import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { RAIZ } from "./config.js";

/** Datos propios del ejercicio, por chainId. El schema del 02 se copió de su NOTA/schemas.json. */
export interface DatosCadena {
  resolver?: string;
  schemaUID?: string;
  schemaUIDEjercicio02: string;
}
const RUTA = `${RAIZ}src/datos.json`;

export function leerDatos(chainId: bigint): DatosCadena {
  const todos = JSON.parse(readFileSync(RUTA, "utf8")) as Record<string, DatosCadena>;
  const datos = todos[chainId.toString()];
  if (!datos) throw new Error(`No hay datos para chainId ${chainId} en src/datos.json`);
  return datos;
}

export function guardarDatos(chainId: bigint, cambios: Partial<DatosCadena>): void {
  const todos = existsSync(RUTA) ? (JSON.parse(readFileSync(RUTA, "utf8")) as Record<string, DatosCadena>) : {};
  todos[chainId.toString()] = { ...todos[chainId.toString()], ...cambios } as DatosCadena;
  writeFileSync(RUTA, JSON.stringify(todos, null, 2) + "\n");
}
