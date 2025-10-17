/* ========= Configuration ========= */
// If you commit your CSV into the repo, set its filename here so the "Load CSV from site" button works.
// Otherwise, use the file picker.
const BUILT_IN_CSV = "SEPTCLER 1.csv"; // or "" to disable

// Column “aliases” we’ll try to match against the messy TASK headers.
// We keep this forgiving: we match by includes() and ignore case.
const Aliases = {
  stockCode: ["stock code"],
  description: ["description"],
  supplier: ["supplier", "buying"],
  brand: ["brand", "manu"],
  priceExVat: ["sale price ex vat", "online price ex vat", "online pr ex vat"],
  salePrice: ["sale price", "online price", "online"],
  cost: ["cost", "average cost price", "calc cost", "calculated cost"],
  profitPct: ["% profit", "profit %", "calculated % profit"],
  availableQty: ["available stock", "available", "stock", "quantity"],
  stockValue: ["stock value", "available value", "value"],
  ytdSales: ["sales year to date", "year to date", "ytd"],
  qtyOnOrder: ["on order", "quantity on order"],
};

const MonthOrder = [
  "Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul",
  // some exports repeat a second year:
  "Aug (Prev)","Sep (Prev)","Oct (Prev)","Nov (Prev)","Dec (Prev)","Jan (Prev)","Feb (Prev)","Mar (Prev)","Apr (Prev)","May (Prev)","Jun (Prev)","Jul (Prev)"
];

/* ========= App state ========= */
let rowsRaw = [];      // raw arrays from CSV
let headersRaw = [];   // raw header rows (could be 1–3 rows)
let data = [];         // normalised objects (in-memory only, no file changes)
let headerMap = {};    // mapping canonical field -> actual column index
let monthColumns = []; // [{name, index}]

/* ========= Helpers ========= */

// Turn multiple header rows (1–3 rows) into a single header string per column (in memory).
function synthesiseHeader(columnsByRow) {
  const depth = columnsByRow.length;
  const width = Math.max(...columnsByRow.map(r => r.length));
  const headers = [];
  for (let c = 0; c < width; c++) {
    const parts = [];
    for (let r = 0; r < depth; r++) {
      const cell = (columnsByRow[r] || [])[c] || "";
      const clean = String(cell).replace(/\r/g,"").trim();
      if (clean) parts.push(clean);
    }
    headers.push(parts.join(" ").replace(/\s+/g," ").trim());
  }
  return headers;
}

// Find the first column index whose combined header matches any alias text
function findColIndex(headers, aliasList) {
  const lower = headers.map(h => h.toLowerCase());
  for (const alias of aliasList) {
    const a = alias.toLowerCase();
    const idx = lower.findIndex(h => h.includes(a));
    if (idx !== -1) return idx;
  }
  return -1;
}

// Numbers: parse tolerant of commas, £, blanks
function toNumber(v) {
  if (v === null || v === undefined) return NaN;
  const s = String(v).replace(/[,£%]/g, "").trim();
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}

// Format £
function fmtGBP(n) {
  if (!Number.isFinite(n)) return "–";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

// Debounce
const debounce = (fn, ms=300) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; };

/* ========= Parsing ========= */

function parseCSVText(csvText) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      worker: true,
      skipEmptyLines: "greedy",
      fastMode: false, // keep robust for messy rows
      complete: results => resolve(results.data),
      error: reject
    });
  });
}

async function loadFromFile(file) {
  const text = await file.text();
  const arr = await parseCSVText(text);
  hydrate(arr);
}

async function loadFromPath(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error("Failed to fetch CSV from site");
  const text = await res.text();
  const arr = await parseCSVText(text);
  hydrate(arr);
}

