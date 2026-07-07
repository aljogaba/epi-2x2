const ids = ["a", "b", "c", "d", "variableName", "upperCategory", "lowerCategory", "eventName", "useCorrection"];
let captureMode = "basic";

function readTable() {
  return {
    a: EpiValidators.readCell("a"),
    b: EpiValidators.readCell("b"),
    c: EpiValidators.readCell("c"),
    d: EpiValidators.readCell("d")
  };
}

function getLabels() {
  const eventName = document.getElementById("eventName").value.trim() || "Evento";
  const variableName = document.getElementById("variableName").value.trim() || "Variable evaluada";
  const upperCategory = document.getElementById("upperCategory").value.trim() || `${variableName}: sí`;
  const lowerCategory = document.getElementById("lowerCategory").value.trim() || `${variableName}: no`;
  return { eventName, variableName, upperCategory, lowerCategory };
}

function setTable(values) {
  for (const [key, value] of Object.entries(values)) {
    const el = document.getElementById(key);
    if (el) el.value = value;
  }
  update();
}

function setLabels(values) {
  for (const [key, value] of Object.entries(values)) {
    const el = document.getElementById(key);
    if (el) el.value = value;
  }
}

function updateLabels() {
  const labels = getLabels();
  document.querySelector(".factor-yes").textContent = labels.upperCategory;
  document.querySelector(".factor-no").textContent = labels.lowerCategory;
  document.querySelector(".event-yes").textContent = `${labels.eventName}: sí`;
  document.querySelector(".event-no").textContent = `${labels.eventName}: no`;
  document.getElementById("codingSummary").innerHTML = `
    <strong>${labels.variableName}</strong>: se compara <strong>“${labels.upperCategory}”</strong> contra <strong>“${labels.lowerCategory}”</strong> para el evento <strong>“${labels.eventName}”</strong>. La fila superior siempre corresponde a las celdas <strong>a</strong> y <strong>b</strong>.
  `;
}

function update() {
  updateLabels();

  const table = readTable();
  const useCorrection = document.getElementById("useCorrection").checked;
  const labels = getLabels();
  const result = Epi2x2.calculate(table, { useCorrection });

  renderWarnings(table, result, useCorrection);
  renderResults(result);
  renderChiSquare(result);
  renderVisualization(result, labels);
  renderInterpretation(result, labels);
  updateReportPreview(result, labels);
}

function renderWarnings(table, result, useCorrection) {
  const warning = document.getElementById("warningBox");
  const messages = [];

  if (EpiValidators.hasEmptyRows(table)) {
    messages.push("Alguna fila tiene total cero; revise la captura antes de interpretar el resultado.");
  }

  if (EpiValidators.hasZeroCell(table)) {
    if (useCorrection && result.corrected) {
      messages.push("Se detectó al menos una celda con cero. Se aplicó corrección de 0.5 para estimar OR/RR e intervalos.");
    } else {
      messages.push("Existe al menos una celda con cero. Active la corrección de 0.5 si requiere estimar OR/RR e intervalos.");
    }
  }

  if (messages.length === 0) {
    warning.classList.add("hidden");
    warning.innerHTML = "";
  } else {
    warning.classList.remove("hidden");
    warning.innerHTML = messages.join("<br>");
  }
}

function renderResults(result) {
  const f = EpiFormatters;
  document.getElementById("rrValue").textContent = f.number(result.rr, 4);
  document.getElementById("orValue").textContent = f.number(result.or, 4);
  document.getElementById("raValue").textContent = f.number(result.ra, 4);
  document.getElementById("riskExposed").textContent = f.percent(result.riskExposed, 2);
  document.getElementById("riskUnexposed").textContent = f.percent(result.riskUnexposed, 2);
  document.getElementById("totalObserved").textContent = f.count(result.totals.total);
  document.getElementById("rrCi95").textContent = f.interval(result.rrCi95.low, result.rrCi95.high, 4);
  document.getElementById("rrCi99").textContent = f.interval(result.rrCi99.low, result.rrCi99.high, 4);
  document.getElementById("orCi95").textContent = f.interval(result.orCi95.low, result.orCi95.high, 4);
  document.getElementById("orCi99").textContent = f.interval(result.orCi99.low, result.orCi99.high, 4);

  document.getElementById("rrInterpretation").textContent = magnitudeText(result.rr);
  document.getElementById("orInterpretation").textContent = magnitudeText(result.or);
  document.getElementById("raInterpretation").textContent = result.ra > 0 ? "Mayor riesgo absoluto" : result.ra < 0 ? "Menor riesgo absoluto" : "Sin diferencia";
}


