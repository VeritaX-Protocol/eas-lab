import { readFileSync } from "node:fs";
import { RAIZ } from "./config.js";

export interface Entidad {
  nombre: string;
  nit: string;
}
/** Dirección de wallet en minúsculas -> entidad. */
export type Directorio = Record<string, Entidad>;

export function cargarDirectorio(): Directorio {
  const crudo = JSON.parse(readFileSync(`${RAIZ}src/directorio.json`, "utf8")) as Record<string, unknown>;
  const directorio: Directorio = {};
  for (const [clave, valor] of Object.entries(crudo)) {
    if (clave.startsWith("_")) continue; // campos de documentación
    directorio[clave.toLowerCase()] = valor as Entidad;
  }
  return directorio;
}

/** Las direcciones se comparan sin distinguir mayúsculas (checksum EIP-55 vs minúsculas). */
export function buscarEntidad(directorio: Directorio, direccion: string): Entidad | undefined {
  return directorio[direccion.toLowerCase()];
}
