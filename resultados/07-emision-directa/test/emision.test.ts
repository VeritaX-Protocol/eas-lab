import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estimarCosto, certificadoIdDesdeHash, type ConSaldo } from "../src/emision.js";
import type { EAS } from "../src/eas.js";
import type { DatosCertificado } from "../src/esquema.js";

// Pruebas sin red: un EAS falso que "estima" 100.000 de gas y un provider falso con saldo y precio fijos.
const eas = { attest: async () => ({ estimateGas: async () => 100_000n }) } as unknown as EAS;
const provider = (saldo: bigint): ConSaldo =>
  ({ getBalance: async () => saldo, getFeeData: async () => ({ maxFeePerGas: 10n, gasPrice: 10n }) }) as unknown as ConSaldo;

const hash = "0x" + "11".repeat(32);
const datos: DatosCertificado = {
  certificadoId: certificadoIdDesdeHash(hash), plantillaArweaveId: "X", hashPlantilla: hash, hashDatos: hash,
  codigoCurso: "C", fechaEmision: 1n, vigenciaHasta: 0n,
};

describe("emisión directa", () => {
  it("estimarCosto devuelve gas y costo máximo si el saldo alcanza", async () => {
    assert.deepEqual(await estimarCosto(eas, provider(1_000_000n), "0xabc", "0x00", datos), { gas: 100_000n, wei: 1_000_000n });
  });
  it("estimarCosto falla con mensaje claro si el saldo no alcanza", async () => {
    await assert.rejects(estimarCosto(eas, provider(999_999n), "0xabc", "0x00", datos), /Saldo insuficiente/);
  });
  it("el certificadoId es determinista y distinto por hash", () => {
    assert.equal(certificadoIdDesdeHash(hash), certificadoIdDesdeHash(hash));
    assert.notEqual(certificadoIdDesdeHash(hash), certificadoIdDesdeHash("0x" + "22".repeat(32)));
  });
});
