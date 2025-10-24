/* ========= Configuration ========= */
const BUILT_IN_CSV = "SEPTCLER 1.csv"; // set "" to disable auto-load

/* ========= Brand normalisation & colours ========= */
const normKey = s => String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"");

// Treat these tokens as non-brands ("Other")
const NOT_BRAND_KEYS = new Set([
  "0","305","356","407","40","ew","g","gh","ing","ion","jo","o","p","s","son","tsadhesives",
  "utomotive","Â","Ã","commandtm","crescentr","irwinjack","irwinrecord","irwinviseg","irwinhilmor",
  "lth","mc","numaticmc"
]);

// Canonical brand map (key = normKey(raw) → value = Canonical Brand)
// Built from your full list.
const BRAND_ALIASES = {
  "3inone":"3-IN-ONE","3m":"3M","xms":"XMS",

  "abracs":"Abracs","abru":"Abru","abus":"ABUS","abusmechanical":"ABUS","acer":"Acer","advent":"Advent",
  "aerosol":"Aerosol","airmaster":"Airmaster","alm":"ALM","almmanufacturi":"ALM","amazon":"Amazon",
  "amblers":"Amblers","amblerssafety":"Amblers Safety","americanline":"American Line","antex":"Antex",
  "apache":"Apache","apex":"Apex","apple":"Apple","araldite":"Araldite","arctichayes":"Arctic Hayes",
  "armogard":"Armorgard","arrow":"Arrow",

  "bahco":"Bahco","bailey":"Bailey","bakers":"Bakers","baridi":"Baridi","barron":"BARRON","batavia":"Batavia",
  "beagriease":"BE AGRIEase","beacon":"Beacon","beal":"Beal","beats":"Beats","beeswift":"Beeswift",
  "belle":"Belle","bessey":"Bessey","beta":"Beta","bigwipes":"Big Wipes","blackdecker":"Black & Decker",
  "blackedge":"Blackedge","blackfriar":"Blackfriar","bluecol":"BLUECOL","bluespot":"BlueSpot Tools","boa":"BOA",
  "bolle":"Bollé","bollesafety":"Bollé","bondit":"Bond It","bondloc":"Bondloc",
  "bosch":"Bosch","boschacc":"Bosch","bosh":"Bosch","bostik":"Bostik","bostitch":"Bostitch",
  "bpcfixings":"BPC Fixings","brand":"Other","brennenstuhl":"Brennenstuhl","britoolexpert":"Britool Expert",
  "britool":"Britool Expert","briwax":"Briwax","brk":"BRK","broadfix":"Broadfix","buckbootz":"BuckBootz",
  "buckler":"Buckler Boots","bucklerboots":"Buckler Boots","bulldog":"Bulldog","byron":"Byron",

  "cablequick":"CableQuick","campingaz":"Campingaz","carplan":"CarPlan","carriage":"Carriage","carver":"Carver",
  "cascamite":"Cascamite","castle":"Castle","castleclothing":"Castle Clothing","caterpillar":"Caterpillar",
  "champion":"Champion","channellock":"Channellock","class":"Class","coleman":"Coleman","collection":"Collection",
  "command":"Command","concept":"Concept","copydex":"Copydex","coreplus":"Coreplus","cox":"COX","crescent":"Crescent",
  "crescentnichol":"Crescent Nicholson","crescentwiss":"Crescent Wiss","ct1":"CT1","ctie":"CT1","cuprinol":"Cuprinol",
  "curver":"Curver",

  "dart":"DART","decosol":"Decosol","defender":"Defender","dellonda":"Dellonda","denso":"Denso","denver":"Denver",
  "detavimark":"Deta Vimark","dewalt":"DeWalt","dewaltdrywall":"DeWalt","dewaltrespirat":"DeWalt",
  "dewaltacc":"DeWalt","dewaltmc":"DeWalt","dickies":"Dickies","dimplex":"Dimplex","disston":"Disston","dmt":"DMT",
  "doff":"DOFF","dormer":"Dormer","dowsil":"Dowsil","draper":"Draper","dunlop":"Dunlop","duotool":"DUOTOOL",
  "duracell":"Duracell","duratool":"Duratool",

  "emagnets":"E-Magnets","earlex":"Earlex","ecoflow":"EcoFlow","edgepoint":"EdgePoint","edma":"Edma",
  "einhell":"Einhell","elora":"Elora","energizer":"Energizer","estwing":"Estwing","everbuild":"Everbuild",
  "eveready":"Eveready","evostik":"Evo-Stik","evolution":"Evolution","evolutionpower":"Evolution","excel":"Excel",
  "expert":"Expert",

  "fmprducts":"F M Products","facom":"Facom","faithfull":"Faithfull","faithfullpower":"Faithfull Power","fein":"FEIN",
  "festool":"Festool","fireangel":"FireAngel","firmahold":"firmaHold","firstalert":"First Alert","fischer":"Fischer",
  "fisco":"Fisco","fisher":"Fisher","fiskars":"Fiskars","flexpower":"Flex Power Tools","flexpowertool":"Flex Power Tools",
  "flexipads":"Flexipads","flexipadsworld":"Flexipads","flexovit":"Flexovit","flopro":"Flopro","flowtech":"Flowtech",
  "fluxite":"Fluxite","footprint":"Footprint","forefix":"Forefix","forge":"Forge","forgefix":"ForgeFix","fort":"Fort",
  "freud":"Freud","frysmetals":"Frys Metals",

  "gardman":"Gardman","garryson":"Garryson","gedore":"Gedore","gerber":"Gerber","gopro":"GoPro","gorilla":"Gorilla",
  "gorillaglue":"Gorilla Glue","grabo":"Grabo","grampianpackag":"Grampian Packaging","gripit":"Gripit","gys":"GYS",
  "gys001":"GYS",

  "halls":"Halls","hammerite":"Hammerite","hanson":"Hanson","hardyakka":"Hard Yakka","harris":"Harris",
  "harrisonclou":"Harrison & Clough","hellyhansen":"Helly Hansen","henrysquire":"Henry Squire","hikoki":"HiKOKI",
  "hitachi":"HiKOKI","hills":"Hills","hmt":"HMT","holemakertechn":"HMT","holzmann":"Holzmann","hotspot":"Hotspot",
  "hozelock":"Hozelock","hultafors":"Hultafors","husqvarna":"Husqvarna","hyundai":"Hyundai",

  "illbruck":"illbruck","imex":"Imex","india":"India","irwin":"Irwin","itlinsulated":"ITL Insulated",

  "jcb":"JCB","jcpfixings":"JCP Fixings","jeaton":"Jeaton","jefferson":"Jefferson","jeyes":"Jeyes","jokari":"Jokari",
  "jsp":"JSP","jubilee":"Jubilee","just1source":"Just 1 Source","justonesource":"Just 1 Source",

  "kane":"KANE","karcher":"Karcher","kent":"Kent","kandestowe":"Kent & Stowe","kentstowe":"Kent & Stowe","keter":"Keter",
  "kew":"Kärcher (Nilfisk Alt.)","kewnilfiskalt":"Kew Nilfisk Alto","kidde":"Kidde","kielder":"Kielder","kilrock":"Kilrock",
  "knipex":"Knipex","kodak":"Kodak","komelon":"Komelon","kunys":"Kuny's","kwb":"KWB",

  "laserliner":"Laserliner","ledlenser":"Ledlenser","leica":"Leica","leicageosystem":"Leica Geosystems","lenovo":"Lenovo",
  "lenox":"Lenox","lessmann":"Lessmann","lg":"LG","liberon":"Liberon","lighthouse":"Lighthouse","lindab":"Lindab",
  "lindstrom":"Lindstrom","link2home":"Link2Home","littlegiant":"Little Giant","llitools":"Lli Tools","loctite":"Loctite",
  "logik":"Logik","loncin":"Loncin","lufkin":"Lufkin","lumag":"Lumag","lumatic":"Lumatic","lyte":"Lyte",

  "maglite":"Maglite","makita":"Makita","makitaacc":"Makita","makitamc":"Makita","mapei":"Mapei","marcrist":"Marcrist",
  "marigold":"Marigold","markal":"Markal","marshalltown":"Marshalltown","martinpricefa":"Martin Price Fasteners",
  "marxman":"Marxman","master":"Master","masterlock":"Master Lock","masterplug":"Masterplug","matabi":"Matabi","maun":"Maun",
  "medikit":"Medikit","melco":"Melco","meridianlighti":"Meridian Lighting","metabo":"Metabo","metalmate":"Metalmate",
  "microsoft":"Microsoft","milwaukee":"Milwaukee","miscellaneous":"Other","moldex":"Moldex","monument":"Monument",
  "moorewright":"Moore & Wright","multisharp":"Multi-Sharp","multicore":"Multicore",

  "ndurance":"N-Durance","nailfixings":"Nails & Fixings","nailsfixings":"Nails & Fixings","nilfisk":"Nilfisk",
  "nilfiskalto":"Nilfisk","nintendo":"Nintendo","nitromors":"Nitromors","norbar":"Norbar","nortonclipper":"Norton Clipper",
  "nullifire":"Nullifire","numatic":"Numatic","nws":"NWS",

  "oakey":"Oakey","ology":"OLOGY","olympia":"Olympia","olympiatools":"Olympia Tools","owlett":"Owlett",
  "owlettjaton":"Owlett-Jaton","owletts":"Owlett",

  "panasonic":"Panasonic","parweld":"Parweld","paslode":"Paslode","paslodescrews":"Paslode","permex":"Permex",
  "personna":"Personna","peststop":"Pest-Stop","plasplugs":"Plasplugs","plastikote":"PlastiKote","plus":"Plus",
  "plusgas":"PlusGas","polycell":"Polycell","polyvine":"Polyvine","portanails":"Porta-Nails","portwest":"Portwest",
  "pramac":"Pramac","predator":"Predator","premierdiamond":"Premier Diamond","priory":"Priory","products":"Other",
  "pumasafety":"Puma Safety","purdy":"Purdy","python":"Python",

  "qmax":"Q.Max",

  "rst":"R.S.T.","raaco":"Raaco","ragni":"Ragni","rapid":"Rapid","rawl":"Rawlplug","rawlplug":"Rawlplug",
  "realdeals":"RealDeals","recoil":"Recoil","record":"Record","recordpower":"Record Power","red":"Red Gorilla",
  "redgorilla":"Red Gorilla","rentokil":"Rentokil","repesco":"Repesco","resapol":"Resapol","rhino":"Rhino","ridgid":"RIDGID",
  "ring":"Ring","rocol":"ROCOL","rohm":"Röhm","ronseal":"Ronseal","rotabroach":"Rotabroach","rothenberger":"Rothenberger",
  "roughneck":"Roughneck","rus":"RUS","rustins":"Rustins","ryobi":"Ryobi",

  "sadolin":"Sadolin","samsung":"Samsung","scjohnsonprof":"SC Johnson Professional","scan":"Scan","scheppach":"Scheppach",
  "schneider":"Schneider","screwix":"Screwix","scruffs":"Scruffs","sealey":"Sealey","sellotape":"Sellotape","senco":"Senco",
  "sharpie":"Sharpie","shurtape":"Shurtape","sia":"SIA","siaabrasives":"Sia Abrasives","sievert":"Sievert",
  "sikkens":"Sikkens","silversteel":"Silver Steel","silverhook":"Silverhook","sip":"SIP","smj":"SMJ","snail":"Snail",
  "solvite":"Solvite","sparky":"Sparky","spax":"SPAX","spectre":"Spectre","squire":"Squire","stabila":"Stabila",
  "stahlwille":"Stahlwille","stanley":"Stanley","stanleyclothing":"Stanley","stanleyintelli":"Stanley",
  "stanleyspares":"Stanley","stanleytools":"Stanley","starrett":"Starrett","steeple":"Steeple","steinel":"Steinel",
  "stencils":"Stencils","sterimax":"Sterimax","stf":"STF","stihl":"Stihl","stiletto":"Stiletto","sumup":"SumUp",
  "swarfega":"Swarfega","sylglas":"Sylglas",

  "tacwise":"Tacwise","tbdavies":"TB Davies","tb":"TB","teng":"Teng Tools","tengtools":"Teng Tools","terma":"Terma",
  "terry":"Terry","testo":"Testo","tetrionfillers":"Tetrion","thor":"Thor","thorsman":"Thorsman","timberlandpro":"Timberland Pro",
  "timco":"TIMco","toolbank":"Toolbank","toolden":"Toolden","toolmaster":"Toolmaster","tools":"Other","toshiba":"Toshiba",
  "toughbuilt":"ToughBuilt","toupret":"Toupret","towncountry":"Town & Country","traffi":"TRAFFI","tremco":"TREMCO",
  "trend":"Trend","triflow":"Tri-Flow","triton":"Triton","trollull":"Trollull","tuffstuff":"Tuffstuff","turtlewax":"Turtle Wax",
  "tuw":"TUW","tygris":"TYGRIS","tyrgris":"TYGRIS",

  "ucare":"U-Care","uhook":"U-Hook","upol":"U-POL","ultracompact":"Ultra Compact","unicom":"Uni-Com","unibond":"Unibond",
  "unifix":"Unifix","union":"Union",

  "vanguard":"Van Guard","vanvault":"Van Vault","vaughan":"Vaughan","velcrobrand":"VELCRO Brand","victorinox":"Victorinox",
  "vileda":"Vileda","vitax":"Vitax","vitrex":"Vitrex",

  "wagner":"Wagner","walsall":"Walsall","wanbo":"Wanbo","wd40":"WD-40","weller":"Weller","wera":"Wera","werner":"Werner",
  "wesco":"Wesco","wetjet":"WetJet","wiha":"Wiha","witte":"Witte",

  "yale":"Yale","yalelocks":"Yale","youngman":"Youngman","zarges":"Zarges","zenithprofin":"Zenith Profin","zinsser":"Zinsser",
  "zipper":"Zipper"
};

