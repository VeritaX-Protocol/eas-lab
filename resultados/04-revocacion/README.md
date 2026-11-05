# Ejercicio 04: revocación

## Qué hace
`scripts/revocar.ts` ejecuta el ciclo completo en Base Sepolia:
1. `emisorA` emite una attestation nueva.
2. Se verifica con el verificador (copiado del 03): `VALIDO_PENDIENTE_HASH`.
3. `emisorA` la revoca (solo el attester original puede).
4. Se verifica de nuevo: `REVOCADO`, con fecha de revocación.
5. Tres pruebas negativas, cada una debe fallar de forma controlada y se reporta el motivo:
   - `emisorB` intenta revocar la de `emisorA` → `AccessDenied`
   - `emisorA` la revoca por segunda vez → `AlreadyRevoked`
   - Schema idéntico pero `revocable=false`: se emite y se intenta revocar → `Irrevocable`

Las revocaciones rechazadas fallan en la estimación de gas, antes de enviarse, así que no cuestan gas. Una revocación es pública y permanente: no hay "des-revocar".

## Requisitos
- Ejercicios 01 a 03 hechos. `.env.local` es copia del de 03. `src/datos-entrada.json` trae el schema UID del 02.
- ETH en `emisorA` (emite y revoca), `emisorB` (solo intenta) y `admin` (registra el schema no revocable la primera vez).

## Cómo correrlo
Desde `resultados/04-revocacion/`:

```bash
npm install            # (npm ci)
npm test               # decodificación de errores del contrato y estado REVOCADO (sin red)
npm run typecheck      # tsc --noEmit
npm run revocar        # el ciclo completo en cadena
```
Cada `npm run revocar` emite 3 attestations nuevas (la revocada, una que queda viva y la del schema no revocable). El schema no revocable es solo para esta prueba: no lo uses después.

## Salida esperada
`VALIDO_PENDIENTE_HASH` → `REVOCADO` con `Revocado el <fecha ISO>`, y tres líneas "OK, falló como se esperaba" con `AccessDenied`, `AlreadyRevoked` e `Irrevocable`.

## Estructura
`src/` (`errores.ts` traduce los selectores de error del contrato, `emitir.ts` emite el ejemplo, + copias del 03: config, wallets, eas, cadena, esquema, directorio, lector, verificador, entrada) · `scripts/revocar.ts` · `test/` · `NOTA.md`.