function renderChiSquare(result) {
  const f = EpiFormatters;
  const chi = result.chiSquare;
  const warning = document.getElementById("chiWarning");
  const decisionCard = document.getElementById("chiDecisionCard");

  document.getElementById("chi2Value").textContent = f.number(chi.value, 4);
  document.getElementById("chiPValue").textContent = f.pValue(chi.pValue);
  document.getElementById("chiDf").textContent = chi.df || 1;
  document.getElementById("expectedA").textContent = f.number(chi.expected.a, 2);
  document.getElementById("expectedB").textContent = f.number(chi.expected.b, 2);
  document.getElementById("expectedC").textContent = f.number(chi.expected.c, 2);
  document.getElementById("expectedD").textContent = f.number(chi.expected.d, 2);

  decisionCard.classList.remove("significant", "not-significant", "warning");

  if (!chi.valid) {
    document.getElementById("chiDecision").textContent = "No calculable";
    document.getElementById("chiDecisionNote").textContent = "Revise filas y columnas con total cero.";
    decisionCard.classList.add("warning");
  } else if (chi.significant05) {
    document.getElementById("chiDecision").textContent = "Asociación significativa";
    document.getElementById("chiDecisionNote").textContent = "p < 0.05; continúe con RR/OR e interpretación.";
    decisionCard.classList.add("significant");
  } else {
    document.getElementById("chiDecision").textContent = "No significativa";
    document.getElementById("chiDecisionNote").textContent = "p ≥ 0.05; interprete RR/OR con cautela.";
    decisionCard.classList.add("not-significant");
  }

  const messages = [];
  if (chi.valid && chi.minExpected < 5) {
    messages.push(`Al menos una frecuencia esperada es menor de 5 (${f.number(chi.minExpected, 2)}). Para muestras pequeñas conviene considerar prueba exacta de Fisher.`);
  }
  if (result.corrected) {
    messages.push("Nota: RR/OR e intervalos usaron corrección 0.5 por celda cero; la chi cuadrada se calculó con los conteos observados originales.");
  }

  if (messages.length === 0) {
    warning.classList.add("hidden");
    warning.innerHTML = "";
  } else {
    warning.classList.remove("hidden");
    warning.innerHTML = messages.join("<br>");
  }
}

function magnitudeText(value) {
  if (!Number.isFinite(value)) return "No calculable";
  if (value > 1) return "Mayor que 1";
  if (value < 1) return "Menor que 1";
  return "Igual a 1";
}

function renderInterpretation(result, labels) {
  const box = document.getElementById("interpretationText");
  const direction = result.interpretation.direction;
  const f = EpiFormatters;
  const rr = f.number(result.rr, 4);
  const or = f.number(result.or, 4);
  const riskUpper = f.percent(result.riskExposed, 2);
  const riskLower = f.percent(result.riskUnexposed, 2);
  const ra = f.percent(result.ra, 2);
  let className = "neutral";
  let lead = "Sin asociación concluyente";
  let summary = "";

  const chi = result.chiSquare;
  const significantText = chi.valid
    ? (chi.significant05
      ? "La prueba de chi cuadrada indica asociación estadísticamente significativa al nivel 0.05."
      : "La prueba de chi cuadrada no muestra asociación estadísticamente significativa al nivel 0.05; interprete las medidas de efecto con cautela.")
    : "La prueba de chi cuadrada no pudo calcularse por totales marginales insuficientes.";

  if (direction === "risk") {
    className = "danger";
    lead = "Asociación positiva";
    summary = `La categoría superior <strong>“${labels.upperCategory}”</strong> se asocia con mayor ocurrencia de <strong>“${labels.eventName}”</strong> que la categoría inferior <strong>“${labels.lowerCategory}”</strong>. En esta codificación, la categoría superior se comporta como posible factor de riesgo.`;
  } else if (direction === "protective") {
    className = "good";
    lead = "Asociación protectora";
    summary = `La categoría superior <strong>“${labels.upperCategory}”</strong> se asocia con menor ocurrencia de <strong>“${labels.eventName}”</strong> que la categoría inferior <strong>“${labels.lowerCategory}”</strong>. En esta codificación, la categoría superior se comporta como posible factor protector.`;
  } else {
    summary = `La estimación puntual compara <strong>“${labels.upperCategory}”</strong> contra <strong>“${labels.lowerCategory}”</strong>, pero el intervalo de confianza al 95 % no permite descartar ausencia de asociación, o el cálculo no es concluyente.`;
  }

  box.innerHTML = `
    <p><span class="${className}">${lead}.</span> ${summary}</p>
    <div class="interpretation-grid">
      <div><strong>Riesgo categoría superior</strong><span>${riskUpper}</span></div>
      <div><strong>Riesgo categoría inferior</strong><span>${riskLower}</span></div>
      <div><strong>RR</strong><span>${rr}</span></div>
      <div><strong>OR</strong><span>${or}</span></div>
      <div><strong>Diferencia absoluta</strong><span>${ra}</span></div>
    </div>
    <p class="muted"><strong>Prueba de asociación:</strong> ${significantText}</p>
    <p class="muted">Nota crítica: la calculadora no decide si la variable es riesgo o protección por su nombre; interpreta la <strong>categoría superior</strong> contra la <strong>categoría inferior</strong>. Revise la codificación antes de concluir causalidad.</p>
  `;
}