function hydrate(arrayRows) {
  rowsRaw = arrayRows;

  // Heuristics: TASK exports often have 3 header rows, sometimes 2, rarely 1.
  const guessHeaderRows = 3;
  headersRaw = rowsRaw.slice(0, guessHeaderRows);
  const headers = synthesiseHeader(headersRaw);

  // The rest is data
  const body = rowsRaw.slice(guessHeaderRows);

  // Build canonical headerMap
  headerMap = {
    stockCode:   findColIndex(headers, Aliases.stockCode),
    description: findColIndex(headers, Aliases.description),
    supplier:    findColIndex(headers, Aliases.supplier),
    brand:       findColIndex(headers, Aliases.brand),
    priceExVat:  findColIndex(headers, Aliases.priceExVat),
    salePrice:   findColIndex(headers, Aliases.salePrice),
    cost:        findColIndex(headers, Aliases.cost),
    profitPct:   findColIndex(headers, Aliases.profitPct),
    availableQty:findColIndex(headers, Aliases.availableQty),
    stockValue:  findColIndex(headers, Aliases.stockValue),
    ytdSales:    findColIndex(headers, Aliases.ytdSales),
    qtyOnOrder:  findColIndex(headers, Aliases.qtyOnOrder),
  };

  // Month columns (any headers that look exactly like month names in order or include them)
  monthColumns = headers
    .map((h, i) => ({ name: h, index: i }))
    .filter(({name}) => /(^|\s)(Aug|Sep|Oct|Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul)(\s|$)/i.test(name));

  // Build in-memory dataset
  data = body
    .filter(r => r && r.some(cell => String(cell).trim() !== ""))
    .map(r => {
      const price = headerMap.salePrice >= 0 ? toNumber(r[headerMap.salePrice]) :
                    headerMap.priceExVat >= 0 ? toNumber(r[headerMap.priceExVat]) : NaN;
      const cost  = headerMap.cost >= 0 ? toNumber(r[headerMap.cost]) : NaN;
      const pct   = headerMap.profitPct >= 0 ? toNumber(r[headerMap.profitPct]) : NaN;

      // Profit %: prefer provided column; otherwise compute if price & cost exist
      const profitPct = Number.isFinite(pct)
        ? pct
        : (Number.isFinite(price) && Number.isFinite(cost) && cost !== 0)
          ? ((price - cost) / cost) * 100
          : NaN;

      // YTD Sales best-effort
      const ytd = headerMap.ytdSales >= 0 ? toNumber(r[headerMap.ytdSales]) : NaN;

      // Stock Value best-effort
      const stockVal = headerMap.stockValue >= 0 ? toNumber(r[headerMap.stockValue]) : NaN;

      // Aggregate monthly sales into a time series map
      const months = {};
      monthColumns.forEach(({name, index}) => { months[name] = toNumber(r[index]); });

      return {
        stockCode: headerMap.stockCode >= 0 ? String(r[headerMap.stockCode] ?? "").trim() : "",
        description: headerMap.description >= 0 ? String(r[headerMap.description] ?? "").trim() : "",
        supplier: headerMap.supplier >= 0 ? String(r[headerMap.supplier] ?? "").trim() : "",
        brand: headerMap.brand >= 0 ? String(r[headerMap.brand] ?? "").trim() : "",
        priceExVat: price,
        cost,
        profitPct,
        availableQty: headerMap.availableQty >= 0 ? toNumber(r[headerMap.availableQty]) : NaN,
        stockValue: stockVal,
        qtyOnOrder: headerMap.qtyOnOrder >= 0 ? toNumber(r[headerMap.qtyOnOrder]) : NaN,
        ytdSales: ytd,
        months
      };
    });

  populateFilters();
  computeKPIsAndRender();
}

/* ========= Filters & KPIs ========= */

