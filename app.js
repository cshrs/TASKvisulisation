/* ========= Configuration ========= */
const BUILT_IN_CSV = "OVER.CSV"; // optional, eg "PAUL.CSV" if you commit it alongside the site

/* ========= Brand normalisation & colours ========= */
const normKey = s => String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"");

const NOT_BRAND_KEYS = new Set([
  "0","305","356","407","40","ew","g","gh","ing","ion","jo","o","p","s","son","tsadhesives",
  "utomotive","Â","Ã","commandtm","crescentr","irwinjack","irwinrecord","irwinviseg","irwinhilmor",
  "lth","mc","numaticmc"
]);

/* Canonical map: key = normKey(raw) -> value = Canonical Brand
   This is your merged brand list logic. Keep extending as needed. */
const BRAND_ALIASES = {
  "3inone":"3-IN-ONE","3m":"3M",
  "abracs":"Abracs",
  "abru":"Abru",
  "abus":"ABUS","abusmechanical":"ABUS",
  "amazon":"Amazon",
  "armogard":"Armorgard",
  "bahco":"Bahco",
  "beeswift":"Beeswift",
  "belle":"Belle",
  "blackdecker":"Black & Decker",
  "bondit":"Bond It",
  "bosch":"Bosch","bosh":"Bosch","boschacc":"Bosch",
  "bostitch":"Bostitch",
  "brennenstuhl":"Brennenstuhl",
  "buckler":"Buckler Boots","bucklerboots":"Buckler Boots",
  "bulldog":"Bulldog",
  "campingaz":"Campingaz",
  "cascamite":"Cascamite",
  "castle":"Castle","castleclothing":"Castle Clothing",
  "ct1":"CT1","ctie":"CT1",
  "dart":"DART",
  "defender":"Defender",
  "dormer":"Dormer",
  "draper":"Draper",
  "dewalt":"DeWalt","dewaltdrywall":"DeWalt","dewaltrespirat":"DeWalt","dewaltacc":"DeWalt","dewaltmc":"DeWalt",
  "einhell":"Einhell",
  "energizer":"Energizer",
  "estwing":"Estwing",
  "everbuild":"Everbuild",
  "evolution":"Evolution","evolutionpower":"Evolution",
  "facom":"Facom",
  "faithfull":"Faithfull","faithfullpower":"Faithfull Power",
  "festool":"Festool",
  "fischer":"Fischer",
  "fiskars":"Fiskars",
  "forgefix":"ForgeFix","forge":"Forge",
  "gedore":"Gedore",
  "gorilla":"Gorilla","gorillaglue":"Gorilla Glue",
  "gys":"GYS",
  "hikoki":"HiKOKI","hitachi":"HiKOKI",
  "hozelock":"Hozelock",
  "hultafors":"Hultafors",
  "hyundai":"Hyundai",
  "illbruck":"illbruck",
  "irwin":"Irwin",
  "jcb":"JCB",
  "jeaton":"Jeaton",
  "jsp":"JSP",
  "kane":"KANE",
  "karcher":"Karcher",
  "knipex":"Knipex",
  "komelon":"Komelon",
  "laserliner":"Laserliner",
  "ledlenser":"Ledlenser",
  "leica":"Leica","leicageosystem":"Leica Geosystems",
  "liberon":"Liberon",
  "lighthouse":"Lighthouse",
  "loctite":"Loctite",
  "makita":"Makita","makitaacc":"Makita","makitamc":"Makita",
  "marcrist":"Marcrist",
  "marshalltown":"Marshalltown",
  "masterlock":"Master Lock",
  "masterplug":"Masterplug",
  "metabo":"Metabo",
  "milwaukee":"Milwaukee",
  "monument":"Monument",
  "ndurance":"N-Durance","ndurance":"N-Durance","ndurance":"N-Durance",
  "nailfixings":"Nails & Fixings","nailsfixings":"Nails & Fixings",
  "norbar":"Norbar",
  "paslode":"Paslode","paslodescrews":"Paslode",
  "plasplugs":"Plasplugs",
  "portwest":"Portwest",
  "pramac":"Pramac",
  "predator":"Predator",
  "purdy":"Purdy",
  "rawl":"Rawlplug","rawlplug":"Rawlplug",
  "rentokil":"Rentokil",
  "resapol":"Resapol",
  "ridgid":"RIDGID",
  "rocol":"ROCOL",
  "ronseal":"Ronseal",
  "rothenberger":"Rothenberger",
  "roughneck":"Roughneck",
  "rustins":"Rustins",
  "ryobi":"Ryobi",
  "scan":"Scan",
  "scheppach":"Scheppach",
  "scruffs":"Scruffs",
  "sealey":"Sealey",
  "senco":"Senco",
  "shurtape":"Shurtape",
  "sia":"SIA","siaabrasives":"Sia Abrasives",
  "sievert":"Sievert",
  "sip":"SIP",
  "squire":"Squire",
  "stabila":"Stabila",
  "stanley":"Stanley",
  "starrett":"Starrett",
  "steinel":"Steinel",
  "stihl":"Stihl",
  "swarfega":"Swarfega",
  "tacwise":"Tacwise",
  "teng":"Teng Tools","tengtools":"Teng Tools",
  "testo":"Testo",
  "thor":"Thor",
  "timco":"TIMco",
  "toolbank":"Toolbank",
  "toolden":"Toolden",
  "toughbuilt":"ToughBuilt",
  "toupret":"Toupret",
  "tremco":"TREMCO",
  "trend":"Trend",
  "triton":"Triton",
  "turtlewax":"Turtle Wax",
  "tygris":"TYGRIS","tyrgris":"TYGRIS",
  "unibond":"Unibond",
  "upol":"U-POL",
  "vanvault":"Van Vault",
  "vitrex":"Vitrex",
  "wd40":"WD-40",
  "wera":"Wera",
  "wiha":"Wiha",
  "yale":"Yale","yalelocks":"Yale",
  "youngman":"Youngman",
  "zarges":"Zarges",
  "zinsser":"Zinsser",
  "zipper":"Zipper"
};

