/* ========= Configuration ========= */
const BUILT_IN_CSV = "SEPTCLER 1.csv"; // set "" to disable auto-load

/* ========= Brand normalisation & colours ========= */
const normKey = s => String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"");

// Extend/adjust this list as you see more variants in your exports
const BRAND_ALIASES = {
  // Priority brands
  "milwaukee":"Milwaukee",
  "dewalt":"DeWalt","de-walt":"DeWalt",
  "makita":"Makita",
  "bosch":"Bosch","boschprofessional":"Bosch","boschaccessories":"Bosch",
  "hikoki":"HiKOKI","hi-koki":"HiKOKI","hikokipt":"HiKOKI",
  "hitachi":"HiKOKI","hitachipowertools":"HiKOKI",
  "everbuild":"Everbuild", // NEW: merge Everbuild variants
  // Others
  "einhell":"Einhell"
};

function canonicalBrand(name){
  const k = normKey(name);
  return BRAND_ALIASES[k] || (name ? String(name).trim() : "Unknown");
}

const brandColours = {
  "Milwaukee": "#d0021b",
  "DeWalt": "#ffd000",
  "Makita": "#00a19b",
  "Bosch": "#1f6feb",
  "HiKOKI": "#0b8457",
  "Einhell": "#cc0033",
  "Everbuild": "#ff8c00" // orange
};
const fallbackColours = ["#6aa6ff","#ff9fb3","#90e0c5","#ffd08a","#c9b6ff","#8fd3ff","#ffc6a8","#b2e1a1","#f5b3ff","#a4b0ff"];
function brandColour(name, i=0){ return brandColours[name] || fallbackColours[i % fallbackColours.length]; }

/* ========= Plotly theme ========= */
const baseLayout = {
  paper_bgcolor: "#ffffff",
  plot_bgcolor: "#ffffff",
  font: { family: "Inter, system-ui, Segoe UI, Arial, sans-serif", color: "#2a2a33" },
  margin: { t: 60, l: 60, r: 20, b: 60 }
};

/* ========= State ========= */
let headers = [];
let data = [];
let headerMap = {};
let monthColumns = []; // Aug..Jul only

/* ========= Utils ========= */
function toNumber(v){ if(v==null) return NaN; const n=parseFloat(String(v).replace(/[,£%]/g,"").trim()); return Number.isFinite(n)?n:NaN; }
function fmtGBP(n){ return Number.isFinite(n)? new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"}).format(n) : "–"; }
function fmtDateUK(d){ try{ if(!d) return ""; const date = new Date(d); if (isNaN(date)) return String(d); return date.toLocaleDateString("en-GB"); }catch{ return String(d); } }
const debounce=(fn,ms=200)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);}};
// Safe setter
function setText(id, value){ const el = document.getElementById(id); if (el) el.textContent = value; }
// Sum
const sum = arr => arr.reduce((s,v)=> s + (Number.isFinite(v)?v:0), 0);

/* ========= CSV parsing ========= */
function parseCSVText(csvText){
  return new Promise((resolve,reject)=>{
    Papa.parse(csvText,{worker:true,skipEmptyLines:"greedy",complete:r=>resolve(r.data),error:reject});
  });
}
async function loadFromFile(file){ const txt=await file.text(); hydrate(await parseCSVText(txt)); }
async function loadFromPath(path){ const r=await fetch(path); if(!r.ok) throw new Error("Fetch CSV failed"); hydrate(await parseCSVText(await r.text())); }

/* ========= Build combined header (3 rows) ========= */
function synthesiseHeader(rows){
  const depth = rows.length, width = Math.max(...rows.map(r=>r.length));
  const out=[];
  for(let c=0;c<width;c++){
    const parts=[]; for(let r=0;r<depth;r++){ const cell=(rows[r]||[])[c]||""; const s=String(cell).replace(/\r/g,"").trim(); if(s) parts.push(s); }
    out.push(parts.join(" ").replace(/\s+/g," ").trim());
  }
  return out;
}

