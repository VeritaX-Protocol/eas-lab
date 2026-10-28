import { appendFileSync, chmodSync, copyFileSync, existsSync } from "node:fs";
import { Wallet } from "ethers";
import { RAIZ, RUTA_ENV, VARIABLES_LLAVE, type Rol } from "../src/config.js";

/**
 * Genera las 3 wallets de prueba y guarda sus llaves en .env.local.
 * Se ejecuta UNA sola vez: si .env.local ya existe, no toca nada
 * (sobrescribir perdería las llaves de wallets que ya tienen fondos).
 */
function main(): void {
  if (existsSync(RUTA_ENV)) {
    console.log(".env.local ya existe: no se generan wallets nuevas ni se sobrescribe nada.");
    return;
  }

  // Punto de partida: la configuración pública de la cadena de .env.example.
  copyFileSync(`${RAIZ}.env.example`, RUTA_ENV);
  // La copia hereda permisos abiertos; restringimos ANTES de escribir las llaves.
  chmodSync(RUTA_ENV, 0o600);

  const lineas: string[] = ["", "# Llaves de prueba (testnet únicamente)"];
  console.log("Wallets generadas (solo direcciones públicas):");
  for (const rol of Object.keys(VARIABLES_LLAVE) as Rol[]) {
    const wallet = Wallet.createRandom();
    lineas.push(`${VARIABLES_LLAVE[rol]}=${wallet.privateKey}`);
    // Jamás se imprime la llave: solo la dirección, que es pública.
    console.log(`  ${rol.padEnd(8)} ${wallet.address}`);
  }
  appendFileSync(RUTA_ENV, lineas.join("\n") + "\n");

  console.log("\nSiguiente paso: fondea admin y emisorA con ETH de Base Sepolia (faucet).");
}

main();