function canonicalBrand(name){
  const k = normKey(name);
  if (!k || NOT_BRAND_KEYS.has(k)) return "Other";
  return BRAND_ALIASES[k] || (name ? String(name).trim() : "Other");
}

const brandColours = {
  "Milwaukee": "#d0021b","DeWalt": "#ffd000","Makita": "#00a19b","Bosch": "#1f6feb","HiKOKI": "#0b8457",
  "Everbuild": "#ff8c00","N-Durance": "#7d5cff","Metabo":"#136f63","Festool":"#2b8a3e","Stanley":"#ffeb3b",
  "Irwin":"#005eb8","ABUS":"#0aa55b","Makita":"#00a19b"
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

/* ========= Header helpers ========= */
function synthesiseHeader(rows){
  const depth = rows.length, width = Math.max(...rows.map(r=>r.length));
  const out=[];
  for(let c=0;c<width;c++){
    const parts=[]; for(let r=0;r<depth;r++){ const cell=(rows[r]||[])[c]||""; const s=String(cell).replace(/\r/g,"").trim(); if(s) parts.push(s); }
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

/* ========= Hydrate from raw SEPTCLER ========= */
function hydrate(arrayRows){
  const headerRows=3;
  const headersRaw = arrayRows.slice(0, headerRows);
  headers = synthesiseHeader(headersRaw);
  const body = arrayRows.slice(headerRows).filter(r => r && r.some(c => String(c).trim() !== ""));

  // Primary mapping
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
    salePriceExVat:  idx("Sale Price Ex Vat") !== -1 ? idx("Sale Price Ex Vat") : findHeaderIndex(["sale","price","ex","vat"]),
    onlinePriceExVat: findHeaderIndex(["online","price","ex","vat"])
  };

  // Current-year months strictly: Aug..Jul
  const monthsList = ["Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul"];
  monthColumns = monthsList.map(m => ({name:m, index: (H[m] ?? -1)})).filter(m => m.index >= 0);

  // Build dataset rows
  data = body.map(r=>{
    const salePrice  = headerMap.salePriceExVat>=0 ? toNumber(r[headerMap.salePriceExVat]) : NaN;
    const onlinePrice= headerMap.onlinePriceExVat>=0 ? toNumber(r[headerMap.onlinePriceExVat]) : NaN;
    const priceBasis = Number.isFinite(salePrice) && salePrice>0 ? salePrice :
                       (Number.isFinite(onlinePrice) && onlinePrice>0 ? onlinePrice : NaN);

    const months={}, monthsRevenue={};
    monthColumns.forEach(({name,index})=>{
      const units = toNumber(r[index]);
      months[name] = units;
      monthsRevenue[name] = (Number.isFinite(units) && Number.isFinite(priceBasis)) ? (units * priceBasis) : NaN;
    });

    const brandRaw = headerMap.brand>=0 ? String(r[headerMap.brand]??"").trim() : "";
    const brand = canonicalBrand(brandRaw); // merged brand

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
      priceBasis,
      internetSales,
      ebaySales,
      combinedSales: (Number.isFinite(internetSales)?internetSales:0) + (Number.isFinite(ebaySales)?ebaySales:0),
      lastInvoice:   headerMap.lastInvoice>=0 ? r[headerMap.lastInvoice] : ""
    };
  });

  populateFilters();
  refresh();
}

/* ========= Filtering ========= */
function uniqueSorted(arr){ return [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b)); }

