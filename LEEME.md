# Plan de ejercicios: laboratorio EAS

## 1. Contexto del laboratorio (léelo siempre)

`eas-lab` es el laboratorio de calentamiento de EAS de la organización VeritaXProtocol. Son ejercicios cortos y **desechables** para aprender las bases de EAS (Ethereum Attestation Service) en **Base Sepolia** antes de construir el producto: certificados, diplomas y carnets verificables.

Cubre solo EAS: conexión, schemas, attestations, lectura, revocación, hash con sal, resolver, emisión directa, modo off-chain y costos. Los otros temas viven en otros repositorios de la organización (otros laboratorios y los repos finales de API y frontend). Aquí no hay Arweave, PDF/QR, cifrado de datos ni interfaces web.

### Decisiones ya tomadas

| Tema | Decisión |
|---|---|
| Cadena | Base Sepolia (testnet) |
| Modo principal | On-chain con hash con sal (modo A). Off-chain firmado (modo B) solo como ejercicio |
| Emisores autorizados | Contrato resolver propio |
| Gas | Envío directo: cada entidad firma y paga su propio gas |
| Cadena configurable | chainId, RPC y direcciones vienen de configuración, nunca fijos en el código |
| Lenguaje | **TypeScript** en todos los ejercicios (sección 5.1) |
| Contratos | Hardhat 3 (no Foundry) |
| Idioma | Explicaciones en español; código y nombres técnicos en inglés |

## 2. Principios no negociables (constitución preliminar)

1. Ningún dato personal en la cadena. Jamás.
2. El hash siempre lleva una sal aleatoria única por certificado. Nunca `hash(cédula)` a secas.
3. Los datos personales se guardan cifrados. Las llaves no viven en el código ni en el repositorio.
4. **Solo testnet y llaves de prueba.** Nunca mainnet, nunca llaves reales en estos ejercicios.
5. Todo certificado es revocable.
6. La verificación distingue estados y muestra disclaimers. "No encontrado" no significa "falso".
7. El código de los spikes es desechable. No pasa a producción sin pasar por una especificación.

## 3. Reglas para Claude Code

Antes de empezar un ejercicio, lee este archivo y el archivo del ejercicio pedido. Luego:

1. **No adelantes ejercicios.** Haz solo el que se pide y detente al terminar.
2. **Trabaja en pasos pequeños.** Antes de cada bloque de código, explica en 2 a 4 líneas qué vas a hacer y por qué. Comentarios del código en español. Funciones cortas.
3. **No instales dependencias que no estén listadas** sin preguntar primero. Anota la versión instalada de cada una.
4. **No confíes en tu memoria para nombres del SDK de EAS ni para la API de Hardhat 3.** Los nombres de funciones en este plan pueden haber cambiado. Verifica contra la documentación de EAS y contra el paquete instalado (`node_modules`). Si un nombre difiere, usa el real y anótalo en la nota del ejercicio.
5. **Seguridad:** nunca imprimas una llave privada completa, nunca hagas commit de `.env.local`, nunca uses mainnet.
6. **Si algo falla, no lo parches en silencio.** Explica el error, la causa y qué cambiaste.
7. **Ante una duda de diseño, pregunta** en vez de decidir.
8. **Al terminar:** ejecuta el criterio de éxito, escribe `NOTA.md` en la carpeta del ejercicio con la plantilla de abajo, muestra un resumen "Qué aprendí" y **detente a esperar** que el usuario revise.

### Dos modos de trabajo (elige por ejercicio)

- **Modo A (Claude Code escribe):** Claude Code implementa y explica. Tú lees, ejecutas y respondes las preguntas de comprensión.
- **Modo B (tú escribes):** tú escribes el código siguiendo el ejercicio y Claude Code solo revisa, explica errores y sugiere. Recomendado para los ejercicios 01 a 05, donde se aprenden los conceptos base.

### Prompt sugerido para iniciar un ejercicio

> Lee `LEEME.md` y `ejercicio-NN-nombre.md`. Ejecuta solo ese ejercicio en modo A (o B), siguiendo las reglas. Explica cada paso, escribe la nota en `resultados/NN-nombre/NOTA.md` y detente al terminar.

## 4. Preparación inicial (una sola vez)

