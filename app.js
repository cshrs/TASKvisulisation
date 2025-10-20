/* ========= Configuration ========= */
const BUILT_IN_CSV = "SEPTCLER 1.csv"; // set "" to disable auto-load

/* ========= Brand colours (priority brands fixed) ========= */
const brandColours = {
  "Milwaukee": "#d0021b", // red
  "DEWALT": "#ffd000", "DeWalt": "#ffd000", "Dewalt": "#ffd000",
  "Makita": "#00a19b",  // teal
  "Bosch": "#1f6feb"    // blue
};
const fallbackColours = ["#6aa6ff","#ff9fb3","#90e0c5","#ffd08a","#c9b6ff","#8fd3ff","#ffc6a8","#b2e1a1","#f5b3ff","#a4b0ff"];
function brandColour(name, i=0){
  if (!name) return fallbackColours[i % fallbackColours.length];
  return brandColours[name] || fallbackColours[i % fallbackColours.length];
}
function canonicalBrand(name=""){
  const s = String(name).toLowerCase();
  if (s.includes("milwaukee")) return "Milwaukee";
  if (s.includes("dewalt")) return "DeWalt";
  if (s.includes("makita")) return "Makita";
  if (s.includes("bosch")) return "Bosch";
  return name || "Unknown";
}

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
let monthColumns = []; // Aug..Jul
let priceExVatIndex = -1;

/* ========= Utils ========= */
function toNumber(v){ if(v==null) return NaN; const n=parseFloat(String(v).replace(/[,£%]/g,"").trim()); return Number.isFinite(n)?n:NaN; }
function fmtGBP(n){ return Number.isFinite(n)? new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"}).format(n) : "–"; }
function fmtDateUK(d){ try{ if(!d) return ""; const date = new Date(d); if (isNaN(date)) return String(d); return date.toLocaleDateString("en-GB"); }catch{ return String(d); } }
const debounce=(fn,ms=200)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);}};

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

  // Exact mapping (verified)
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
    amazonSales: idx("Amazon Sales"),
    totalSales:  idx("Total"),
    availableQty: idx("Available Stock No Van"),
    availableVal: idx("Available Value No Van"),
    subCategory: idx("Sub Category"),
    lastInvoice: idx("Last Invoice Date"),
    salePriceExVat: idx("Sale Price Ex Vat")
  };
  priceExVatIndex = headerMap.salePriceExVat;

  // Months strictly Aug..Jul
  const monthsList = ["Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul"];
  monthColumns = monthsList.map(m => ({name:m, index: idx(m)})).filter(m => m.index >= 0);

  // Build dataset rows
  data = body.map(r=>{
    const internet  = headerMap.internetSales>=0 ? toNumber(r[headerMap.internetSales]) : 0;
    const ebay      = headerMap.ebaySales>=0 ? toNumber(r[headerMap.ebaySales]) : 0;
    const priceEx   = headerMap.salePriceExVat>=0 ? toNumber(r[headerMap.salePriceExVat]) : NaN;

    const months={}, monthsRevenue={};
    monthColumns.forEach(({name,index})=>{
      const units = toNumber(r[index]);
      months[name] = units;
      monthsRevenue[name] = (Number.isFinite(units) && Number.isFinite(priceEx)) ? (units * priceEx) : NaN;
    });

    return {
      stockCode:   headerMap.stockCode>=0 ? String(r[headerMap.stockCode]??"").trim() : "",
      description: headerMap.description>=0 ? String(r[headerMap.description]??"").trim() : "",
      brand:       headerMap.brand>=0 ? String(r[headerMap.brand]??"").trim() : "",
      subCategory: headerMap.subCategory>=0 ? String(r[headerMap.subCategory]??"").trim() : "",
      profitPct:   headerMap.profitPct>=0 ? toNumber(r[headerMap.profitPct]) : NaN,
      stockValue:  headerMap.stockValue>=0 ? toNumber(r[headerMap.stockValue]) : NaN,
      months,
      monthsRevenue,
      internetSales: internet,
      ebaySales: ebay,
      combinedSales: internet + ebay,
      priceExVat: priceEx,
      lastInvoice: headerMap.lastInvoice>=0 ? r[headerMap.lastInvoice] : ""
    };
  });

  populateFilters();
  refresh();
}

