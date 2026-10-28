import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// Raíz del ejercicio (una carpeta arriba de src/). Así los scripts funcionan
// sin importar desde qué directorio se lancen.
export const RAIZ = fileURLToPath(new URL("..", import.meta.url));
export const RUTA_ENV = `${RAIZ}.env.local`;

/** Configuración de la cadena. Todo viene del entorno; nada está fijo en el código. */
export interface ChainConfig {
  rpcUrl: string;
  chainId: bigint;
  easAddress: string;
  schemaRegistryAddress: string;
}

/** Nombres de los roles de prueba y la variable de entorno que guarda su llave. */
export const VARIABLES_LLAVE = {
  admin: "PRIVATE_KEY_ADMIN",
  emisorA: "PRIVATE_KEY_EMISOR_A",
  emisorB: "PRIVATE_KEY_EMISOR_B",
} as const;

export type Rol = keyof typeof VARIABLES_LLAVE;

/** Lee una variable obligatoria o lanza un error que dice exactamente cuál falta. */
export function exigir(env: NodeJS.ProcessEnv, nombre: string): string {
  const valor = env[nombre]?.trim();
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre} en .env.local`);
  }
  return valor;
}

/** Construye la configuración a partir de un objeto de entorno (separado para poder probarlo). */
export function leerConfig(env: NodeJS.ProcessEnv): ChainConfig {
  const chainId = exigir(env, "CHAIN_ID");
  if (!/^\d+$/.test(chainId)) {
    throw new Error(`CHAIN_ID debe ser un entero positivo, recibí "${chainId}"`);
  }
  return {
    rpcUrl: exigir(env, "RPC_URL"),
    chainId: BigInt(chainId),
    easAddress: exigir(env, "EAS_ADDRESS"),
    schemaRegistryAddress: exigir(env, "SCHEMA_REGISTRY_ADDRESS"),
  };
}

/** Carga .env.local (si no existe, indica el primer paso) y devuelve la configuración. */
export function cargarConfig(): ChainConfig {
  if (!existsSync(RUTA_ENV)) {
    throw new Error(
      "No existe .env.local. Ejecuta primero: npm run wallets (scripts/generar-wallets.ts)",
    );
  }
  dotenv.config({ path: RUTA_ENV, quiet: true });
  return leerConfig(process.env);
}
