// Demostración educativa sobre una cédula INVENTADA por nosotros.
import { calcularHashDatos, generarSal, keccakTexto, type DatosCertificado } from "../src/hash.js";

const RANGO = 1_000_000;
const ESPACIO_REAL = 100_000_000;
const CEDULA_INVENTADA = "734562";

// Fuerza bruta: prueba cada número del rango y compara con el hash objetivo.
function romper(objetivo: string, hashear: (n: string) => string): { hallado: string | null; ms: number } {
  const t0 = performance.now();
  let hallado: string | null = null;
  for (let n = 0; n < RANGO; n++) {
    const candidato = String(n);
    if (hashear(candidato) === objetivo) { hallado = candidato; break; }
  }
  return { hallado, ms: performance.now() - t0 };
}

// 1 y 2: hash sin sal.
const sinSal = keccakTexto(CEDULA_INVENTADA);
console.log("== Sin sal: keccak256(cédula) ==");
console.log("hash en cadena:", sinSal);
const r1 = romper(sinSal, keccakTexto);
console.log(`recuperada: ${r1.hallado} en ${r1.ms.toFixed(0)} ms`);
// Extrapolación del peor caso: se recorre todo el rango (no solo hasta el acierto).
const rRango = romper("0x" + "00".repeat(32), keccakTexto);
const msPorHash = rRango.ms / RANGO;
console.log(`recorrer ${RANGO.toLocaleString("es")} números: ${rRango.ms.toFixed(0)} ms (${(msPorHash * 1e6).toFixed(0)} ns/hash)`);
console.log(`extrapolado a ${ESPACIO_REAL.toLocaleString("es")}: ~${((msPorHash * ESPACIO_REAL) / 1000).toFixed(0)} s\n`);

// 3: hash con sal de 32 bytes. El atacante conoce todos los datos salvo la sal.
const datos: DatosCertificado = {
  nombre: "Persona Inventada", tipoDoc: "CC", numeroDoc: CEDULA_INVENTADA, codigoCurso: "CURSO-1",
  fechaEmision: "2026-10-30", certificadoId: "cert-demo", hashPlantilla: "0x" + "11".repeat(32), sal: generarSal(),
};
const conSal = calcularHashDatos(datos);
console.log("== Con sal de 32 bytes ==");
console.log("hash en cadena:", conSal);
// El atacante conoce el formato y el resto de campos, pero no la sal: prueba cédulas con una sal falsa.
const r3 = romper(conSal, (n) => calcularHashDatos({ ...datos, numeroDoc: n, sal: "00".repeat(32) }));
console.log(`intento con ${RANGO.toLocaleString("es")} cédulas: ${r3.hallado === null ? "NO recuperada" : "recuperada (!)"} en ${r3.ms.toFixed(0)} ms`);
const msPorIntento = r3.ms / RANGO;
const intentos = 2 ** 256;
const anios = (msPorIntento * intentos) / 1000 / 3.15e7;
console.log(`la sal añade 2^256 ≈ 1,2e77 posibilidades por cédula; a ${(1000 / msPorIntento).toFixed(0)} intentos/s ≈ ${anios.toExponential(1)} años`);
console.log("Inviable: la sal no se puede adivinar ni recorrer.");