/* ========= Filters & Sorting ========= */
function uniqueSorted(arr){ return [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b)); }

function populateFilters(){
  const brandSel = document.getElementById("brandFilter");
  const subSel   = document.getElementById("subcatFilter");
  brandSel.length = 1; subSel.length = 1;

  uniqueSorted(data.map(d=>d.brand)).forEach(v=> brandSel.add(new Option(v, v)));
  uniqueSorted(data.map(d=>d.subCategory)).forEach(v=> subSel.add(new Option(v, v)));
}

function currentFiltered(){
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

/* ========= KPIs + Render ========= */
function fmtInt(n){ return Number.isFinite(n)? n.toLocaleString("en-GB") : "–"; }
function sum(arr){ return arr.reduce((s,v)=> s + (Number.isFinite(v)?v:0), 0); }

function revenueTotals(items){
  const months = monthColumns.map(m=>m.name);
  const perMonth = months.map(m => sum(items.map(d => d.monthsRevenue[m])));
  // truncate to last month with revenue data (>0 and finite)
  let last = -1;
  for (let i = perMonth.length - 1; i >= 0; i--) {
    if (Number.isFinite(perMonth[i]) && perMonth[i] > 0) { last = i; break; }
  }
  const end = last >= 0 ? last + 1 : 0;
  return {
    months: months.slice(0, end),
    perMonth: perMonth.slice(0, end),
    ytd: sum(perMonth.slice(0, end))
  };
}

function refresh(){
  const items = currentFiltered();
  const itemsSorted = sortItems(items);

  // KPIs
  const totalSkus = items.length;
  const stockValue = sum(items.map(d=>d.stockValue));
  const avgProfit = items.length ? sum(items.map(d=>d.profitPct))/items.length : NaN;
  const combinedSales = sum(items.map(d=>d.combinedSales));
  const rev = revenueTotals(items);

  document.getElementById("kpiTotalSkus").textContent = fmtInt(totalSkus);
  document.getElementById("kpiStockValue").textContent = fmtGBP(stockValue);
  document.getElementById("kpiAvgProfit").textContent = Number.isFinite(avgProfit) ? `${avgProfit.toFixed(1)}%` : "–";
  document.getElementById("kpiSalesCombined").textContent = fmtInt(combinedSales);
  document.getElementById("kpiRevenueYTD").textContent = fmtGBP(rev.ytd);

  // Charts (note: Profit per SKU removed per your request)
  drawSalesRevenueTrend(items, rev);
  drawBrandRevShareFab4(items);     // NEW donut
  drawBrandTotalsBar(items);
  drawBrandMonthlyStacked(items);
  drawBrandProfitBar(items);
  drawBrandRevenueBar(items);
  drawSkuRevenueTop(items);

  // Table
  renderInvoiceTable(items);
}

/* ========= Brand summary helpers ========= */
function summariseByBrand(items){
  const by=new Map();
  for(const d of items){
    const key = canonicalBrand(d.brand || "Unknown");
    if(!by.has(key)){
      by.set(key,{
        brand:key,
        combinedSales:0,
        stockValue:0,
        profitSum:0, profitCount:0,
        revenue:0,
        months:Object.fromEntries(monthColumns.map(c=>[c.name,0])),
        monthsRevenue:Object.fromEntries(monthColumns.map(c=>[c.name,0]))
      });
    }
    const b=by.get(key);
    b.combinedSales += Number.isFinite(d.combinedSales)? d.combinedSales : 0;
    b.stockValue    += Number.isFinite(d.stockValue)? d.stockValue : 0;
    if (Number.isFinite(d.profitPct)){ b.profitSum += d.profitPct; b.profitCount += 1; }
    for (const {name} of monthColumns){
      const u=d.months[name], r=d.monthsRevenue[name];
      b.months[name] += Number.isFinite(u)? u : 0;
      b.monthsRevenue[name] += Number.isFinite(r)? r : 0;
    }
    b.revenue += sum(Object.values(d.monthsRevenue));
  }
  const rows = Array.from(by.values()).map(r=>({
    brand:r.brand,
    combinedSales:r.combinedSales,
    stockValue:r.stockValue,
    avgProfitPct: r.profitCount? r.profitSum/r.profitCount : NaN,
    revenue:r.revenue,
    months:r.months,
    monthsRevenue:r.monthsRevenue
  }));
  rows.sort((a,b)=> b.revenue - a.revenue);
  return rows;
}

/* ========= Charts ========= */

// Sales & Revenue per Month (units bars + revenue line + truncated cum. line)
function drawSalesRevenueTrend(items, rev){
  const months = rev.months;
  const unitSums = months.map(m => sum(items.map(d => d.months[m])));
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
    height: document.getElementById("salesRevenueTrend").clientHeight
  },{responsive:true});
}

