const i18nConfig = window.CrochetCodexI18n || {};
const supportedLanguages = i18nConfig.supportedLanguages || [{ code: "zh-CN", label: "简体中文" }];
const languages = supportedLanguages.map(language => language.code);
const translations = i18nConfig.translations || {};
const stitchLabels = i18nConfig.stitches || {};
const shapeLabels = i18nConfig.shapes || {};

const stitches = [
  { id: "empty", labels: stitchLabels.empty || {}, abbr: "empty", draw: "empty" },
  { id: "ch", labels: stitchLabels.ch || {}, abbr: "ch", draw: "chain" },
  { id: "slst", labels: stitchLabels.slst || {}, abbr: "sl st", draw: "dot" },
  { id: "sc", labels: stitchLabels.sc || {}, abbr: "sc", draw: "cross" },
  { id: "hdc", labels: stitchLabels.hdc || {}, abbr: "hdc", draw: "halfDouble" },
  { id: "dc", labels: stitchLabels.dc || {}, abbr: "dc", draw: "double" },
  { id: "tr", labels: stitchLabels.tr || {}, abbr: "tr", draw: "treble" },
  { id: "inc", labels: stitchLabels.inc || {}, abbr: "inc", draw: "increase" },
  { id: "dec", labels: stitchLabels.dec || {}, abbr: "dec", draw: "decrease" },
  { id: "bobble", labels: stitchLabels.bobble || {}, abbr: "bob", draw: "bobble" },
  { id: "picot", labels: stitchLabels.picot || {}, abbr: "picot", draw: "picot" },
  { id: "erase", labels: stitchLabels.erase || {}, abbr: "erase", draw: "eraser" }
];

const shapePresets = [
  { id: "single", labels: shapeLabels.single || {} },
  { id: "rect", labels: shapeLabels.rect || {} },
  { id: "circle", labels: shapeLabels.circle || {} },
  { id: "star", labels: shapeLabels.star || {} }
];

const swatchColors = ["#24221f", "#2f7d78", "#cf5f42", "#8f5b9a", "#d69b2d", "#5c7f45", "#4d76b9", "#b34d66", "#8b6b4f", "#6d6860", "#ffffff", "#f1d7c3"];
const defaultLanguage = initialLanguage();
const state = {
  rows: 18,
  cols: 24,
  cell: 34,
  gutter: 42,
  zoom: 1,
  tool: "sc",
  preset: "single",
  presetCols: 7,
  presetRows: 7,
  color: "#2f7d78",
  title: translations[defaultLanguage].defaultTitle,
  language: defaultLanguage,
  numberMode: "both",
  hover: null,
  selected: null,
  grid: [],
  undo: [],
  redo: [],
  isPainting: false,
  panMode: false,
  isPanning: false,
  spacePanning: false,
  panStart: null,
  background: {
    src: "",
    name: "",
    opacity: 35,
    scale: 100,
    offsetX: 0,
    offsetY: 0,
    naturalWidth: 0,
    naturalHeight: 0,
    image: null
  }
};

const els = {
  canvas: document.getElementById("chart"),
  stage: document.getElementById("stage"),
  stageWrap: document.getElementById("stageWrap"),
  status: document.getElementById("status"),
  colsInput: document.getElementById("colsInput"),
  rowsInput: document.getElementById("rowsInput"),
  cellInput: document.getElementById("cellInput"),
  numberMode: document.getElementById("numberMode"),
  toolPalette: document.getElementById("toolPalette"),
  presetPalette: document.getElementById("presetPalette"),
  presetColsInput: document.getElementById("presetColsInput"),
  presetRowsInput: document.getElementById("presetRowsInput"),
  swatches: document.getElementById("swatches"),
  customColor: document.getElementById("customColor"),
  legend: document.getElementById("legend"),
  summaryText: document.getElementById("summaryText"),
  zoomLabel: document.getElementById("zoomLabel"),
  titleInput: document.getElementById("titleInput"),
  fileInput: document.getElementById("fileInput"),
  bgFileInput: document.getElementById("bgFileInput"),
  bgOpacityInput: document.getElementById("bgOpacityInput"),
  bgScaleInput: document.getElementById("bgScaleInput"),
  bgOffsetXInput: document.getElementById("bgOffsetXInput"),
  bgOffsetYInput: document.getElementById("bgOffsetYInput"),
  bgInfoText: document.getElementById("bgInfoText"),
  languageSelect: document.getElementById("languageSelect")
};

const ctx = els.canvas.getContext("2d");
const dpr = Math.max(1, window.devicePixelRatio || 1);

function blankGrid(rows, cols) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ stitch: "empty", color: "#24221f" }))
  );
}

function copyGrid(grid = state.grid) {
  return grid.map(row => row.map(cell => ({ ...cell })));
}

function init() {
  buildLanguageOptions();
  applyLanguage();
  const stored = localStorage.getItem("crochet-chart-project");
  if (stored) {
    try {
      loadProject(JSON.parse(stored), false);
    } catch {
      state.grid = blankGrid(state.rows, state.cols);
    }
  } else {
    state.grid = blankGrid(state.rows, state.cols);
    seedSample();
  }
  buildTools();
  buildPresets();
  buildSwatches();
  bindEvents();
  updateInputs();
  render();
}