/* ========= Hydrate from raw SEPTCLER ========= */
function hydrate(arrayRows){
  const headerRows=3;
  const headersRaw = arrayRows.slice(0, headerRows);
  headers = synthesiseHeader(headersRaw);
  const body = arrayRows.slice(headerRows).filter(r => r && r.some(c => String(c).trim() !== ""));

  // Exact mapping (verified from your export)
  const H = Object.fromEntries(headers.map((h,i)=>[h.trim(), i]));
  const idx = (name) => (H[name] ?? -1);

  headerMap = {
    stockCode:     idx("Stock Code"),
    description:   idx("Description ..............."),
    brand:         idx("Manu/ Brand"),
    profitPct:     idx("Calculated % Profit"),
    stockValue:    idx("Stock Value"),
    internetSales: idx("Internet Sales"),
    ebaySales:     idx("Ebay"),
    amazonSales:   idx("Amazon Sales"),
    totalSales:    idx("Total"),
    subCategory:   idx("Sub Category"),
    lastInvoice:   idx("Last Invoice Date"),
    salePriceExVat:idx("Sale Price Ex Vat")
  };

  // Current-year months strictly: Aug..Jul
  const monthsList = ["Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul"];
  monthColumns = monthsList.map(m => ({name:m, index: idx(m)})).filter(m => m.index >= 0);

  // Build dataset rows (brand normalised)
  data = body.map(r=>{
    const priceEx   = headerMap.salePriceExVat>=0 ? toNumber(r[headerMap.salePriceExVat]) : NaN;
    const months={}, monthsRevenue={};
    monthColumns.forEach(({name,index})=>{
      const units = toNumber(r[index]);
      months[name] = units;
      monthsRevenue[name] = (Number.isFinite(units) && Number.isFinite(priceEx)) ? (units * priceEx) : NaN;
    });

    const brandRaw = headerMap.brand>=0 ? String(r[headerMap.brand]??"").trim() : "";
    const brand = canonicalBrand(brandRaw);

    return {
      stockCode:   headerMap.stockCode>=0 ? String(r[headerMap.stockCode]??"").trim() : "",
      description: headerMap.description>=0 ? String(r[headerMap.description]??"").trim() : "",
      brand,
      subCategory: headerMap.subCategory>=0 ? String(r[headerMap.subCategory]??"").trim() : "",
      profitPct:   headerMap.profitPct>=0 ? toNumber(r[headerMap.profitPct]) : NaN,
      stockValue:  headerMap.stockValue>=0 ? toNumber(r[headerMap.stockValue]) : NaN,
      months,
      monthsRevenue,
      internetSales: headerMap.internetSales>=0 ? toNumber(r[headerMap.internetSales]) : 0,
      ebaySales:     headerMap.ebaySales>=0 ? toNumber(r[headerMap.ebaySales]) : 0,
      priceExVat:    priceEx,
      lastInvoice:   headerMap.lastInvoice>=0 ? r[headerMap.lastInvoice] : ""
    };
  }).map(d => ({ ...d, combinedSales: (Number.isFinite(d.internetSales)?d.internetSales:0) + (Number.isFinite(d.ebaySales)?d.ebaySales:0) }));

  populateFilters();
  refresh();
}

/* ========= Filtering ========= */
function uniqueSorted(arr){ return [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b)); }

// Global items for dashboards (ignore free-text search)
function baseItemsForAggregates(){
  const br  = document.getElementById("brandFilter").value;
  const sub = document.getElementById("subcatFilter").value;
  return data.filter(d=>{
    if (br  && d.brand !== br) return false;
    if (sub && d.subCategory !== sub) return false;
    return true;
  });
}