- **Node.js 22.13.0 o superior** (verifícalo con `node -v`; es el mínimo que exige Hardhat 3), npm (o pnpm) y git.
- **Hardhat 3** (última versión mayor) para el ejercicio 06, **no Foundry**. Guía: https://hardhat.org/docs/getting-started. Se inicializa con `npx hardhat --init` dentro de `resultados/06-resolver/` (proyecto propio, con su `package.json`). Verifica los comandos en la documentación vigente antes de usarlos.
- **Fondos de prueba:** consigue ETH de Base Sepolia en un faucet reconocido (la documentación de Base mantiene una lista actualizada). Se necesita poco.
- **Red:** Base Sepolia, chainId `84532`. RPC público `https://sepolia.base.org` (tiene límites de uso). Verifica estos datos en la documentación de Base.
- **Direcciones de EAS:** en las cadenas del stack OP, EAS y el registro de schemas son contratos predesplegados (direcciones `0x4200...0021` y `0x4200...0020`). Verifica en la documentación de EAS antes de usarlas y guárdalas en configuración.

### Wallets de prueba (se generan en el ejercicio 01)

| Rol | Para qué |
|---|---|
| `admin` | Dueño del resolver, administra emisores |
| `emisorA` | Entidad autorizada |
| `emisorB` | Entidad NO autorizada (para pruebas negativas) |

### Dependencias previstas

**TypeScript** (`typescript`, `tsx`, `@types/node`) en todos los ejercicios, además de: `ethers` (v6), `@ethereum-attestation-service/eas-sdk`, `dotenv`, `@noble/hashes`, `node:test` (ya viene con Node) y `hardhat` (v3, ejercicio 06). Fija las versiones al instalar.

## 5. Estructura de los spikes: un ejercicio, un proyecto autocontenido

**Regla central:** cada ejercicio es un proyecto completo e independiente dentro de `resultados/NN-nombre/`, con el número y el nombre del archivo del ejercicio. **No hay carpetas compartidas entre ejercicios** (nada de `shared/`, `server/`, `web/` ni `plantillas/` en la raíz). Se podría borrar cualquier otra carpeta de ejercicio y el ejercicio seguiría funcionando.

```
resultados/
  01-conexion/
    package.json          (type: "module"; solo las dependencias de ESTE ejercicio)
    tsconfig.json         (strict; propio de este ejercicio)
    node_modules/
    .gitignore            (node_modules, .env.local, *.db)
    .env.example          (nombres de variables, sin valores)
    .env.local            (llaves y configuración; nunca se commitea)
    src/                  (config, wallets y demás módulos propios del ejercicio)
    scripts/              (los scripts que se ejecutan: generar-wallets.ts, conectar.ts, ...)
    test/                 (pruebas con node:test, en .test.ts)
    NOTA.md               (la nota del ejercicio, con la plantilla de la sección 7)
  02-schema-attestation/
    ... (misma forma)
  06-resolver/            (además: contracts/, ignition/, hardhat.config.ts del proyecto Hardhat 3)
```

Reglas:

1. **Todo dentro de la carpeta del ejercicio:** código, `package.json`, `node_modules`, `.env.local`, datos de entrada y salida, pruebas, informes y la nota. Los comandos se ejecutan desde esa carpeta (`cd resultados/NN-nombre && npm install && node scripts/...`).
2. **Nada se importa de otro ejercicio.** Ninguna ruta del tipo `../02-schema/...`. Si un ejercicio necesita código de uno anterior (por ejemplo, 03 usa lo de 02), **se copia** a su propia carpeta y se anota de dónde vino en `NOTA.md`. Se admite la duplicación: el código de los spikes es desechable.
3. **Datos que arrastra un ejercicio de otro** (UID de schema, dirección del resolver, hash de la plantilla, directorio de entidades) se copian a un archivo de datos propio (por ejemplo `datos-entrada.json`) y se anota el ejercicio de origen. Dentro del ejercicio, lo que antes era `shared/schemas.json`, `shared/directorio.json`, `shared/plantillas.json` o similar vive en su propia carpeta.
4. **Wallets y llaves:** `generar-wallets.js` se ejecuta una sola vez, en el ejercicio 01. Los ejercicios posteriores **copian** el `.env.local` del ejercicio 01 a su carpeta para reutilizar las mismas wallets y los mismos fondos (copia del archivo, nunca regenerar llaves ni imprimirlas). Pide confirmación al usuario antes de copiarlo.
5. **Dependencias:** cada ejercicio instala solo las suyas, con versiones fijas, y las anota en `NOTA.md`. Con `"type": "module"`, las rutas se resuelven dentro del propio ejercicio.
6. Crea la carpeta al empezar el ejercicio, no antes, y no crees las de ejercicios posteriores.
7. Las rutas de los archivos de ejercicio (`shared/...`, `notas/NN.md`, `ejercicios/NN-.../`) se **leen relativas a la carpeta del ejercicio**: `shared/x.js` pasa a `src/x.ts`, `notas/NN.md` pasa a `NOTA.md` y `ejercicios/NN-nombre/y.js` pasa a `scripts/y.ts`. Toda extensión `.js` de las especificaciones se escribe `.ts`. Esta sección prevalece sobre las rutas de cada archivo.