function seedSample() {
  const mid = Math.floor(state.cols / 2);
  for (let r = 2; r < Math.min(state.rows, 12); r++) {
    const width = Math.min(r + 2, 12);
    for (let c = mid - Math.floor(width / 2); c <= mid + Math.floor(width / 2); c++) {
      if (state.grid[r] && state.grid[r][c]) {
        state.grid[r][c] = {
          stitch: r % 3 === 0 ? "dc" : r % 3 === 1 ? "sc" : "ch",
          color: r % 2 ? "#2f7d78" : "#cf5f42"
        };
      }
    }
  }
}

function buildTools() {
  els.toolPalette.innerHTML = "";
  stitches.forEach(stitch => {
    const btn = document.createElement("button");
    btn.className = `tool${state.tool === stitch.id ? " active" : ""}`;
    btn.type = "button";
    btn.title = termLabel(stitch);
    btn.setAttribute("aria-label", stitchButtonLabel(stitch));
    btn.dataset.tool = stitch.id;
    btn.innerHTML = `${symbolSvg(stitch.id, stitch.id === "empty" ? "#b7aea2" : "#24221f")}<span>${stitchButtonLabel(stitch)}</span>`;
    btn.addEventListener("click", () => {
      state.tool = stitch.id;
      buildTools();
    });
    els.toolPalette.appendChild(btn);
  });
}

function buildPresets() {
  els.presetPalette.innerHTML = "";
  shapePresets.forEach(preset => {
    const btn = document.createElement("button");
    btn.className = `preset-tool${state.preset === preset.id ? " active" : ""}`;
    btn.type = "button";
    btn.title = localizedLabel(preset);
    btn.setAttribute("aria-label", localizedLabel(preset));
    btn.dataset.preset = preset.id;
    btn.innerHTML = `${shapeSvg(preset.id)}<span>${localizedLabel(preset)}</span>`;
    btn.addEventListener("click", () => {
      state.preset = preset.id;
      buildPresets();
      render();
    });
    els.presetPalette.appendChild(btn);
  });
}

function buildSwatches() {
  els.swatches.innerHTML = "";
  swatchColors.forEach(color => {
    const btn = document.createElement("button");
    btn.className = `swatch${sameColor(state.color, color) ? " active" : ""}`;
    btn.type = "button";
    btn.title = color;
    btn.setAttribute("aria-label", `${translate("customYarnColor")} ${color}`);
    btn.style.background = color;
    btn.addEventListener("click", () => {
      state.color = color;
      els.customColor.value = normalizeColor(color);
      buildSwatches();
    });
    els.swatches.appendChild(btn);
  });
}

function bindEvents() {
  els.stageWrap.addEventListener("pointerdown", event => {
    if (shouldPan(event)) beginPan(event);
  });
  els.stageWrap.addEventListener("pointermove", panMove);
  els.stageWrap.addEventListener("pointerup", endPan);
  els.stageWrap.addEventListener("pointercancel", endPan);
  els.stageWrap.addEventListener("lostpointercapture", endPan);
  els.stageWrap.addEventListener("contextmenu", event => event.preventDefault());
  els.stageWrap.addEventListener("wheel", zoomWithWheel, { passive: false });

  els.canvas.addEventListener("pointerdown", event => {
    if (shouldPan(event)) {
      beginPan(event);
      return;
    }
    state.isPainting = true;
    els.canvas.setPointerCapture(event.pointerId);
    paintAt(event, true);
  });
  els.canvas.addEventListener("pointermove", event => {
    if (state.isPanning) return;
    const pos = eventToCell(event);
    state.hover = pos;
    if (state.isPainting) paintAt(event, false);
    render();
  });
  els.canvas.addEventListener("pointerup", event => {
    state.isPainting = false;
    els.canvas.releasePointerCapture(event.pointerId);
  });
  els.canvas.addEventListener("pointerleave", () => {
    state.hover = null;
    render();
  });

  document.getElementById("undoBtn").addEventListener("click", undo);
  document.getElementById("redoBtn").addEventListener("click", redo);
  document.getElementById("mirrorBtn").addEventListener("click", mirrorHorizontal);
  document.getElementById("panBtn").addEventListener("click", togglePanMode);
  document.getElementById("clearBtn").addEventListener("click", clearGrid);
  document.getElementById("zoomOutBtn").addEventListener("click", () => setZoom(state.zoom - .1));
  document.getElementById("zoomInBtn").addEventListener("click", () => setZoom(state.zoom + .1));
  document.getElementById("saveBtn").addEventListener("click", saveProject);
  document.getElementById("exportPngBtn").addEventListener("click", exportPng);
  document.getElementById("exportSvgBtn").addEventListener("click", exportSvg);
  document.getElementById("exportJsonBtn").addEventListener("click", exportJson);
  document.getElementById("importJsonBtn").addEventListener("click", () => els.fileInput.click());
  document.getElementById("uploadBgBtn").addEventListener("click", () => els.bgFileInput.click());
  document.getElementById("clearBgBtn").addEventListener("click", clearBackgroundImage);
  document.getElementById("fillRowBtn").addEventListener("click", fillSelectedRow);
  document.getElementById("outlineBtn").addEventListener("click", outlineGrid);

  els.fileInput.addEventListener("change", importJson);
  els.bgFileInput.addEventListener("change", importBackgroundImage);
  els.languageSelect.addEventListener("change", event => setLanguage(event.target.value));
  els.customColor.addEventListener("input", event => {
    state.color = event.target.value;
    buildSwatches();
  });
  [els.bgOpacityInput, els.bgScaleInput, els.bgOffsetXInput, els.bgOffsetYInput].forEach(input => {
    input.addEventListener("change", () => {
      state.background.opacity = clamp(Math.round(Number(els.bgOpacityInput.value)), 0, 100);
      state.background.scale = clamp(Math.round(Number(els.bgScaleInput.value)), 10, 300);
      state.background.offsetX = clamp(Math.round(Number(els.bgOffsetXInput.value)), -2000, 2000);
      state.background.offsetY = clamp(Math.round(Number(els.bgOffsetYInput.value)), -2000, 2000);
      updateInputs();
      render();
    });
  });
  [els.presetColsInput, els.presetRowsInput].forEach(input => {
    input.addEventListener("change", () => {
      state.presetCols = clamp(Math.round(Number(els.presetColsInput.value)), 1, 21);
      state.presetRows = clamp(Math.round(Number(els.presetRowsInput.value)), 1, 21);
      updateInputs();
      render();
    });
  });
  els.titleInput.addEventListener("input", event => {
    state.title = event.target.value.trim() || translate("untitledPattern");
    render();
  });

  [els.colsInput, els.rowsInput, els.cellInput, els.numberMode].forEach(input => {
    input.addEventListener("change", applyCanvasSettings);
  });

  window.addEventListener("keydown", event => {
    if (event.code === "Space" && !isTextInput(event.target)) {
      event.preventDefault();
      state.spacePanning = true;
      updatePanUi();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      event.shiftKey ? redo() : undo();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
      event.preventDefault();
      redo();
    }
    const tool = stitches.find(item => item.abbr.toLowerCase() === event.key.toLowerCase());
    if (tool) {
      state.tool = tool.id;
      buildTools();
    }
  });
  window.addEventListener("keyup", event => {
    if (event.code === "Space") {
      state.spacePanning = false;
      updatePanUi();
    }
  });
}

