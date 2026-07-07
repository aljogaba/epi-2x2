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
  renderInterpretation(result, labels);
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
    <p class="muted">Nota crítica: la calculadora no decide si la variable es riesgo o protección por su nombre; interpreta la <strong>categoría superior</strong> contra la <strong>categoría inferior</strong>. Revise la codificación antes de concluir causalidad.</p>
  `;
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

  document.getElementById("exampleExcel").addEventListener("click", () => {
    setLabels({
      variableName: "Factor presente",
      upperCategory: "Factor presente: sí",
      lowerCategory: "Factor presente: no",
      eventName: "Enfermedad"
    });
    setTable({ a: 15, b: 35, c: 45, d: 5 });
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
}

document.addEventListener("DOMContentLoaded", () => {
  setMode("basic");
  bindEvents();
  update();
});