### 5.1 Lenguaje: TypeScript (obligatorio)

Todo el código de los ejercicios se escribe en **TypeScript**, no en JavaScript. Motivo: los tipos hacen explícito qué recibe y qué devuelve cada función, y eso facilita leer y entender el código, sobre todo cuando los ejemplos los genera Claude Code automáticamente.

- Extensión `.ts` para scripts, módulos, pruebas (`*.test.ts`), servidor y lógica de las páginas web. Las páginas HTML pueden quedar como `.html` y cargan el `.ts` ya transpilado (por ejemplo con `tsx`, `esbuild` o `vite`; elige la opción más simple y anótala en `NOTA.md`).
- Cada ejercicio trae su propio `tsconfig.json` con `"strict": true`, `"module": "NodeNext"` y `"moduleResolution": "NodeNext"`. Verifica las opciones en la documentación vigente de TypeScript.
- **Ejecutar:** `npx tsx scripts/archivo.ts`. **Pruebas:** `node --import tsx --test test/*.test.ts`. **Revisar tipos:** `npx tsc --noEmit`, que debe pasar sin errores antes de dar el ejercicio por terminado (se suma al criterio de éxito).
- Tipos explícitos en las firmas de funciones, parámetros y valores devueltos; interfaces o tipos con nombre para las estructuras de datos (attestation, certificado, configuración). Prohibido `any` salvo que se justifique en un comentario. Comentarios en español, como en el resto.
- Si un paquete no trae tipos, instala los `@types/...` correspondientes o declara los tipos mínimos y anótalo en `NOTA.md`.
- El ejercicio 06 usa Hardhat 3, que ya trabaja con TypeScript (`hardhat.config.ts`, pruebas en `.ts`).
- Si el SDK de EAS u otra librería no funciona bien con ESM en Node, resuélvelo dentro del ejercicio y explica la causa en `NOTA.md`, sin parchear en silencio.

## 6. Tabla de contenido: orden de los ejercicios

| # | Archivo | Tema | Bloque | Depende de |
|---|---|---|---|---|
| 01 | `ejercicios/ejercicio-01-conexion.md` | Conexión, wallets y fondos | Consola | – |
| 02 | `ejercicios/ejercicio-02-schema-attestation.md` | Schema y primera attestation | Consola | 01 |
| 03 | `ejercicios/ejercicio-03-lectura-verificacion.md` | Leer y verificar por UID | Consola | 02 |
| 04 | `ejercicios/ejercicio-04-revocacion.md` | Revocar | Consola | 02, 03 |
| 05 | `ejercicios/ejercicio-05-hash-con-sal.md` | Hash con sal | Consola | – |
| 06 | `ejercicios/ejercicio-06-resolver.md` | Resolver de emisores autorizados | Consola + Solidity | 02 |
| 07 | `ejercicios/ejercicio-07-emision-directa.md` | Emisión directa e idempotencia | Consola | 02, 06 |
| 08 | `ejercicios/ejercicio-08-offchain.md` | Off-chain firmado y timestamp | Consola | 02, 03 |
| 09 | `ejercicios/ejercicio-09-costos.md` | Medición de costos | Consola | 02, 06, 07, 08 |
| 99 | `ejercicios/99-cierre.md` | Consolidar decisiones | Cierre | todos |

## 7. Plantilla de nota (`NOTA.md` dentro de la carpeta del ejercicio)

```
# Nota del ejercicio NN
Fecha:
Versiones usadas (Node, paquetes, Hardhat):
Código o datos copiados de otros ejercicios (y de cuál):
Qué hice:
Qué funcionó:
Qué falló o me sorprendió:
Nombres de funciones del SDK que difirieron del plan:
Decisión para la especificación:
Costos o tiempos medidos:
Preguntas abiertas:
```

## 8. Glosario mínimo

- **Attestation:** declaración firmada y registrada en EAS.
- **Schema:** plantilla de campos de una attestation. No se puede modificar una vez registrado.
- **UID:** identificador único de un schema o de una attestation.
- **Attester:** quien firma la attestation (la entidad emisora).
- **Resolver:** contrato que EAS consulta para aceptar o rechazar una attestation.
- **Hash con sal:** huella irreversible de los datos mezclados con un valor aleatorio.
- **AEAD (AES-GCM):** cifrado que además detecta manipulación.
- **DEK / KEK:** llave de datos / llave que protege a las llaves de datos.
