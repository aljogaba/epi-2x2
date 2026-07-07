# Guía de uso — Epi 2×2

## Regla central

La calculadora mantiene fija la matriz epidemiológica:

| | Evento sí | Evento no |
|---|---:|---:|
| Categoría superior | a | b |
| Categoría inferior | c | d |

La fila superior no significa necesariamente “factor de riesgo”. Significa la categoría que se está comparando contra la fila inferior.

## Ejemplo protector

Si se analiza desinfección:

| | PRRS sí | PRRS no |
|---|---:|---:|
| Desinfección: sí | 12 | 114 |
| Desinfección: no | 110 | 8 |

La categoría superior (“Desinfección: sí”) se compara contra la categoría inferior (“Desinfección: no”). Si RR y OR son menores que 1, la desinfección se comporta como posible factor protector.

## Ejemplo de riesgo

Si se analiza ausencia o deficiencia de una práctica, la categoría superior puede nombrarse como exposición de riesgo:

| | Granja positiva sí | Granja positiva no |
|---|---:|---:|
| Control deficiente: sí | 38 | 12 |
| Control deficiente: no | 18 | 32 |

Si RR y OR son mayores que 1, la categoría superior se comporta como posible factor de riesgo.

## Recomendación

No cambie la posición de los datos para forzar una interpretación. Revise la forma en que nombra la categoría superior e inferior.
