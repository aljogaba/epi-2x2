# Changelog

Todos los cambios importantes de Epi 2×2 serán documentados en este archivo.

## [0.2.0-dev] - En desarrollo

### Agregado

- Modo básico y modo avanzado para orientar la captura de tablas 2 × 2.
- Campos separados para evento/enfermedad, variable evaluada, categoría superior y categoría inferior.
- Nota de codificación para evitar confundir factor de riesgo con práctica protectora.
- Interpretación automática basada en la categoría superior comparada contra la categoría inferior.
- Ejemplo protector con desinfección y PRRS.

### Cambiado

- Se sustituye el lenguaje genérico de “factor/exposición” por “variable evaluada” y “categorías comparadas”.
- La interpretación ya no asume que toda variable evaluada es un factor de riesgo.
- Las tarjetas de riesgo se renombran como riesgo de la categoría superior e inferior.

### Conservado

- La matriz a-b-c-d permanece fija:
  - a = categoría superior / evento sí.
  - b = categoría superior / evento no.
  - c = categoría inferior / evento sí.
  - d = categoría inferior / evento no.
