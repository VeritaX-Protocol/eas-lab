# Ejercicio 02: schema y primera attestation

**Bloque:** consola | **Dificultad:** baja | **Tiempo:** 2 h | **Depende de:** 01

## Objetivo

Registrar el schema del certificado (sin resolver todavía) y crear la primera attestation con datos de ejemplo.

## Qué vas a entender

- Un schema es una plantilla de campos y **no se puede modificar** una vez registrado.
- El UID del schema es determinista: mismo texto, mismo resolver y mismo `revocable` dan el mismo UID.
- Por qué el `recipient` va en la dirección cero (el titular no necesita wallet y no queremos vincular a una persona on-chain).

## Schema del certificado (versión 1)

```
bytes32 certificadoId, string plantillaArweaveId, bytes32 hashPlantilla, bytes32 hashDatos, string codigoCurso, uint64 fechaEmision, uint64 vigenciaHasta
```

- `certificadoId`: 32 bytes aleatorios, identificador interno del certificado.
- `plantillaArweaveId`: ID de transacción de Arweave (por ahora, un valor de ejemplo).
- `hashPlantilla`: hash del archivo SVG (por ahora, un valor de ejemplo).
- `hashDatos`: hash con sal de los datos personales (por ahora, un valor de ejemplo; se calcula de verdad en el ejercicio 05).
- `codigoCurso`: código del programa.
- `fechaEmision` y `vigenciaHasta`: fechas Unix en segundos (`0` = sin vencimiento).

## Instrucciones para Claude Code

### Archivos a crear

- `shared/schemas.js`: constante con el texto del schema y funciones para codificar y decodificar datos con `SchemaEncoder`.
- `shared/schemas.json`: guarda el UID registrado **por chainId** (la cadena es configurable).
- `ejercicios/02-schema/registrar-schema.js`
- `ejercicios/02-schema/crear-attestation.js`

### Pasos

1. `registrar-schema.js`: con la wallet `admin`, registrar el schema en el SchemaRegistry con `resolver = dirección cero` y `revocable = true`. Si ya existe (error de "ya registrado"), calcular el UID de forma determinista y continuar sin fallar. Guardar el UID en `shared/schemas.json`.
2. `crear-attestation.js`: con `emisorA`, codificar datos de ejemplo (valores falsos, claramente de prueba), crear la attestation con `recipient` en dirección cero, `expirationTime` en 0 y `revocable` en true. Esperar la confirmación.
3. Imprimir el UID de la attestation y el enlace a EASScan de Base Sepolia (verificar la URL actual).

## Criterio de éxito

- Aparece el UID del schema y el de la attestation.
- En EASScan se ven los campos decodificados y coinciden con lo enviado.
- Ejecutar `registrar-schema.js` dos veces no produce error.

## Casos negativos

- Attestation con un UID de schema inexistente: debe fallar con error claro.
- Datos con tipos mal formados (por ejemplo, un `bytes32` de longitud incorrecta): el codificador debe rechazarlos antes de enviar.

## Preguntas de comprensión

1. ¿Por qué no se puede "editar" un schema y qué haríamos si nos equivocamos de campo?
2. ¿Qué información pública quedó escrita al emitir la attestation? ¿Hay algún dato personal?
3. ¿Por qué `recipient` es la dirección cero?

## Qué anotar

UID del schema, UID de la attestation, gas usado, y cualquier diferencia entre el SDK y lo descrito aquí.

## Advertencias

- Todo lo que se escribe es público y permanente. Usa solo datos de ejemplo.
- Si cambias el texto del schema, el UID cambia. Anota la versión.
