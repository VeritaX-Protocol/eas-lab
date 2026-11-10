import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Wallet } from "ethers";
import { EAS, Offchain, OffchainAttestationVersion } from "../src/eas.js";
import { certificadoNuevo } from "../src/ejemplo.js";
import { aJson, deJson, firmarOffchain, verificarOffchain } from "../src/offchain.js";
import type { Directorio } from "../src/directorio.js";

// Sin red: el helper off-chain se arma con una configuración fija.
const EAS_ADDR = "0x4200000000000000000000000000000000000021";
const offchain = new Offchain({ address: EAS_ADDR, version: "1.0.0", chainId: 84532n }, OffchainAttestationVersion.Version2, new EAS(EAS_ADDR));
const schema = "0x" + "ab".repeat(32);
const emisorA = Wallet.createRandom();
const emisorB = Wallet.createRandom();
const directorio: Directorio = { [emisorA.address.toLowerCase()]: { nombre: "Entidad A", nit: "1" } };

describe("off-chain firmado", async () => {
  const firmada = await firmarOffchain(offchain, emisorA, schema, certificadoNuevo());

  it("un archivo de emisor registrado es VALIDO, también tras guardarlo y leerlo como JSON", () => {
    assert.equal(verificarOffchain(offchain, firmada, directorio).estado, "VALIDO");
    assert.equal(verificarOffchain(offchain, deJson(aJson(firmada)), directorio).estado, "VALIDO");
  });
  it("cambiar 1 byte de los datos rompe la verificación", () => {
    const m = structuredClone(firmada);
    m.message.data = m.message.data.slice(0, -2) + (m.message.data.endsWith("ff") ? "00" : "ff");
    assert.equal(verificarOffchain(offchain, m, directorio).estado, "FIRMA_INVALIDA");
  });
  it("cambiar datos Y uid no sirve: el firmante recuperado ya no es el registrado", () => {
    const m = structuredClone(firmada);
    m.message.data = m.message.data.slice(0, -2) + (m.message.data.endsWith("ff") ? "00" : "ff");
    m.uid = Offchain.getOffchainUID(OffchainAttestationVersion.Version2, m.message.schema, m.message.recipient, m.message.time, m.message.expirationTime, m.message.revocable, m.message.refUID, m.message.data, m.message.salt);
    assert.notEqual(verificarOffchain(offchain, m, directorio).estado, "VALIDO");
  });
  it("firma válida de una llave fuera del directorio: EMISOR_NO_REGISTRADO", async () => {
    const deB = await firmarOffchain(offchain, emisorB, schema, certificadoNuevo());
    assert.equal(verificarOffchain(offchain, deB, directorio).estado, "EMISOR_NO_REGISTRADO");
  });
});