function shouldPan(event) {
  return state.panMode || state.spacePanning || event.button === 1 || event.button === 2;
}

function beginPan(event) {
  state.isPanning = true;
  state.isPainting = false;
  state.hover = null;
  state.panStart = {
    x: event.clientX,
    y: event.clientY,
    left: els.stageWrap.scrollLeft,
    top: els.stageWrap.scrollTop
  };
  els.stageWrap.classList.add("panning");
  els.stageWrap.setPointerCapture(event.pointerId);
  event.preventDefault();
  event.stopPropagation();
}

function panMove(event) {
  if (!state.isPanning || !state.panStart) return;
  const dx = event.clientX - state.panStart.x;
  const dy = event.clientY - state.panStart.y;
  els.stageWrap.scrollLeft = state.panStart.left - dx;
  els.stageWrap.scrollTop = state.panStart.top - dy;
  event.preventDefault();
}

function endPan(event) {
  if (!state.isPanning) return;
  state.isPanning = false;
  state.panStart = null;
  els.stageWrap.classList.remove("panning");
  if (event?.pointerId != null && els.stageWrap.hasPointerCapture(event.pointerId)) {
    els.stageWrap.releasePointerCapture(event.pointerId);
  }
}

function togglePanMode() {
  state.panMode = !state.panMode;
  updatePanUi();
}

function updatePanUi() {
  document.getElementById("panBtn").classList.toggle("active", state.panMode);
  els.stageWrap.classList.toggle("pan-ready", state.panMode || state.spacePanning);
}

function zoomWithWheel(event) {
  event.preventDefault();
  const direction = event.deltaY < 0 ? 1 : -1;
  zoomAt(event.clientX, event.clientY, direction * .1);
}

function zoomAt(clientX, clientY, delta) {
  const before = state.zoom;
  const wrapRect = els.stageWrap.getBoundingClientRect();
  const viewportX = clientX - wrapRect.left;
  const viewportY = clientY - wrapRect.top;
  const contentX = els.stageWrap.scrollLeft + viewportX;
  const contentY = els.stageWrap.scrollTop + viewportY;
  const unscaledX = contentX / before;
  const unscaledY = contentY / before;
  setZoom(before + delta);
  els.stageWrap.scrollLeft = unscaledX * state.zoom - viewportX;
  els.stageWrap.scrollTop = unscaledY * state.zoom - viewportY;
}

function isTextInput(target) {
  return ["INPUT", "SELECT", "TEXTAREA"].includes(target?.tagName);
}

function paintAt(event, startAction) {
  const pos = eventToCell(event);
  if (!pos) return;
  const changed = applyPresetAt(pos, startAction);
  if (!changed) return;
  state.selected = pos;
  state.redo = [];
  render();
}

function eventToCell(event) {
  const rect = els.canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / state.zoom;
  const y = (event.clientY - rect.top) / state.zoom;
  const chartX = x - state.gutter;
  const chartY = y - 58;
  const col = Math.floor(chartX / state.cell);
  const row = Math.floor(chartY / state.cell);
  if (row < 0 || row >= state.rows || col < 0 || col >= state.cols) return null;
  return { row, col };
}

function applyPresetAt(pos, startAction) {
  const cells = getPresetCells(pos.row, pos.col);
  const next = state.tool === "erase"
    ? { stitch: "empty", color: "#24221f" }
    : { stitch: state.tool, color: state.color };
  const changed = [];
  cells.forEach(cell => {
    if (cell.row < 0 || cell.row >= state.rows || cell.col < 0 || cell.col >= state.cols) return;
    const current = state.grid[cell.row][cell.col];
    if (current.stitch === next.stitch && sameColor(current.color, next.color)) return;
    changed.push(cell);
  });
  if (!changed.length) return false;
  if (startAction) pushUndo();
  changed.forEach(cell => {
    state.grid[cell.row][cell.col] = { ...next };
  });
  return true;
}