// Global items for dashboards (ignore free-text search), ONLY normalised brands (exclude "Other")
function baseItemsForAggregates(){
  const br  = document.getElementById("brandFilter").value;
  return data.filter(d=>{
    const okBrand = d.brand && d.brand !== "Other"; // only normalised brands
    if (!okBrand) return false;
    if (br  && d.brand !== br) return false;
    return true;
  });
}

// Items with search (for SKU detail/table); allow all brands so search remains complete
function itemsWithSearch(){
  const q   = document.getElementById("search").value.trim().toLowerCase();
  const br  = document.getElementById("brandFilter").value;
  return data.filter(d=>{
    // Respect brand filter (but still excludes "Other" if user chose a brand)
    if (br && d.brand !== br) return false;
    if (q){
      const hay=(d.description+" "+d.stockCode).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function populateFilters(){
  const brandSel = document.getElementById("brandFilter");
  brandSel.length = 1;
  // Only canonical brands (exclude "Other")
  uniqueSorted(data.map(d=>d.brand).filter(b=>b && b!=="Other")).forEach(v=> brandSel.add(new Option(v, v)));
}

/* ========= Sorting ========= */
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
    const key = d.brand || "Other";
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
      b.months[name] += Number.isFinite(r)? r : 0;
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
  })).filter(r=> r.brand !== "Other"); // exclude "Other" from brand summaries
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

  // Estimated YTD revenue
  const revAgg = revenueSeries(itemsAgg);
  const ytdRevenue = sum(revAgg.perMonth);

  setText("kpiTotalSkus", Number.isFinite(totalSkus) ? totalSkus.toLocaleString("en-GB") : "–");
  setText("kpiStockValue", fmtGBP(stockValue));
  setText("kpiYtdRevenue", fmtGBP(ytdRevenue));
  setText("kpiAvgProfit", Number.isFinite(avgProfit) ? `${avgProfit.toFixed(1)}%` : "–");
  setText("kpiSalesCombined", Number.isFinite(combinedSales) ? combinedSales.toLocaleString("en-GB") : "–");

  // Global charts
  drawSalesRevenueTrend(itemsAgg, revAgg);
  drawBrandRevShareFab4(itemsAgg);
  drawBrandTotalsBar(itemsAgg);
  drawBrandMonthlyStacked(itemsAgg);
  drawBrandRevenueBar(itemsAgg);
  drawBrandTop10OrderShare(itemsAgg);
  drawBrandTop10RevenueShare(itemsAgg);
  drawSkuRevenueTop(itemsAgg);

  // SKU focus area (appears on 1–5 matches)
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

// Top 10 Brands — Order Share (Internet + eBay units)
function drawBrandTop10OrderShare(items){
  const rows = summariseByBrand(items)
    .filter(r => Number.isFinite(r.combinedSales) && r.combinedSales > 0)
    .sort((a,b)=> b.combinedSales - a.combinedSales)
    .slice(0,10);

  Plotly.newPlot("brandTop10OrderShare",[{
    type:"pie",
    labels: rows.map(r=>r.brand),
    values: rows.map(r=>r.combinedSales),
    hole: 0.45,
    textinfo:"label+percent",
    marker:{colors: rows.map((r,i)=>brandColour(r.brand,i))}
  }],{
    ...baseLayout,
    title:"Top 10 Brands — Order Share (Internet + eBay units)"
  },{responsive:true});
}

// Top 10 Brands — Revenue Share (ex VAT)
function drawBrandTop10RevenueShare(items){
  const rows = summariseByBrand(items)
    .filter(r => Number.isFinite(r.revenue) && r.revenue > 0)
    .sort((a,b)=> b.revenue - a.revenue)
    .slice(0,10);

  Plotly.newPlot("brandTop10RevenueShare",[{
    type:"pie",
    labels: rows.map(r=>r.brand),
    values: rows.map(r=>r.revenue),
    hole: 0.45,
    textinfo:"label+percent",
    marker:{colors: rows.map((r,i)=>brandColour(r.brand,i))}
  }],{
    ...baseLayout,
    title:"Top 10 Brands — Revenue Share (ex VAT)"
  },{responsive:true});
}

function drawSkuRevenueTop(items){
  const months = monthColumns.map(m=>m.name);
  const withRevenue = items.map(d=>({
    sku: `${d.stockCode} — ${d.description}`,
    brand: d.brand,
    revenue: sum(months.map(m=>d.monthsRevenue[m])),
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

    unitTraces.push({
      type:"bar",
      name:`${d.stockCode} — Units`,
      x:months,
      y:units,
      marker:{color: brandColour(d.brand,i)}
    });

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
["search","brandFilter","sortBy"].forEach(id=>{
  document.getElementById(id).addEventListener("input", debounce(refresh,150));
});
