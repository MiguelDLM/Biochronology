// =====================================================================
// ICS Chronostratigraphic Chart Renderer (final)
// Builds an ICS-style hierarchical chart with multiple scale modes
// =====================================================================

const SOURCE_FILES = {
  ics: 'data/ICS_chart.ttl',
  nalma: 'data/nalma.ttl',
  salma: 'data/salma.ttl',
  elma: 'data/elma.ttl',
  alma: 'data/alma.ttl',
  mp: 'data/mp_zones.ttl'
};

const BIOZONE_LABELS = {
  nalma: 'NALMA (Norteamérica)',
  salma: 'SALMA (Sudamérica)',
  elma: 'ELMA (Europa)',
  alma: 'ALMA (Asia)',
  mp: 'MP Zones (Europa)'
};

const COLUMN_BASE = [
  { key: 'time', label: 'Age (Ma)', width: 90, type: 'time' },
  { key: 'eon', label: 'Eonothem / Eon', width: 150, type: 'ics', ranks: ['Supereon', 'Eon'] },
  { key: 'era', label: 'Erathem / Era', width: 160, type: 'ics', ranks: ['Era'] },
  { key: 'period', label: 'System / Period', width: 170, type: 'ics', ranks: ['Period', 'Sub-Period'] },
  { key: 'epoch', label: 'Series / Epoch', width: 170, type: 'ics', ranks: ['Epoch', 'Subseries', 'Series'] },
  { key: 'age', label: 'Stage / Age', width: 170, type: 'ics', ranks: ['Age', 'Stage'] }
];

const RANK_COLUMN_KEY = {
  Supereon: 'eon',
  Eon: 'eon',
  Era: 'era',
  Period: 'period',
  'Sub-Period': 'period',
  Epoch: 'epoch',
  Series: 'epoch',
  Subseries: 'epoch',
  Age: 'age',
  Stage: 'age'
};

const RANK_Z_INDEX = {
  Supereon: 10,
  Eon: 10,
  Era: 20,
  Period: 30,
  'Sub-Period': 35,
  Epoch: 40,
  Series: 40,
  Subseries: 45,
  Age: 60,
  Stage: 60
};

// RDF namespaces
const PREFIXES = {
  skos: 'http://www.w3.org/2004/02/skos/core#',
  time: 'http://www.w3.org/2006/time#',
  ischart: 'http://resource.geosciml.org/classifier/ics/ischart/',
  sdo: 'http://schema.org/',
  https_sdo: 'https://schema.org/',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  gts: 'http://resource.geosciml.org/ontology/timescale/gts#'
};

let parsedData = {};
let currentScaleMode = 'proportional';

