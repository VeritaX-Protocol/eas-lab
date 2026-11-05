import { JsonRpcProvider, Wallet } from "ethers";
import { VARIABLES_LLAVE, exigir, type Rol } from "./config.js";

/**
 * Provider = conexión de SOLO LECTURA a la cadena (bloques, saldos, código).
 * Signer   = provider + llave privada: además puede firmar y pagar transacciones.
 * Aquí devolvemos signers (Wallet) conectados al provider, uno por rol.
 */
export function crearProvider(rpcUrl: string): JsonRpcProvider {
  // OJO: no se fija la red (staticNetwork). Si se fijara, ethers devolvería la red que
  // nosotros declaramos sin preguntarle al nodo, y la validación del chainId no serviría.
  return new JsonRpcProvider(rpcUrl);
}

export function obtenerSigners(
  env: NodeJS.ProcessEnv,
  provider: JsonRpcProvider,
): Record<Rol, Wallet> {
  const roles = Object.keys(VARIABLES_LLAVE) as Rol[];
  const entradas = roles.map((rol) => {
    const llave = exigir(env, VARIABLES_LLAVE[rol]);
    return [rol, new Wallet(llave, provider)] as const;
  });
  return Object.fromEntries(entradas) as Record<Rol, Wallet>;
}
