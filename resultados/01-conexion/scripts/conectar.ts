import { EAS } from "../src/eas.js";
import { formatEther, type Provider } from "ethers";
import { cargarConfig, type ChainConfig } from "../src/config.js";
import { crearProvider, obtenerSigners } from "../src/wallets.js";

/** Aborta si el nodo responde con una cadena distinta a la configurada. */
async function validarChainId(provider: Provider, esperado: bigint): Promise<bigint> {
  // Sin red fija, getNetwork() consulta eth_chainId al nodo: es el chainId REAL del RPC.
  const { chainId } = await provider.getNetwork();
  // Primera barrera de seguridad: si el RPC apunta a otra red (p. ej. mainnet),
  // nos detenemos ANTES de leer saldos o firmar nada.
  if (chainId !== esperado) {
    throw new Error(
      `ChainId inesperado: el RPC responde ${chainId} pero la configuración espera ${esperado}. Abortando.`,
    );
  }
  return chainId;
}

/** Un contrato existe en una dirección si getCode devuelve algo distinto de "0x". */
async function exigirCodigo(provider: Provider, nombre: string, direccion: string): Promise<void> {
  const codigo = await provider.getCode(direccion);
  if (codigo === "0x") {
    throw new Error(`No hay contrato desplegado en ${nombre} (${direccion})`);
  }
  console.log(`  ${nombre}: ${direccion} -> código presente (${(codigo.length - 2) / 2} bytes)`);
}

async function main(): Promise<void> {
  const config: ChainConfig = cargarConfig();
  const provider = crearProvider(config.rpcUrl);

  const chainId = await validarChainId(provider, config.chainId);
  console.log(`chainId: ${chainId}`);
  console.log(`bloque actual: ${await provider.getBlockNumber()}`);

  // Saldos: getBalance solo necesita el provider (lectura). Solo se muestran direcciones.
  const signers = obtenerSigners(process.env, provider);
  console.log("saldos:");
  for (const [rol, signer] of Object.entries(signers)) {
    const saldo = await provider.getBalance(signer.address);
    console.log(`  ${rol.padEnd(8)} ${signer.address}  ${formatEther(saldo)} ETH`);
  }

  console.log("contratos de EAS:");
  await exigirCodigo(provider, "EAS", config.easAddress);
  await exigirCodigo(provider, "SchemaRegistry", config.schemaRegistryAddress);

  // El SDK recibe la dirección de EAS desde la configuración; connect() le da un
  // signer (aquí admin) para que pueda enviar transacciones en ejercicios futuros.
  const eas = new EAS(config.easAddress);
  eas.connect(signers.admin);
  console.log(`versión del contrato EAS: ${await eas.getVersion()}`);
}

main().catch((error: unknown) => {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
