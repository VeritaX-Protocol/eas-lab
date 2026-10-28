import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { RAIZ } from "./config.js";

/** Registro local de UIDs de schema. La cadena es configurable, así que se guarda POR chainId. */
export interface RegistroSchema {
  uid: string;
  version: number;
  texto: string;
}
export type Schemas = Record<string, RegistroSchema>;

const RUTA = `${RAIZ}src/schemas.json`;

export function leerSchemas(): Schemas {
  if (!existsSync(RUTA)) return {};
  return JSON.parse(readFileSync(RUTA, "utf8")) as Schemas;
}

export function guardarSchema(chainId: bigint, registro: RegistroSchema): void {
  const todos = leerSchemas();
  todos[chainId.toString()] = registro;
  writeFileSync(RUTA, JSON.stringify(todos, null, 2) + "\n");
}

/** UID del schema registrado en esa cadena, o error que dice qué script correr antes. */
export function uidSchema(chainId: bigint): string {
  const registro = leerSchemas()[chainId.toString()];
  if (!registro) {
    throw new Error(`No hay schema guardado para chainId ${chainId}. Ejecuta primero: npm run registrar`);
  }
  return registro.uid;
}
