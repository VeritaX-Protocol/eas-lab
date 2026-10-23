# Ejercicio 04: revocación

**Bloque:** consola | **Dificultad:** baja | **Tiempo:** 1 a 2 h | **Depende de:** 02, 03

## Objetivo

Revocar una attestation y comprobar quién puede hacerlo, cuándo falla y cómo lo ve el verificador.

## Qué vas a entender

- Solo el attester original puede revocar.
- Una revocación es pública y permanente: no se puede "des-revocar".
- Un schema registrado como no revocable nunca permite revocar.

## Instrucciones para Claude Code

### Archivos a crear

- `ejercicios/04-revocacion/revocar.js`
- `ejercicios/04-revocacion/revocacion.test.js`

### Pasos

1. Crear una attestation nueva con `emisorA` (reutiliza el script del ejercicio 02).
2. Verificarla: debe salir `VALIDO_PENDIENTE_HASH`.
3. Revocarla con `emisorA`.
4. Verificarla de nuevo: debe salir `REVOCADO` con la fecha de revocación.
5. Pruebas negativas (cada una debe fallar de forma controlada):
   - `emisorB` intenta revocar la attestation de `emisorA`.
   - `emisorA` intenta revocarla por segunda vez.
   - Registrar un segundo schema idéntico pero con `revocable = false`, crear una attestation y tratar de revocarla.

## Criterio de éxito

- La revocación cambia el estado a `REVOCADO`.
- Las tres pruebas negativas fallan y el script reporta el motivo de cada una.

## Preguntas de comprensión

1. Si revocamos por error un título válido, ¿cómo se corrige? (Pista: no se puede deshacer.)
2. ¿Por qué todos nuestros schemas serán `revocable = true`?
3. ¿Qué pasa con una revocación si el emisor pierde su llave?

## Qué anotar

Gas de la revocación, mensajes de error exactos de cada caso negativo, y la decisión sobre cómo se corrige una revocación equivocada (emitir una nueva attestation y registrar el motivo).

## Advertencias

- El segundo schema (no revocable) es solo para esta prueba. No lo uses después.