function canonicalBrand(name){
  const k = normKey(name);
  if (!k || NOT_BRAND_KEYS.has(k)) return "Other";
  return BRAND_ALIASES[k] || (name ? String(name).trim() : "Other");
}

const brandColours = {
  "Milwaukee": "#d0021b",
  "DeWalt": "#ffd000",
  "Makita": "#00a19b",
  "Bosch": "#1f6feb",
  "HiKOKI": "#0b8457",
  "Everbuild": "#ff8c00",
  "N-Durance": "#7d5cff",
  "Metabo": "#136f63",
  "Festool": "#2b8a3e",
  "Stanley": "#ffeb3b",
  "Irwin": "#005eb8",
  "ABUS": "#0aa55b"
};
const fallbackColours = ["#6aa6ff","#ff9fb3","#90e0c5","#ffd08a","#c9b6ff","#8fd3ff","#ffc6a8","#b2e1a1","#f5b3ff","#a4b0ff"];
function brandColour(name, i=0){ return brandColours[name] || fallbackColours[i % fallbackColours.length]; }

/* ========= Plotly theme ========= */
const baseLayout = {
  paper_bgcolor: "rgba(255,255,255,0)",
  plot_bgcolor: "rgba(255,255,255,0)",
  font: { family: "Inter, system-ui, Segoe UI, Arial, sans-serif", color: "#1f2530" },
  margin: { t: 56, l: 60, r: 18, b: 60 }
};

/* ========= State ========= */
let headers = [];
let data = [];
let headerMap = {};
let monthColumns = [];
let prevMonthColumns = [];

/* ========= Utils ========= */
function toNumber(v){
  if (v == null) return NaN;
  const n = parseFloat(String(v).replace(/[,£%]/g,"").trim());
  return Number.isFinite(n) ? n : NaN;
}
function fmtGBP(n){
  return Number.isFinite(n)
    ? new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"}).format(n)
    : "–";
}
function fmtDateUK(d){
  try{
    if(!d) return "";
    const date = new Date(d);
    if (isNaN(date)) return String(d);
    return date.toLocaleDateString("en-GB");
  }catch{
    return String(d);
  }
}
const debounce = (fn,ms=200)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; };
function setText(id, value){ const el = document.getElementById(id); if (el) el.textContent = value; }
const sum = arr => arr.reduce((s,v)=> s + (Number.isFinite(v)?v:0), 0);

