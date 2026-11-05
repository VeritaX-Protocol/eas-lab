import assert from "node:assert/strict";
import { test } from "node:test";
import { id } from "ethers";
import { ZERO_BYTES32 } from "../src/eas.js";
import { codificarDatos, nuevoCertificadoId } from "../src/esquema.js";
import { describirError } from "../src/errores.js";
import { verificarAttestation } from "../src/verificador.js";

const SCHEMA = "0x" + "aa".repeat(32);
const EMISOR = "0x469582501001A156858CCd546Ad298A29D59C5d0";

// Imita el mensaje de ethers para un custom error del contrato.
const errorDeContrato = (nombre: string): Error =>
  new Error(`execution reverted (unknown custom error) (action="estimateGas", data="${id(`${nombre}()`).slice(0, 10)}", transaction={...})`);

test("los tres errores del ejercicio se traducen por su selector", () => {
  assert.match(describirError(errorDeContrato("AccessDenied")), /^AccessDenied/);
  assert.match(describirError(errorDeContrato("AlreadyRevoked")), /^AlreadyRevoked/);
  assert.match(describirError(errorDeContrato("Irrevocable")), /^Irrevocable/);
});

test("un error desconocido devuelve su primera frase, sin volcar la transacción", () => {
  const texto = describirError(new Error('boom (action="x", data="0xdeadbeef", transaction={...})'));
  assert.equal(texto, "boom");
});

test("una attestation revocada se reporta REVOCADO con la fecha de revocación", async () => {
  const data = codificarDatos({
    certificadoId: nuevoCertificadoId(), plantillaArweaveId: "EJEMPLO",
    hashPlantilla: "0x" + "11".repeat(32), hashDatos: "0x" + "22".repeat(32),
    codigoCurso: "CURSO-PRUEBA-004", fechaEmision: 1_700_000_000n, vigenciaHasta: 0n,
  });
  const r = await verificarAttestation("0x" + "01".repeat(32), {
    lector: { leer: async () => ({ uid: "0x" + "01".repeat(32), schema: SCHEMA, time: 1n, expirationTime: 0n, revocationTime: 1_750_000_000n, attester: EMISOR, recipient: ZERO_BYTES32, data }) },
    schemaUID: SCHEMA,
    directorio: { [EMISOR.toLowerCase()]: { nombre: "Entidad de Prueba A", nit: "1" } },
  });
  assert.equal(r.estado, "REVOCADO");
  assert.equal(r.fechaRevocacion, 1_750_000_000n);
  assert.match(r.detalle, /2025-06-15/);
});
