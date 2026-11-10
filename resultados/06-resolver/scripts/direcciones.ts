// Imprime las direcciones PÚBLICAS de las wallets de prueba (nunca las llaves).
import { Wallet } from "ethers";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local", quiet: true });
for (const [rol, v] of [["admin", "PRIVATE_KEY_ADMIN"], ["emisorA", "PRIVATE_KEY_EMISOR_A"], ["emisorB", "PRIVATE_KEY_EMISOR_B"]] as const) {
  console.log(rol, new Wallet(process.env[v] ?? "").address);
}
