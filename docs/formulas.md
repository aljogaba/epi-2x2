# Fórmulas de Epi 2×2

Tabla base:

| | Evento sí | Evento no |
|---|---:|---:|
| Factor sí | a | b |
| Factor no | c | d |

## Riesgos

Riesgo en expuestos:

```text
Re = a / (a + b)
```

Riesgo en no expuestos:

```text
Ru = c / (c + d)
```

## Riesgo relativo

```text
RR = Re / Ru
```

Error estándar logarítmico:

```text
EE[ln(RR)] = sqrt(1/a - 1/(a+b) + 1/c - 1/(c+d))
```

Intervalo de confianza:

```text
IC = exp(ln(RR) ± z × EE)
```

## Odds Ratio

```text
OR = (a × d) / (b × c)
```

Error estándar logarítmico:

```text
EE[ln(OR)] = sqrt(1/a + 1/b + 1/c + 1/d)
```

Intervalo de confianza:

```text
IC = exp(ln(OR) ± z × EE)
```

## Riesgo atribuible

```text
RA = Re - Ru
```

## Valores z

```text
IC 95 %: z = 1.9599639845
IC 99 %: z = 2.5758293035
```

## Corrección por cero

Cuando alguna celda es cero, la herramienta puede aplicar corrección de 0.5 a las cuatro celdas para evitar división entre cero en OR/RR e intervalos.


## Chi cuadrada de Pearson para tabla 2 × 2

La prueba de asociación se calcula con los conteos observados originales:

```text
χ² = n(ad − bc)² / [(a+b)(c+d)(a+c)(b+d)]
```

Con una tabla 2 × 2, los grados de libertad son 1. El valor p se estima para una distribución chi cuadrada con 1 gl.

Las frecuencias esperadas bajo independencia se calculan como:

```text
Eij = total fila i × total columna j / total general
```

Si alguna frecuencia esperada es menor de 5, la interpretación de chi cuadrada debe hacerse con cautela y puede ser preferible una prueba exacta de Fisher.
