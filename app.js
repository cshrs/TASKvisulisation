/* ========= Config ========= */
const BUILT_IN_CSV = "SEPTCLER 1.csv"; // set "" to disable auto-load

// Aliases (case-insensitive, tolerant of TASK headers)
const Aliases = {
  stockCode: ["stock code"],
  description: ["description"],
  supplier: ["supplier","buying"],
  brand: ["brand","manu"],
  priceExVat: ["sale price ex vat","online price ex vat","online pr ex vat"],
  salePrice: ["sale price","online price","online"],
  cost: ["cost","average cost price","calculated cost","calc cost"],
  profitPct: ["% profit","profit %","calculated % profit"],
  availableQty: ["available stock","available","stock","quantity"],
  stockValue: ["stock value","available value","value"],
  ytdSales: ["sales year to date","year to date","ytd"],
  internetSales: ["internet sales","internet"],
  ebaySales: ["ebay","ebay sales"]
};
const MonthRegex = /(^|\s)(Aug|Sep|Oct|Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul)(\s|$)/i;

/* ========= Pastel Plotly Theme ========= */
const pastelColorway = ["#6aa6ff","#ff9fb3","#90e0c5","#ffd08a","#c9b6ff","#8fd3ff","#ffc6a8","#b2e1a1","#f5b3ff","#a4b0ff"];
const pastelLayout = {
  paper_bgcolor: "#ffffff",
  plot_bgcolor: "#ffffff",
  font: { family: "Inter, system-ui, Segoe UI, Arial, sans-serif", color: "#2a2a33" },
  colorway: pastelColorway,
  margin: { t: 60, l: 60, r: 20, b: 60 }
};

/* ========= State ========= */
let rowsRaw=[], headersRaw=[], data=[], headerMap={}, monthColumns=[];

/* ========= Helpers ========= */
function synthesiseHeader(rows){
  const depth = rows.length, width = Math.max(...rows.map(r=>r.length));
  const headers = [];
  for(let c=0;c<width;c++){
    const parts=[];
    for(let r=0;r<depth;r++){
      const cell=(rows[r]||[])[c]||"";
      const s=String(cell).replace(/\r/g,"").trim();
      if(s) parts.push(s);
    }
    headers.push(parts.join(" ").replace(/\s+/g," ").trim());
  }
  return headers;
}
function findColIndex(headers, list){
  const lower=headers.map(h=>h.toLowerCase());
  for(const a of list){ const i = lower.findIndex(h=>h.includes(a.toLowerCase())); if(i!==-1) return i; }
  return -1;
}
function toNumber(v){ if(v==null) return NaN; const n=parseFloat(String(v).replace(/[,£%]/g,"").trim()); return Number.isFinite(n)?n:NaN; }
function fmtGBP(n){ return Number.isFinite(n) ? new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP",maximumFractionDigits:0}).format(n) : "–"; }
const debounce=(fn,ms=200)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);}};

/* ========= CSV ========= */
function parseCSVText(txt){
  return new Promise((resolve,reject)=>{
    Papa.parse(txt,{worker:true,skipEmptyLines:"greedy",complete:r=>resolve(r.data),error:reject});
  });
}
async function loadFromFile(f){ const txt=await f.text(); hydrate(await parseCSVText(txt)); }
async function loadFromPath(p){ const r=await fetch(p); if(!r.ok) throw new Error("Fetch CSV failed"); hydrate(await parseCSVText(await r.text())); }

