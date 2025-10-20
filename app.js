/* ========= Configuration ========= */
// Commit your CSV to auto-load (or leave "" to force using the file picker)
const BUILT_IN_CSV = "SEPTCLER 1.csv";

/* ========= Pastel Plotly Theme ========= */
const pastelColorway = [
  "#6aa6ff","#ff9fb3","#90e0c5","#ffd08a","#c9b6ff",
  "#8fd3ff","#ffc6a8","#b2e1a1","#f5b3ff","#a4b0ff"
];
const pastelLayout = {
  paper_bgcolor: "#ffffff",
  plot_bgcolor: "#ffffff",
  font: { family: "Inter, system-ui, Segoe UI, Arial, sans-serif", color: "#2a2a33" },
  colorway: pastelColorway,
  margin: { t: 60, l: 60, r: 20, b: 60 }
};

/* ========= State ========= */
let rowsRaw = [];
let headersRaw = [];
let headers = [];
let data = [];
let headerMap = {};
let monthColumns = []; // Aug..Jul only

/* ========= Utils ========= */
function toNumber(v) {
  if (v === null || v === undefined) return NaN;
  const n = parseFloat(String(v).replace(/[,£%]/g, "").trim());
  return Number.isFinite(n) ? n : NaN;
}
function fmtGBP(n) {
  if (!Number.isFinite(n)) return "–";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}
const debounce = (fn, ms=200) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; };

/* ========= CSV Parsing ========= */
function parseCSVText(csvText) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      worker: true,
      skipEmptyLines: "greedy",
      complete: res => resolve(res.data),
      error: reject
    });
  });
}
async function loadFromFile(file) {
  const text = await file.text();
  hydrate(await parseCSVText(text));
}
async function loadFromPath(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error("Failed to fetch CSV");
  hydrate(await parseCSVText(await res.text()));
}

/* ========= Build combined header (3 rows) ========= */
function synthesiseHeader(rows) {
  const depth = rows.length;
  const width = Math.max(...rows.map(r => r.length));
  const out = [];
  for (let c = 0; c < width; c++) {
    const parts = [];
    for (let r = 0; r < depth; r++) {
      const cell = (rows[r] || [])[c] || "";
      const s = String(cell).replace(/\r/g, "").trim();
      if (s) parts.push(s);
    }
    out.push(parts.join(" ").replace(/\s+/g, " ").trim());
  }
  return out;
}

/* ========= Hydrate from raw SEPTCLER ========= */
function hydrate(arrayRows) {
  rowsRaw = arrayRows;

  const headerRows = 3; // TASK: 3 header rows
  headersRaw = rowsRaw.slice(0, headerRows);
  headers = synthesiseHeader(headersRaw);
  const body = rowsRaw.slice(headerRows).filter(r => r && r.some(c => String(c).trim() !== ""));

  // Exact mapping — verified from your sheet
  const H = Object.fromEntries(headers.map((h,i)=>[h.trim(), i]));
  const idx = (name) => (H[name] ?? -1);

  headerMap = {
    stockCode:   idx("Stock Code"),
    description: idx("Description ..............."),
    brand:       idx("Manu/ Brand"),
    profitPct:   idx("Calculated % Profit"),
    stockValue:  idx("Stock Value"),
    internetSales: idx("Internet Sales"),
    ebaySales:   idx("Ebay"),
    amazonSales: idx("Amazon Sales"), // parsed but not used in Combined KPI
    totalSales:  idx("Total"),
    availableQty: idx("Available Stock No Van"),
    availableVal: idx("Available Value No Van"),
    subCategory: idx("Sub Category")
  };

  // Current year months strictly: Aug..Jul
  const currentMonths = ["Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul"];
  monthColumns = currentMonths
    .map(m => ({ name: m, index: idx(m) }))
    .filter(m => m.index >= 0);

  // Build rows
  data = body.map(r => {
    const profitPct = headerMap.profitPct >= 0 ? toNumber(r[headerMap.profitPct]) : NaN;
    const internet  = headerMap.internetSales >= 0 ? toNumber(r[headerMap.internetSales]) : 0;
    const ebay      = headerMap.ebaySales     >= 0 ? toNumber(r[headerMap.ebaySales])     : 0;

    const months = {};
    monthColumns.forEach(({ name, index }) => { months[name] = toNumber(r[index]); });

    return {
      stockCode:   headerMap.stockCode   >= 0 ? String(r[headerMap.stockCode] ?? "").trim() : "",
      description: headerMap.description >= 0 ? String(r[headerMap.description] ?? "").trim() : "",
      brand:       headerMap.brand       >= 0 ? String(r[headerMap.brand] ?? "").trim() : "",
      subCategory: headerMap.subCategory >= 0 ? String(r[headerMap.subCategory] ?? "").trim() : "",
      profitPct,
      stockValue:  headerMap.stockValue  >= 0 ? toNumber(r[headerMap.stockValue]) : NaN,
      months,
      internetSales: internet,
      ebaySales:     ebay,
      combinedSales: internet + ebay
    };
  });

  populateFilters();
  refresh();
}

