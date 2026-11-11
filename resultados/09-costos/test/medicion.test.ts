import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estadistica, leerMuestra, type ConRpc } from "../src/medicion.js";

const rpc = (recibo: Record<string, string> | null): ConRpc => ({ send: async () => recibo });

describe("medición de costos", () => {
  it("estadistica da promedio, mínimo y máximo", () => {
    assert.deepEqual(estadistica([10n, 20n, 60n]), { promedio: 30n, min: 10n, max: 60n });
  });
  it("estadistica rechaza una lista vacía", () => {
    assert.throws(() => estadistica([]), /No hay valores/);
  });
  it("leerMuestra suma la parte L2 (gas × precio) y la L1 (l1Fee) del recibo crudo", async () => {
    const m = await leerMuestra(rpc({ gasUsed: "0x64", effectiveGasPrice: "0xa", l1Fee: "0x7" }), "0xabc", 32);
    assert.equal(m.feeL2Wei, 1000n);
    assert.equal(m.totalWei, 1007n);
    assert.equal(m.bytesDatos, 32);
  });
  it("leerMuestra falla en voz alta si el recibo no trae l1Fee (no cuenta la L1 como cero)", async () => {
    await assert.rejects(leerMuestra(rpc({ gasUsed: "0x64", effectiveGasPrice: "0xa" }), "0xabc", 1), /l1Fee/);
  });
  it("leerMuestra falla si no hay recibo", async () => {
    await assert.rejects(leerMuestra(rpc(null), "0xabc", 1), /No hay recibo/);
  });
});
