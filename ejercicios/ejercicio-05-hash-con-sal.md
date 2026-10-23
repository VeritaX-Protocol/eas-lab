# Ejercicio 05: hash con sal

**Bloque:** consola | **Dificultad:** media | **Tiempo:** 2 a 3 h | **Depende de:** nada (puede hacerse en paralelo con 02)

## Objetivo

Construir la función que calcula el hash con sal de los datos personales y demostrar por qué la sal es indispensable.

## Qué vas a entender

- Un hash no se "desencripta": solo permite comprobar si unos datos coinciden.
- Por qué `hash(cédula)` sin sal se rompe en segundos.
- Los problemas reales: espacios, mayúsculas, tildes y concatenación ambigua.

## Instrucciones para Claude Code

### Archivos a crear

- `shared/hash.js` (debe funcionar igual en Node y en el navegador, así que usa `@noble/hashes` y no módulos exclusivos de Node).
- `ejercicios/05-hash/hash.test.js`
- `ejercicios/05-hash/ataque-demo.js`

### Funciones de `shared/hash.js`

- `normalizar(texto)`: normalización Unicode NFC, `trim`, colapsar espacios repetidos y pasar a mayúsculas con configuración regional del español. **No eliminar tildes** (decisión a documentar: "JOSÉ" y "JOSE" son distintos).
- `generarSal()`: 32 bytes aleatorios criptográficos, en hexadecimal.
- `calcularHashDatos(datos)` con `datos = { nombre, tipoDoc, numeroDoc, codigoCurso, fechaEmision, certificadoId, hashPlantilla, sal }`. Construye una representación canónica: un arreglo JSON con los campos en **orden fijo** y un prefijo de versión (`"cert-v1"`), lo codifica en UTF-8 y calcula keccak-256. Devuelve un `bytes32` en hexadecimal.

### Pruebas obligatorias

1. Determinismo: mismos datos y misma sal dan el mismo hash.
2. Cambiar cualquier campo (incluso una letra) cambia el hash.
3. Distinta sal da distinto hash con los mismos datos.
4. Ambigüedad: nombre `"AB"` con curso `"C"` debe dar hash distinto que nombre `"A"` con curso `"BC"`.
5. Normalización: `"  José   Pérez "` y `"JOSÉ PÉREZ"` dan el mismo hash, y la misma tilde escrita en NFC o NFD también.
6. Campo faltante o `undefined`: lanza error.

### Demostración de por qué la sal importa (`ataque-demo.js`)

1. Calcular `keccak256(numeroDeCedula)` sin sal para un número de prueba inventado.
2. Recuperarlo probando todos los números de un rango de 1 millón. Medir el tiempo y extrapolar a 100 millones.
3. Repetir el intento contra el hash con sal de 32 bytes y mostrar que no es viable.

Esto es una demostración educativa sobre datos inventados por ti mismo.

## Criterio de éxito

- Todas las pruebas pasan.
- La demo muestra el tiempo de ruptura sin sal y su inviabilidad con sal.
- `hashDatos` calculado aquí se puede usar en el ejercicio 02 en lugar del valor de ejemplo.

## Preguntas de comprensión

1. ¿Por qué cada certificado necesita su propia sal y no una sal global?
2. ¿Por qué se normaliza el nombre antes de hacer el hash?
3. Si borramos la sal de nuestra base de datos, ¿qué le pasa al hash que quedó en la cadena?

## Qué anotar

Decisión de normalización (tildes, mayúsculas), formato canónico elegido, tiempo medido de la demo.

## Advertencias

- Cambiar el formato canónico después de emitir certificados rompe todas las verificaciones. El prefijo de versión existe para eso.