function getPresetCells(centerRow, centerCol) {
  if (state.preset === "single") return [{ row: centerRow, col: centerCol }];
  const width = clamp(Math.round(state.presetCols), 1, 21);
  const height = clamp(Math.round(state.presetRows), 1, 21);
  const left = centerCol - Math.floor(width / 2);
  const top = centerRow - Math.floor(height / 2);
  const star = state.preset === "star" ? starPolygon(width, height) : null;
  const cells = [];
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (state.preset === "rect") {
        cells.push({ row: top + r, col: left + c });
        continue;
      }
      const nx = width === 1 ? 0 : (c / (width - 1)) * 2 - 1;
      const ny = height === 1 ? 0 : (r / (height - 1)) * 2 - 1;
      if (state.preset === "circle") {
        if ((nx * nx) + (ny * ny) <= 1.02) cells.push({ row: top + r, col: left + c });
        continue;
      }
      if (state.preset === "star" && pointInPolygon({ x: c + .5, y: r + .5 }, star)) {
        cells.push({ row: top + r, col: left + c });
      }
    }
  }
  return cells;
}

function starPolygon(width, height) {
  const points = [];
  const cx = width / 2;
  const cy = height / 2;
  const outer = Math.max(1.5, Math.min(width, height) * .48);
  const inner = outer * .45;
  for (let i = 0; i < 10; i++) {
    const angle = (-Math.PI / 2) + (i * Math.PI / 5);
    const radius = i % 2 === 0 ? outer : inner;
    points.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius
    });
  }
  return points;
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y))
      && (point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || .00001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function applyCanvasSettings() {
  pushUndo();
  const nextCols = clamp(Number(els.colsInput.value), 4, 80);
  const nextRows = clamp(Number(els.rowsInput.value), 4, 80);
  const nextCell = clamp(Number(els.cellInput.value), 22, 54);
  const nextGrid = blankGrid(nextRows, nextCols);
  for (let r = 0; r < Math.min(state.rows, nextRows); r++) {
    for (let c = 0; c < Math.min(state.cols, nextCols); c++) {
      nextGrid[r][c] = { ...state.grid[r][c] };
    }
  }
  state.rows = nextRows;
  state.cols = nextCols;
  state.cell = nextCell;
  state.numberMode = els.numberMode.value;
  state.grid = nextGrid;
  state.redo = [];
  updateInputs();
  render();
}

function pushUndo() {
  state.undo.push(copyGrid());
  if (state.undo.length > 60) state.undo.shift();
  document.getElementById("undoBtn").disabled = false;
}

function undo() {
  if (!state.undo.length) return;
  state.redo.push(copyGrid());
  state.grid = state.undo.pop();
  state.selected = null;
  syncSizeFromGrid();
  render();
}

function redo() {
  if (!state.redo.length) return;
  state.undo.push(copyGrid());
  state.grid = state.redo.pop();
  state.selected = null;
  syncSizeFromGrid();
  render();
}

function clearGrid() {
  if (!hasContent()) return;
  pushUndo();
  state.grid = blankGrid(state.rows, state.cols);
  state.redo = [];
  state.selected = null;
  render();
}

function mirrorHorizontal() {
  pushUndo();
  state.grid = state.grid.map(row => row.slice().reverse());
  state.redo = [];
  render();
}

function fillSelectedRow() {
  const row = state.selected?.row ?? state.hover?.row;
  if (row == null) return;
  pushUndo();
  for (let c = 0; c < state.cols; c++) {
    state.grid[row][c] = state.tool === "erase"
      ? { stitch: "empty", color: "#24221f" }
      : { stitch: state.tool, color: state.color };
  }
  state.redo = [];
  render();
}

function outlineGrid() {
  pushUndo();
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      if (r === 0 || c === 0 || r === state.rows - 1 || c === state.cols - 1) {
        state.grid[r][c] = { stitch: state.tool === "erase" ? "sc" : state.tool, color: state.color };
      }
    }
  }
  state.redo = [];
  render();
}

function setZoom(value) {
  state.zoom = clamp(Math.round(value * 10) / 10, .5, 1.8);
  els.stage.style.zoom = state.zoom;
  els.stage.style.transform = "";
  els.zoomLabel.textContent = `${Math.round(state.zoom * 100)}%`;
}

function updateInputs() {
  els.colsInput.value = state.cols;
  els.rowsInput.value = state.rows;
  els.cellInput.value = state.cell;
  els.numberMode.value = state.numberMode;
  els.bgOpacityInput.value = state.background.opacity;
  els.bgScaleInput.value = state.background.scale;
  els.bgOffsetXInput.value = state.background.offsetX;
  els.bgOffsetYInput.value = state.background.offsetY;
  els.presetColsInput.value = state.presetCols;
  els.presetRowsInput.value = state.presetRows;
  els.titleInput.value = state.title;
  els.customColor.value = normalizeColor(state.color);
  updateBackgroundInfo();
  setZoom(state.zoom);
}

function syncSizeFromGrid() {
  state.rows = state.grid.length;
  state.cols = state.grid[0]?.length || state.cols;
  updateInputs();
}

function render() {
  const width = state.cols * state.cell + state.gutter * 2;
  const height = state.rows * state.cell + 92;
  els.canvas.style.width = `${width}px`;
  els.canvas.style.height = `${height}px`;
  els.canvas.width = Math.round(width * dpr);
  els.canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fffefa";
  ctx.fillRect(0, 0, width, height);
  drawTitle(width);
  drawBackgroundImage();
  drawGrid();
  drawCells();
  drawHover();
  updateLegend();
  updateStatus();
  document.getElementById("undoBtn").disabled = !state.undo.length;
  document.getElementById("redoBtn").disabled = !state.redo.length;
}