function renderVisualization(result, labels) {
  renderDecisionStrip(result, labels);
  renderForestPlot(result);
  renderHeatmap(result, labels);
  renderRiskBars(result, labels);
}

function renderDecisionStrip(result, labels) {
  const chi = result.chiSquare;
  const association = document.getElementById("decisionAssociation");
  const associationNote = document.getElementById("decisionAssociationNote");
  const direction = document.getElementById("decisionDirection");
  const magnitude = document.getElementById("decisionMagnitude");
  const precision = document.getElementById("decisionPrecision");
  const cards = document.querySelectorAll(".decision-strip article");
  cards.forEach((card) => card.classList.remove("risk", "protective", "neutral"));

  if (!chi.valid) {
    association.textContent = "No calculable";
    associationNote.textContent = "Revise totales marginales.";
    cards[0].classList.add("neutral");
  } else if (chi.significant05) {
    association.textContent = "Significativa";
    associationNote.textContent = `p = ${EpiFormatters.pValue(chi.pValue)}`;
    cards[0].classList.add("protective");
  } else {
    association.textContent = "No significativa";
    associationNote.textContent = `p = ${EpiFormatters.pValue(chi.pValue)}`;
    cards[0].classList.add("neutral");
  }

  const dir = result.interpretation.direction;
  if (dir === "risk") {
    direction.textContent = "Mayor ocurrencia";
    cards[1].classList.add("risk");
  } else if (dir === "protective") {
    direction.textContent = "Menor ocurrencia";
    cards[1].classList.add("protective");
  } else {
    direction.textContent = "No concluyente";
    cards[1].classList.add("neutral");
  }

  if (!Number.isFinite(result.rr)) {
    magnitude.textContent = "No calculable";
    cards[2].classList.add("neutral");
  } else {
    const effect = Math.max(result.rr, 1 / result.rr);
    magnitude.textContent = effect >= 3 ? "Fuerte" : effect >= 1.5 ? "Moderada" : "Baja";
    cards[2].classList.add(dir === "risk" ? "risk" : dir === "protective" ? "protective" : "neutral");
  }

  const ratio = (Number.isFinite(result.rrCi95.low) && result.rrCi95.low > 0 && Number.isFinite(result.rrCi95.high))
    ? result.rrCi95.high / result.rrCi95.low
    : NaN;
  precision.textContent = !Number.isFinite(ratio) ? "No calculable" : ratio <= 2 ? "Alta" : ratio <= 4 ? "Moderada" : "Baja";
  cards[3].classList.add(!Number.isFinite(ratio) || ratio > 4 ? "neutral" : "protective");
}

function renderForestPlot(result) {
  const container = document.getElementById("forestPlot");
  if (!container) return;
  const rows = [
    { label: "RR", value: result.rr, ci: result.rrCi95 },
    { label: "OR", value: result.or, ci: result.orCi95 }
  ];
  const finiteValues = rows.flatMap((row) => [row.value, row.ci.low, row.ci.high]).filter((v) => Number.isFinite(v) && v > 0);
  if (finiteValues.length === 0) {
    container.innerHTML = `<div class="muted">No hay estimaciones calculables para graficar.</div>`;
    return;
  }
  const minValue = Math.min(0.1, ...finiteValues) / 1.25;
  const maxValue = Math.max(10, ...finiteValues) * 1.25;
  const logMin = Math.log(minValue);
  const logMax = Math.log(maxValue);
  const pct = (value) => {
    if (!Number.isFinite(value) || value <= 0) return 50;
    const p = ((Math.log(value) - logMin) / (logMax - logMin)) * 100;
    return Math.max(0, Math.min(100, p));
  };
  const one = pct(1);
  container.innerHTML = rows.map((row) => {
    if (!Number.isFinite(row.value) || !Number.isFinite(row.ci.low) || !Number.isFinite(row.ci.high)) {
      return `<div class="forest-row"><div class="forest-label">${row.label}</div><div class="muted">No calculable</div><div></div></div>`;
    }
    const left = pct(row.ci.low);
    const right = pct(row.ci.high);
    const estimate = pct(row.value);
    const width = Math.max(1, right - left);
    return `
      <div class="forest-row">
        <div class="forest-label">${row.label}</div>
        <div class="forest-track" style="--one:${one}%;--ci-left:${left}%;--ci-width:${width}%;--estimate:${estimate}%">
          <span class="forest-ci"></span><span class="forest-dot"></span>
        </div>
        <div class="forest-value">${EpiFormatters.number(row.value, 4)} (${EpiFormatters.interval(row.ci.low, row.ci.high, 4)})</div>
      </div>`;
  }).join("");
}

