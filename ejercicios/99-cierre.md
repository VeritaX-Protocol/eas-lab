# Cierre: consolidar lo aprendido en EAS

**Cuándo:** cuando los ejercicios 01 a 09 tengan su `NOTA.md` en `resultados/`.

## 1. Revisión final

Comprueba que cada nota existe y está completa. Con ayuda de Claude Code, genera `resultados/RESUMEN.md` con:

- Una tabla de decisiones (tema, decisión, ejercicio que la respalda, riesgo pendiente).
- Los nombres reales de funciones y versiones de paquetes que difirieron de este plan.
- Los costos medidos y el supuesto de precio.
- Las preguntas abiertas, separando las técnicas de las legales.

## 2. Preguntas que deben quedar respondidas

| Tema | Pregunta |
|---|---|
| Cadena | ¿EAS en Base cumple lo medido en costos y latencia? |
| Resolver | ¿El diseño de autorización y la rotación del owner son suficientes? ¿Se usará multisig? |
| Gas | ¿Cuánto gas paga cada entidad por certificado y cómo mantiene fondeada su wallet? ¿Hará falta un relayer? |
| Datos | ¿Qué datos van en el hash y cuáles se quedan fuera de la cadena? |
| Modos | ¿Qué certificados usarán el modo A (on-chain) y cuáles el B (off-chain)? |
| Multichain | ¿La cadena es realmente configurable en todo el código? |

## 3. Qué pasa con el código del laboratorio

- Se conserva como referencia y **no se copia** a los repositorios del producto.
- Lo que se lleva al producto son las decisiones y los hallazgos del `RESUMEN.md`.

## 4. Siguiente paso

Los resultados alimentan el resto de laboratorios y los repositorios finales de la organización (API REST y frontend).

## 5. Prompt sugerido para Claude Code

> Lee `resultados/RESUMEN.md` y `LEEME.md`. Lista las decisiones de EAS que los ejercicios no resolvieron y propón qué debería investigar el siguiente laboratorio.