function drawTitle(width) {
  ctx.fillStyle = "#24221f";
  ctx.font = "700 18px Segoe UI, Microsoft YaHei, Arial";
  ctx.textAlign = "left";
  ctx.fillText(state.title, state.gutter, 30);
  ctx.fillStyle = "#6d6860";
  ctx.font = "12px Segoe UI, Microsoft YaHei, Arial";
  ctx.textAlign = "right";
  ctx.fillText(`${state.cols} x ${state.rows}`, width - state.gutter, 30);
}

function drawBackgroundImage() {
  if (!state.background.image || !state.background.src) return;
  const left = state.gutter;
  const top = 58;
  const drawWidth = state.background.naturalWidth * (state.background.scale / 100);
  const drawHeight = state.background.naturalHeight * (state.background.scale / 100);
  ctx.save();
  ctx.beginPath();
  ctx.rect(left, top, state.cols * state.cell, state.rows * state.cell);
  ctx.clip();
  ctx.globalAlpha = state.background.opacity / 100;
  ctx.drawImage(
    state.background.image,
    left + state.background.offsetX,
    top + state.background.offsetY,
    drawWidth,
    drawHeight
  );
  ctx.restore();
}

function drawGrid() {
  const left = state.gutter;
  const top = 58;
  const right = left + state.cols * state.cell;
  const bottom = top + state.rows * state.cell;
  ctx.strokeStyle = "#ded7ce";
  ctx.lineWidth = 1;
  for (let c = 0; c <= state.cols; c++) {
    const x = left + c * state.cell + .5;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
  }
  for (let r = 0; r <= state.rows; r++) {
    const y = top + r * state.cell + .5;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#7f756a";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(left + .5, top + .5, state.cols * state.cell, state.rows * state.cell);
  drawRowNumbers(top, left, right);
}

function drawRowNumbers(top, left, right) {
  if (state.numberMode === "none") return;
  ctx.font = "12px Segoe UI, Microsoft YaHei, Arial";
  ctx.fillStyle = "#6d6860";
  ctx.textBaseline = "middle";
  for (let r = 0; r < state.rows; r++) {
    const rowNo = state.rows - r;
    const y = top + r * state.cell + state.cell / 2;
    const side = state.numberMode === "both" ? (rowNo % 2 ? "right" : "left") : state.numberMode;
    ctx.textAlign = side === "right" ? "left" : "right";
    ctx.fillText(rowNo, side === "right" ? right + 12 : left - 12, y);
  }
  ctx.textBaseline = "alphabetic";
}

function drawCells() {
  const left = state.gutter;
  const top = 58;
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const cell = state.grid[r][c];
      if (cell.stitch === "empty") continue;
      const x = left + c * state.cell + state.cell / 2;
      const y = top + r * state.cell + state.cell / 2;
      drawSymbol(ctx, cell.stitch, x, y, state.cell * .66, cell.color);
    }
  }
}

function drawHover() {
  const pos = state.hover || state.selected;
  if (!pos) return;
  const cells = getPresetCells(pos.row, pos.col);
  ctx.save();
  ctx.strokeStyle = state.hover ? "#2f7d78" : "#cf5f42";
  ctx.fillStyle = state.hover ? "rgba(47, 125, 120, .10)" : "rgba(207, 95, 66, .10)";
  ctx.lineWidth = 2;
  cells.forEach(cell => {
    if (cell.row < 0 || cell.row >= state.rows || cell.col < 0 || cell.col >= state.cols) return;
    const x = state.gutter + cell.col * state.cell;
    const y = 58 + cell.row * state.cell;
    ctx.fillRect(x + 4, y + 4, state.cell - 8, state.cell - 8);
    ctx.strokeRect(x + 2, y + 2, state.cell - 4, state.cell - 4);
  });
  ctx.restore();
}