function renderHeatmap(result, labels) {
  const container = document.getElementById("heatmap2x2");
  if (!container) return;
  const t = result.rawTable;
  const max = Math.max(t.a, t.b, t.c, t.d, 1);
  const cells = [
    { key: "a", value: t.a, label: `${labels.upperCategory} / ${labels.eventName}: sí` },
    { key: "b", value: t.b, label: `${labels.upperCategory} / ${labels.eventName}: no` },
    { key: "c", value: t.c, label: `${labels.lowerCategory} / ${labels.eventName}: sí` },
    { key: "d", value: t.d, label: `${labels.lowerCategory} / ${labels.eventName}: no` }
  ];
  container.innerHTML = cells.map((cell) => {
    const alpha = 0.10 + (cell.value / max) * 0.55;
    return `<div class="heat-cell" style="--alpha:${alpha.toFixed(3)}"><span>Celda ${cell.key}</span><strong>${EpiFormatters.count(cell.value)}</strong><small>${cell.label}</small></div>`;
  }).join("");
}

function renderRiskBars(result, labels) {
  const container = document.getElementById("riskBars");
  if (!container) return;
  const rows = [
    { label: labels.upperCategory, value: result.riskExposed },
    { label: labels.lowerCategory, value: result.riskUnexposed }
  ];
  container.innerHTML = rows.map((row) => {
    const pct = Number.isFinite(row.value) ? Math.max(0, Math.min(100, row.value * 100)) : 0;
    return `<div class="risk-row"><div class="risk-label"><span>${row.label}</span><small>${EpiFormatters.percent(row.value, 2)}</small></div><div class="risk-track"><div class="risk-fill" style="--w:${pct}%"></div></div></div>`;
  }).join("");
}

function updateReportPreview(result, labels) {
  const preview = document.getElementById("reportPreview");
  if (!preview) return;
  const decision = result.chiSquare.valid
    ? (result.chiSquare.significant05 ? "asociación significativa" : "asociación no significativa")
    : "asociación no calculable";
  preview.innerHTML = `<strong>Reporte listo: ${labels.variableName} vs ${labels.eventName}</strong><span>Incluye tabla 2×2, RR ${EpiFormatters.number(result.rr, 4)}, OR ${EpiFormatters.number(result.or, 4)}, χ² ${EpiFormatters.number(result.chiSquare.value, 4)} y ${decision}.</span>`;
}

