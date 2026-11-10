import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { encodePacked, keccak256, zeroAddress, zeroHash } from "viem";
import { network } from "hardhat";

// Forma mínima de lo que se lee de EAS (los artefactos de npm no traen tipos generados).
interface Atestacion { attester: string; revocationTime: bigint }
const ESQUEMA = "bytes32 certificadoId, bytes32 hashDatos";

describe("EmisoresAutorizados", async function () {
  const { viem } = await network.create();
  const [admin, emisorA, emisorB] = await viem.getWalletClients();

  // Despliega EAS + registro + resolver y registra un schema revocable que usa el resolver.
  async function preparar() {
    const registro = await viem.deployContract("SchemaRegistry");
    const eas = await viem.deployContract("EAS", [registro.address]);
    const resolver = await viem.deployContract("EmisoresAutorizados", [eas.address, admin.account.address]);
    await registro.write.register([ESQUEMA, resolver.address, true]);
    // UID del schema = keccak256(texto, resolver, revocable)
    const schemaUID = keccak256(encodePacked(["string", "address", "bool"], [ESQUEMA, resolver.address, true]));
    return { eas, resolver, schemaUID };
  }

  const solicitud = (schema: `0x${string}`) => ({
    schema,
    data: { recipient: zeroAddress, expirationTime: 0n, revocable: true, refUID: zeroHash, data: "0x" as const, value: 0n },
  });

  // Intenta emitir con la wallet indicada y devuelve el UID de la attestation.
  async function emitir(eas: Awaited<ReturnType<typeof preparar>>["eas"], schema: `0x${string}`, cuenta: typeof emisorA) {
    const easDe = await viem.getContractAt("EAS", eas.address, { client: { wallet: cuenta } });
    const publico = await viem.getPublicClient();
    const hash = await easDe.write.attest([solicitud(schema)]);
    const recibo = await publico.waitForTransactionReceipt({ hash });
    const eventos = await publico.getContractEvents({ address: eas.address, abi: eas.abi, eventName: "Attested", fromBlock: recibo.blockNumber, toBlock: recibo.blockNumber, strict: true });
    return (eventos[0].args as unknown as { uid: `0x${string}` }).uid;
  }

  async function resolverDe(resolver: Awaited<ReturnType<typeof preparar>>["resolver"], cuenta: typeof emisorA) {
    return viem.getContractAt("EmisoresAutorizados", resolver.address, { client: { wallet: cuenta } });
  }

  it("el owner autoriza y emite el evento", async function () {
    const { resolver } = await preparar();
    await viem.assertions.emitWithArgs(resolver.write.autorizar([emisorA.account.address, true]), resolver, "EmisorActualizado", [
      emisorA.account.address,
      true,
    ]);
    assert.equal(await resolver.read.autorizado([emisorA.account.address]), true);
  });

  it("un no-owner no puede autorizar", async function () {
    const { resolver } = await preparar();
    const comoB = await resolverDe(resolver, emisorB);
    await viem.assertions.revertWithCustomError(comoB.write.autorizar([emisorB.account.address, true]), resolver, "SoloOwner");
    assert.equal(await resolver.read.autorizado([emisorB.account.address]), false);
  });

  it("un emisor autorizado emite", async function () {
    const { eas, resolver, schemaUID } = await preparar();
    await resolver.write.autorizar([emisorA.account.address, true]);
    const uid = await emitir(eas, schemaUID, emisorA);
    const att = (await eas.read.getAttestation([uid])) as unknown as Atestacion;
    assert.equal(att.attester.toLowerCase(), emisorA.account.address.toLowerCase());
  });

  it("un emisor no autorizado se revierte", async function () {
    const { eas, schemaUID } = await preparar();
    await assert.rejects(emitir(eas, schemaUID, emisorB), /InvalidAttestation/);
  });

  it("un emisor desautorizado ya no emite, pero sí revoca lo que emitió antes", async function () {
    const { eas, resolver, schemaUID } = await preparar();
    await resolver.write.autorizar([emisorA.account.address, true]);
    const uid = await emitir(eas, schemaUID, emisorA);

    await resolver.write.autorizar([emisorA.account.address, false]);
    await assert.rejects(emitir(eas, schemaUID, emisorA), /InvalidAttestation/);

    const easA = await viem.getContractAt("EAS", eas.address, { client: { wallet: emisorA } });
    await easA.write.revoke([{ schema: schemaUID, data: { uid, value: 0n } }]);
    const att = (await eas.read.getAttestation([uid])) as unknown as Atestacion;
    assert.ok(att.revocationTime > 0n, "la attestation debió quedar revocada");
  });

  it("transferirOwner: solo el owner, y rechaza la dirección cero", async function () {
    const { resolver } = await preparar();
    await viem.assertions.revertWithCustomError(resolver.write.transferirOwner([zeroAddress]), resolver, "DireccionInvalida");
    const comoB = await resolverDe(resolver, emisorB);
    await viem.assertions.revertWithCustomError(comoB.write.transferirOwner([emisorB.account.address]), resolver, "SoloOwner");
    await resolver.write.transferirOwner([emisorB.account.address]);
    assert.equal(((await resolver.read.owner()) as string).toLowerCase(), emisorB.account.address.toLowerCase());
  });
});