function drawSymbol(target, stitchId, x, y, size, color) {
  target.save();
  target.strokeStyle = color;
  target.fillStyle = color;
  target.lineWidth = Math.max(2, size / 11);
  target.lineCap = "round";
  target.lineJoin = "round";
  const s = size / 2;

  if (stitchId === "ch") {
    target.beginPath();
    target.ellipse(x, y, s * .78, s * .42, -.28, 0, Math.PI * 2);
    target.stroke();
  } else if (stitchId === "slst") {
    target.beginPath();
    target.arc(x, y, s * .22, 0, Math.PI * 2);
    target.fill();
  } else if (stitchId === "sc") {
    line(target, x - s * .54, y - s * .54, x + s * .54, y + s * .54);
    line(target, x + s * .54, y - s * .54, x - s * .54, y + s * .54);
  } else if (stitchId === "hdc") {
    line(target, x, y - s * .74, x, y + s * .72);
    line(target, x - s * .48, y - s * .7, x + s * .48, y - s * .7);
  } else if (stitchId === "dc") {
    line(target, x, y - s * .76, x, y + s * .72);
    line(target, x - s * .5, y - s * .7, x + s * .5, y - s * .7);
    line(target, x - s * .48, y - s * .12, x + s * .48, y + s * .12);
  } else if (stitchId === "tr") {
    line(target, x, y - s * .76, x, y + s * .72);
    line(target, x - s * .5, y - s * .7, x + s * .5, y - s * .7);
    line(target, x - s * .48, y - s * .25, x + s * .48, y - s * .02);
    line(target, x - s * .48, y + s * .16, x + s * .48, y + s * .39);
  } else if (stitchId === "inc") {
    line(target, x, y + s * .68, x - s * .52, y - s * .58);
    line(target, x, y + s * .68, x + s * .52, y - s * .58);
    line(target, x - s * .72, y - s * .58, x - s * .32, y - s * .58);
    line(target, x + s * .32, y - s * .58, x + s * .72, y - s * .58);
  } else if (stitchId === "dec") {
    line(target, x - s * .54, y + s * .68, x, y - s * .58);
    line(target, x + s * .54, y + s * .68, x, y - s * .58);
    line(target, x - s * .72, y + s * .68, x - s * .32, y + s * .68);
    line(target, x + s * .32, y + s * .68, x + s * .72, y + s * .68);
  } else if (stitchId === "bobble") {
    for (let i = 0; i < 5; i++) {
      target.beginPath();
      target.arc(x + (i - 2) * s * .24, y + Math.abs(i - 2) * s * .08, s * .24, 0, Math.PI * 2);
      target.stroke();
    }
  } else if (stitchId === "picot") {
    target.beginPath();
    target.moveTo(x - s * .58, y + s * .45);
    target.quadraticCurveTo(x, y - s * .85, x + s * .58, y + s * .45);
    target.stroke();
    target.beginPath();
    target.arc(x, y - s * .28, s * .2, 0, Math.PI * 2);
    target.stroke();
  } else if (stitchId === "eraser") {
    target.strokeStyle = "#9b9185";
    target.strokeRect(x - s * .55, y - s * .35, s * 1.1, s * .7);
    line(target, x - s * .18, y - s * .35, x + s * .18, y + s * .35);
  }

  target.restore();
}

function line(target, x1, y1, x2, y2) {
  target.beginPath();
  target.moveTo(x1, y1);
  target.lineTo(x2, y2);
  target.stroke();
}

function importBackgroundImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    setBackgroundImage({
      src: reader.result,
      name: file.name,
      opacity: state.background.opacity,
      scale: state.background.scale,
      offsetX: state.background.offsetX,
      offsetY: state.background.offsetY
    });
    flashStatus(translate("referenceLoaded"));
  };
  reader.readAsDataURL(file);
  event.target.value = "";
}

function clearBackgroundImage() {
  if (!state.background.src) return;
  state.background = {
    src: "",
    name: "",
    opacity: 35,
    scale: 100,
    offsetX: 0,
    offsetY: 0,
    naturalWidth: 0,
    naturalHeight: 0,
    image: null
  };
  updateInputs();
  render();
}

function setBackgroundImage(background = {}) {
  const next = {
    ...state.background,
    ...background,
    opacity: clamp(Math.round(Number(background.opacity ?? state.background.opacity)), 0, 100),
    scale: clamp(Math.round(Number(background.scale ?? state.background.scale)), 10, 300),
    offsetX: clamp(Math.round(Number(background.offsetX ?? state.background.offsetX)), -2000, 2000),
    offsetY: clamp(Math.round(Number(background.offsetY ?? state.background.offsetY)), -2000, 2000),
    naturalWidth: 0,
    naturalHeight: 0,
    image: null
  };
  state.background = next;
  if (!next.src) {
    updateInputs();
    render();
    return;
  }
  const image = new Image();
  image.onload = () => {
    state.background.image = image;
    state.background.naturalWidth = image.naturalWidth || image.width;
    state.background.naturalHeight = image.naturalHeight || image.height;
    updateInputs();
    render();
  };
  image.src = next.src;
}

function updateBackgroundInfo() {
  if (!state.background.src) {
    els.bgInfoText.textContent = translate("noReferenceImage");
    return;
  }
  const name = state.background.name || translate("embeddedImage");
  const size = state.background.naturalWidth && state.background.naturalHeight
    ? `${state.background.naturalWidth} x ${state.background.naturalHeight}`
    : translate("loading");
  els.bgInfoText.textContent = `${name} · ${size}`;
}

function updateLegend() {
  const counts = new Map();
  for (const row of state.grid) {
    for (const cell of row) {
      if (cell.stitch !== "empty") counts.set(cell.stitch, (counts.get(cell.stitch) || 0) + 1);
    }
  }
  els.legend.innerHTML = "";
  const used = stitches.filter(stitch => stitch.id !== "erase" && stitch.id !== "empty" && counts.has(stitch.id));
  if (!used.length) {
    els.legend.innerHTML = `<p class="note">${translate("noStitches")}</p>`;
  } else {
    used.forEach(stitch => {
      const row = document.createElement("div");
      row.className = "legend-row";
      row.innerHTML = `<div class="legend-icon">${symbolSvg(stitch.id, "#24221f")}</div><div class="legend-name">${termLabel(stitch)} (${stitch.abbr})</div><div class="legend-count">${counts.get(stitch.id)}</div>`;
      els.legend.appendChild(row);
    });
  }
  const total = [...counts.values()].reduce((sum, value) => sum + value, 0);
  els.summaryText.textContent = translate("summary")(state.title, state.cols, state.rows, total);
}

function updateStatus() {
  const stitch = stitches.find(item => item.id === state.tool);
  const preset = shapePresets.find(item => item.id === state.preset);
  const pos = state.hover
    ? translate("position")(state.rows - state.hover.row, state.hover.col + 1)
    : translate("ready");
  els.status.textContent = `${pos} · ${stitch ? termLabel(stitch) : ""} · ${preset ? localizedLabel(preset) : localizedLabel(shapePresets[0])}`;
}