function buildReportHtml(result, labels) {
  const f = EpiFormatters;
  const date = new Date().toLocaleString("es-MX");
  const chiDecision = result.chiSquare.valid
    ? (result.chiSquare.significant05 ? "Asociación significativa" : "No significativa")
    : "No calculable";
  const direction = result.interpretation.direction === "risk" ? "Mayor ocurrencia en categoría superior" : result.interpretation.direction === "protective" ? "Menor ocurrencia en categoría superior" : "No concluyente";
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Reporte Epi 2×2</title><style>
    body{font-family:Inter,system-ui,Segoe UI,sans-serif;margin:0;background:#eef3f1;color:#18352f;line-height:1.45}main{max-width:980px;margin:auto;padding:24px}.head{background:#0f3d36;color:white;padding:26px;border-radius:20px;margin-bottom:18px}.head h1{margin:0;font-size:2rem}.card{background:white;border:1px solid #d9e3df;border-radius:18px;padding:18px;margin-bottom:14px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.metric{background:#f7faf9;border:1px solid #d9e3df;border-radius:14px;padding:14px}.metric span{display:block;color:#63746f;font-weight:800;text-transform:uppercase;font-size:.75rem}.metric strong{font-size:1.5rem}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #d9e3df;text-align:left}th{background:#eaf3ef}.note{color:#63746f;font-size:.9rem}.footer{font-size:.85rem;color:#63746f}@media(max-width:760px){.grid{grid-template-columns:1fr}main{padding:12px}.head{border-radius:14px}}</style></head><body><main>
    <section class="head"><div>Laboratorio de Sistemas Porcícolas</div><h1>Epi 2×2</h1><p>Reporte epidemiológico de tabla de contingencia</p><strong>Autor: Alberto Jorge Galindo-Barboza</strong></section>
    <section class="card"><h2>Codificación</h2><p><strong>Evento:</strong> ${labels.eventName}</p><p><strong>Variable evaluada:</strong> ${labels.variableName}</p><p><strong>Categoría superior:</strong> ${labels.upperCategory}</p><p><strong>Categoría inferior:</strong> ${labels.lowerCategory}</p></section>
    <section class="card"><h2>Tabla 2 × 2</h2><table><tr><th></th><th>${labels.eventName}: sí</th><th>${labels.eventName}: no</th></tr><tr><th>${labels.upperCategory}</th><td>${f.count(result.rawTable.a)}</td><td>${f.count(result.rawTable.b)}</td></tr><tr><th>${labels.lowerCategory}</th><td>${f.count(result.rawTable.c)}</td><td>${f.count(result.rawTable.d)}</td></tr></table></section>
    <section class="card"><h2>Resultados principales</h2><div class="grid"><div class="metric"><span>RR</span><strong>${f.number(result.rr,4)}</strong></div><div class="metric"><span>OR</span><strong>${f.number(result.or,4)}</strong></div><div class="metric"><span>RA</span><strong>${f.percent(result.ra,2)}</strong></div><div class="metric"><span>IC 95 % RR</span><strong>${f.interval(result.rrCi95.low,result.rrCi95.high,4)}</strong></div><div class="metric"><span>IC 95 % OR</span><strong>${f.interval(result.orCi95.low,result.orCi95.high,4)}</strong></div><div class="metric"><span>χ² / p</span><strong>${f.number(result.chiSquare.value,4)} / ${f.pValue(result.chiSquare.pValue)}</strong></div></div></section>
    <section class="card"><h2>Decisión e interpretación</h2><p><strong>Prueba de asociación:</strong> ${chiDecision}</p><p><strong>Dirección:</strong> ${direction}</p><p class="note">La interpretación depende de la codificación de la categoría superior contra la categoría inferior. Este reporte no establece causalidad por sí solo.</p></section>
    <section class="footer">© 2026 Alberto Jorge Galindo-Barboza. Todos los derechos reservados. Perfil profesional: https://aljogaba.github.io/ · Generado: ${date}</section>
  </main></body></html>`;
}

function setMode(mode) {
  captureMode = mode;
  document.querySelectorAll(".mode-button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
  document.getElementById("basicHelp").classList.toggle("hidden", mode !== "basic");
  document.getElementById("advancedHelp").classList.toggle("hidden", mode !== "advanced");
}

function bindEvents() {
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", update);
    el.addEventListener("change", update);
  });

  document.querySelectorAll(".mode-button").forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
  });

  document.getElementById("exampleProtective").addEventListener("click", () => {
    setLabels({
      variableName: "Desinfección",
      upperCategory: "Desinfección: sí",
      lowerCategory: "Desinfección: no",
      eventName: "PRRS"
    });
    setTable({ a: 12, b: 114, c: 110, d: 8 });
  });


  document.getElementById("exampleRisk").addEventListener("click", () => {
    setLabels({
      variableName: "Control de acceso deficiente",
      upperCategory: "Control deficiente: sí",
      lowerCategory: "Control deficiente: no",
      eventName: "Granja positiva"
    });
    setTable({ a: 38, b: 12, c: 18, d: 32 });
  });

  document.getElementById("clearTable").addEventListener("click", () => {
    setTable({ a: 0, b: 0, c: 0, d: 0 });
  });

  const openReport = document.getElementById("openReport");
  const downloadReport = document.getElementById("downloadReport");
  if (openReport) {
    openReport.addEventListener("click", () => {
      const result = Epi2x2.calculate(readTable(), { useCorrection: document.getElementById("useCorrection").checked });
      const html = buildReportHtml(result, getLabels());
      const reportWindow = window.open("", "_blank");
      if (reportWindow) {
        reportWindow.document.open();
        reportWindow.document.write(html);
        reportWindow.document.close();
      }
    });
  }
  if (downloadReport) {
    downloadReport.addEventListener("click", () => {
      const result = Epi2x2.calculate(readTable(), { useCorrection: document.getElementById("useCorrection").checked });
      const html = buildReportHtml(result, getLabels());
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `epi-2x2-reporte-${new Date().toISOString().slice(0,10)}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setMode("basic");
  bindEvents();
  update();
});
