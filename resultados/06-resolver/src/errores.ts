import { id } from "ethers";

/**
 * Errores personalizados del contrato EAS (verificados en eas-contracts/contracts/EAS.sol
 * y Common.sol). ethers solo ve el selector de 4 bytes (keccak de "Nombre()") y lo reporta
 * como "unknown custom error"; aquí lo traducimos a algo legible.
 */
const ERRORES_EAS: Record<string, string> = Object.fromEntries(
  [
    ["AccessDenied", "quien firma no es el attester original"],
    ["AlreadyRevoked", "la attestation ya estaba revocada"],
    ["Irrevocable", "el schema (o la attestation) no es revocable"],
    ["NotFound", "no existe una attestation con ese UID"],
    ["InvalidSchema", "el schema no está registrado"],
    ["InvalidRevocation", "revocación inválida"],
    ["InvalidAttestation", "el resolver del schema rechazó la attestation (emisor no autorizado)"],
    ["SoloOwner", "solo el owner del resolver puede hacer esto"],
  ].map(([nombre, causa]) => [id(`${nombre}()`).slice(0, 10), `${nombre} (${causa})`]),
);

/** Extrae el selector del error del mensaje de ethers y devuelve una descripción corta. */
export function describirError(error: unknown): string {
  const mensaje = error instanceof Error ? error.message : String(error);
  const selector = mensaje.match(/data="(0x[0-9a-fA-F]{8})/)?.[1]?.toLowerCase();
  if (selector && ERRORES_EAS[selector]) return ERRORES_EAS[selector];
  // Sin selector conocido: la primera frase del mensaje, sin el volcado de la transacción.
  return mensaje.match(/^[^(]*/)?.[0].trim() || mensaje;
}