/* ========= Build Data ========= */
function hydrate(arr){
  rowsRaw=arr;
  const headerRows=3;               // TASK often uses 3 header rows
  headersRaw=rowsRaw.slice(0,headerRows);
  const headers=synthesiseHeader(headersRaw);
  const body=rowsRaw.slice(headerRows).filter(r=>r&&r.some(c=>String(c).trim()!==""));

  headerMap={
    stockCode:findColIndex(headers,Aliases.stockCode),
    description:findColIndex(headers,Aliases.description),
    supplier:findColIndex(headers,Aliases.supplier),
    brand:findColIndex(headers,Aliases.brand),
    salePrice:findColIndex(headers,Aliases.salePrice),
    priceExVat:findColIndex(headers,Aliases.priceExVat),
    cost:findColIndex(headers,Aliases.cost),
    profitPct:findColIndex(headers,Aliases.profitPct),
    availableQty:findColIndex(headers,Aliases.availableQty),
    stockValue:findColIndex(headers,Aliases.stockValue),
    ytdSales:findColIndex(headers,Aliases.ytdSales),
    internetSales:findColIndex(headers,Aliases.internetSales),
    ebaySales:findColIndex(headers,Aliases.ebaySales)
  };

  const monthCandidates = headers.map((h,i)=>({name:h,index:i})).filter(x=>MonthRegex.test(x.name));
  monthColumns = monthCandidates.slice(0,12); // first Aug→Jul run only

  data = body.map(r=>{
    const price = headerMap.salePrice>=0 ? toNumber(r[headerMap.salePrice]) :
                  headerMap.priceExVat>=0 ? toNumber(r[headerMap.priceExVat]) : NaN;
    const cost  = headerMap.cost>=0 ? toNumber(r[headerMap.cost]) : NaN;
    const pctProvided = headerMap.profitPct>=0 ? toNumber(r[headerMap.profitPct]) : NaN;
    const profitPct = Number.isFinite(pctProvided) ? pctProvided :
                      (Number.isFinite(price)&&Number.isFinite(cost)&&cost!==0) ? ((price-cost)/cost)*100 : NaN;

    const months={}; monthColumns.forEach(({name,index})=> months[name]=toNumber(r[index]));
    const internet = headerMap.internetSales>=0 ? toNumber(r[headerMap.internetSales]) : 0;
    const ebay     = headerMap.ebaySales>=0 ? toNumber(r[headerMap.ebaySales]) : 0;

    return {
      stockCode: headerMap.stockCode>=0 ? String(r[headerMap.stockCode]??"").trim() : "",
      description: headerMap.description>=0 ? String(r[headerMap.description]??"").trim() : "",
      supplier: headerMap.supplier>=0 ? String(r[headerMap.supplier]??"").trim() : "",
      brand: headerMap.brand>=0 ? String(r[headerMap.brand]??"").trim() : "",
      priceExVat: price,
      cost,
      profitPct,
      availableQty: headerMap.availableQty>=0 ? toNumber(r[headerMap.availableQty]) : NaN,
      stockValue: headerMap.stockValue>=0 ? toNumber(r[headerMap.stockValue]) : NaN,
      months,
      internetSales: internet,
      ebaySales: ebay,
      combinedSales: internet + ebay
    };
  });

  populateFilters();
  refresh();
}

