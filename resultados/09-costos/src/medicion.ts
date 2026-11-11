/** Una transacción medida. Todo en unidades enteras (gas, wei, bytes); se guarda como texto en el JSON. */
export interface Muestra {
  gas: bigint;
  precioEfectivoWei: bigint;
  /** Parte L2: gas × precio efectivo. */
  feeL2Wei: bigint;
  /** Parte L1 (publicación de datos): campo `l1Fee` del recibo crudo del stack OP. */
  l1FeeWei: bigint;
  totalWei: bigint;
  bytesDatos: number;
}

/** Lo mínimo que se necesita de un provider (así se prueba sin red). */
export interface ConRpc {
  send(metodo: string, params: unknown[]): Promise<unknown>;
}

const hex = (v: unknown, campo: string): bigint => {
  if (typeof v !== "string") throw new Error(`El recibo no trae "${campo}"`);
  return BigInt(v);
};

/**
 * Lee el recibo CRUDO (eth_getTransactionReceipt): ahí viene `l1Fee`, que ethers no expone.
 * Si el nodo no devuelve `l1Fee` falla en voz alta en vez de contar la parte L1 como cero.
 */
export async function leerMuestra(rpc: ConRpc, hash: string, bytesDatos: number): Promise<Muestra> {
  const r = (await rpc.send("eth_getTransactionReceipt", [hash])) as Record<string, unknown> | null;
  if (!r) throw new Error(`No hay recibo para ${hash}`);
  const gas = hex(r.gasUsed, "gasUsed");
  const precioEfectivoWei = hex(r.effectiveGasPrice, "effectiveGasPrice");
  const l1FeeWei = hex(r.l1Fee, "l1Fee");
  const feeL2Wei = gas * precioEfectivoWei;
  return { gas, precioEfectivoWei, feeL2Wei, l1FeeWei, totalWei: feeL2Wei + l1FeeWei, bytesDatos };
}

export interface Estadistica {
  promedio: bigint;
  min: bigint;
  max: bigint;
}

export function estadistica(valores: bigint[]): Estadistica {
  if (valores.length === 0) throw new Error("No hay valores para calcular la estadística");
  const suma = valores.reduce((a, b) => a + b, 0n);
  return {
    promedio: suma / BigInt(valores.length),
    min: valores.reduce((a, b) => (b < a ? b : a)),
    max: valores.reduce((a, b) => (b > a ? b : a)),
  };
}

/** Operación medida: `certificadosPorTx` permite hablar de costo POR CERTIFICADO en los lotes. */
export interface OperacionMedida {
  id: string;
  nombre: string;
  certificadosPorTx: number;
  muestras: Muestra[];
  /** false si el script paró antes de las repeticiones pedidas (p. ej. por falta de saldo). */
  completo: boolean;
}

/** bigint no es JSON: se guarda como texto y se recupera con `deJsonResultados`. */
export function aJsonResultados(v: unknown): string {
  return JSON.stringify(v, (_k, x: unknown) => (typeof x === "bigint" ? x.toString() : x), 2);
}
export function muestrasDeJson(crudo: Array<Record<string, string | number>>): Muestra[] {
  return crudo.map((m) => ({
    gas: BigInt(m.gas), precioEfectivoWei: BigInt(m.precioEfectivoWei), feeL2Wei: BigInt(m.feeL2Wei),
    l1FeeWei: BigInt(m.l1FeeWei), totalWei: BigInt(m.totalWei), bytesDatos: Number(m.bytesDatos),
  }));
}