/* ========= CSV parsing ========= */
function parseCSVText(csvText){
  return new Promise((resolve,reject)=>{
    Papa.parse(csvText,{
      worker:true,
      skipEmptyLines:"greedy",
      complete:r=>resolve(r.data),
      error:reject
    });
  });
}
async function loadFromFile(file){
  const txt = await file.text();
  hydrate(await parseCSVText(txt));
}
async function loadFromPath(path){
  const r = await fetch(path);
  if(!r.ok) throw new Error("Fetch CSV failed");
  hydrate(await parseCSVText(await r.text()));
}

/* ========= Header helpers ========= */
function synthesiseHeader(rows){
  const depth = rows.length;
  const width = Math.max(...rows.map(r=>r.length));
  const out = [];
  for(let c=0;c<width;c++){
    const parts = [];
    for(let r=0;r<depth;r++){
      const cell = (rows[r]||[])[c] || "";
      const s = String(cell).replace(/\r/g,"").trim();
      if(s) parts.push(s);
    }
    out.push(parts.join(" ").replace(/\s+/g," ").trim());
  }
  return out;
}
function findHeaderIndex(tokens){
  const need = tokens.map(t=>t.toLowerCase());
  for (let i=0;i<headers.length;i++){
    const h = headers[i].toLowerCase();
    if (need.every(n => h.includes(n))) return i;
  }
  return -1;
}

/* ========= Period helpers ========= */
function getPeriodMode(){ return document.getElementById("periodMode").value; }
function getSelectedMonth(){ return document.getElementById("monthSelect").value; }

function activeMonths(){
  const months = monthColumns.map(m=>m.name);
  if (getPeriodMode() === "Month"){
    const m = getSelectedMonth();
    return m ? [m] : [];
  }

  // YTD: truncate at last month with any revenue across dataset
  const perMonth = months.map(m => sum(data.map(d => d.monthsRevenue?.[m])));
  let last = -1;
  for (let i = perMonth.length - 1; i >= 0; i--){
    if (Number.isFinite(perMonth[i]) && perMonth[i] > 0){ last = i; break; }
  }
  return last >= 0 ? months.slice(0,last+1) : [];
}

/* ========= Hydrate from raw export ========= */
function hydrate(arrayRows){
  const headerRows = 3;
  headers = synthesiseHeader(arrayRows.slice(0, headerRows));
  const body = arrayRows.slice(headerRows).filter(r => r && r.some(c => String(c).trim() !== ""));

  const H = Object.fromEntries(headers.map((h,i)=>[h.trim(), i]));
  const idx = (name) => (H[name] ?? -1);

  headerMap = {
    stockCode:       idx("Stock Code"),
    description:     idx("Description ..............."),
    brand:           idx("Manu/ Brand"),
    profitPct:       idx("Calculated % Profit"),
    stockValue:      idx("Stock Value"),
    internetSales:   idx("Internet Sales"),
    ebaySales:       idx("Ebay"),
    subCategory:     idx("Sub Category"),
    lastInvoice:     idx("Last Invoice Date"),
    salePriceExVat:  idx("Sale Price Ex Vat") !== -1 ? idx("Sale Price Ex Vat") : findHeaderIndex(["sale","price","ex","vat"]),
    onlinePriceExVat: findHeaderIndex(["online","price","ex","vat"])
  };

  const monthsList = ["Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul"];
  monthColumns = monthsList.map(m => ({name:m, index:(H[m] ?? -1)})).filter(m => m.index >= 0);

  // prev-year month columns: "Aug Prev Year" etc
  prevMonthColumns = monthsList.map(m => ({name:m, index:(H[`${m} Prev Year`] ?? -1)})).filter(m => m.index >= 0);

  data = body.map(r=>{
    const salePrice   = headerMap.salePriceExVat>=0 ? toNumber(r[headerMap.salePriceExVat]) : NaN;
    const onlinePrice = headerMap.onlinePriceExVat>=0 ? toNumber(r[headerMap.onlinePriceExVat]) : NaN;
    const priceBasis  = (Number.isFinite(salePrice) && salePrice>0) ? salePrice
                      : ((Number.isFinite(onlinePrice) && onlinePrice>0) ? onlinePrice : NaN);

    const months = {};
    const monthsRevenue = {};
    monthColumns.forEach(({name,index})=>{
      const units = toNumber(r[index]);
      months[name] = units;
      monthsRevenue[name] = (Number.isFinite(units) && Number.isFinite(priceBasis)) ? (units * priceBasis) : NaN;
    });

    const prevMonths = {};
    const prevMonthsRevenue = {};
    prevMonthColumns.forEach(({name,index})=>{
      const units = toNumber(r[index]);
      prevMonths[name] = units;
      prevMonthsRevenue[name] = (Number.isFinite(units) && Number.isFinite(priceBasis)) ? (units * priceBasis) : NaN;
    });

    const brandRaw = headerMap.brand>=0 ? String(r[headerMap.brand]??"").trim() : "";
    const brand = canonicalBrand(brandRaw);

    const internetSales = headerMap.internetSales>=0 ? toNumber(r[headerMap.internetSales]) : 0;
    const ebaySales     = headerMap.ebaySales>=0 ? toNumber(r[headerMap.ebaySales]) : 0;

    return {
      stockCode:     headerMap.stockCode>=0 ? String(r[headerMap.stockCode]??"").trim() : "",
      description:   headerMap.description>=0 ? String(r[headerMap.description]??"").trim() : "",
      brand,
      subCategory:   headerMap.subCategory>=0 ? String(r[headerMap.subCategory]??"").trim() : "",
      profitPct:     headerMap.profitPct>=0 ? toNumber(r[headerMap.profitPct]) : NaN,
      stockValue:    headerMap.stockValue>=0 ? toNumber(r[headerMap.stockValue]) : NaN,
      months,
      monthsRevenue,
      prevMonths,
      prevMonthsRevenue,
      priceBasis,
      internetSales,
      ebaySales,
      combinedSales: (Number.isFinite(internetSales)?internetSales:0) + (Number.isFinite(ebaySales)?ebaySales:0),
      lastInvoice:   headerMap.lastInvoice>=0 ? r[headerMap.lastInvoice] : ""
    };
  });

  populateFilters();
  populateMonths();
  refresh();
}