// NEW — Revenue share donut for Milwaukee, DeWalt, Makita, Bosch
function drawBrandRevShareFab4(items){
  const rows = summariseByBrand(items);
  const wanted = ["Milwaukee","DeWalt","Makita","Bosch"];
  const map = new Map(rows.map(r=>[r.brand, r]));
  const labels = [];
  const values = [];
  const colors = [];
  wanted.forEach((w,i)=>{
    const r = map.get(w);
    const val = r ? r.revenue : 0;
    labels.push(w);
    values.push(val);
    colors.push(brandColour(w,i));
  });

  Plotly.newPlot("brandRevShareFab4",[{
    type:"pie",
    labels, values, hole:0.45, textinfo:"label+percent",
    marker:{colors:colors}
  }],{
    ...baseLayout,
    title:"Revenue Share — Milwaukee / DeWalt / Makita / Bosch (ex VAT)",
    height: document.getElementById("brandRevShareFab4").clientHeight
  },{responsive:true});
}

// Brand totals — Combined Sales
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
    height: document.getElementById("brandTotalsBar").clientHeight
  },{responsive:true});
}

// Brand monthly stacked (Units)
function drawBrandMonthlyStacked(items){
  const rows = summariseByBrand(items).slice(0,10);
  const months = monthColumns.map(c=>c.name);
  const traces = rows.map((r,i)=>({
    type:"bar",
    name:r.brand,
    x:months,
    y:months.map(m=>r.months[m]),
    marker:{color: brandColour(r.brand,i)}
  }));
  Plotly.newPlot("brandMonthlyStacked", traces, {
    ...baseLayout,
    barmode:"stack",
    title:"Monthly Sales by Brand (Units, current year)",
    xaxis:{tickangle:-45,automargin:true},
    yaxis:{title:"Units"},
    height: document.getElementById("brandMonthlyStacked").clientHeight
  },{responsive:true});
}

// Brand revenue bar
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
    height: document.getElementById("brandRevenueBar").clientHeight
  },{responsive:true});
}

// Top revenue SKUs
function drawSkuRevenueTop(items){
  const monthNames = monthColumns.map(m=>m.name);
  const withRevenue = items.map(d=>({
    sku: `${d.stockCode} — ${d.description}`,
    brand: canonicalBrand(d.brand),
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
    height: document.getElementById("skuRevenueTop").clientHeight
  },{responsive:true});
}

/* ========= Last Invoice table ========= */
function renderInvoiceTable(items){
  const tbody = document.querySelector("#invoiceTable tbody");
  tbody.innerHTML = "";
  const rows = items.slice(0,200);
  for(const d of rows){
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.stockCode}</td>
      <td>${d.description}</td>
      <td>${canonicalBrand(d.brand)}</td>
      <td>${d.subCategory}</td>
      <td>${fmtDateUK(d.lastInvoice)}</td>
    `;
    tbody.appendChild(tr);
  }
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
