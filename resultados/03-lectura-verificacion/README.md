# Ejercicio 03: lectura y verificación por UID

## Qué hace
Un **módulo verificador**: dado el UID de una attestation, la lee de la cadena, decodifica sus datos y devuelve un **estado** claro (`src/verificador.ts`). Es la base de cualquier verificador posterior.

| Estado | Condición |
|---|---|
| `NO_ENCONTRADO` | El UID no corresponde a ninguna attestation (aviso: no significa "falso") |
| `SCHEMA_INCORRECTO` | Existe, pero no es de nuestro schema |
| `REVOCADO` | Tiene fecha de revocación |
| `EXPIRADO` | Pasó el `expirationTime` de EAS o la `vigenciaHasta` del certificado |
| `EMISOR_NO_REGISTRADO` | El attester no está en `src/directorio.json` |
| `VALIDO_PENDIENTE_HASH` | Todo bien; falta comparar el hash de datos (ejercicio 05) |

Las comprobaciones se aplican **en ese orden** y la primera que falla manda. Un UID mal formado no es un estado: es un error controlado (`UidInvalidoError`, salida 2) y ni siquiera se consulta la cadena.

El verificador recibe un *lector* inyectable (`src/lector.ts`): en producción lee con el SDK de EAS; en las pruebas es uno falso, así se cubren todos los estados sin red.

## Requisitos
- Ejercicios 01 y 02 hechos. `.env.local` es copia del de 02 (mismas wallets). El UID del schema y la attestation de ejemplo vienen del 02 en `src/datos-entrada.json`.
- `npm run casos` necesita ETH en `admin`, `emisorA` y `emisorB`.

## Cómo correrlo
Desde `resultados/03-lectura-verificacion/`:

```bash
npm install                 # (npm ci)
npm test                    # 11 pruebas sin red: todos los estados, el orden y el UID mal formado
npm run typecheck           # tsc --noEmit
npm run casos               # UNA vez: crea en cadena una attestation de emisorB y una de otro schema (src/casos.json)
npm run leer                # verifica la attestation de ejemplo del 02
npm run leer -- <uid>       # verifica cualquier UID
```

## Salida esperada (Base Sepolia, verificado)
| UID | Estado |
|---|---|
| attestation del 02 (emisorA) | `VALIDO_PENDIENTE_HASH`, con campos decodificados y emisor "Entidad de Prueba A" |
| `emisorNoRegistrado` de `src/casos.json` | `EMISOR_NO_REGISTRADO` |
| `otroSchema` de `src/casos.json` | `SCHEMA_INCORRECTO` |
| 32 bytes aleatorios | `NO_ENCONTRADO` |
| `0x1234` | `Entrada inválida: UID mal formado…` (sin crash) |

`REVOCADO` se prueba solo con el lector falso: revocar en cadena es el ejercicio 04. `EXPIRADO`, también por pruebas.

## Estructura
`src/` (verificador, lector, directorio, entrada, + copias del 02: config, wallets, eas, cadena, esquema) · `scripts/` (leer, crear-casos) · `test/` · `NOTA.md`.