// =====================================================================
// Utility Functions
// =====================================================================

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function showLoading(show = true) {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

function showError(message) {
  const container = document.getElementById('error-container');
  if (container) {
    container.innerHTML = `<div class="error-message"><strong>Error:</strong> ${message}</div>`;
  }
  console.error(message);
}

function clearError() {
  const container = document.getElementById('error-container');
  if (container) container.innerHTML = '';
}

function ensurePrefixes(ttlText) {
  const required = {
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    skos: 'http://www.w3.org/2004/02/skos/core#',
    time: 'http://www.w3.org/2006/time#',
    ischart: 'http://resource.geosciml.org/classifier/ics/ischart/',
    sdo: 'https://schema.org/',
    gts: 'http://resource.geosciml.org/ontology/timescale/gts#'
  };

  const missing = [];
  for (const key in required) {
    const regex = new RegExp(`@prefix\\s+${key}:`, 'i');
    if (!regex.test(ttlText)) missing.push(key);
  }

  if (!missing.length) return ttlText;
  const block = missing.map(p => `@prefix ${p}: <${required[p]}> .`).join('\n');
  return `${block}\n\n${ttlText}`;
}

// =====================================================================
// Parsing TTL with N3.js
// =====================================================================

async function parseTTL(sourceKey, ttlText) {
  ttlText = ensurePrefixes(ttlText);
  const parser = new N3.Parser();
  const store = new N3.Store();

  return new Promise((resolve, reject) => {
    parser.parse(ttlText, (error, quad) => {
      if (error) {
        reject(error);
        return;
      }
      if (quad) {
        store.addQuad(quad);
      } else {
        resolve(extractItems(store, sourceKey));
      }
    });
  });
}

function extractItems(store, sourceKey) {
  const items = [];
  const concepts = store.getSubjects(
    PREFIXES.rdf + 'type',
    PREFIXES.skos + 'Concept',
    null
  );

  for (const concept of concepts) {
    const data = extractConcept(store, concept, sourceKey);
    if (data && data.start !== null && data.end !== null) {
      items.push(data);
    }
  }

  return items;
}

function extractConcept(store, conceptUri, sourceKey) {
  const item = {
    id: conceptUri.value,
    label: null,
    start: null,
    end: null,
    color: null,
    rank: null,
    source: sourceKey
  };

  const labels = store.getObjects(conceptUri, PREFIXES.skos + 'prefLabel', null);
  if (labels.length) item.label = labels[0].value;

  const timeBeginnings = store.getObjects(conceptUri, PREFIXES.time + 'hasBeginning', null);
  const timeEnds = store.getObjects(conceptUri, PREFIXES.time + 'hasEnd', null);

  if (timeBeginnings.length) {
    const beginNode = timeBeginnings[0];
    const values = store.getObjects(beginNode, PREFIXES.ischart + 'inMYA', null);
    if (values.length) item.start = parseFloat(values[0].value);
  }

  if (timeEnds.length) {
    const endNode = timeEnds[0];
    const values = store.getObjects(endNode, PREFIXES.ischart + 'inMYA', null);
    if (values.length) item.end = parseFloat(values[0].value);
  }

  let colors = store.getObjects(conceptUri, PREFIXES.sdo + 'color', null);
  if (!colors.length) {
    colors = store.getObjects(conceptUri, PREFIXES.https_sdo + 'color', null);
  }
  if (colors.length) item.color = colors[0].value;

  const ranks = store.getObjects(conceptUri, PREFIXES.gts + 'rank', null);
  if (ranks.length) {
    const rankUri = ranks[0].value;
    item.rank = rankUri.substring(rankUri.lastIndexOf('/') + 1);
  }

  return item;
}

// =====================================================================
// Data Loading & Event Handling
// =====================================================================

async function loadAllSelectedSources() {
  showLoading(true);
  clearError();

  const selectedSources = getSelectedSources();
  if (!selectedSources.length) {
    showError('Selecciona al menos una fuente de datos.');
    showLoading(false);
    return;
  }

  try {
    if (!parsedData.ics) {
      const ttlText = await fetchText(SOURCE_FILES.ics);
      parsedData.ics = await parseTTL('ics', ttlText);
    }

    for (const source of selectedSources) {
      if (!parsedData[source]) {
        const ttlText = await fetchText(SOURCE_FILES[source]);
        parsedData[source] = await parseTTL(source, ttlText);
      }
    }
    renderChart(selectedSources);
  } catch (error) {
    showError(`Error al cargar datos: ${error.message}`);
    console.error(error);
  } finally {
    showLoading(false);
  }
}

function getSelectedSources() {
  const checkboxes = document.querySelectorAll('.source-checkbox:checked');
  return Array.from(checkboxes).map(cb => cb.dataset.source);
}

// =====================================================================
// Chart Rendering Pipeline
// =====================================================================

function renderChart(selectedSources) {
  const container = document.getElementById('chart-container');
  if (!container) return;
  container.innerHTML = '';

  const [minMa, maxMa] = getTimeRange();
  const icsItems = parsedData.ics || [];
  // Debug: detect and report items with very small overlap with the visible range
  detectTinyOverlaps(icsItems, minMa, maxMa);
  const scale = buildScale(minMa, maxMa, currentScaleMode, icsItems);
  const geoColorIndex = buildGeoColorIndex(icsItems);
  const columns = getColumnDefinitions(selectedSources);

  const header = renderHeader(columns);
  container.appendChild(header);

  const body = document.createElement('div');
  body.className = 'chart-body';
  body.style.height = `${scale.totalHeight}px`;
  container.appendChild(body);

  let currentLeft = 0;
  for (const column of columns) {
    const columnEl = document.createElement('div');
    columnEl.className = `chart-column column-${column.key}`;
    columnEl.style.left = `${currentLeft}px`;
    columnEl.style.width = `${column.width}px`;
    columnEl.style.height = `${scale.totalHeight}px`;

    if (column.type === 'time') {
      renderTimeColumn(columnEl, scale, minMa, maxMa);
    } else if (column.type === 'ics') {
      renderIcsColumn(columnEl, icsItems, column.ranks, scale, minMa, maxMa);
    } else if (column.type === 'biozone' && parsedData[column.key]) {
      renderBiozoneColumn(columnEl, parsedData[column.key], column.key, scale, minMa, maxMa, geoColorIndex);
    }

    body.appendChild(columnEl);
    currentLeft += column.width;
  }

  body.style.width = `${currentLeft}px`;
  header.style.width = `${currentLeft}px`;
}

function detectTinyOverlaps(items, min, max) {
  const EPS_MA = 0.05;
  const small = [];
  for (const it of items) {
    const itemMin = Math.min(it.start, it.end);
    const itemMax = Math.max(it.start, it.end);
    const overlap = Math.min(itemMax, max) - Math.max(itemMin, min);
    if (overlap > 0 && overlap <= EPS_MA) {
      small.push({ id: it.id, label: it.label, start: it.start, end: it.end, overlap });
    }
  }
  if (small.length) {
    console.warn('Tiny overlaps with visible range detected (<=0.05 Ma):', small);
  }
}

function renderHeader(columns) {
  const header = document.createElement('div');
  header.className = 'chart-header';
  let cumulative = 0;
  for (const column of columns) {
    const cell = document.createElement('div');
    cell.className = `column-header header-${column.key}`;
    cell.style.width = `${column.width}px`;
    cell.style.left = `${cumulative}px`;
    cell.textContent = column.label;
    header.appendChild(cell);
    cumulative += column.width;
  }
  return header;
}

function getColumnDefinitions(selectedSources) {
  const defs = COLUMN_BASE.map(col => ({ ...col }));
  // Order biozones so European zones (ELMA & MP) are adjacent
  const biozones = ['nalma', 'salma', 'elma', 'mp', 'alma'];
  for (const key of biozones) {
    if (selectedSources.includes(key)) {
      defs.push({ key, label: BIOZONE_LABELS[key], width: 180, type: 'biozone' });
    }
  }
  return defs;
}

// =====================================================================
// Scale Builders
// =====================================================================

function buildScale(minMa, maxMa, mode, icsItems) {
  const min = Math.min(minMa, maxMa);
  const max = Math.max(minMa, maxMa);
  const ages = (icsItems || []).filter(item => item.rank === 'Age' || item.rank === 'Stage');
  const visibleAges = ages.filter(item => overlapsRange(item, min, max));

  if (mode === 'equal' && visibleAges.length) {
    const sorted = [...visibleAges].sort((a, b) => a.end - b.end); // younger (low Ma) first
    const slotHeight = 90;
    const ageBoundaries = new Map();
    sorted.forEach((age, index) => {
      const top = index * slotHeight;
      ageBoundaries.set(age.id, {
        top,
        bottom: top + slotHeight,
        age
      });
    });
    const totalHeight = Math.max(sorted.length * slotHeight, 600);

    return {
      mode,
      min,
      max,
      totalHeight,
      ageBoundaries,
      timeToY(value) {
        const clamped = clampTime(value, min, max);
        for (const boundary of ageBoundaries.values()) {
          const { age, top, bottom } = boundary;
          if (clamped <= age.start + 1e-6 && clamped >= age.end - 1e-6) {
            const span = age.start - age.end;
            const ratio = span > 0 ? (clamped - age.end) / span : 0;
            return top + ratio * (bottom - top);
          }
        }
        // fallback linear inside range
        return ((clamped - min) / (max - min)) * totalHeight;
      }
    };
  }

  const pixelsPerMa = mode === 'logarithmic' ? 45 : 32;
  // Slightly boost pixelsPerMa for shorter spans (e.g. whole Cenozoic 0-66 Ma)
  // so very short ages (late Pleistocene, etc.) render with visible height.
  let adjustedPixelsPerMa = pixelsPerMa;
  const span = max - min;
  if (mode !== 'logarithmic' && span > 0 && span <= 66) {
    adjustedPixelsPerMa = Math.round(pixelsPerMa * 1.4);
  }

  const totalHeight = Math.max(span * adjustedPixelsPerMa, 700);
  // Add a small top/bottom padding so labels at the extremes (0 Ma) are visible
  const topPadding = 12;
  const bottomPadding = 20;
  const effectiveHeight = Math.max(totalHeight - topPadding - bottomPadding, 200);

  if (mode === 'logarithmic') {
    const offset = 0.05;
    const logMin = Math.log(min + offset);
    const logMax = Math.log(max + offset);
    return {
      mode,
      min,
      max,
      totalHeight,
      ageBoundaries: null,
      timeToY(value) {
        const clamped = clampTime(value, min, max);
        const logValue = Math.log(clamped + offset);
        const normalized = (logValue - logMin) / (logMax - logMin || 1);
        return topPadding + normalized * effectiveHeight;
      }
    };
  }

  // proportional (linear)
  return {
    mode,
    min,
    max,
    totalHeight,
    ageBoundaries: null,
    timeToY(value) {
      const clamped = clampTime(value, min, max);
      const fraction = (clamped - min) / (max - min || 1);
      return topPadding + fraction * effectiveHeight;
    }
  };
}

// =====================================================================
// Column Renderers
// =====================================================================

function renderTimeColumn(columnEl, scale, min, max) {
  columnEl.classList.add('time-column');

  const majorInterval = chooseInterval(max - min);
  // iterate major ticks but avoid placing a tick exactly at the exclusive upper bound
  for (let ma = min; ma < max - 1e-9; ma += majorInterval) {
    const y = scale.timeToY(ma);
    const line = document.createElement('div');
    line.className = 'time-line';
    line.style.top = `${y}px`;
    columnEl.appendChild(line);

    const label = document.createElement('span');
    label.className = 'time-label';
    // Nudge the label for 0 Ma slightly down so it's visible against the top padding
    label.style.top = `${ma === 0 ? y + 6 : y}px`;
    label.textContent = ma === 0 ? '0 (Presente)' : ma.toFixed(ma < 10 ? 1 : 0);
    columnEl.appendChild(label);
  }

  // Add range box at extremes for clarity
  const topLine = document.createElement('div');
  topLine.className = 'time-axis-border';
  topLine.style.top = `${scale.timeToY(min)}px`;
  columnEl.appendChild(topLine);

  const bottomLine = document.createElement('div');
  bottomLine.className = 'time-axis-border';
  bottomLine.style.top = `${scale.timeToY(clampTime(max, min, max))}px`;
  columnEl.appendChild(bottomLine);
}

function renderIcsColumn(columnEl, items, ranks, scale, min, max) {
  columnEl.classList.add('ics-column');
  const relevant = items.filter(item => item.rank && ranks.includes(item.rank) && overlapsRange(item, min, max));
  relevant.sort((a, b) => (a.start - b.start)); // older (higher Ma) last

  for (const item of relevant) {
    const { top, height } = getBoxPosition(item, scale, min, max);
    const box = document.createElement('div');
    box.className = `ics-box rank-${(item.rank || '').toLowerCase()}`;
    box.style.top = `${top}px`;
    box.style.height = `${height}px`;
    box.style.zIndex = RANK_Z_INDEX[item.rank] || 30;

  const fill = item.color || '#b9c2d0';
    box.style.backgroundColor = fill;
    box.style.color = getContrastColor(fill);

    const label = document.createElement('span');
    label.className = 'ics-label';
    label.textContent = item.label || '—';
    box.appendChild(label);

    const clampedStart = clampTime(item.start, min, max);
    const clampedEnd = clampTime(item.end, min, max);
    box.title = `${item.label || '—'}\n${clampedEnd.toFixed(2)} - ${clampedStart.toFixed(2)} Ma`;

    columnEl.appendChild(box);
  }
}

function renderBiozoneColumn(columnEl, items, key, scale, min, max, geoColorIndex) {
  columnEl.classList.add('biozone-column');
  columnEl.classList.add(`biozone-${key}`);

  const relevant = items.filter(item => overlapsRange(item, min, max));
  relevant.sort((a, b) => a.start - b.start);

  for (const item of relevant) {
    const { top, height } = getBoxPosition(item, scale, min, max);
    const box = document.createElement('div');
    box.className = 'biozone-box';
    box.style.top = `${top}px`;
    box.style.height = `${height}px`;

    const geoColor = resolveGeoColorForInterval(item, geoColorIndex) || '#dde6f6';
    box.style.backgroundColor = geoColor;
    box.style.borderLeftColor = darkenColor(geoColor, 0.35);
    box.style.color = getContrastColor(geoColor);

    const label = document.createElement('span');
    label.className = 'biozone-label';
    label.textContent = item.label || '—';
    box.appendChild(label);

    const clampedStart = clampTime(item.start, min, max);
    const clampedEnd = clampTime(item.end, min, max);
    box.title = `${item.label || '—'}\n${clampedEnd.toFixed(2)} - ${clampedStart.toFixed(2)} Ma`;

    columnEl.appendChild(box);
  }
}

// =====================================================================
// Rendering Helpers
// =====================================================================

function getBoxPosition(item, scale, min, max) {
  const startClamped = clampTime(item.start, min, max);
  const endClamped = clampTime(item.end, min, max);
  const yStart = scale.timeToY(startClamped);
  const yEnd = scale.timeToY(endClamped);
  const top = Math.min(yStart, yEnd);
  // Ensure very short intervals are still visible. For proportional mode
  // use a slightly larger minimum box height.
  const baseHeight = Math.abs(yEnd - yStart);
  let minHeight = 2;
  if (scale && scale.mode === 'proportional') minHeight = 8;
  const height = Math.max(baseHeight, minHeight);
  return { top, height };
}

// Determine if an item's interval overlaps the visible range [min, max)
// Use half-open interval for the visible range so items that end exactly at max
// are considered outside the range (not included). This prevents showing a
// sliver of the previous interval when the user selects an upper-bound like 66 Ma.
function overlapsRange(item, min, max) {
  const itemMin = Math.min(item.start, item.end);
  const itemMax = Math.max(item.start, item.end);
  // Compute actual overlap length between item and visible range [min, max]
  const overlap = Math.min(itemMax, max) - Math.max(itemMin, min);
  // Ignore extremely small overlaps near the boundary to avoid showing tiny slivers
  // caused by rounding/precision of TTL values. EPS is in Ma (here 0.05 Ma = 50 kyr).
  const EPS_MA = 0.05;
  return overlap > EPS_MA;
}

// Clamp a time value into the visible half-open range [min, max).
// Values equal to max will be nudged slightly below max so they map inside the
// drawing area consistently (avoids rendering a 0-height box at the bottom border).
function clampTime(value, min, max) {
  const clamped = Math.min(Math.max(value, min), max);
  // If value equals the exclusive upper bound, nudge inward by a tiny epsilon
  if (clamped === max) return max - 1e-9;
  return clamped;
}

function chooseInterval(span) {
  if (span <= 10) return 1;
  if (span <= 25) return 2;
  if (span <= 80) return 5;
  if (span <= 150) return 10;
  return 20;
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = clean[0];
    const g = clean[1];
    const b = clean[2];
    return {
      r: parseInt(r + r, 16),
      g: parseInt(g + g, 16),
      b: parseInt(b + b, 16)
    };
  }
  if (clean.length !== 6) return null;
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16)
  };
}

