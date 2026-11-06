# Ejercicio 05: hash con sal

Función que calcula el hash con sal de los datos de un certificado y demostración de por qué la sal es indispensable. **Laboratorio, no producto.** Es independiente: no usa la cadena, wallets ni `.env.local`.

## Qué hace
- `src/hash.ts`: `normalizar`, `generarSal` y `calcularHashDatos` (keccak-256 de un arreglo JSON `["cert-v1", ...campos en orden fijo]`, devuelve `bytes32`). Usa `@noble/hashes`, así que sirve igual en Node y en el navegador.
- `scripts/ataque-demo.ts`: rompe `keccak256(cédula)` sin sal probando 1 millón de números, extrapola a 100 millones y muestra que con sal de 32 bytes no es viable.
- `test/hash.test.ts`: las 6 pruebas obligatorias (+ tildes y sal).

## Cómo correrlo
```
cd resultados/05-hash-con-sal
npm install
npm test            # pruebas
npm run typecheck   # tsc --noEmit
npm run demo        # demostración del ataque (~15 s)
```

## Salida esperada
Pruebas: 8 de 8 en verde. Demo: cédula inventada recuperada en segundos sin sal; con sal, "NO recuperada" y un tiempo estimado astronómico.

## Casos negativos probados
Campo ausente, `undefined` o vacío lanza error; "AB"+"C" ≠ "A"+"BC"; "JOSÉ" ≠ "JOSE".
