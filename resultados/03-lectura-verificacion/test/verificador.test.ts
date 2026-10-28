import assert from "node:assert/strict";
import { test } from "node:test";
import { ZERO_BYTES32 } from "../src/eas.js";
import { codificarDatos, nuevoCertificadoId, type DatosCertificado } from "../src/esquema.js";
import type { AttestationLeida, LectorAttestation } from "../src/lector.js";
import { UidInvalidoError, verificarAttestation, type OpcionesVerificacion } from "../src/verificador.js";

const SCHEMA = "0x" + "aa".repeat(32);
const UID = "0x" + "01".repeat(32);
const EMISOR_OK = "0x469582501001A156858CCd546Ad298A29D59C5d0"; // mayúsculas/minúsculas mezcladas a propósito
const EMISOR_NO = "0x7ed1326A8914314624DbC75959cc3A598b16C0a9";
const AHORA = 1_800_000_000n;

const datos = (extra: Partial<DatosCertificado> = {}): DatosCertificado => ({
  certificadoId: nuevoCertificadoId(),
  plantillaArweaveId: "EJEMPLO",
  hashPlantilla: "0x" + "11".repeat(32),
  hashDatos: "0x" + "22".repeat(32),
  codigoCurso: "CURSO-PRUEBA-001",
  fechaEmision: 1_700_000_000n,
  vigenciaHasta: 0n,
  ...extra,
});

const attestation = (extra: Partial<AttestationLeida> = {}, d: DatosCertificado = datos()): AttestationLeida => ({
  uid: UID,
  schema: SCHEMA,
  time: 1_700_000_000n,
  expirationTime: 0n,
  revocationTime: 0n,
  attester: EMISOR_OK,
  recipient: "0x" + "00".repeat(20),
  data: codificarDatos(d),
  ...extra,
});

/** Lector falso: devuelve siempre la attestation dada (sin red). */
const opciones = (a: AttestationLeida): OpcionesVerificacion => {
  const lector: LectorAttestation = { leer: async () => a };
  return {
    lector,
    schemaUID: SCHEMA,
    directorio: { [EMISOR_OK.toLowerCase()]: { nombre: "Entidad de Prueba A", nit: "900000001-0" } },
    ahora: AHORA,
  };
};

// Estructura vacía que devuelve EAS para un UID que no existe.
const vacia = (): AttestationLeida => ({
  uid: ZERO_BYTES32, schema: ZERO_BYTES32, time: 0n, expirationTime: 0n, revocationTime: 0n,
  attester: "0x" + "00".repeat(20), recipient: "0x" + "00".repeat(20), data: "0x",
});

test("UID inexistente (estructura vacía) -> NO_ENCONTRADO, con aviso de que no es 'falso'", async () => {
  const r = await verificarAttestation(UID, opciones(vacia()));
  assert.equal(r.estado, "NO_ENCONTRADO");
  assert.match(r.aviso, /NO significa/);
});

test("UID de otro schema -> SCHEMA_INCORRECTO", async () => {
  const r = await verificarAttestation(UID, opciones(attestation({ schema: "0x" + "bb".repeat(32) })));
  assert.equal(r.estado, "SCHEMA_INCORRECTO");
  assert.equal(r.camposDecodificados, null);
});

test("attestation válida -> VALIDO_PENDIENTE_HASH con campos decodificados y emisor", async () => {
  const d = datos();
  const r = await verificarAttestation(UID, opciones(attestation({}, d)));
  assert.equal(r.estado, "VALIDO_PENDIENTE_HASH");
  assert.deepEqual(r.camposDecodificados, d);
  assert.equal(r.emisor?.nombre, "Entidad de Prueba A");
  assert.equal(r.fechaEmision, d.fechaEmision);
});

test("attester fuera del directorio -> EMISOR_NO_REGISTRADO", async () => {
  const r = await verificarAttestation(UID, opciones(attestation({ attester: EMISOR_NO })));
  assert.equal(r.estado, "EMISOR_NO_REGISTRADO");
  assert.equal(r.emisor?.nombre, null);
});

test("revocado -> REVOCADO", async () => {
  const r = await verificarAttestation(UID, opciones(attestation({ revocationTime: 1_750_000_000n })));
  assert.equal(r.estado, "REVOCADO");
});

test("el orden importa: revocado Y emisor no registrado -> REVOCADO", async () => {
  const r = await verificarAttestation(UID, opciones(attestation({ revocationTime: 1n, attester: EMISOR_NO })));
  assert.equal(r.estado, "REVOCADO");
});

test("el orden importa: revocado Y expirado -> REVOCADO", async () => {
  const r = await verificarAttestation(UID, opciones(attestation({ revocationTime: 1n, expirationTime: 5n })));
  assert.equal(r.estado, "REVOCADO");
});

test("expirationTime de EAS vencido -> EXPIRADO", async () => {
  const r = await verificarAttestation(UID, opciones(attestation({ expirationTime: AHORA - 1n })));
  assert.equal(r.estado, "EXPIRADO");
  assert.match(r.detalle, /EAS/);
});

test("vigenciaHasta propia vencida -> EXPIRADO (aunque EAS no expire)", async () => {
  const r = await verificarAttestation(UID, opciones(attestation({}, datos({ vigenciaHasta: AHORA - 1n }))));
  assert.equal(r.estado, "EXPIRADO");
  assert.match(r.detalle, /vigenciaHasta/);
});

test("vigenciaHasta en el futuro sigue siendo válido", async () => {
  const r = await verificarAttestation(UID, opciones(attestation({}, datos({ vigenciaHasta: AHORA + 100n }))));
  assert.equal(r.estado, "VALIDO_PENDIENTE_HASH");
});

test("UID mal formado -> error controlado, sin consultar el lector", async () => {
  let consultas = 0;
  const op = { ...opciones(vacia()), lector: { leer: async () => (consultas++, vacia()) } };
  await assert.rejects(verificarAttestation("0x1234", op), UidInvalidoError);
  await assert.rejects(verificarAttestation("no-es-hex", op), UidInvalidoError);
  assert.equal(consultas, 0);
});