function darkenColor(hex, amount = 0.25) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const mix = channel => Math.round(rgb[channel] * (1 - amount));
  return `rgb(${mix('r')}, ${mix('g')}, ${mix('b')})`;
}

function getContrastColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#1d1d1d';
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
  return luminance > 150 ? '#1d1d1d' : '#ffffff';
}

function getTimeRange() {
  const select = document.getElementById('time-range');
  if (!select) return [0, 66];
  // If a valid custom range is set (and applied), use it
  const customMinInput = document.getElementById('custom-min');
  const customMaxInput = document.getElementById('custom-max');
  const applied = customMinInput && customMaxInput && customMinInput.dataset.applied === 'true' && customMaxInput.dataset.applied === 'true';
  if (applied) {
    const min = parseFloat(customMinInput.value);
    const max = parseFloat(customMaxInput.value);
    if (!Number.isNaN(min) && !Number.isNaN(max) && min < max) return [min, max];
  }

  const [min, max] = select.value.split('-').map(Number);
  // clear any applied custom flag if preset selected
  if (customMinInput) delete customMinInput.dataset.applied;
  if (customMaxInput) delete customMaxInput.dataset.applied;
  return [min, max];
}

// =====================================================================
// Geological Color Helpers
// =====================================================================

function buildGeoColorIndex(icsItems) {
  return (icsItems || [])
    .filter(item => (item.rank === 'Age' || item.rank === 'Stage') && item.color)
    .map(item => ({
      start: Math.max(item.start, item.end),
      end: Math.min(item.start, item.end),
      color: item.color
    }))
    .sort((a, b) => a.end - b.end);
}

