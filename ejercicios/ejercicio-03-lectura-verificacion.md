# Ejercicio 03: leer y verificar por UID

**Bloque:** consola | **Dificultad:** media | **Tiempo:** 2 a 3 h | **Depende de:** 02

## Objetivo

Construir el módulo verificador que, dado un UID, lee la attestation y devuelve un **estado** claro. Este módulo es la base de cualquier verificador posterior.

## Qué vas a entender

- Qué campos tiene una attestation (attester, schema, tiempo, revocación, datos).
- Que un UID inexistente no necesariamente produce un error: puede devolver una estructura vacía (verifícalo).
- La diferencia entre la expiración de EAS y la `vigenciaHasta` propia del certificado.

## Instrucciones para Claude Code

### Archivos a crear

- `shared/directorio.js` y `shared/directorio.json`: directorio de entidades registradas (`{ direccionWallet: { nombre, nit } }`), con `emisorA` registrado y `emisorB` ausente.
- `shared/verificador.js`: exporta `verificarAttestation(uid, opciones)`.
- `ejercicios/03-lectura/leer.js`: recibe un UID por línea de comandos e imprime el resultado.
- `ejercicios/03-lectura/verificador.test.js`: pruebas con `node:test`.

### Estados que debe devolver el verificador

| Estado | Condición |
|---|---|
| `NO_ENCONTRADO` | El UID no corresponde a ninguna attestation |
| `SCHEMA_INCORRECTO` | Existe, pero no es de nuestro schema |
| `REVOCADO` | Tiene fecha de revocación |
| `EXPIRADO` | Pasó la expiración de EAS o la `vigenciaHasta` del certificado |
| `EMISOR_NO_REGISTRADO` | El attester no está en el directorio |
| `VALIDO_PENDIENTE_HASH` | Todo bien hasta aquí; falta comparar el hash de datos (ejercicio 05) |

Cada resultado incluye `{ estado, detalle, emisor, fechaEmision, camposDecodificados }`.

### Pasos

1. Leer la attestation con el SDK y decodificar sus datos con `SchemaEncoder`.
2. Aplicar los estados en el orden de la tabla (el orden importa: un revocado no debe aparecer como válido).
3. Escribir las pruebas.
4. Opcional: consultar el API GraphQL del indexador de EASScan para listar attestations por attester (verificar el endpoint actual).

## Criterio de éxito

- `leer.js <uid-del-ejercicio-02>` devuelve `VALIDO_PENDIENTE_HASH` con los campos decodificados.
- Pruebas verdes para: UID aleatorio, UID de otro schema, y attestation válida.

## Casos negativos

- UID mal formado (longitud incorrecta): error controlado, no un crash.
- Attestation de `emisorB` (no registrado): `EMISOR_NO_REGISTRADO`.

## Preguntas de comprensión

1. ¿Por qué el orden de las comprobaciones importa?
2. ¿Qué significa "no encontrado" y por qué no debemos mostrar "falso"?
3. ¿Qué diferencia hay entre `expirationTime` de EAS y `vigenciaHasta`?

## Qué anotar

Comportamiento real del SDK con UIDs inexistentes, tiempo de respuesta de cada lectura, y si el RPC público limitó las consultas.