function shapeSvg(shapeId) {
  const paths = {
    single: `<rect x="13" y="13" width="6" height="6" rx="1.5"/>`,
    rect: `<rect x="7" y="9" width="18" height="14" rx="2"/>`,
    circle: `<ellipse cx="16" cy="16" rx="9" ry="7"/>`,
    star: `<path d="m16 7 2.9 5.8 6.4.9-4.6 4.5 1.1 6.3-5.8-3-5.8 3 1.1-6.3-4.6-4.5 6.4-.9Z"/>`
  };
  return `<svg viewBox="0 0 32 32" aria-hidden="true">${paths[shapeId] || paths.single}</svg>`;
}

function symbolSvg(stitchId, color) {
  const paths = {
    empty: `<rect x="7" y="7" width="18" height="18" rx="2" fill="none" stroke="${color}" stroke-dasharray="3 3"/>`,
    ch: `<ellipse cx="16" cy="16" rx="9" ry="5" transform="rotate(-18 16 16)" fill="none" stroke="${color}" stroke-width="2.4"/>`,
    slst: `<circle cx="16" cy="16" r="4" fill="${color}"/>`,
    sc: `<path d="M9 9l14 14M23 9 9 23" stroke="${color}" stroke-width="2.6" stroke-linecap="round"/>`,
    hdc: `<path d="M16 7v18M10 7h12" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>`,
    dc: `<path d="M16 7v18M10 7h12M10 15l12 3" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>`,
    tr: `<path d="M16 7v18M10 7h12M10 13l12 3M10 19l12 3" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>`,
    inc: `<path d="M16 25 9 8M16 25l7-17M7 8h5M20 8h5" stroke="${color}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>`,
    dec: `<path d="M9 25 16 8M23 25 16 8M7 25h5M20 25h5" stroke="${color}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>`,
    bobble: `<circle cx="10" cy="17" r="3.4" fill="none" stroke="${color}" stroke-width="2"/><circle cx="16" cy="14" r="3.4" fill="none" stroke="${color}" stroke-width="2"/><circle cx="22" cy="17" r="3.4" fill="none" stroke="${color}" stroke-width="2"/>`,
    picot: `<path d="M8 22Q16 6 24 22" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/><circle cx="16" cy="13" r="3" fill="none" stroke="${color}" stroke-width="2"/>`,
    eraser: `<path d="M9 13 18 8l6 10-9 5-6-10Z" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/><path d="m13 11 6 10" stroke="${color}" stroke-width="2"/>`
  };
  return `<svg viewBox="0 0 32 32" aria-hidden="true">${paths[stitchId] || paths.empty}</svg>`;
}

function saveProject() {
  localStorage.setItem("crochet-chart-project", JSON.stringify(projectData()));
  flashStatus(translate("savedToBrowser"));
}

function projectData() {
  return {
    app: "crochet-chart-designer",
    version: 1,
    title: state.title,
    rows: state.rows,
    cols: state.cols,
    cell: state.cell,
    numberMode: state.numberMode,
    background: {
      src: state.background.src,
      name: state.background.name,
      opacity: state.background.opacity,
      scale: state.background.scale,
      offsetX: state.background.offsetX,
      offsetY: state.background.offsetY
    },
    grid: state.grid
  };
}

function loadProject(data, recordUndo = true) {
  if (recordUndo && state.grid.length) pushUndo();
  state.title = data.title && !isDefaultTitle(data.title) ? data.title : translate("defaultTitle");
  state.rows = clamp(Number(data.rows || data.grid?.length || 18), 4, 80);
  state.cols = clamp(Number(data.cols || data.grid?.[0]?.length || 24), 4, 80);
  state.cell = clamp(Number(data.cell || 34), 22, 54);
  state.numberMode = data.numberMode || "both";
  state.background = {
    src: "",
    name: "",
    opacity: 35,
    scale: 100,
    offsetX: 0,
    offsetY: 0,
    naturalWidth: 0,
    naturalHeight: 0,
    image: null
  };
  state.grid = blankGrid(state.rows, state.cols);
  if (Array.isArray(data.grid)) {
    for (let r = 0; r < Math.min(state.rows, data.grid.length); r++) {
      for (let c = 0; c < Math.min(state.cols, data.grid[r].length); c++) {
        const cell = data.grid[r][c] || {};
        state.grid[r][c] = {
          stitch: stitches.some(item => item.id === cell.stitch) ? cell.stitch : "empty",
          color: normalizeColor(cell.color || "#24221f")
        };
      }
    }
  }
  state.redo = [];
  if (data.background?.src) setBackgroundImage(data.background);
  updateInputs();
  render();
}

function exportJson() {
  downloadBlob(`${safeName(state.title)}.json`, JSON.stringify(projectData(), null, 2), "application/json");
}

