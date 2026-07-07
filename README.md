# Epi 2×2

**Calculadora epidemiológica para tablas de contingencia**

Epi 2×2 es una herramienta web para calcular medidas de asociación y riesgo a partir de tablas de contingencia 2 × 2.

La herramienta permite estimar:

- Riesgo relativo (RR)
- Odds Ratio (OR)
- Riesgo atribuible (RA)
- Intervalos de confianza al 95 % y 99 %
- Interpretación básica de asociación epidemiológica
- Codificación explícita de categoría superior e inferior para evitar confusión entre factores de riesgo y factores protectores

El proyecto forma parte del **Laboratorio de Sistemas Porcícolas**, ecosistema de herramientas técnico-científicas para producción, sanidad, epidemiología aplicada y toma de decisiones.

## Estado del proyecto

Versión actual: `v0.2.0-dev`

MVP funcional inicial.

## Validación inicial

Caso de referencia del Excel fuente:

| Celda | Valor |
|---|---:|
| a | 15 |
| b | 35 |
| c | 45 |
| d | 5 |

Resultados esperados:

| Indicador | Valor |
|---|---:|
| RR | 0.3333 |
| OR | 0.0476 |
| RA | -0.6000 |
| IC 95 % RR | 0.2118 – 0.5247 |
| IC 99 % RR | 0.1835 – 0.6056 |
| IC 95 % OR | 0.0158 – 0.1437 |
| IC 99 % OR | 0.0111 – 0.2038 |

## Autoría

Desarrollado por Alberto Jorge Galindo-Barboza.

## Nota sobre el modelo fuente

La lógica inicial proviene de una calculadora en Excel desarrollada para análisis epidemiológico de tablas 2 × 2. El archivo Excel fuente no forma parte del repositorio público.

## Ecosistema

**Laboratorio de Sistemas Porcícolas**  
Modelos, calculadoras y herramientas técnico-científicas para porcicultura, epidemiología y toma de decisiones.
