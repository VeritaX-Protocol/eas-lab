import { readFileSync, writeFileSync } from "node:fs";
import { formatEther } from "ethers";
import { RAIZ } from "../src/config.js";
import { ejecutar } from "../src/cadena.js";
import { estadistica, muestrasDeJson, type OperacionMedida } from "../src/medicion.js";

interface Parametros { precioEthUsd: number | null; precioGasGwei: number | null; l1FeeEthPorByte: number | null }
const VOLUMENES = [100, 1000, 10000];
const MODOS = ["attest", "multiattest10", "timestamp1", "timestamp10", "timestamp100"];

const eth = (w: bigint): string => Number(formatEther(w)).toFixed(10);
const rango = (e: { min: bigint; max: bigint }, f: (v: bigint) => string = String): string => `${f(e.min)} – ${f(e.max)}`;

ejecutar(async () => {
  const crudo = JSON.parse(readFileSync(`${RAIZ}resultados.json`, "utf8")) as { fecha: string; repeticiones: number; operaciones: Array<Omit<OperacionMedida, "muestras"> & { muestras: Array<Record<string, string | number>> }> };
  const params = JSON.parse(readFileSync(`${RAIZ}parametros.json`, "utf8")) as Parametros;
  const ops = crudo.operaciones.map((o) => ({ ...o, muestras: muestrasDeJson(o.muestras) }));
  const faltan = (Object.keys(params) as Array<keyof Parametros>).filter((k) => params[k] === null);
  const hayUsd = faltan.length === 0;

  // Costo por operación (por transacción)
  const filas = ops.map((o) => {
    const gas = estadistica(o.muestras.map((m) => m.gas));
    const total = estadistica(o.muestras.map((m) => m.totalWei));
    const l1 = estadistica(o.muestras.map((m) => m.l1FeeWei));
    const bytes = o.muestras[0]?.bytesDatos ?? 0;
    return `| ${o.nombre} | ${o.muestras.length}${o.completo ? "" : " (incompleto)"} | ${gas.promedio} (${rango(gas)}) | ${bytes} | ${eth(total.promedio)} | ${(Number(l1.promedio) / Number(total.promedio) * 100).toFixed(0)}% |`;
  });

  // Costo por certificado: cada muestra se divide entre los certificados de su transacción.
  const porCert = ops.filter((o) => o.certificadosPorTx > 0).map((o) => {
    const n = BigInt(o.certificadosPorTx);
    const gas = estadistica(o.muestras.map((m) => m.gas / n));
    const total = estadistica(o.muestras.map((m) => m.totalWei / n));
    const bytesCert = (o.muestras[0]?.bytesDatos ?? 0) / o.certificadosPorTx;
    return { id: o.id, nombre: o.nombre, gas, total, bytesCert };
  });
  const base = new Map(porCert.map((p) => [p.id, p]));
  const usd = (gas: bigint, bytesCert: number): string =>
    hayUsd ? ((Number(gas) * params.precioGasGwei! * 1e-9 + bytesCert * params.l1FeeEthPorByte!) * params.precioEthUsd!).toFixed(6) : "—";

  const tablaCert = porCert.map((p) => `| ${p.nombre} | ${p.gas.promedio} (${rango(p.gas)}) | ${p.bytesCert.toFixed(0)} | ${eth(p.total.promedio)} (${rango(p.total, eth)}) | ${usd(p.gas.promedio, p.bytesCert)} |`);
  const ahorro = (id: string, ref: string): string => {
    const a = base.get(id), r = base.get(ref);
    return a && r ? `${(100 - Number(a.gas.promedio) / Number(r.gas.promedio) * 100).toFixed(0)}%` : "n/d";
  };

  const escenarios: string[] = [];
  for (const id of MODOS) {
    const p = base.get(id);
    if (!p) continue;
    for (const v of VOLUMENES) {
      const n = BigInt(v);
      escenarios.push(`| ${p.nombre} | ${v} | ${p.gas.promedio * n} | ${eth(p.total.promedio * n)} (${rango({ min: p.total.min * n, max: p.total.max * n }, eth)}) | ${usd(p.gas.promedio * n, p.bytesCert * v)} |`);
    }
  }

  const md = `# Informe de costos (ejercicio 09)

Medido en **Base Sepolia (testnet)** el ${crudo.fecha.slice(0, 10)}, ${crudo.repeticiones} repeticiones por operación.

> **Los precios de testnet NO son representativos.** El ETH de testnet no vale nada y su precio del gas y de la parte L1 no se parecen a los de mainnet. Lo comparable son las **unidades de gas** y los **bytes enviados**. Los valores en ETH de abajo son solo lo que costó en testnet.

## Costo por operación (una transacción)
Costo total = parte L2 (gas × precio efectivo) + parte L1 (\`l1Fee\` del recibo crudo, publicación de datos en la L1).

| Operación | Muestras | Gas prom (mín – máx) | Bytes enviados | ETH testnet prom | % L1 |
|---|---|---|---|---|---|
${filas.join("\n")}

## Costo por certificado
Cada lote se divide entre sus certificados. Es un **rango**, no un número único.

| Modo | Gas por cert. prom (mín – máx) | Bytes por cert. | ETH testnet por cert. prom (mín – máx) | USD por cert. |
|---|---|---|---|---|
${tablaCert.join("\n")}

Ahorro de gas por certificado frente al modo individual:
- Attestation en lote de 10 vs directa: **${ahorro("multiattest10", "attest")}**
- Timestamp en lote de 10 vs individual: **${ahorro("timestamp10", "timestamp1")}**
- Timestamp en lote de 100 vs individual: **${ahorro("timestamp100", "timestamp1")}**

## Escenarios de volumen mensual
| Modo | Certificados al mes | Gas total | ETH testnet (mín – máx) | USD |
|---|---|---|---|---|
${escenarios.join("\n")}

No incluye revocaciones (dependen del porcentaje de certificados revocados) ni autorizar emisores (una vez por entidad).

## Parámetros que hay que actualizar antes de poner precios
Edita \`parametros.json\` y vuelve a correr \`npm run informe\`. ${hayUsd ? "Valores usados:" : `Faltan: **${faltan.join(", ")}**, por eso la columna USD está vacía (no se inventan precios).`}
- \`precioEthUsd\`: precio actual del ETH en USD (fuente actual, mainnet).
- \`precioGasGwei\`: precio del gas en la L2 (Base mainnet) en gwei, de una fuente actual. Se multiplica por las unidades de gas medidas.
- \`l1FeeEthPorByte\`: costo de publicar un byte en la L1, en ETH, de una fuente actual. Se multiplica por los bytes por certificado.
${hayUsd ? `\nUsados: ETH = ${params.precioEthUsd} USD, gas = ${params.precioGasGwei} gwei, L1 = ${params.l1FeeEthPorByte} ETH por byte.\n` : ""}
Además conviene repetir la medición en mainnet-fork o con datos reales de producción y revisar si cambian los costos de datos de la L1 (EIP-4844 y posteriores).
`;
  writeFileSync(`${RAIZ}informe.md`, md);
  console.log("informe.md generado");
});
