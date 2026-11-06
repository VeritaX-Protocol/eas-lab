import assert from "node:assert/strict";
import { test } from "node:test";
import { calcularHashDatos, generarSal, normalizar, type DatosCertificado } from "../src/hash.js";

const SAL = "ab".repeat(32);
const base = (): DatosCertificado => ({
  nombre: "José Pérez", tipoDoc: "CC", numeroDoc: "123456789", codigoCurso: "CURSO-1",
  fechaEmision: "2026-10-30", certificadoId: "cert-0001", hashPlantilla: "0x" + "11".repeat(32), sal: SAL,
});

test("1. determinismo: mismos datos y misma sal dan el mismo hash", () => {
  assert.equal(calcularHashDatos(base()), calcularHashDatos(base()));
  assert.match(calcularHashDatos(base()), /^0x[0-9a-f]{64}$/);
});

test("2. cambiar cualquier campo cambia el hash", () => {
  const h0 = calcularHashDatos(base());
  const cambios: Partial<DatosCertificado> = {
    nombre: "José Pérez.", tipoDoc: "TI", numeroDoc: "123456780", codigoCurso: "CURSO-2",
    fechaEmision: "2026-10-31", certificadoId: "cert-0002", hashPlantilla: "0x" + "12".repeat(32),
  };
  for (const [campo, valor] of Object.entries(cambios)) {
    assert.notEqual(calcularHashDatos({ ...base(), [campo]: valor }), h0, `no cambió con ${campo}`);
  }
});

test("3. distinta sal da distinto hash", () => {
  assert.notEqual(calcularHashDatos({ ...base(), sal: "cd".repeat(32) }), calcularHashDatos(base()));
});

test("4. ambigüedad: AB+C es distinto de A+BC", () => {
  assert.notEqual(
    calcularHashDatos({ ...base(), nombre: "AB", codigoCurso: "C" }),
    calcularHashDatos({ ...base(), nombre: "A", codigoCurso: "BC" }),
  );
});

test("5. normalización: espacios, mayúsculas y NFC/NFD dan el mismo hash", () => {
  const a = calcularHashDatos({ ...base(), nombre: "  José   Pérez " });
  assert.equal(a, calcularHashDatos({ ...base(), nombre: "JOSÉ PÉREZ" }));
  assert.equal(a, calcularHashDatos({ ...base(), nombre: "José Pérez" })); // NFD
});

test("5b. decisión: las tildes NO se eliminan (JOSÉ ≠ JOSE)", () => {
  assert.notEqual(normalizar("José"), normalizar("Jose"));
  assert.notEqual(calcularHashDatos({ ...base(), nombre: "José" }), calcularHashDatos({ ...base(), nombre: "Jose" }));
});

test("6. campo faltante, undefined o vacío lanza error", () => {
  for (const campo of Object.keys(base()) as Array<keyof DatosCertificado>) {
    const datos: Record<string, unknown> = { ...base() };
    delete datos[campo];
    assert.throws(() => calcularHashDatos(datos as unknown as DatosCertificado), new RegExp(campo));
    datos[campo] = undefined;
    assert.throws(() => calcularHashDatos(datos as unknown as DatosCertificado), new RegExp(campo));
  }
  assert.throws(() => calcularHashDatos({ ...base(), nombre: "   " }), /nombre/);
});

test("generarSal: 32 bytes en hex y distinta en cada llamada", () => {
  const s = generarSal();
  assert.match(s, /^[0-9a-f]{64}$/);
  assert.notEqual(s, generarSal());
});
