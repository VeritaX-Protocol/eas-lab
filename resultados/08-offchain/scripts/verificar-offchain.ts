import { readFileSync } from "node:fs";
import { Wallet } from "ethers";
import { cargarConfig, RAIZ } from "../src/config.js";
import { cargarDirectorio } from "../src/directorio.js";
import { EAS, Offchain, OffchainAttestationVersion, type SignedOffchainAttestation } from "../src/eas.js";
import { deJson, verificarOffchain } from "../src/offchain.js";
import { ejecutar } from "../src/cadena.js";

// Verifica SIN conectarse a la cadena: la configuración sale de .env.local y la versión del dominio, del propio archivo.
ejecutar(async () => {
  const config = cargarConfig();
  const directorio = cargarDirectorio();
  const leer = (n: string): SignedOffchainAttestation => deJson(readFileSync(`${RAIZ}salida/${n}`, "utf8"));
  const verificar = (f: SignedOffchainAttestation): string => {
    const offchain = new Offchain({ address: config.easAddress, version: f.domain.version, chainId: config.chainId }, OffchainAttestationVersion.Version2, new EAS(config.easAddress));
    const r = verificarOffchain(offchain, f, directorio);
    return `${r.estado}${r.entidad ? ` (${r.entidad})` : ""}`;
  };

  const buena = leer("cert-offchain.json");
  console.log(`1. archivo de emisorA:                      ${verificar(buena)}`);

  const cambiado = structuredClone(buena);
  cambiado.message.data = buena.message.data.slice(0, -2) + "ff";
  console.log(`2. mismo archivo con 1 byte de datos alterado: ${verificar(cambiado)}`);

  const otraFirma = structuredClone(buena);
  otraFirma.signature = { ...buena.signature, r: Wallet.createRandom().privateKey };
  console.log(`3. firma sustituida por otra:                ${verificar(otraFirma)}`);

  console.log(`4. archivo firmado por emisorB (no en directorio): ${verificar(leer("cert-offchain-emisorB.json"))}`);
  console.log("   La firma de emisorB es válida criptográficamente; se rechaza por el directorio, no por la firma.");
});