function uniqueSorted(arr) {
  return [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}

function populateFilters() {
  const supplierSel = document.getElementById("supplierFilter");
  const brandSel = document.getElementById("brandFilter");

  const suppliers = uniqueSorted(data.map(d => d.supplier));
  const brands = uniqueSorted(data.map(d => d.brand));

  for (const s of suppliers) supplierSel.insertAdjacentHTML("beforeend", `<option value="${s}">${s}</option>`);
  for (const b of brands) brandSel.insertAdjacentHTML("beforeend", `<option value="${b}">${b}</option>`);
}

function currentFilter() {
  const q = document.getElementById("search").value.trim().toLowerCase();
  const sup = document.getElementById("supplierFilter").value;
  const br = document.getElementById("brandFilter").value;

  return data.filter(d => {
    if (sup && d.supplier !== sup) return false;
    if (br && d.brand !== br) return false;
    if (q) {
      const hay = (d.description + " " + d.stockCode).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function computeKPIsAndRender() {
  const filtered = currentFilter();

  // KPIs
  const totalSkus = filtered.length;
  const totalStockValue = filtered.reduce((s,d)=> s + (Number.isFinite(d.stockValue)? d.stockValue : 0), 0);
  const avgProfit = filtered.length ? filtered.reduce((s,d)=> s + (Number.isFinite(d.profitPct)? d.profitPct : 0), 0) / filtered.length : NaN;
  const ytd = filtered.reduce((s,d)=> s + (Number.isFinite(d.ytdSales)? d.ytdSales : 0), 0);

  document.getElementById("kpiTotalSkus").textContent = totalSkus.toLocaleString("en-GB");
  document.getElementById("kpiStockValue").textContent = fmtGBP(totalStockValue);
  document.getElementById("kpiAvgProfit").textContent = Number.isFinite(avgProfit) ? `${avgProfit.toFixed(1)}%` : "–";
  document.getElementById("kpiSalesYTD").textContent = ytd.toLocaleString("en-GB");

  drawCharts(filtered);
}

/* ========= Charts ========= */

function drawCharts(items) {
  // 1) Profit by item (Top N)
  const top = [...items]
    .filter(d => Number.isFinite(d.profitPct))
    .sort((a,b)=> b.profitPct - a.profitPct)
    .slice(0, 50);

  Plotly.newPlot("profitByItem", [{
    type: "bar",
    x: top.map(d => `${d.stockCode} — ${d.description}`),
    y: top.map(d => d.profitPct),
    hovertemplate: "<b>%{x}</b><br>% Profit: %{y:.1f}%<extra></extra>"
  }], {
    title: "Top 50 by % Profit",
    xaxis: { automargin: true },
    yaxis: { title: "% Profit" }
  }, {responsive: true});

  // 2) Stock vs demand (scatter)
  Plotly.newPlot("stockVsDemand", [{
    type: "scattergl",
    mode: "markers",
    x: items.map(d => d.availableQty),
    y: items.map(d => d.ytdSales),
    text: items.map(d => `${d.stockCode} — ${d.description}`),
    hovertemplate: "<b>%{text}</b><br>Available: %{x}<br>YTD Sales: %{y}<extra></extra>"
  }], {
    title: "Stock on Hand vs Sales YTD",
    xaxis: { title: "Available Qty" },
    yaxis: { title: "Sales YTD" }
  }, {responsive: true});

  // 3) Sales trend by month (sum)
  // Build a consistent month sequence using the detected month columns
  const monthNames = monthColumns.map(c => c.name);
  const monthSums = monthNames.map(m => items.reduce((s,d)=> s + (Number.isFinite(d.months[m]) ? d.months[m] : 0), 0));

  Plotly.newPlot("salesTrend", [{
    type: "scatter",
    mode: "lines+markers",
    x: monthNames,
    y: monthSums,
    hovertemplate: "%{x}: %{y:.0f}<extra></extra>"
  }], {
    title: "Monthly Sales (Sum across filtered items)",
    xaxis: { tickangle: -45, automargin: true },
    yaxis: { title: "Units / Value (as exported)" }
  }, {responsive: true});

  // 4) Profit distribution (histogram)
  Plotly.newPlot("profitDistribution", [{
    type: "histogram",
    x: items.map(d => d.profitPct).filter(Number.isFinite),
    nbinsx: 50
  }], {
    title: "Profit % Distribution",
    xaxis: { title: "% Profit" },
    yaxis: { title: "Count of SKUs" }
  }, {responsive: true});

  // 5) Supplier performance (bar, average profit)
  const bySupplier = {};
  for (const d of items) {
    if (!d.supplier) continue;
    const k = d.supplier;
    if (!bySupplier[k]) bySupplier[k] = {count:0,sumProfit:0};
    if (Number.isFinite(d.profitPct)) { bySupplier[k].sumProfit += d.profitPct; }
    bySupplier[k].count += 1;
  }
  const suppliers = Object.keys(bySupplier);
  const avgProfit = suppliers.map(s => bySupplier[s].sumProfit / bySupplier[s].count);

  Plotly.newPlot("supplierPerformance", [{
    type: "bar",
    x: suppliers,
    y: avgProfit,
    hovertemplate: "%{x}: %{y:.1f}%<extra></extra>"
  }], {
    title: "Average % Profit by Supplier",
    xaxis: { automargin: true },
    yaxis: { title: "% Profit" }
  }, {responsive: true});
}

/* ========= Events ========= */

document.getElementById("file").addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (f) loadFromFile(f);
});

document.getElementById("loadSample").addEventListener("click", async () => {
  if (!BUILT_IN_CSV) { alert("Set BUILT_IN_CSV in app.js or use the file picker."); return; }
  await loadFromPath(BUILT_IN_CSV);
});

["search","supplierFilter","brandFilter"].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener("input", debounce(computeKPIsAndRender, 150));
});