/* ========= Filters & Sorting ========= */
function uniqueSorted(a){ return [...new Set(a.filter(Boolean))].sort((x,y)=>x.localeCompare(y)); }
function populateFilters(){
  const sup=document.getElementById("supplierFilter"), br=document.getElementById("brandFilter");
  sup.length=1; br.length=1;
  uniqueSorted(data.map(d=>d.supplier)).forEach(s=>sup.add(new Option(s,s)));
  uniqueSorted(data.map(d=>d.brand)).forEach(b=>br.add(new Option(b,b)));
}
function currentFiltered(){
  const q=document.getElementById("search").value.trim().toLowerCase();
  const sup=document.getElementById("supplierFilter").value;
  const br=document.getElementById("brandFilter").value;
  return data.filter(d=>{
    if(sup && d.supplier!==sup) return false;
    if(br && d.brand!==br) return false;
    if(q){
      const hay=(d.description+" "+d.stockCode).toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });
}
function sortItems(items){
  const how=document.getElementById("sortBy").value;
  const arr=[...items];
  const by=(k,dir=1)=>(a,b)=> (a[k]??"").localeCompare(b[k]??"")*dir;
  const byNum=(k,dir=1)=>(a,b)=> ((Number.isFinite(a[k])?a[k]:-Infinity)-(Number.isFinite(b[k])?b[k]:-Infinity))*dir;
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

function refresh(){
  const items=currentFiltered();

  // KPIs
  const totalSkus=items.length;
  const stockValue=items.reduce((s,d)=>s+(Number.isFinite(d.stockValue)?d.stockValue:0),0);
  const avgProfit=items.length ? items.reduce((s,d)=>s+(Number.isFinite(d.profitPct)?d.profitPct:0),0)/items.length : NaN;
  const combinedSales=items.reduce((s,d)=>s+(Number.isFinite(d.combinedSales)?d.combinedSales:0),0);
  document.getElementById("kpiTotalSkus").textContent=fmtInt(totalSkus);
  document.getElementById("kpiStockValue").textContent=fmtGBP(stockValue);
  document.getElementById("kpiAvgProfit").textContent=Number.isFinite(avgProfit)? `${avgProfit.toFixed(1)}%` : "–";
  document.getElementById("kpiSalesCombined").textContent=fmtInt(combinedSales);

  // Charts
  drawProfitPerSKU(sortItems(items));
  drawMonthlySales(items);
  drawPieByBrand(items);
  drawPieBySupplier(items);
}

/* ========= Charts ========= */

// Profit per SKU
function drawProfitPerSKU(items){
  const top = items.filter(d=>Number.isFinite(d.profitPct)).slice(0,200);
  Plotly.newPlot("profitByItem", [{
    type:"bar",
    x: top.map(d=>`${d.stockCode} — ${d.description}`),
    y: top.map(d=>d.profitPct),
    hovertemplate:"<b>%{x}</b><br>% Profit: %{y:.1f}%<extra></extra>"
  }], {
    ...pastelLayout,
    title:"Profit % by SKU",
    xaxis:{automargin:true,showticklabels:false},
    yaxis:{title:"% Profit"},
    height: document.getElementById("profitByItem").clientHeight
  }, {responsive:true});
}

// Sales per month (current year only)
function drawMonthlySales(items){
  const names=monthColumns.map(c=>c.name);
  const sums=names.map(m=>items.reduce((s,d)=>s+(Number.isFinite(d.months[m])?d.months[m]:0),0));
  Plotly.newPlot("salesTrend", [{
    type:"scatter", mode:"lines+markers",
    x:names, y:sums, hovertemplate:"%{x}: %{y:.0f}<extra></extra>"
  }], {
    ...pastelLayout,
    title:"Sales per Month (current year)",
    xaxis:{tickangle:-45,automargin:true},
    yaxis:{title:"Units / Value (as exported)"},
    height: document.getElementById("salesTrend").clientHeight
  }, {responsive:true});
}

// Pie—Sales by Brand (top 10 + Other)
function drawPieByBrand(items){
  const byBrand={};
  for(const d of items){
    const k=d.brand||"Unknown";
    byBrand[k]=(byBrand[k]||0)+(Number.isFinite(d.combinedSales)?d.combinedSales:0);
  }
  const entries=Object.entries(byBrand).sort((a,b)=>b[1]-a[1]);
  const top=entries.slice(0,10), other=entries.slice(10).reduce((s,[,v])=>s+v,0);
  const labels=[...top.map(([k])=>k), ...(other>0?["Other"]:[])];
  const values=[...top.map(([,v])=>v), ...(other>0?[other]:[])];

  Plotly.newPlot("pieBrand", [{
    type:"pie", labels, values, hole:0.45, textinfo:"label+percent"
  }], {
    ...pastelLayout,
    title:"Combined Sales Share by Brand",
    height: document.getElementById("pieBrand").clientHeight
  }, {responsive:true});
}

// Pie—Sales by Supplier (top 10 + Other)
function drawPieBySupplier(items){
  const bySup={};
  for(const d of items){
    const k=d.supplier||"Unknown";
    bySup[k]=(bySup[k]||0)+(Number.isFinite(d.combinedSales)?d.combinedSales:0);
  }
  const entries=Object.entries(bySup).sort((a,b)=>b[1]-a[1]);
  const top=entries.slice(0,10), other=entries.slice(10).reduce((s,[,v])=>s+v,0);
  const labels=[...top.map(([k])=>k), ...(other>0?["Other"]:[])];
  const values=[...top.map(([,v])=>v), ...(other>0?[other]:[])];

  Plotly.newPlot("pieSupplier", [{
    type:"pie", labels, values, hole:0.45, textinfo:"label+percent"
  }], {
    ...pastelLayout,
    title:"Combined Sales Share by Supplier",
    height: document.getElementById("pieSupplier").clientHeight
  }, {responsive:true});
}

/* ========= Events ========= */
document.getElementById("file").addEventListener("change", e=>{
  const f=e.target.files[0]; if(f) loadFromFile(f);
});
document.getElementById("loadSample").addEventListener("click", ()=>{
  if(!BUILT_IN_CSV){ alert("Set BUILT_IN_CSV in app.js or use the file picker."); return; }
  loadFromPath(BUILT_IN_CSV);
});
["search","supplierFilter","brandFilter","sortBy"].forEach(id=>{
  document.getElementById(id).addEventListener("input", debounce(refresh,150));
});
