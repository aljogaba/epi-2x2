# Validación

## Caso fuente Excel

Tabla:

- a = 15
- b = 35
- c = 45
- d = 5

Resultados esperados aproximados:

- RR = 0.3333
- OR = 0.0476
- RA = -0.6000
- IC 95 % RR = 0.2118 – 0.5247
- IC 99 % RR = 0.1835 – 0.6056
- IC 95 % OR = 0.0158 – 0.1437
- IC 99 % OR = 0.0111 – 0.2038

## Validación de codificación

La versión `v0.2.0-dev` conserva la matriz fija:

- a = categoría superior / evento sí.
- b = categoría superior / evento no.
- c = categoría inferior / evento sí.
- d = categoría inferior / evento no.

La mejora de esta versión es conceptual e interpretativa: la herramienta ya no asume que la variable capturada es siempre factor de riesgo; ahora interpreta la categoría superior contra la inferior.


## Validación del módulo chi cuadrada

La versión `v0.3.0-dev` agrega chi cuadrada de Pearson para tablas 2 × 2.

Para tablas con conteos suficientes, se reporta:

- χ² de Pearson.
- Valor p para gl = 1.
- Frecuencias esperadas bajo independencia.
- Advertencia si alguna esperada es menor de 5.

La corrección de 0.5 para celdas con cero se mantiene restringida a RR/OR e intervalos. La prueba de chi cuadrada usa conteos observados.