/* ========= Filters & Sorting ========= */
function uniqueSorted(arr) {
  return [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}

function populateFilters() {
  const brandSel = document.getElementById("brandFilter");
  const subSel   = document.getElementById("subcatFilter");

  brandSel.length = 1; // reset (keep placeholder)
  subSel.length   = 1;

  uniqueSorted(data.map(d => d.brand)).forEach(v => brandSel.add(new Option(v, v)));
  uniqueSorted(data.map(d => d.subCategory)).forEach(v => subSel.add(new Option(v, v)));
}

function currentFiltered() {
  const q   = document.getElementById("search").value.trim().toLowerCase();
  const br  = document.getElementById("brandFilter").value;
  const sub = document.getElementById("subcatFilter").value;

  return data.filter(d => {
    if (br  && d.brand !== br) return false;
    if (sub && d.subCategory !== sub) return false;
    if (q) {
      const hay = (d.description + " " + d.stockCode).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function sortItems(items) {
  const how = document.getElementById("sortBy").value;
  const arr = [...items];
  const by = (k, dir=1) => (a,b) => (a[k] ?? "").localeCompare(b[k] ?? "") * dir;
  const byNum = (k, dir=1) => (a,b) => ((Number.isFinite(a[k])?a[k]:-Infinity) - (Number.isFinite(b[k])?b[k]:-Infinity)) * dir;

  switch (how) {
    case "profitAsc": return arr.sort(byNum("profitPct", +1));
    case "brandAZ":   return arr.sort(by("brand", +1));
    case "brandZA":   return arr.sort(by("brand", -1));
    case "skuAZ":     return arr.sort(by("stockCode", +1));
    case "skuZA":     return arr.sort(by("stockCode", -1));
    case "profitDesc":
    default:          return arr.sort(byNum("profitPct", -1));
  }
}

/* ========= KPIs & Rendering ========= */
function fmtInt(n){ return Number.isFinite(n) ? n.toLocaleString("en-GB") : "–"; }

function refresh() {
  const items = currentFiltered();

  // KPIs
  const totalSkus = items.length;
  const stockValue = items.reduce((s,d)=> s + (Number.isFinite(d.stockValue)? d.stockValue : 0), 0);
  const avgProfit = items.length ? items.reduce((s,d)=> s + (Number.isFinite(d.profitPct)? d.profitPct : 0), 0) / items.length : NaN;
  const combinedSales = items.reduce((s,d)=> s + (Number.isFinite(d.combinedSales)? d.combinedSales : 0), 0);

  document.getElementById("kpiTotalSkus").textContent = fmtInt(totalSkus);
  document.getElementById("kpiStockValue").textContent = fmtGBP(stockValue);
  document.getElementById("kpiAvgProfit").textContent = Number.isFinite(avgProfit) ? `${avgProfit.toFixed(1)}%` : "–";
  document.getElementById("kpiSalesCombined").textContent = fmtInt(combinedSales);

  // Charts
  drawProfitPerSKU(sortItems(items));
  drawMonthlySales(items);
  drawPieByBrand(items);
  drawBrandTotalsBar(items);
  drawBrandMonthlyStacked(items);
  drawBrandProfitBar(items);

  // Optional: audit mapping in console
  // console.table(headerMap); console.log("Months:", monthColumns.map(m=>m.name).join(", "));
}

/* ========= Brand summary from raw SEPTCLER ========= */
function summariseByBrand(items) {
  const by = new Map();
  for (const d of items) {
    const k = d.brand || "Unknown";
    if (!by.has(k)) {
      by.set(k, {
        brand: k,
        combinedSales: 0,
        stockValue: 0,
        profitSum: 0,
        profitCount: 0,
        months: Object.fromEntries(monthColumns.map(c => [c.name, 0]))
      });
    }
    const b = by.get(k);
    if (Number.isFinite(d.combinedSales)) b.combinedSales += d.combinedSales;
    if (Number.isFinite(d.stockValue))    b.stockValue    += d.stockValue;
    if (Number.isFinite(d.profitPct)) { b.profitSum += d.profitPct; b.profitCount += 1; }
    for (const { name } of monthColumns) {
      const v = d.months[name];
      if (Number.isFinite(v)) b.months[name] += v;
    }
  }
  const rows = Array.from(by.values()).map(r => ({
    brand: r.brand,
    combinedSales: r.combinedSales,
    stockValue: r.stockValue,
    avgProfitPct: r.profitCount ? r.profitSum / r.profitCount : NaN,
    months: r.months
  }));
  rows.sort((a,b)=> b.combinedSales - a.combinedSales);
  return rows;
}

/* ========= Charts ========= */

// Profit per SKU
function drawProfitPerSKU(items) {
  const top = items.filter(d => Number.isFinite(d.profitPct)).slice(0, 200);
  Plotly.newPlot("profitByItem", [{
    type: "bar",
    x: top.map(d => `${d.stockCode} — ${d.description}`),
    y: top.map(d => d.profitPct),
    hovertemplate: "<b>%{x}</b><br>% Profit: %{y:.1f}%<extra></extra>"
  }], {
    ...pastelLayout,
    title: "Profit % by SKU",
    xaxis: { automargin: true, showticklabels: false },
    yaxis: { title: "% Profit" },
    height: document.getElementById("profitByItem").clientHeight
  }, { responsive: true });
}

// Sales per Month (current year only)
function drawMonthlySales(items) {
  const names = monthColumns.map(c => c.name);
  const sums = names.map(m => items.reduce((s,d)=> s + (Number.isFinite(d.months[m]) ? d.months[m] : 0), 0));
  Plotly.newPlot("salesTrend", [{
    type: "scatter", mode: "lines+markers",
    x: names, y: sums, hovertemplate: "%{x}: %{y:.0f}<extra></extra>"
  }], {
    ...pastelLayout,
    title: "Sales per Month (current year)",
    xaxis: { tickangle: -45, automargin: true },
    yaxis: { title: "Units / Value (as exported)" },
    height: document.getElementById("salesTrend").clientHeight
  }, { responsive: true });
}

// Pie — Combined Sales by Brand
function drawPieByBrand(items) {
  const byBrand = {};
  for (const d of items) {
    const k = d.brand || "Unknown";
    byBrand[k] = (byBrand[k] || 0) + (Number.isFinite(d.combinedSales) ? d.combinedSales : 0);
  }
  const entries = Object.entries(byBrand).sort((a,b)=> b[1] - a[1]);
  const top = entries.slice(0, 10);
  const other = entries.slice(10).reduce((s,[,v])=> s + v, 0);
  const labels = [...top.map(([k])=>k), ...(other>0?["Other"]:[])];
  const values = [...top.map(([,v])=>v), ...(other>0?[other]:[])];

  Plotly.newPlot("pieBrand", [{
    type: "pie", labels, values, hole: 0.45, textinfo: "label+percent"
  }], {
    ...pastelLayout,
    title: "Combined Sales Share by Brand (Internet + eBay)",
    height: document.getElementById("pieBrand").clientHeight
  }, { responsive: true });
}

// Brand totals — Combined Sales (Top 15)
function drawBrandTotalsBar(items) {
  const rows = summariseByBrand(items).slice(0, 15);
  Plotly.newPlot("brandTotalsBar", [{
    type: "bar",
    x: rows.map(r => r.brand),
    y: rows.map(r => r.combinedSales),
    hovertemplate: "<b>%{x}</b><br>Combined Sales: %{y:,}<extra></extra>"
  }], {
    ...pastelLayout,
    title: "Combined Sales by Brand (Internet + eBay)",
    xaxis: { automargin: true },
    yaxis: { title: "Combined Sales" },
    height: document.getElementById("brandTotalsBar").clientHeight
  }, { responsive: true });
}

// Brand monthly stacked (Top 10 by Combined Sales)
function drawBrandMonthlyStacked(items) {
  const rows = summariseByBrand(items).slice(0, 10);
  const months = monthColumns.map(c => c.name);
  const traces = rows.map(r => ({
    type: "bar", name: r.brand, x: months, y: months.map(m => r.months[m])
  }));
  Plotly.newPlot("brandMonthlyStacked", traces, {
    ...pastelLayout,
    barmode: "stack",
    title: "Monthly Sales by Brand (stacked, current year)",
    xaxis: { tickangle: -45, automargin: true },
    yaxis: { title: "Sales" },
    height: document.getElementById("brandMonthlyStacked").clientHeight
  }, { responsive: true });
}

// Brand average % profit (Top 15)
function drawBrandProfitBar(items) {
  const rows = summariseByBrand(items).slice(0, 15);
  Plotly.newPlot("brandProfitBar", [{
    type: "bar",
    x: rows.map(r => r.brand),
    y: rows.map(r => r.avgProfitPct),
    hovertemplate: "<b>%{x}</b><br>Avg % Profit: %{y:.1f}%<extra></extra>"
  }], {
    ...pastelLayout,
    title: "Average % Profit by Brand",
    xaxis: { automargin: true },
    yaxis: { title: "% Profit" },
    height: document.getElementById("brandProfitBar").clientHeight
  }, { responsive: true });
}

/* ========= Events ========= */
document.getElementById("file").addEventListener("change", e => {
  const f = e.target.files[0]; if (f) loadFromFile(f);
});
document.getElementById("loadSample").addEventListener("click", () => {
  if (!BUILT_IN_CSV) { alert("Set BUILT_IN_CSV in app.js or use the file picker."); return; }
  loadFromPath(BUILT_IN_CSV);
});
["search","brandFilter","subcatFilter","sortBy"].forEach(id => {
  document.getElementById(id).addEventListener("input", debounce(refresh, 150));
});
