import type { JsonRpcProvider, Wallet } from "ethers";
import { cargarConfig, type ChainConfig, type Rol } from "./config.js";
import { crearProvider, obtenerSigners } from "./wallets.js";

export interface Cadena {
  config: ChainConfig;
  provider: JsonRpcProvider;
  signers: Record<Rol, Wallet>;
}

export const URL_EASSCAN = "https://base-sepolia.easscan.org";

/**
 * Carga la configuración, se conecta y ABORTA si el nodo responde otro chainId
 * (misma guarda que el ejercicio 01: nada se firma en una red equivocada).
 */
export async function conectarCadena(): Promise<Cadena> {
  const config = cargarConfig();
  const provider = crearProvider(config.rpcUrl);
  const { chainId } = await provider.getNetwork(); // sin red fija: lo responde el nodo
  if (chainId !== config.chainId) {
    throw new Error(
      `ChainId inesperado: el RPC responde ${chainId} pero la configuración espera ${config.chainId}. Abortando.`,
    );
  }
  return { config, provider, signers: obtenerSigners(process.env, provider) };
}

/** Los scripts terminan igual: mensaje claro y código de salida 1, sin stack trace. */
export function ejecutar(main: () => Promise<void>): void {
  main().catch((error: unknown) => {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
