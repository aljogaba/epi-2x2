const Epi2x2 = (() => {
  const Z95 = 1.959963984540054;
  const Z99 = 2.5758293035489004;

  function applyCorrectionIfNeeded(table, useCorrection) {
    const values = [table.a, table.b, table.c, table.d];
    const needsCorrection = values.some((v) => v === 0);
    if (!needsCorrection || !useCorrection) {
      return { table: { ...table }, corrected: false };
    }
    return {
      table: {
        a: table.a + 0.5,
        b: table.b + 0.5,
        c: table.c + 0.5,
        d: table.d + 0.5
      },
      corrected: true
    };
  }

  function calculate(rawTable, options = {}) {
    const useCorrection = options.useCorrection ?? true;
    const correction = applyCorrectionIfNeeded(rawTable, useCorrection);
    const t = correction.table;

    const exposedTotal = t.a + t.b;
    const unexposedTotal = t.c + t.d;
    const eventTotal = t.a + t.c;
    const nonEventTotal = t.b + t.d;
    const total = exposedTotal + unexposedTotal;

    const riskExposed = exposedTotal > 0 ? t.a / exposedTotal : NaN;
    const riskUnexposed = unexposedTotal > 0 ? t.c / unexposedTotal : NaN;
    const rr = riskUnexposed > 0 ? riskExposed / riskUnexposed : NaN;
    const or = (t.b * t.c) !== 0 ? (t.a * t.d) / (t.b * t.c) : NaN;
    const ra = riskExposed - riskUnexposed;

    const seRR = (t.a > 0 && t.c > 0)
      ? Math.sqrt((1 / t.a) - (1 / exposedTotal) + (1 / t.c) - (1 / unexposedTotal))
      : NaN;

    const seOR = [t.a, t.b, t.c, t.d].every((v) => v > 0)
      ? Math.sqrt((1 / t.a) + (1 / t.b) + (1 / t.c) + (1 / t.d))
      : NaN;

    const rrCi95 = confidenceInterval(rr, seRR, Z95);
    const rrCi99 = confidenceInterval(rr, seRR, Z99);
    const orCi95 = confidenceInterval(or, seOR, Z95);
    const orCi99 = confidenceInterval(or, seOR, Z99);

    const chiSquare = calculateChiSquare(rawTable);

    return {
      rawTable,
      table: t,
      corrected: correction.corrected,
      totals: { exposedTotal, unexposedTotal, eventTotal, nonEventTotal, total },
      riskExposed,
      riskUnexposed,
      rr,
      or,
      ra,
      seRR,
      seOR,
      rrCi95,
      rrCi99,
      orCi95,
      orCi99,
      chiSquare,
      interpretation: interpret(rr, rrCi95, or, orCi95, ra, chiSquare)
    };
  }

  function confidenceInterval(estimate, standardError, z) {
    if (!Number.isFinite(estimate) || estimate <= 0 || !Number.isFinite(standardError)) {
      return { low: NaN, high: NaN };
    }
    const logEstimate = Math.log(estimate);
    return {
      low: Math.exp(logEstimate - z * standardError),
      high: Math.exp(logEstimate + z * standardError)
    };
  }

  function intervalIncludesOne(ci) {
    return Number.isFinite(ci.low) && Number.isFinite(ci.high) && ci.low <= 1 && ci.high >= 1;
  }

  function interpret(rr, rrCi95, or, orCi95, ra, chiSquare) {
    const rrIncludesOne = intervalIncludesOne(rrCi95);
    const orIncludesOne = intervalIncludesOne(orCi95);

    let direction = "neutral";
    let summary = "No se identifica una asociación clara con la información capturada.";

    if (Number.isFinite(rr)) {
      if (rr > 1) {
        direction = rrIncludesOne ? "neutral" : "risk";
        summary = rrIncludesOne
          ? "El RR es mayor que 1, pero el IC 95 % incluye 1; la asociación no es concluyente."
          : "El riesgo en la categoría superior es mayor que en la categoría inferior.";
      } else if (rr < 1) {
        direction = rrIncludesOne ? "neutral" : "protective";
        summary = rrIncludesOne
          ? "El RR es menor que 1, pero el IC 95 % incluye 1; la asociación no es concluyente."
          : "El riesgo en la categoría superior es menor que en la categoría inferior.";
      }
    }

    const raText = Number.isFinite(ra)
      ? (ra > 0
        ? "El riesgo atribuible es positivo, lo que sugiere mayor riesgo absoluto en la categoría superior."
        : ra < 0
          ? "El riesgo atribuible es negativo, lo que sugiere menor riesgo absoluto en la categoría superior."
          : "El riesgo atribuible es cero, sin diferencia absoluta entre grupos.")
      : "El riesgo atribuible no pudo calcularse.";

    return {
      direction,
      summary,
      rrIncludesOne,
      orIncludesOne,
      raText
    };
  }



  function calculateChiSquare(rawTable) {
    const a = rawTable.a;
    const b = rawTable.b;
    const c = rawTable.c;
    const d = rawTable.d;
    const row1 = a + b;
    const row2 = c + d;
    const col1 = a + c;
    const col2 = b + d;
    const total = row1 + row2;
    const denominator = row1 * row2 * col1 * col2;

    if (total <= 0 || denominator === 0) {
      return {
        value: NaN,
        pValue: NaN,
        df: 1,
        significant05: false,
        expected: { a: NaN, b: NaN, c: NaN, d: NaN },
        minExpected: NaN,
        valid: false
      };
    }

    const expected = {
      a: row1 * col1 / total,
      b: row1 * col2 / total,
      c: row2 * col1 / total,
      d: row2 * col2 / total
    };

    const numerator = total * Math.pow((a * d) - (b * c), 2);
    const value = numerator / denominator;
    const pValue = chiSquare1Survival(value);
    const minExpected = Math.min(expected.a, expected.b, expected.c, expected.d);

    return {
      value,
      pValue,
      df: 1,
      significant05: Number.isFinite(pValue) && pValue < 0.05,
      expected,
      minExpected,
      valid: true
    };
  }

  function chiSquare1Survival(x) {
    if (!Number.isFinite(x) || x < 0) return NaN;
    return erfc(Math.sqrt(x / 2));
  }

  function erfc(x) {
    // Complementary error function approximation. Accurate enough for UI-level p-values.
    const z = Math.abs(x);
    const t = 1 / (1 + z / 2);
    const r = t * Math.exp(
      -z * z - 1.26551223 +
      t * (1.00002368 +
      t * (0.37409196 +
      t * (0.09678418 +
      t * (-0.18628806 +
      t * (0.27886807 +
      t * (-1.13520398 +
      t * (1.48851587 +
      t * (-0.82215223 +
      t * 0.17087277))))))))
    );
    return x >= 0 ? r : 2 - r;
  }



  return { calculate };
})();
