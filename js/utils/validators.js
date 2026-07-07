const EpiValidators = (() => {
  function readCell(id) {
    const el = document.getElementById(id);
    const value = Number(el.value);
    if (!Number.isFinite(value) || value < 0) return 0;
    return value;
  }

  function hasZeroCell(table) {
    return [table.a, table.b, table.c, table.d].some((v) => v === 0);
  }

  function hasNegativeCell(table) {
    return [table.a, table.b, table.c, table.d].some((v) => v < 0);
  }

  function hasEmptyRows(table) {
    return (table.a + table.b === 0) || (table.c + table.d === 0);
  }

  return { readCell, hasZeroCell, hasNegativeCell, hasEmptyRows };
})();
