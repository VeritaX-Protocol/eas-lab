import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import dotenv from "dotenv";
import { configVariable, defineConfig } from "hardhat/config";

// Las llaves de prueba viven en .env.local (nunca en este archivo ni en el repositorio).
dotenv.config({ path: ".env.local", quiet: true });

// EAS 1.9.0 fija exactamente solidity 0.8.29, así que todo se compila con esa versión.
const compilador = { version: "0.8.29", settings: { optimizer: { enabled: true, runs: 200 } } };

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: { default: compilador, production: compilador },
    // Hardhat no genera artefactos de los archivos de npm salvo que se pidan aquí.
    npmFilesToBuild: [
      "@ethereum-attestation-service/eas-contracts/contracts/EAS.sol",
      "@ethereum-attestation-service/eas-contracts/contracts/SchemaRegistry.sol",
    ],
  },
  networks: {
    hardhatMainnet: { type: "edr-simulated", chainType: "l1" },
    baseSepolia: {
      type: "http",
      chainType: "op",
      url: configVariable("RPC_URL"),
      accounts: [configVariable("PRIVATE_KEY_ADMIN")],
    },
  },
});
