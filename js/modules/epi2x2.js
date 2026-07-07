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
      interpretation: interpret(rr, rrCi95, or, orCi95, ra)
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

  function interpret(rr, rrCi95, or, orCi95, ra) {
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

  return { calculate };
})();