/* ========= Filtering ========= */
function uniqueSorted(arr){ return [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b)); }

function baseItemsForAggregates(){
  const br = document.getElementById("brandFilter").value;
  return data.filter(d=>{
    if (!d.brand || d.brand === "Other") return false;
    if (br && d.brand !== br) return false;
    return true;
  });
}

function itemsWithSearch(){
  const q  = document.getElementById("search").value.trim().toLowerCase();
  const br = document.getElementById("brandFilter").value;

  return data.filter(d=>{
    if (br && d.brand !== br) return false;
    if (q){
      const hay = (d.description + " " + d.stockCode).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function populateFilters(){
  const brandSel = document.getElementById("brandFilter");
  brandSel.length = 1;
  uniqueSorted(data.map(d=>d.brand).filter(b=>b && b!=="Other")).forEach(v=> brandSel.add(new Option(v, v)));
}

function populateMonths(){
  const ms = document.getElementById("monthSelect");
  ms.innerHTML = "";
  monthColumns.forEach(m => ms.add(new Option(m.name, m.name)));
}

/* ========= Series helpers ========= */
function revenueSeries(items, monthsActive){
  const perMonth = monthsActive.map(m => sum(items.map(d => d.monthsRevenue[m])));
  return { months: monthsActive, perMonth };
}
function unitsSeries(items, monthsActive){
  const perMonth = monthsActive.map(m => sum(items.map(d => Number.isFinite(d.months[m]) ? d.months[m] : 0 )));
  return { months: monthsActive, perMonth };
}
function prevRevenueSeries(items, monthsActive){
  const perMonth = monthsActive.map(m => sum(items.map(d => d.prevMonthsRevenue?.[m])));
  return { months: monthsActive, perMonth };
}
function prevUnitsSeries(items, monthsActive){
  const perMonth = monthsActive.map(m => sum(items.map(d => Number.isFinite(d.prevMonths?.[m]) ? d.prevMonths[m] : 0 )));
  return { months: monthsActive, perMonth };
}

/* ========= Brand summary ========= */
function summariseByBrand(items, monthsActive){
  const by = new Map();
  for(const d of items){
    const key = d.brand || "Other";
    if(!by.has(key)) by.set(key,{ brand:key, units:0, stockValue:0, revenue:0 });
    const b = by.get(key);

    b.stockValue += Number.isFinite(d.stockValue) ? d.stockValue : 0;
    for (const m of monthsActive){
      b.revenue += Number.isFinite(d.monthsRevenue[m]) ? d.monthsRevenue[m] : 0;
      b.units   += Number.isFinite(d.months[m]) ? d.months[m] : 0;
    }
  }
  const rows = Array.from(by.values()).filter(r => r.brand !== "Other");
  rows.sort((a,b)=> b.revenue - a.revenue);
  return rows;
}

/* ========= Chart helpers ========= */
function safeClear(id){
  const el = document.getElementById(id);
  if (!el) return;
  try { Plotly.purge(id); } catch {}
  el.innerHTML = "";
}
function setVisible(id, visible){
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = visible ? "" : "none";
  if (!visible) safeClear(id);
}
function chartHeight(id){
  return document.getElementById(id)?.clientHeight || 520;
}

/* ========= Charts ========= */
function drawUnitsTrend(uSeries){
  Plotly.newPlot("salesUnitsTrend", [{
    type:"bar",
    name:"Units",
    x:uSeries.months,
    y:uSeries.perMonth,
    marker:{color:"#90e0c5"},
    hovertemplate:"%{x}: %{y:.0f} units<extra></extra>"
  }], {
    ...baseLayout,
    title:"Units per Month",
    xaxis:{tickangle:-45, automargin:true},
    yaxis:{title:"Units"},
    height: chartHeight("salesUnitsTrend")
  }, {responsive:true});
}

function drawRevenueTrend(rSeries){
  const revenue = rSeries.perMonth;
  const cumulative = revenue.reduce((acc,v,i)=>{
    acc.push((acc[i-1]||0) + (Number.isFinite(v)?v:0));
    return acc;
  }, []);

  Plotly.newPlot("revenueTrend", [
    {
      type:"bar",
      name:"Est. Revenue (ex VAT)",
      x:rSeries.months,
      y:revenue,
      hovertemplate:"%{x}: £%{y:,.0f}<extra></extra>"
    },
    {
      type:"scatter",
      mode:"lines",
      name:"Cumulative Revenue",
      x:rSeries.months,
      y:cumulative,
      hovertemplate:"%{x}: £%{y:,.0f}<extra></extra>"
    }
  ], {
    ...baseLayout,
    title:"Estimated Revenue per Month (ex VAT)",
    xaxis:{tickangle:-45, automargin:true},
    yaxis:{title:"£ ex VAT"},
    height: chartHeight("revenueTrend")
  }, {responsive:true});
}

/* YoY charts: grouped bars only (no % change line) */
function drawYoYUnits(currU, prevU){
  const months = currU.months;
  const prev = prevU.perMonth.length ? prevU.perMonth : months.map(()=>0);

  Plotly.newPlot("yoyUnits", [
    { type:"bar", name:"Current Year", x:months, y:currU.perMonth, marker:{color:"#90e0c5"}, hovertemplate:"%{x}: %{y:.0f} units<extra></extra>" },
    { type:"bar", name:"Previous Year", x:months, y:prev, marker:{color:"#c9b6ff"}, hovertemplate:"%{x}: %{y:.0f} units<extra></extra>" }
  ], {
    ...baseLayout,
    title:"Units YoY (Current vs Previous Year)",
    barmode:"group",
    xaxis:{tickangle:-45, automargin:true},
    yaxis:{title:"Units"},
    height: chartHeight("yoyUnits")
  }, {responsive:true});
}

function drawYoYRevenue(currR, prevR){
  const months = currR.months;
  const prev = prevR.perMonth.length ? prevR.perMonth : months.map(()=>0);

  Plotly.newPlot("yoyRevenue", [
    { type:"bar", name:"Current Year", x:months, y:currR.perMonth, marker:{color:"#6aa6ff"}, hovertemplate:"%{x}: £%{y:,.0f}<extra></extra>" },
    { type:"bar", name:"Previous Year", x:months, y:prev, marker:{color:"#ffd08a"}, hovertemplate:"%{x}: £%{y:,.0f}<extra></extra>" }
  ], {
    ...baseLayout,
    title:"Estimated Revenue YoY (ex VAT)",
    barmode:"group",
    xaxis:{tickangle:-45, automargin:true},
    yaxis:{title:"£ ex VAT"},
    height: chartHeight("yoyRevenue")
  }, {responsive:true});
}

function drawBrandRevShareFab4(items, rSeries){
  const rows = summariseByBrand(items, rSeries.months);
  const wanted = ["Milwaukee","DeWalt","Makita","Bosch"];
  const map = new Map(rows.map(r=>[r.brand, r]));

  const labels = [];
  const values = [];
  const colors = [];

  wanted.forEach((w,i)=>{
    labels.push(w);
    values.push(map.get(w)?.revenue || 0);
    colors.push(brandColour(w,i));
  });

  Plotly.newPlot("brandRevShareFab4", [{
    type:"pie",
    labels, values,
    hole:0.45,
    textinfo:"label+percent",
    marker:{colors}
  }], {
    ...baseLayout,
    title:"Revenue Share (Fab 4, ex VAT)",
    height: chartHeight("brandRevShareFab4")
  }, {responsive:true});
}

function drawBrandTotalsBar(items, monthsActive){
  const rows = summariseByBrand(items, monthsActive).sort((a,b)=> b.units - a.units).slice(0,15);
  Plotly.newPlot("brandTotalsBar", [{
    type:"bar",
    x: rows.map(r=>r.brand),
    y: rows.map(r=>r.units),
    marker:{color: rows.map((r,i)=>brandColour(r.brand,i))},
    hovertemplate:"<b>%{x}</b><br>Units: %{y:.0f}<extra></extra>"
  }], {
    ...baseLayout,
    title:"Units by Brand (Top 15)",
    xaxis:{automargin:true},
    yaxis:{title:"Units"},
    height: chartHeight("brandTotalsBar")
  }, {responsive:true});
}

function drawBrandMonthlyStacked(items){
  const months = monthColumns.map(c=>c.name);
  const topBrands = summariseByBrand(items, months).slice(0,10).map(r=>r.brand);

  const traces = topBrands.map((brand,i)=>({
    type:"bar",
    name: brand,
    x: months,
    y: months.map(m => sum(items.filter(d=>d.brand===brand).map(d => Number.isFinite(d.months[m]) ? d.months[m] : 0))),
    marker:{color: brandColour(brand,i)}
  }));

  Plotly.newPlot("brandMonthlyStacked", traces, {
    ...baseLayout,
    title:"Monthly Units by Brand (Current Year)",
    barmode:"stack",
    xaxis:{tickangle:-45, automargin:true},
    yaxis:{title:"Units"},
    height: chartHeight("brandMonthlyStacked")
  }, {responsive:true});
}

function drawBrandRevenueBar(items, monthsActive){
  const rows = summariseByBrand(items, monthsActive).slice(0,15);
  Plotly.newPlot("brandRevenueBar", [{
    type:"bar",
    x: rows.map(r=>r.brand),
    y: rows.map(r=>r.revenue),
    marker:{color: rows.map((r,i)=>brandColour(r.brand,i))},
    hovertemplate:"<b>%{x}</b><br>£%{y:,.0f}<extra></extra>"
  }], {
    ...baseLayout,
    title:"Estimated Revenue by Brand (Top 15, ex VAT)",
    xaxis:{automargin:true},
    yaxis:{title:"£ ex VAT"},
    height: chartHeight("brandRevenueBar")
  }, {responsive:true});
}

function drawBrandTop10OrderShare(items, monthsActive){
  const rows = summariseByBrand(items, monthsActive).filter(r=>r.units>0).sort((a,b)=> b.units - a.units).slice(0,10);
  Plotly.newPlot("brandTop10OrderShare", [{
    type:"pie",
    labels: rows.map(r=>r.brand),
    values: rows.map(r=>r.units),
    hole:0.45,
    textinfo:"label+percent",
    marker:{colors: rows.map((r,i)=>brandColour(r.brand,i))}
  }], {
    ...baseLayout,
    title:"Top 10 Brands (Order Share, Units)",
    height: chartHeight("brandTop10OrderShare")
  }, {responsive:true});
}

function drawBrandTop10RevenueShare(items, monthsActive){
  const rows = summariseByBrand(items, monthsActive).filter(r=>r.revenue>0).sort((a,b)=> b.revenue - a.revenue).slice(0,10);
  Plotly.newPlot("brandTop10RevenueShare", [{
    type:"pie",
    labels: rows.map(r=>r.brand),
    values: rows.map(r=>r.revenue),
    hole:0.45,
    textinfo:"label+percent",
    marker:{colors: rows.map((r,i)=>brandColour(r.brand,i))}
  }], {
    ...baseLayout,
    title:"Top 10 Brands (Revenue Share, ex VAT)",
    height: chartHeight("brandTop10RevenueShare")
  }, {responsive:true});
}

function drawSkuRevenueTop(items, monthsActive){
  const withRevenue = items.map(d=>{
    const rev = sum(monthsActive.map(m => d.monthsRevenue[m]));
    return { label: `${d.stockCode} | ${d.description}`, brand: d.brand, revenue: rev };
  }).filter(x => Number.isFinite(x.revenue) && x.revenue > 0);

  const top = withRevenue.sort((a,b)=> b.revenue - a.revenue).slice(0,100);

  Plotly.newPlot("skuRevenueTop", [{
    type:"bar",
    x: top.map(t=>t.label),
    y: top.map(t=>t.revenue),
    marker:{color: top.map((t,i)=>brandColour(t.brand,i))},
    hovertemplate:"£%{y:,.0f}<extra></extra>"
  }], {
    ...baseLayout,
    title:"Top 100 SKUs by Estimated Revenue (ex VAT)",
    xaxis:{automargin:true, showticklabels:false},
    yaxis:{title:"£ ex VAT"},
    height: chartHeight("skuRevenueTop")
  }, {responsive:true});
}

/* SKU Focus: only for 1 to 5 matches */
function truncatedMonthsForSku(d){
  const months = monthColumns.map(m=>m.name);
  let last = -1;
  for (let i = months.length - 1; i >= 0; i--){
    const u = d.months[months[i]];
    const r = d.monthsRevenue[months[i]];
    if ((Number.isFinite(u) && u > 0) || (Number.isFinite(r) && r > 0)) { last = i; break; }
  }
  return months.slice(0, last >= 0 ? last + 1 : 0);
}

function drawSkuFocusTrend(skus){
  const unitTraces = [];
  const revTraces = [];

  skus.forEach((d,i)=>{
    const months = truncatedMonthsForSku(d);
    const units  = months.map(m => Number.isFinite(d.months[m]) ? d.months[m] : 0);
    const revs   = months.map(m => Number.isFinite(d.monthsRevenue[m]) ? d.monthsRevenue[m] : 0);

    unitTraces.push({
      type:"bar",
      name:`${d.stockCode} Units`,
      x:months,
      y:units,
      marker:{color: brandColour(d.brand,i)}
    });

    revTraces.push({
      type:"scatter",
      mode:"lines+markers",
      name:`£ Revenue ${d.stockCode}`,
      x:months,
      y:revs,
      yaxis:"y2"
    });
  });

  Plotly.newPlot("skuFocusTrend", [...unitTraces, ...revTraces], {
    ...baseLayout,
    title: skus.length === 1 ? `SKU Monthly Units and Revenue: ${skus[0].stockCode}` : "Selected SKUs: Monthly Units and Revenue",
    xaxis:{tickangle:-45, automargin:true},
    yaxis:{title:"Units"},
    yaxis2:{title:"£ ex VAT", overlaying:"y", side:"right"},
    barmode: skus.length > 1 ? "group" : "stack",
    height: chartHeight("skuFocusTrend")
  }, {responsive:true});
}

/* ========= Invoice table ========= */
function renderInvoiceTable(items){
  const tbody = document.querySelector("#invoiceTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const brandValue = document.getElementById("brandFilter").value;
  const limited = !brandValue;
  const rows = limited ? items.slice(0, 400) : items;

  rows.forEach(d=>{
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

  const noteEl = document.querySelector(".table-card .note");
  if (noteEl){
    noteEl.textContent = limited
      ? "Showing the first 400 SKUs that match your current search/filters. Select a Brand to see all matches."
      : "Showing all SKUs that match your current search/filters.";
  }
}

/* ========= Render ========= */
function refresh(){
  const itemsAgg = baseItemsForAggregates();
  const itemsSearch = itemsWithSearch();
  const monthsActive = activeMonths();

  // Units per Month: follows search when present
  const hasSearch = document.getElementById("search").value.trim().length > 0;
  const itemsForUnits = hasSearch ? itemsSearch : itemsAgg;

  const uSeriesUnits = unitsSeries(itemsForUnits, monthsActive);
  const rSeries = revenueSeries(itemsAgg, monthsActive);

  // YoY series use same scope as their base charts
  const prevU = prevUnitsSeries(itemsForUnits, monthsActive);
  const prevR = prevRevenueSeries(itemsAgg, monthsActive);

  // KPIs
  setText("kpiTotalSkus", itemsAgg.length.toLocaleString("en-GB"));
  setText("kpiStockValue", fmtGBP(sum(itemsAgg.map(d=>d.stockValue))));
  setText("kpiYtdRevenue", fmtGBP(sum(rSeries.perMonth)));
  const combinedSales = sum(itemsAgg.map(d=>d.combinedSales));
  setText("kpiSalesCombined", Number.isFinite(combinedSales) ? combinedSales.toLocaleString("en-GB") : "–");
  const revLabel = document.getElementById("kpiRevenueLabel");
  if (revLabel) revLabel.textContent = "Est. revenue (ex VAT)";

  // Always visible charts
  drawUnitsTrend(uSeriesUnits);
  drawRevenueTrend(rSeries);
  drawYoYUnits(uSeriesUnits, prevU);
  drawYoYRevenue(rSeries, prevR);
  drawBrandMonthlyStacked(itemsAgg);
  drawSkuRevenueTop(itemsAgg, monthsActive);

  // Hide comparative brand charts when brand OR search is active
  const brandValue = document.getElementById("brandFilter").value;
  const hideComparative = !!brandValue || hasSearch;

  setVisible("brandRevShareFab4Card",      !hideComparative);
  setVisible("brandTotalsBarCard",         !hideComparative);
  setVisible("brandRevenueBarCard",        !hideComparative);
  setVisible("brandTop10OrderShareCard",   !hideComparative);
  setVisible("brandTop10RevenueShareCard", !hideComparative);

  if (!hideComparative){
    drawBrandRevShareFab4(itemsAgg, rSeries);
    drawBrandTotalsBar(itemsAgg, monthsActive);
    drawBrandRevenueBar(itemsAgg, monthsActive);
    drawBrandTop10OrderShare(itemsAgg, monthsActive);
    drawBrandTop10RevenueShare(itemsAgg, monthsActive);
  } else {
    safeClear("brandRevShareFab4");
    safeClear("brandTotalsBar");
    safeClear("brandRevenueBar");
    safeClear("brandTop10OrderShare");
    safeClear("brandTop10RevenueShare");
  }

  // SKU focus
  const q = document.getElementById("search").value.trim();
  const matches = itemsSearch;
  const focus = q && matches.length > 0 && matches.length <= 5;

  if (focus) drawSkuFocusTrend(matches);
  else safeClear("skuFocusTrend");

  // Single-SKU detail
  const detail = document.getElementById("skuDetail");
  if (q && matches.length === 1){
    const d = matches[0];
    if (detail) detail.hidden = false;
    setText("skuDetailTitle", `SKU Details: ${d.stockCode}`);
    setText("dSku", d.stockCode || "–");
    setText("dDesc", d.description || "–");
    setText("dBrand", d.brand || "–");
    setText("dSub", d.subCategory || "–");
    setText("dInv", fmtDateUK(d.lastInvoice));
  } else {
    if (detail) detail.hidden = true;
  }

  renderInvoiceTable(matches);
}

/* ========= Events ========= */
document.getElementById("file").addEventListener("change", e=>{
  const f = e.target.files[0];
  if (f) loadFromFile(f);
});

document.getElementById("loadSample").addEventListener("click", ()=>{
  if(!BUILT_IN_CSV){
    alert("Set BUILT_IN_CSV in app.js, or use Choose CSV.");
    return;
  }
  loadFromPath(BUILT_IN_CSV);
});

["search","brandFilter","sortBy"].forEach(id=>{
  document.getElementById(id).addEventListener("input", debounce(refresh, 150));
});

document.getElementById("periodMode").addEventListener("input", ()=>{
  const mSel = document.getElementById("monthSelect");
  if (getPeriodMode() === "Month") mSel.style.display = "inline-block";
  else mSel.style.display = "none";
  refresh();
});

document.getElementById("monthSelect").addEventListener("input", debounce(refresh, 150));