function importJson(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      loadProject(JSON.parse(reader.result), true);
      flashStatus(translate("jsonImported"));
    } catch {
      flashStatus(translate("jsonInvalid"));
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function exportPng() {
  const link = document.createElement("a");
  link.download = `${safeName(state.title)}.png`;
  link.href = els.canvas.toDataURL("image/png");
  link.click();
}

function exportSvg() {
  const svg = buildSvg();
  downloadBlob(`${safeName(state.title)}.svg`, svg, "image/svg+xml");
}

function buildSvg() {
  const width = state.cols * state.cell + state.gutter * 2;
  const height = state.rows * state.cell + 92;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="#fffefa"/>`,
    `<text x="${state.gutter}" y="30" font-family="Segoe UI, Microsoft YaHei, Arial" font-size="18" font-weight="700" fill="#24221f">${escapeXml(state.title)}</text>`,
    `<text x="${width - state.gutter}" y="30" text-anchor="end" font-family="Segoe UI, Microsoft YaHei, Arial" font-size="12" fill="#6d6860">${state.cols} x ${state.rows}</text>`
  ];
  const left = state.gutter;
  const top = 58;
  for (let c = 0; c <= state.cols; c++) {
    const x = left + c * state.cell;
    parts.push(`<line x1="${x}" y1="${top}" x2="${x}" y2="${top + state.rows * state.cell}" stroke="#ded7ce"/>`);
  }
  for (let r = 0; r <= state.rows; r++) {
    const y = top + r * state.cell;
    parts.push(`<line x1="${left}" y1="${y}" x2="${left + state.cols * state.cell}" y2="${y}" stroke="#ded7ce"/>`);
  }
  parts.push(`<rect x="${left}" y="${top}" width="${state.cols * state.cell}" height="${state.rows * state.cell}" fill="none" stroke="#7f756a" stroke-width="1.5"/>`);
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const cell = state.grid[r][c];
      if (cell.stitch === "empty") continue;
      const x = left + c * state.cell + state.cell / 2 - 16;
      const y = top + r * state.cell + state.cell / 2 - 16;
      parts.push(`<g transform="translate(${x} ${y}) scale(${state.cell * .66 / 32})">${symbolSvg(cell.stitch, escapeXml(cell.color)).replace("<svg viewBox=\"0 0 32 32\" aria-hidden=\"true\">", "").replace("</svg>", "")}</g>`);
    }
  }
  parts.push("</svg>");
  return parts.join("");
}

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function flashStatus(text) {
  els.status.textContent = text;
  setTimeout(updateStatus, 1200);
}

function hasContent() {
  return state.grid.some(row => row.some(cell => cell.stitch !== "empty"));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function safeName(name) {
  return (name || "crochet-chart").replace(/[\\/:*?"<>|]+/g, "-").trim() || "crochet-chart";
}

function initialLanguage() {
  const stored = localStorage.getItem("crochet-ui-language");
  if (languages.includes(stored)) return stored;
  const storedMatch = matchSupportedLanguage(stored);
  if (storedMatch) return storedMatch;
  const preferredLanguages = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language || ""];
  for (const language of preferredLanguages) {
    const match = matchSupportedLanguage(language);
    if (match) return match;
  }
  return "zh-CN";
}

function matchSupportedLanguage(language) {
  const normalized = String(language || "").toLowerCase();
  if (!normalized) return "";
  const exact = supportedLanguages.find(item => item.code.toLowerCase() === normalized);
  if (exact) return exact.code;
  if (normalized.startsWith("zh-hant") || normalized.startsWith("zh-tw") || normalized.startsWith("zh-hk") || normalized.startsWith("zh-mo")) return "zh-TW";
  if (normalized.startsWith("zh")) return "zh-CN";
  const base = normalized.split("-")[0];
  return languages.includes(base) ? base : "";
}

function translate(key) {
  return translations[state.language]?.[key] ?? translations.en[key] ?? key;
}

function applyLanguage() {
  document.documentElement.lang = state.language;
  document.title = translate("appTitle");
  els.languageSelect.value = state.language;
  els.languageSelect.setAttribute("aria-label", translate("language"));
  document.querySelectorAll("[data-i18n]").forEach(element => {
    element.textContent = translate(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-title]").forEach(element => {
    const text = translate(element.dataset.i18nTitle);
    element.title = text;
    element.setAttribute("aria-label", text);
  });
  document.querySelectorAll("[data-i18n-alt]").forEach(element => {
    element.alt = translate(element.dataset.i18nAlt);
  });
  updateBackgroundInfo();
}

function buildLanguageOptions() {
  els.languageSelect.innerHTML = "";
  supportedLanguages.forEach(language => {
    const option = document.createElement("option");
    option.value = language.code;
    option.lang = language.code;
    option.textContent = language.label;
    els.languageSelect.appendChild(option);
  });
}

function setLanguage(language) {
  if (!languages.includes(language) || language === state.language) return;
  state.language = language;
  localStorage.setItem("crochet-ui-language", language);
  if (!els.titleInput.value.trim() || isDefaultTitle(els.titleInput.value)) {
    state.title = translate("defaultTitle");
  }
  applyLanguage();
  buildTools();
  buildPresets();
  updateInputs();
  render();
}

function localizedLabel(item) {
  return item.labels[state.language] || item.labels.en;
}

function termLabel(item) {
  return localizedLabel(item);
}

function isDefaultTitle(value) {
  const defaultTitles = languages.map(language => translations[language].defaultTitle);
  defaultTitles.push("我的钩针图案 / My Crochet Chart");
  return defaultTitles.includes(value);
}

function stitchButtonLabel(stitch) {
  const term = termLabel(stitch);
  return stitch.id === "empty" || stitch.id === "erase" ? term : `${term} (${stitch.abbr})`;
}

function normalizeColor(value) {
  if (typeof value !== "string") return "#24221f";
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  return "#24221f";
}

function sameColor(a, b) {
  return normalizeColor(a).toLowerCase() === normalizeColor(b).toLowerCase();
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

init();
