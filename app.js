/* ========= Configuration ========= */
const BUILT_IN_CSV = "SEPTCLER 1.csv"; // set "" to disable auto-load

/* ========= Brand colour map (prioritised) ========= */
const brandColours = {
  "Milwaukee": "#d0021b", // red
  "DEWALT": "#ffd000", "DeWalt": "#ffd000", "Dewalt": "#ffd000", // yellow
  "Makita": "#00a19b",  // teal
  "Bosch": "#1f6feb", "BoschAccessories": "#1f6feb", // blue
  "Einhell": "#cc0033", // crimson
};
const fallbackColours = ["#6aa6ff","#ff9fb3","#90e0c5","#ffd08a","#c9b6ff","#8fd3ff","#ffc6a8","#b2e1a1","#f5b3ff","#a4b0ff"];
function brandColour(name, i=0){
  if (!name) return fallbackColours[i % fallbackColours.length];
  return brandColours[name] || fallbackColours[i % fallbackColours.length];
}

/* ========= Pastel Plotly Theme ========= */
const pastelLayout = {
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
    lastRec:     idx("Last Rec. Date"),
    salePriceExVat: idx("Sale Price Ex Vat")
  };
  priceExVatIndex = headerMap.salePriceExVat;

  // Months strictly Aug..Jul
  const monthsList = ["Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul"];
  monthColumns = monthsList.map(m => ({name:m, index: idx(m)})).filter(m => m.index >= 0);

  // Build dataset rows
  data = body.map(r=>{
    const profitPct = headerMap.profitPct>=0 ? toNumber(r[headerMap.profitPct]) : NaN;
    const internet  = headerMap.internetSales>=0 ? toNumber(r[headerMap.internetSales]) : 0;
    const ebay      = headerMap.ebaySales>=0 ? toNumber(r[headerMap.ebaySales]) : 0;
    const priceEx   = headerMap.salePriceExVat>=0 ? toNumber(r[headerMap.salePriceExVat]) : NaN;

    // months units + monthly revenue (price ex VAT × units)
    const months={}, monthsRevenue={};
    monthColumns.forEach(({name,index})=>{
      const units = toNumber(r[index]);
      months[name] = units;
      monthsRevenue[name] = (Number.isFinite(units) && Number.isFinite(priceEx)) ? (units * priceEx) : NaN;
    });

    // Last invoice date (keep raw + ISO for table)
    const lastInvRaw = headerMap.lastInvoice>=0 ? r[headerMap.lastInvoice] : "";
    return {
      stockCode:   headerMap.stockCode>=0 ? String(r[headerMap.stockCode]??"").trim() : "",
      description: headerMap.description>=0 ? String(r[headerMap.description]??"").trim() : "",
      brand:       headerMap.brand>=0 ? String(r[headerMap.brand]??"").trim() : "",
      subCategory: headerMap.subCategory>=0 ? String(r[headerMap.subCategory]??"").trim() : "",
      profitPct,
      stockValue:  headerMap.stockValue>=0 ? toNumber(r[headerMap.stockValue]) : NaN,
      months,
      monthsRevenue,
      internetSales: internet,
      ebaySales: ebay,
      combinedSales: internet + ebay,
      priceExVat: priceEx,
      lastInvoice: lastInvRaw
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
  const ytd = sum(perMonth);
  return {months, perMonth, ytd};
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

  // Charts
  drawProfitPerSKU(itemsSorted);
  drawSalesRevenueTrend(items, rev);
  drawPieByBrand(items);
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
    const k=d.brand||"Unknown";
    if(!by.has(k)){
      by.set(k,{
        brand:k,
        combinedSales:0,
        stockValue:0,
        profitSum:0, profitCount:0,
        revenue:0,
        months:Object.fromEntries(monthColumns.map(c=>[c.name,0])),
        monthsRevenue:Object.fromEntries(monthColumns.map(c=>[c.name,0]))
      });
    }
    const b=by.get(k);
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
  // prioritise popular brands (by revenue)
  rows.sort((a,b)=> b.revenue - a.revenue);
  return rows;
}

/* ========= Charts ========= */

// Profit % by SKU
function drawProfitPerSKU(items){
  const top = items.filter(d=>Number.isFinite(d.profitPct)).slice(0,200);
  Plotly.newPlot("profitByItem",[{
    type:"bar",
    x: top.map(d=>`${d.stockCode} — ${d.description}`),
    y: top.map(d=>d.profitPct),
    marker:{color: top.map((d,i)=>brandColour(d.brand,i))},
    hovertemplate:"<b>%{x}</b><br>% Profit: %{y:.1f}%<br>Brand: %{marker.color}<extra></extra>"
  }],{
    ...pastelLayout,
    title:"Profit % by SKU",
    xaxis:{automargin:true,showticklabels:false},
    yaxis:{title:"% Profit"},
    height: document.getElementById("profitByItem").clientHeight
  },{responsive:true});
}

// Sales & Revenue per Month (units bars + revenue line + cumulative line)
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
    ...pastelLayout,
    title:"Sales (Units) & Estimated Revenue per Month",
    xaxis:{tickangle:-45,automargin:true},
    yaxis:{title:"Units / £ ex VAT"},
    height: document.getElementById("salesRevenueTrend").clientHeight
  },{responsive:true});
}

// Pie — Combined Sales by Brand (Internet + eBay)
function drawPieByBrand(items){
  const brandRows = summariseByBrand(items);
  const top = brandRows.slice(0,10);
  const other = brandRows.slice(10).reduce((s,r)=> s + r.combinedSales, 0);
  const labels=[...top.map(r=>r.brand), ...(other>0?["Other"]:[])];
  const values=[...top.map(r=>r.combinedSales), ...(other>0?[other]:[])];
  const colors=top.map((r,i)=>brandColour(r.brand,i)).concat(other>0?["#eceff9"]:[]);

  Plotly.newPlot("pieBrand",[{
    type:"pie", labels, values, hole:0.45, textinfo:"label+percent",
    marker:{colors:colors}
  }],{
    ...pastelLayout,
    title:"Combined Sales Share by Brand (Internet + eBay)",
    height: document.getElementById("pieBrand").clientHeight
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
    ...pastelLayout,
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
    ...pastelLayout,
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
    ...pastelLayout,
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
    ...pastelLayout,
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
      <td>${d.brand}</td>
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