function resolveGeoColorForInterval(item, index) {
  if (!index || !index.length) return null;
  const mid = (item.start + item.end) / 2;
  const target = index.find(entry => mid <= entry.start + 1e-6 && mid >= entry.end - 1e-6);
  if (target) return target.color;
  const overlapping = index.find(entry =>
    !(Math.max(item.start, item.end) < entry.end || Math.min(item.start, item.end) > entry.start)
  );
  return overlapping ? overlapping.color : index[index.length - 1].color;
}

// =====================================================================
// Event Listeners & Initialization
// =====================================================================

function setupEventListeners() {
  const checkboxes = document.querySelectorAll('.source-checkbox');
  checkboxes.forEach(cb => cb.addEventListener('change', loadAllSelectedSources));

  const timeRangeSelect = document.getElementById('time-range');
  if (timeRangeSelect) {
    timeRangeSelect.addEventListener('change', event => {
      // clear applied flags when selecting a preset
      const minInput = document.getElementById('custom-min');
      const maxInput = document.getElementById('custom-max');
      if (minInput) delete minInput.dataset.applied;
      if (maxInput) delete maxInput.dataset.applied;
      loadAllSelectedSources();
    });
  }

  const scaleModeSelect = document.getElementById('scale-mode');
  if (scaleModeSelect) {
    currentScaleMode = scaleModeSelect.value;
    scaleModeSelect.addEventListener('change', event => {
      currentScaleMode = event.target.value;
      loadAllSelectedSources();
    });
  }

  // Custom range apply button
  const applyBtn = document.getElementById('apply-range');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const minInput = document.getElementById('custom-min');
      const maxInput = document.getElementById('custom-max');
      if (!minInput || !maxInput) return;
      const min = parseFloat(minInput.value);
      const max = parseFloat(maxInput.value);
      if (Number.isNaN(min) || Number.isNaN(max) || min >= max) {
        showError('Rango personalizado inválido: asegura Min < Max y ambos números.');
        return;
      }
      // mark as applied so getTimeRange uses these values
      minInput.dataset.applied = 'true';
      maxInput.dataset.applied = 'true';
      clearError();
      loadAllSelectedSources();
    });
  }

  // ...existing code...
}

function exportChart() {
  alert('La exportación a PNG estará disponible en una versión futura.');
}

// Print helper: temporarily set a class so CSS can adjust backgrounds for print
function printChart() {
  const body = document.body;
  if (!body) return;
  body.classList.add('printing');
  // Give the browser a short moment to apply styles before printing
  setTimeout(() => {
    try {
      window.print();
    } finally {
      // remove the class after a brief delay to allow print dialog to open
      setTimeout(() => body.classList.remove('printing'), 500);
    }
  }, 120);
}

// =====================================================================
// Bootstrap
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadAllSelectedSources();
  const printBtn = document.getElementById('print-btn');
  if (printBtn) printBtn.addEventListener('click', printChart);
});
