import assert from "node:assert/strict";
import { test } from "node:test";
import { leerConfig } from "../src/config.js";

const base = {
  RPC_URL: "https://ejemplo.invalid",
  CHAIN_ID: "84532",
  EAS_ADDRESS: "0x4200000000000000000000000000000000000021",
  SCHEMA_REGISTRY_ADDRESS: "0x4200000000000000000000000000000000000020",
};

test("lee la configuración completa", () => {
  const c = leerConfig(base);
  assert.equal(c.chainId, 84532n);
  assert.equal(c.easAddress, base.EAS_ADDRESS);
});

test("falta una variable: error que nombra la variable", () => {
  const { RPC_URL: _omitida, ...sinRpc } = base;
  assert.throws(() => leerConfig(sinRpc), /RPC_URL/);
});

test("CHAIN_ID no numérico: error claro", () => {
  assert.throws(() => leerConfig({ ...base, CHAIN_ID: "base" }), /CHAIN_ID/);
});
