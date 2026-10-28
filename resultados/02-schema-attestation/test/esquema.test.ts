import assert from "node:assert/strict";
import { test } from "node:test";
import { SchemaRegistry, ZERO_ADDRESS } from "../src/eas.js";
import { ESQUEMA_CERTIFICADO, codificarDatos, decodificarDatos, nuevoCertificadoId, type DatosCertificado } from "../src/esquema.js";

const base = (): DatosCertificado => ({
  certificadoId: nuevoCertificadoId(),
  plantillaArweaveId: "EJEMPLO",
  hashPlantilla: "0x" + "11".repeat(32),
  hashDatos: "0x" + "22".repeat(32),
  codigoCurso: "CURSO-PRUEBA-001",
  fechaEmision: 1_700_000_000n,
  vigenciaHasta: 0n,
});

test("codificar y decodificar es una ida y vuelta exacta", () => {
  const d = base();
  assert.deepEqual(decodificarDatos(codificarDatos(d)), d);
});

test("bytes32 de longitud incorrecta se rechaza antes de enviar", () => {
  assert.throws(() => codificarDatos({ ...base(), hashDatos: "0x1234" }), /hashDatos debe ser bytes32/);
});

test("uint64 fuera de rango se rechaza", () => {
  assert.throws(() => codificarDatos({ ...base(), fechaEmision: 1n << 64n }), /fechaEmision/);
});

test("el UID del schema es determinista y cambia con revocable o con el texto", () => {
  const a = SchemaRegistry.getSchemaUID(ESQUEMA_CERTIFICADO, ZERO_ADDRESS, true);
  assert.equal(a, SchemaRegistry.getSchemaUID(ESQUEMA_CERTIFICADO, ZERO_ADDRESS, true));
  assert.notEqual(a, SchemaRegistry.getSchemaUID(ESQUEMA_CERTIFICADO, ZERO_ADDRESS, false));
  assert.notEqual(a, SchemaRegistry.getSchemaUID(ESQUEMA_CERTIFICADO + ", string extra", ZERO_ADDRESS, true));
});
