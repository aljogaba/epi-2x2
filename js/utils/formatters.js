const EpiFormatters = (() => {
  function number(value, decimals = 4) {
    if (!Number.isFinite(value)) return "—";
    return value.toLocaleString("es-MX", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function count(value) {
    if (!Number.isFinite(value)) return "—";
    return value.toLocaleString("es-MX", { maximumFractionDigits: 0 });
  }

  function percent(value, decimals = 2) {
    if (!Number.isFinite(value)) return "—";
    return (value * 100).toLocaleString("es-MX", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }) + " %";
  }

  function interval(low, high, decimals = 4) {
    if (!Number.isFinite(low) || !Number.isFinite(high)) return "—";
    return `${number(low, decimals)} – ${number(high, decimals)}`;
  }

  return { number, count, percent, interval };
})();