// Items that apply the search (used for SKU focus + invoice table)
function itemsWithSearch(){
  const q   = document.getElementById("search").value.trim().toLowerCase();
  const br  = document.getElementById("brandFilter").value;
  const sub = document.getElementById("subcatFilter").value;

  return data.filter(d=>{
    if (br  && d.brand !== br) return false;
    if (sub && d.subCategory !== sub) return false;
    if (q){
      const hay=(d.description+" "+d.stockCode).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function populateFilters(){
  const brandSel = document.getElementById("brandFilter");
  const subSel   = document.getElementById("subcatFilter");
  brandSel.length = 1; subSel.length = 1;

  uniqueSorted(data.map(d=>d.brand)).forEach(v=> brandSel.add(new Option(v, v)));
  uniqueSorted(data.map(d=>d.subCategory)).forEach(v=> subSel.add(new Option(v, v)));
}

/* ========= Sorting (kept for list-based charts) ========= */
function sortItems(items){
  const how = document.getElementById("sortBy").value;
  const arr=[...items];
  const by=(k,dir=1)=>(a,b)=>(a[k]??"").localeCompare(b[k]??"")*dir;
  const byNum=(k,dir=1)=>(a,b)=>((Number.isFinite(a[k])?a[k]:-Infinity)-(Number.isFinite(b[k])?b[k]:-Infinity))*dir;
  switch(how){
    case "profitAsc": return arr.sort(byNum("profitPct",+1));
    case "brandAZ": return arr.sort(by("brand",+1));
    case "brandZA": return arr.sort(by("brand",-1));
    case "skuAZ": return arr.sort(by("stockCode",+1));
    case "skuZA": return arr.sort(by("stockCode",-1));
    case "profitDesc":
    default: return arr.sort(byNum("profitPct",-1));
  }
}

/* ========= KPI + Revenue Series ========= */
function revenueSeries(items){
  const months = monthColumns.map(m=>m.name);
  const perMonth = months.map(m => sum(items.map(d => d.monthsRevenue[m])));
  // truncate to last non-zero month
  let last = -1;
  for (let i = perMonth.length - 1; i >= 0; i--) {
    if (Number.isFinite(perMonth[i]) && perMonth[i] > 0) { last = i; break; }
  }
  const end = last >= 0 ? last + 1 : 0;
  return { months: months.slice(0, end), perMonth: perMonth.slice(0, end) };
}

/* ========= Brand summary ========= */
function summariseByBrand(items){
  const by=new Map();
  for(const d of items){
    const key = d.brand || "Unknown";
    if(!by.has(key)){
      by.set(key,{
        brand:key,
        combinedSales:0,
        stockValue:0,
        profitSum:0, profitCount:0,
        revenue:0,
        months:Object.fromEntries(monthColumns.map(c=>[c.name,0]))
      });
    }
    const b=by.get(key);
    b.combinedSales += Number.isFinite(d.combinedSales)? d.combinedSales : 0;
    b.stockValue    += Number.isFinite(d.stockValue)? d.stockValue : 0;
    if (Number.isFinite(d.profitPct)){ b.profitSum += d.profitPct; b.profitCount += 1; }
    for (const {name} of monthColumns){
      const r=d.monthsRevenue[name];
      b.months[name] += Number.isFinite(r)? r : 0; // revenue per month
    }
    b.revenue += sum(Object.values(d.monthsRevenue));
  }
  const rows = Array.from(by.values()).map(r=>({
    brand:r.brand,
    combinedSales:r.combinedSales,
    stockValue:r.stockValue,
    avgProfitPct: r.profitCount? r.profitSum/r.profitCount : NaN,
    revenue:r.revenue,
    months:r.months
  }));
  rows.sort((a,b)=> b.revenue - a.revenue);
  return rows;
}

/* ========= Render ========= */
function refresh(){
  const itemsAgg = baseItemsForAggregates();  // global dashboards
  const itemsSearch = itemsWithSearch();      // search-driven (SKU focus + invoice table)

  // KPIs (global)
  const totalSkus = itemsAgg.length;
  const stockValue = sum(itemsAgg.map(d=>d.stockValue));
  const avgProfit = itemsAgg.length ? sum(itemsAgg.map(d=>d.profitPct))/itemsAgg.length : NaN;
  const combinedSales = sum(itemsAgg.map(d=>d.combinedSales));

  setText("kpiTotalSkus", Number.isFinite(totalSkus) ? totalSkus.toLocaleString("en-GB") : "–");
  setText("kpiStockValue", fmtGBP(stockValue));
  setText("kpiAvgProfit", Number.isFinite(avgProfit) ? `${avgProfit.toFixed(1)}%` : "–");
  setText("kpiSalesCombined", Number.isFinite(combinedSales) ? combinedSales.toLocaleString("en-GB") : "–");

  // Global charts
  const revAgg = revenueSeries(itemsAgg);
  drawSalesRevenueTrend(itemsAgg, revAgg);
  drawBrandRevShareFab4(itemsAgg);
  drawBrandTotalsBar(itemsAgg);
  drawBrandMonthlyStacked(itemsAgg);
  drawBrandRevenueBar(itemsAgg);
  drawSkuRevenueTop(itemsAgg);

  // SKU focus area
  const q = document.getElementById("search").value.trim();
  const matches = itemsSearch;
  const focus = q && matches.length > 0 && matches.length <= 5;

  if (focus) {
    drawSkuFocusTrend(matches);
  } else {
    safeClear("skuFocusTrend");
  }

  // Single-SKU detail card with invoice date
  const detail = document.getElementById("skuDetail");
  if (q && matches.length === 1) {
    const d = matches[0];
    detail.hidden = false;
    setText("skuDetailTitle", `SKU Details — ${d.stockCode}`);
    setText("dSku", d.stockCode || "–");
    setText("dDesc", d.description || "–");
    setText("dBrand", d.brand || "–");
    setText("dSub", d.subCategory || "–");
    setText("dInv", fmtDateUK(d.lastInvoice));
  } else {
    if (detail) detail.hidden = true;
  }

  // Invoice table reflects the current search
  renderInvoiceTable(matches);
}

/* ========= Chart helpers ========= */
function safeClear(id){
  const el = document.getElementById(id);
  if (!el) return;
  try { Plotly.purge(id); } catch {}
  el.innerHTML = "";
}

/* ========= Charts ========= */

// Global — Sales & Revenue per Month (units + revenue + truncated cumulative)
function drawSalesRevenueTrend(items, rev){
  const months = rev.months;
  const unitSums = months.map(m => items.reduce((s,d)=> s + (Number.isFinite(d.months[m]) ? d.months[m] : 0), 0));
  const revenue = rev.perMonth;
  const cumulative = revenue.reduce((acc,v,i)=>{ acc.push((acc[i-1]||0)+(Number.isFinite(v)?v:0)); return acc; },[]);

  Plotly.newPlot("salesRevenueTrend",[
    {type:"bar", name:"Units (as exported)", x:months, y:unitSums,
     marker:{color:"#90e0c5"}, hovertemplate:"%{x}: %{y:.0f} units<extra></extra>"},
    {type:"scatter", mode:"lines+markers", name:"Est. Revenue (ex VAT)",
     x:months, y:revenue, hovertemplate:"%{x}: £%{y:,.0f}<extra></extra>"},
    {type:"scatter", mode:"lines", name:"Cumulative YTD Revenue",
     x:months, y:cumulative, hovertemplate:"%{x}: £%{y:,.0f}<extra></extra>"}
  ],{
    ...baseLayout,
    title:"Sales (Units) & Estimated Revenue per Month",
    xaxis:{tickangle:-45,automargin:true},
    yaxis:{title:"Units / £ ex VAT"},
    height: document.getElementById("salesRevenueTrend")?.clientHeight || 520
  },{responsive:true});
}

// Global — Fab 4 revenue share
function drawBrandRevShareFab4(items){
  const rows = summariseByBrand(items);
  const wanted = ["Milwaukee","DeWalt","Makita","Bosch"];
  const map = new Map(rows.map(r=>[r.brand, r]));
  const labels = [], values = [], colors = [];
  wanted.forEach((w,i)=>{
    const r = map.get(w);
    const val = r ? r.revenue : 0;
    labels.push(w); values.push(val); colors.push(brandColour(w,i));
  });

  Plotly.newPlot("brandRevShareFab4",[{
    type:"pie",
    labels, values, hole:0.45, textinfo:"label+percent",
    marker:{colors:colors}
  }],{
    ...baseLayout,
    title:"Revenue Share — Milwaukee / DeWalt / Makita / Bosch (ex VAT)",
    height: document.getElementById("brandRevShareFab4")?.clientHeight || 520
  },{responsive:true});
}

// Global — Combined Sales by Brand
function drawBrandTotalsBar(items){
  const rows = summariseByBrand(items).slice(0,15);
  Plotly.newPlot("brandTotalsBar",[{
    type:"bar",
    x: rows.map(r=>r.brand),
    y: rows.map(r=>r.combinedSales),
    marker:{color: rows.map((r,i)=>brandColour(r.brand,i))},
    hovertemplate:"<b>%{x}</b><br>Combined Sales: %{y:,}<extra></extra>"
  }],{
    ...baseLayout,
    title:"Combined Sales by Brand (Internet + eBay)",
    xaxis:{automargin:true},
    yaxis:{title:"Combined Sales"},
    height: document.getElementById("brandTotalsBar")?.clientHeight || 520
  },{responsive:true});
}

// Global — Monthly Units by Brand (stacked)
function drawBrandMonthlyStacked(items){
  const rows = summariseByBrand(items).slice(0,10);
  const months = monthColumns.map(c=>c.name);
  const traces = rows.map((r,i)=>({
    type:"bar",
    name:r.brand,
    x:months,
    y:months.map(m=> items.reduce((s,d)=> s + (d.brand===r.brand ? (Number.isFinite(d.months[m])?d.months[m]:0) : 0), 0)),
    marker:{color: brandColour(r.brand,i)}
  }));
  Plotly.newPlot("brandMonthlyStacked", traces, {
    ...baseLayout,
    barmode:"stack",
    title:"Monthly Sales by Brand (Units, current year)",
    xaxis:{tickangle:-45,automargin:true},
    yaxis:{title:"Units"},
    height: document.getElementById("brandMonthlyStacked")?.clientHeight || 520
  },{responsive:true});
}

// Global — Brand revenue bar
function drawBrandRevenueBar(items){
  const rows = summariseByBrand(items).slice(0,15);
  Plotly.newPlot("brandRevenueBar",[{
    type:"bar",
    x: rows.map(r=>r.brand),
    y: rows.map(r=>r.revenue),
    marker:{color: rows.map((r,i)=>brandColour(r.brand,i))},
    hovertemplate:"<b>%{x}</b><br>Est. Revenue: £%{y:,.0f}<extra></extra>"
  }],{
    ...baseLayout,
    title:"Estimated Revenue by Brand (ex VAT)",
    xaxis:{automargin:true},
    yaxis:{title:"£ ex VAT"},
    height: document.getElementById("brandRevenueBar")?.clientHeight || 520
  },{responsive:true});
}

// Global — Top revenue SKUs
function drawSkuRevenueTop(items){
  const monthNames = monthColumns.map(m=>m.name);
  const withRevenue = items.map(d=>({
    sku: `${d.stockCode} — ${d.description}`,
    brand: d.brand,
    revenue: sum(monthNames.map(m=>d.monthsRevenue[m])),
    lastInvoice: d.lastInvoice
  })).filter(x=>Number.isFinite(x.revenue));

  const top = withRevenue.sort((a,b)=>b.revenue-a.revenue).slice(0,100);
  Plotly.newPlot("skuRevenueTop",[{
    type:"bar",
    x: top.map(t=>t.sku),
    y: top.map(t=>t.revenue),
    marker:{color: top.map((t,i)=>brandColour(t.brand,i))},
    hovertemplate:"<b>%{x}</b><br>Est. Revenue: £%{y:,.0f}<extra></extra>"
  }],{
    ...baseLayout,
    title:"Top 100 SKUs by Estimated Revenue (ex VAT)",
    xaxis:{automargin:true, showticklabels:false},
    yaxis:{title:"£ ex VAT"},
    height: document.getElementById("skuRevenueTop")?.clientHeight || 520
  },{responsive:true});
}

/* ========= SKU Focus (search 1–5 matches) ========= */
// For each SKU, truncate months to the last month where units OR revenue > 0 to prevent odd tails.
function truncatedMonthsForSku(d){
  const months = monthColumns.map(m=>m.name);
  let last = -1;
  for (let i = months.length - 1; i >= 0; i--) {
    const u = d.months[months[i]];
    const r = d.monthsRevenue[months[i]];
    if ((Number.isFinite(u) && u > 0) || (Number.isFinite(r) && r > 0)) { last = i; break; }
  }
  const end = last >= 0 ? last + 1 : 0;
  return months.slice(0, end);
}

function drawSkuFocusTrend(skus){
  const unitTraces = [];
  const revTraces = [];

  skus.forEach((d,i)=>{
    const months = truncatedMonthsForSku(d);
    const units = months.map(m => Number.isFinite(d.months[m]) ? d.months[m] : 0);
    const revs  = months.map(m => Number.isFinite(d.monthsRevenue[m]) ? d.monthsRevenue[m] : 0);

    // Units bars for this SKU
    unitTraces.push({
      type:"bar",
      name:`${d.stockCode} — Units`,
      x:months,
      y:units,
      marker:{color: brandColour(d.brand,i)}
    });

    // Revenue line for this SKU (own x, own truncation)
    revTraces.push({
      type:"scatter",
      mode:"lines+markers",
      name:`£ Revenue — ${d.stockCode}`,
      x:months,
      y:revs,
      yaxis:"y2"
    });
  });

  Plotly.newPlot("skuFocusTrend", [...unitTraces, ...revTraces], {
    ...baseLayout,
    title: skus.length===1 ? `SKU Monthly Units & Revenue — ${skus[0].stockCode}` : "Selected SKUs — Monthly Units & Revenue",
    xaxis:{tickangle:-45, automargin:true},
    yaxis:{title:"Units"},
    yaxis2:{title:"£ ex VAT", overlaying:"y", side:"right"},
    barmode: skus.length>1 ? "group" : "stack",
    height: document.getElementById("skuFocusTrend")?.clientHeight || 520
  }, {responsive:true});
}

/* ========= Invoice table ========= */
function renderInvoiceTable(items){
  const tbody = document.querySelector("#invoiceTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  items.slice(0,200).forEach(d=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.stockCode}</td>
      <td>${d.description}</td>
      <td>${d.brand}</td>
      <td>${d.subCategory}</td>
      <td>${fmtDateUK(d.lastInvoice)}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ========= Events ========= */
document.getElementById("file").addEventListener("change", e=>{
  const f=e.target.files[0]; if(f) loadFromFile(f);
});
document.getElementById("loadSample").addEventListener("click", ()=>{
  if(!BUILT_IN_CSV){ alert("Set BUILT_IN_CSV in app.js or use the file picker."); return; }
  loadFromPath(BUILT_IN_CSV);
});
["search","brandFilter","subcatFilter","sortBy"].forEach(id=>{
  document.getElementById(id).addEventListener("input", debounce(refresh,150));
});
