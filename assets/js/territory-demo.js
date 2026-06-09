/* ============================================================
   Territory Intelligence — interactive demo (self-contained)
   Generic B2B revenue map on a REAL map (Leaflet + CARTO dark
   basemap, lazy-loaded on first open; no API key). Sample data
   only — no real/proprietary data or branding.
   ============================================================ */
(function () {
  "use strict";

  var STATUS = ["Customer", "SQL", "Prospect", "Churned"];
  var STATUS_COLOR = { Customer: "#3DC6CE", SQL: "#F2C879", Prospect: "#F2778C", Churned: "#B79CFF" };
  var REP_COLORS = ["#D9F77B", "#6FD3E6", "#B79CFF", "#F2C879", "#F58CA6"];
  var REP_NAMES  = ["A. Rivera", "M. Chen", "L. Okafor", "S. Dubois", "K. Nakamura"];
  var GAP = "#FF7A7A";
  var K = 5, N = 88, STALE = 90;
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;
  var LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  var LEAFLET_JS  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
  var TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  // [lat, lng] per city
  var REGIONS = {
    "EMEA": { view: [48, 9], zoom: 4, cities: [["London",51.51,-0.12],["Paris",48.85,2.35],["Berlin",52.52,13.4],["Madrid",40.42,-3.7],["Milan",45.46,9.19],["Amsterdam",52.37,4.9],["Dublin",53.35,-6.26],["Munich",48.14,11.58],["Vienna",48.21,16.37],["Zurich",47.37,8.54],["Oslo",59.91,10.75],["Lisbon",38.72,-9.14]] },
    "N. America": { view: [40, -96], zoom: 4, cities: [["New York",40.71,-74.0],["Chicago",41.88,-87.63],["Toronto",43.65,-79.38],["Austin",30.27,-97.74],["Denver",39.74,-104.99],["Boston",42.36,-71.06],["Seattle",47.61,-122.33],["Miami",25.76,-80.19],["Atlanta",33.75,-84.39],["Dallas",32.78,-96.8],["Vancouver",49.28,-123.12],["San Diego",32.72,-117.16]] },
    "APAC": { view: [8, 128], zoom: 3, cities: [["Tokyo",35.68,139.69],["Sydney",-33.87,151.21],["Singapore",1.35,103.82],["Seoul",37.57,126.98],["Melbourne",-37.81,144.96],["Osaka",34.69,135.5],["Auckland",-36.85,174.76],["Bangkok",13.76,100.5],["Taipei",25.03,121.57],["Mumbai",19.08,72.88],["Jakarta",-6.2,106.85],["Manila",14.6,120.98]] }
  };
  var SEEDS = { "EMEA": 101, "N. America": 202, "APAC": 303 };
  var PREFIX = ["Northwind","Atlas","Vertex","Summit","Cobalt","Meridian","Lumen","Beacon","Apex","Cedar","Harbor","Orbit","Pioneer","Keystone","Nimbus","Granite"];
  var SUFFIX = ["Systems","Logistics","Software","Group","Labs","Industries","Partners","Networks","Retail","Capital","Robotics","Health"];
  var SEG = ["Enterprise", "Mid-market", "SMB"];
  var STAGES = ["Discovery", "Qualification", "Proposal", "Negotiation", "Contracting"];
  var NEXT = ["Discovery call", "Product demo", "QBR", "Renewal review", "Pricing review", "Exec sync", "Onboarding kickoff", "Check-in"];
  var SE_NAMES = ["T. Alvarez", "P. Novak", "R. Haddad", "J. Kim", "B. Costa"];
  var CSM_NAMES = ["D. Flynn", "N. Roy", "E. Brandt", "Y. Sato", "C. Mbeki"];

  function rng(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function pick(r, arr) { return arr[(r() * arr.length) | 0]; }
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  var state = {
    region: null, accounts: [], hubs: [], colorBy: "status",
    filters: { Customer: true, SQL: true, Prospect: true, Churned: true },
    isolateRep: -1, selected: null, q: "",
    mode: "explore", route: [], insightsOpen: false, showGaps: false
  };
  var built = false, mapReady = false, overlay, modal, mapDiv, map;
  var hullLayer, gapLayer, markerLayer, routeLayer, numLayer, hubLayer;
  var panelBody, kpiWrap, searchInput, rebBtn, routeBtn, insBtn, loadEl, lastFocus = null;

  /* ---- geo helpers (planar approx at regional scale) ----- */
  function d2(a, b) { var dlat = a.lat - b.lat, dlng = (a.lng - b.lng) * Math.cos(a.lat * Math.PI / 180); return dlat * dlat + dlng * dlng; }
  function km(a, b) { return map ? map.distance([a.lat, a.lng], [b.lat, b.lng]) / 1000 : Math.sqrt(d2(a, b)) * 111; }
  function nearestHubKm(a) { var m = 1e9; state.hubs.forEach(function (h) { m = Math.min(m, km(a, h)); }); return m; }

  /* ---- data ---------------------------------------------- */
  function genRegion(name) {
    var r = rng(SEEDS[name]), cities = REGIONS[name].cities, i;
    var accts = [];
    for (i = 0; i < N; i++) {
      var c = pick(r, cities);
      var lat = c[1] + (r() + r() + r() - 1.5) * 1.7;
      var lng = c[2] + (r() + r() + r() - 1.5) * 2.4;
      var s = r(), status = s < 0.45 ? "Customer" : s < 0.6 ? "SQL" : s < 0.9 ? "Prospect" : "Churned";
      var base = status === "Customer" ? 120 + r() * 780 : status === "SQL" ? 80 + r() * 420 : status === "Prospect" ? 20 + r() * 180 : r() * 90;
      accts.push({
        lat: lat, lng: lng, value: Math.round(base),
        name: pick(r, PREFIX) + " " + pick(r, SUFFIX), city: c[0],
        status: status, seg: pick(r, SEG), rep: 0,
        lastSeen: 1 + Math.floor(r() * 150),
        nextSubj: r() < 0.82 ? pick(r, NEXT) : null, nextIn: 1 + Math.floor(r() * 28),
        oppStage: status === "SQL" ? pick(r, STAGES) : null, oppDays: 3 + Math.floor(r() * 80),
        se: pick(r, SE_NAMES), csm: pick(r, CSM_NAMES), m: null
      });
    }
    // hubs: 5 spread cities
    var hubs = [], step = Math.max(1, Math.floor(cities.length / K));
    for (i = 0; i < K; i++) { var cc = cities[(i * step) % cities.length]; hubs.push({ lat: cc[1], lng: cc[2] }); }
    state.region = name; state.accounts = accts; state.hubs = hubs;
    state.isolateRep = -1; state.selected = null; state.q = ""; state.route = [];
    assign();
  }
  function assign() {
    state.accounts.forEach(function (a) {
      var best = 0, bd = 1e9;
      state.hubs.forEach(function (h, i) { var d = d2(a, h); if (d < bd) { bd = d; best = i; } });
      a.rep = best;
    });
  }
  function rebalanceStep() {
    var sums = state.hubs.map(function () { return { lat: 0, lng: 0, n: 0 }; });
    state.accounts.forEach(function (a) { var s = sums[a.rep]; s.lat += a.lat; s.lng += a.lng; s.n++; });
    state.hubs.forEach(function (h, i) { if (sums[i].n) { h.lat = sums[i].lat / sums[i].n; h.lng = sums[i].lng / sums[i].n; } });
    assign();
  }
  function isShown(a) {
    if (!state.filters[a.status]) return false;
    if (state.q && a.name.toLowerCase().indexOf(state.q) === -1) return false;
    return true;
  }

  /* ---- convex hull (lng=x, lat=y) ------------------------ */
  function hull(pts) {
    if (pts.length < 3) return pts.map(function (p) { return [p.lat, p.lng]; });
    var p = pts.slice().sort(function (a, b) { return a.lng - b.lng || a.lat - b.lat; });
    function cr(o, a, b) { return (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng); }
    var lo = [], up = [], i;
    for (i = 0; i < p.length; i++) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p[i]) <= 0) lo.pop(); lo.push(p[i]); }
    for (i = p.length - 1; i >= 0; i--) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p[i]) <= 0) up.pop(); up.push(p[i]); }
    lo.pop(); up.pop();
    var h = lo.concat(up), cla = 0, cln = 0;
    h.forEach(function (q) { cla += q.lat; cln += q.lng; }); cla /= h.length; cln /= h.length;
    return h.map(function (q) { return [cla + (q.lat - cla) * 1.15, cln + (q.lng - cln) * 1.15]; });
  }

  /* ---- metrics + intelligence ---------------------------- */
  function metrics() {
    var shown = state.accounts.filter(isShown), pipe = 0, cust = 0, sql = 0, counts = [0, 0, 0, 0, 0], tot = 0;
    shown.forEach(function (a) { pipe += a.value; if (a.status === "Customer") cust++; if (a.status === "SQL") sql++; counts[a.rep]++; tot += km(a, state.hubs[a.rep]); });
    var avg = shown.length ? tot / shown.length : 0;
    return { shown: shown.length, pipe: pipe, cust: cust, sql: sql, coverage: Math.max(0, Math.min(99, Math.round(100 - avg / 14))), spread: Math.max.apply(null, counts) - Math.min.apply(null, counts) };
  }
  function statusCounts() { var c = { Customer: 0, SQL: 0, Prospect: 0, Churned: 0 }; state.accounts.forEach(function (a) { c[a.status]++; }); return c; }
  function intel() {
    var rep = REP_NAMES.map(function () { return { count: 0, pipe: 0 }; });
    var stale = 0, whitespace = 0, atRisk = 0, pipe = 0, sql = 0;
    state.accounts.forEach(function (a) {
      rep[a.rep].count++; rep[a.rep].pipe += a.value; pipe += a.value;
      if (a.lastSeen > STALE) stale++;
      if (a.status === "SQL") sql++;
      if (a.status === "Prospect" && nearestHubKm(a) > 350) whitespace++;
      if (a.status === "Churned" || (a.status === "Customer" && a.lastSeen > STALE)) atRisk++;
    });
    var maxI = 0, minI = 0;
    rep.forEach(function (rr, i) { if (rr.count > rep[maxI].count) maxI = i; if (rr.count < rep[minI].count) minI = i; });
    var maxCount = Math.max.apply(null, rep.map(function (rr) { return rr.count; }));
    var insights = [], diff = rep[maxI].count - rep[minI].count;
    if (diff >= 4) insights.push(["load", REP_NAMES[maxI] + " carries " + rep[maxI].count + " accounts vs " + REP_NAMES[minI] + "'s " + rep[minI].count + ". Rebalancing could shift ~" + Math.floor(diff / 2) + " to even the load."]);
    else insights.push(["load", "Territories are well balanced — load spread is just " + diff + " accounts."]);
    if (stale > 0) insights.push(["stale", stale + " accounts haven't been touched in " + STALE + "+ days — worth a coverage sweep."]);
    if (whitespace > 0) insights.push(["space", whitespace + " prospects sit 350km+ from the nearest rep — white space to route into."]);
    insights.push(["pipe", "$" + (pipe / 1000).toFixed(1) + "M pipeline + ARR across " + state.region + ", " + sql + " open SQLs."]);
    if (atRisk > 0) insights.push(["risk", atRisk + " accounts at risk (churned, or customers quiet 90+ days)."]);
    return { rep: rep, maxCount: maxCount, stale: stale, whitespace: whitespace, insights: insights };
  }

  /* ---- route --------------------------------------------- */
  function routeKm() { var d = 0; for (var i = 1; i < state.route.length; i++) d += km(state.route[i - 1], state.route[i]); return d; }
  function toggleStop(a) { var i = state.route.indexOf(a); if (i === -1) state.route.push(a); else state.route.splice(i, 1); }
  function optimizeRoute() {
    if (state.route.length < 3) return;
    var rem = state.route.slice(1), ord = [state.route[0]], cur = state.route[0];
    while (rem.length) { var bi = 0, bd = 1e9; rem.forEach(function (a, i) { var d = d2(cur, a); if (d < bd) { bd = d; bi = i; } }); cur = rem.splice(bi, 1)[0]; ord.push(cur); }
    state.route = ord;
  }

  /* ---- leaflet loader ------------------------------------ */
  function ensureLeaflet(cb) {
    if (window.L) return cb();
    if (!document.querySelector('link[data-leaflet]')) {
      var css = document.createElement("link"); css.rel = "stylesheet"; css.href = LEAFLET_CSS; css.setAttribute("data-leaflet", "1"); document.head.appendChild(css);
    }
    var js = document.createElement("script"); js.src = LEAFLET_JS; js.async = true;
    js.onload = function () { cb(); };
    js.onerror = function () { if (loadEl) loadEl.textContent = "Couldn't load the map library (offline?). Try again later."; };
    document.head.appendChild(js);
  }

  /* ---- build modal --------------------------------------- */
  function build() {
    overlay = el("div", "td-overlay"); overlay.setAttribute("aria-hidden", "true");
    modal = el("div", "td-modal"); modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Territory Intelligence — interactive demo");

    var head = el("div", "td-head");
    var ttl = el("div", "td-head__titles");
    ttl.innerHTML = '<p class="td-head__eyebrow mono">Interactive demo · sample data</p><h3 class="td-head__title">Territory Intelligence</h3>';
    var close = el("button", "td-close"); close.setAttribute("aria-label", "Close demo"); close.innerHTML = "&times;";
    close.addEventListener("click", closeModal);
    head.appendChild(ttl); head.appendChild(close);

    var bar = el("div", "td-bar");
    var regWrap = el("div", "td-seg");
    Object.keys(REGIONS).forEach(function (name, i) {
      var b = el("button", "td-seg__btn"); b.textContent = name; if (i === 0) b.classList.add("is-on");
      b.addEventListener("click", function () {
        regWrap.querySelectorAll(".td-seg__btn").forEach(function (x) { x.classList.remove("is-on"); });
        b.classList.add("is-on"); genRegion(name);
        if (mapReady) { createMarkers(); map.setView(REGIONS[name].view, REGIONS[name].zoom); }
        if (searchInput) searchInput.value = ""; syncButtons(); render(); renderPanel();
      });
      regWrap.appendChild(b);
    });
    var colWrap = el("div", "td-seg");
    [["status", "By status"], ["territory", "By territory"]].forEach(function (v, i) {
      var b = el("button", "td-seg__btn"); b.textContent = v[1]; if (i === 0) b.classList.add("is-on");
      b.addEventListener("click", function () {
        colWrap.querySelectorAll(".td-seg__btn").forEach(function (x) { x.classList.remove("is-on"); });
        b.classList.add("is-on"); state.colorBy = v[0]; syncButtons(); render(); renderPanel();
      });
      colWrap.appendChild(b);
    });
    var search = el("div", "td-search");
    searchInput = el("input"); searchInput.type = "search"; searchInput.placeholder = "Search…"; searchInput.setAttribute("aria-label", "Search accounts");
    searchInput.addEventListener("input", function () { state.q = searchInput.value.trim().toLowerCase(); render(); updateKpis(); });
    search.appendChild(searchInput);

    var acts = el("div", "td-acts");
    routeBtn = el("button", "td-act"); routeBtn.innerHTML = "<span>Route</span>";
    routeBtn.addEventListener("click", function () { state.mode = state.mode === "route" ? "explore" : "route"; if (state.mode === "route") { state.selected = null; state.insightsOpen = false; } syncButtons(); render(); renderPanel(); });
    insBtn = el("button", "td-act"); insBtn.innerHTML = "<span>Intelligence</span>";
    insBtn.addEventListener("click", function () { state.insightsOpen = !state.insightsOpen; if (state.insightsOpen) state.selected = null; syncButtons(); renderPanel(); });
    rebBtn = el("button", "td-act"); rebBtn.innerHTML = "<span>Rebalance</span>"; rebBtn.style.display = "none";
    rebBtn.addEventListener("click", function () { rebalanceStep(); render(); renderPanel(); });
    acts.appendChild(routeBtn); acts.appendChild(insBtn); acts.appendChild(rebBtn);

    bar.appendChild(regWrap); bar.appendChild(colWrap); bar.appendChild(search); bar.appendChild(acts);

    var stage = el("div", "td-stage");
    var mapWrap = el("div", "td-map");
    mapDiv = el("div", "td-leaflet");
    loadEl = el("div", "td-loading"); loadEl.innerHTML = '<span class="mono">Loading map…</span>';
    mapWrap.appendChild(mapDiv); mapWrap.appendChild(loadEl);

    var panel = el("div", "td-panel");
    kpiWrap = el("div", "td-kpis"); panelBody = el("div", "td-panel__body");
    panel.appendChild(kpiWrap); panel.appendChild(panelBody);
    stage.appendChild(mapWrap); stage.appendChild(panel);

    var foot = el("p", "td-foot mono");
    foot.textContent = "Sample data on a live map — colours accounts by status or rep territory, builds routes, and surfaces coverage intelligence. Click a marker for detail.";

    modal.appendChild(head); modal.appendChild(bar); modal.appendChild(stage); modal.appendChild(foot);
    overlay.appendChild(modal); document.body.appendChild(overlay);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });
    built = true;
  }

  function syncButtons() {
    rebBtn.style.display = state.colorBy === "territory" ? "" : "none";
    routeBtn.classList.toggle("is-on", state.mode === "route");
    routeBtn.querySelector("span").textContent = state.route.length ? ("Route · " + state.route.length) : "Route";
    insBtn.classList.toggle("is-on", state.insightsOpen);
  }

  /* ---- map init + markers -------------------------------- */
  function initMap() {
    var L = window.L;
    map = L.map(mapDiv, { zoomControl: true, attributionControl: true, scrollWheelZoom: true, worldCopyJump: true });
    map.setView(REGIONS[state.region].view, REGIONS[state.region].zoom);
    L.tileLayer(TILES, { subdomains: "abc", maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    ["hulls", "gaps", "markers", "route", "hubs", "nums"].forEach(function (p, i) { map.createPane(p); map.getPane(p).style.zIndex = 410 + i * 10; });
    hullLayer = L.layerGroup().addTo(map); gapLayer = L.layerGroup().addTo(map);
    markerLayer = L.layerGroup().addTo(map); routeLayer = L.layerGroup().addTo(map);
    hubLayer = L.layerGroup().addTo(map); numLayer = L.layerGroup().addTo(map);
    map.on("click", function () { if (state.selected) { state.selected = null; render(); renderPanel(); } });
    mapReady = true;
    createMarkers();
    if (loadEl) loadEl.style.display = "none";
  }

  function createMarkers() {
    var L = window.L;
    markerLayer.clearLayers();
    state.accounts.forEach(function (a) {
      var m = L.circleMarker([a.lat, a.lng], { pane: "markers", radius: 6, weight: 0, fillOpacity: 0.9, color: "#fff", fillColor: STATUS_COLOR[a.status] });
      m.bindTooltip("", { direction: "top", offset: [0, -2], className: "td-ltip", opacity: 1 });
      m.on("mouseover", function () { m.setTooltipContent(tipHtml(a)); });
      m.on("click", function (e) {
        if (e.originalEvent) L.DomEvent.stopPropagation(e);
        if (state.mode === "route") { toggleStop(a); syncButtons(); render(); renderPanel(); }
        else { state.selected = a; state.insightsOpen = false; syncButtons(); render(); renderPanel(); }
      });
      markerLayer.addLayer(m); a.m = m;
    });
  }

  /* ---- render -------------------------------------------- */
  function render() {
    if (!mapReady) return;
    var L = window.L, terr = state.colorBy === "territory";

    hullLayer.clearLayers();
    if (terr) {
      for (var i = 0; i < K; i++) {
        var pts = state.accounts.filter(function (a) { return a.rep === i && isShown(a); });
        if (pts.length >= 3) {
          var dim = state.isolateRep !== -1 && state.isolateRep !== i;
          L.polygon(hull(pts), { pane: "hulls", color: REP_COLORS[i], weight: 1, fill: true, fillColor: REP_COLORS[i], fillOpacity: dim ? 0.03 : 0.10, opacity: dim ? 0.15 : 0.5, interactive: false }).addTo(hullLayer);
        }
      }
    }

    gapLayer.clearLayers();
    if (state.showGaps) {
      state.accounts.forEach(function (a) {
        if (a.lastSeen > STALE && isShown(a)) L.circleMarker([a.lat, a.lng], { pane: "gaps", radius: 11, weight: 1.3, color: GAP, fill: false, dashArray: "2 2", opacity: 0.85, interactive: false }).addTo(gapLayer);
      });
    }

    state.accounts.forEach(function (a) {
      var m = a.m; if (!m) return;
      var shown = isShown(a);
      if (!shown) { m.setStyle({ fillOpacity: 0.06, opacity: 0.06, weight: 0, radius: 4 }); return; }
      var inRoute = state.route.indexOf(a) !== -1, sel = a === state.selected;
      var color = terr ? REP_COLORS[a.rep] : STATUS_COLOR[a.status];
      var fo = 0.9; if (terr && state.isolateRep !== -1 && state.isolateRep !== a.rep) fo = 0.14;
      m.setStyle({ fillColor: color, fillOpacity: fo, radius: (sel || inRoute) ? 9 : 6, weight: (sel || inRoute) ? 2 : 0, color: "#FFFFFF", opacity: 1 });
      if (sel || inRoute) m.bringToFront();
    });

    routeLayer.clearLayers(); numLayer.clearLayers();
    if (state.route.length) {
      if (state.route.length > 1) L.polyline(state.route.map(function (a) { return [a.lat, a.lng]; }), { pane: "route", color: "#D9F77B", weight: 2.5, dashArray: "6 5", opacity: 0.9, interactive: false }).addTo(routeLayer);
      state.route.forEach(function (a, i) {
        L.marker([a.lat, a.lng], { pane: "nums", interactive: false, icon: L.divIcon({ className: "td-numicon", html: String(i + 1), iconSize: [20, 20] }) }).addTo(numLayer);
      });
    }

    hubLayer.clearLayers();
    if (terr) {
      state.hubs.forEach(function (h, i) {
        var dim = state.isolateRep !== -1 && state.isolateRep !== i;
        L.circleMarker([h.lat, h.lng], { pane: "hubs", radius: 7, weight: 2.5, color: "#0A0A0A", fillColor: REP_COLORS[i], fillOpacity: dim ? 0.3 : 1, opacity: dim ? 0.3 : 1, interactive: false }).addTo(hubLayer);
      });
    }
    updateKpis();
  }

  /* ---- KPIs ---------------------------------------------- */
  function kpi(val, label) { var c = el("div", "td-kpi"); var v = el("p", "td-kpi__val"); v.innerHTML = val; var l = el("p", "td-kpi__lbl mono"); l.textContent = label; c.appendChild(v); c.appendChild(l); return c; }
  function updateKpis() {
    var m = metrics(); kpiWrap.innerHTML = "";
    kpiWrap.appendChild(kpi(String(m.shown), "Accounts shown"));
    kpiWrap.appendChild(kpi('<span class="td-kpi__pre">$</span>' + (m.pipe / 1000).toFixed(1) + '<span class="td-kpi__unit">M</span>', "Pipeline + ARR"));
    if (state.colorBy === "territory") { kpiWrap.appendChild(kpi(m.coverage + '<span class="td-kpi__unit">%</span>', "Coverage score")); kpiWrap.appendChild(kpi("±" + m.spread, "Load spread")); }
    else { kpiWrap.appendChild(kpi(String(m.cust), "Customers")); kpiWrap.appendChild(kpi(String(m.sql), "Open SQLs")); }
  }

  /* ---- panel --------------------------------------------- */
  function renderPanel() { panelBody.innerHTML = ""; if (state.insightsOpen) return renderInsights(); if (state.mode === "route") return renderRoute(); if (state.selected) return renderDetail(state.selected); renderDefault(); }
  function label(txt) { var p = el("p", "td-sec__label mono"); p.textContent = txt; return p; }

  function renderDefault() {
    var fSec = el("div", "td-sec"); fSec.appendChild(label("Filter by status"));
    var counts = statusCounts();
    STATUS.forEach(function (s) {
      var row = el("button", "td-filter" + (state.filters[s] ? " is-on" : ""));
      row.innerHTML = '<span class="td-filter__box"></span><span class="td-filter__dot" style="background:' + STATUS_COLOR[s] + '"></span><span class="td-filter__name">' + s + '</span><span class="td-filter__n mono">' + counts[s] + '</span>';
      row.addEventListener("click", function () { state.filters[s] = !state.filters[s]; render(); renderPanel(); });
      fSec.appendChild(row);
    });
    panelBody.appendChild(fSec);
    if (state.colorBy === "territory") {
      var lSec = el("div", "td-sec"); lSec.appendChild(label("Reps — click to isolate"));
      var c2 = [0, 0, 0, 0, 0]; state.accounts.forEach(function (a) { if (isShown(a)) c2[a.rep]++; });
      REP_NAMES.forEach(function (nm, i) {
        var row = el("button", "td-rep" + (state.isolateRep === i ? " is-on" : ""));
        row.innerHTML = '<span class="td-rep__sw" style="background:' + REP_COLORS[i] + '"></span><span class="td-rep__name">' + nm + '</span><span class="td-rep__n mono">' + c2[i] + '</span>';
        row.addEventListener("click", function () { state.isolateRep = state.isolateRep === i ? -1 : i; render(); renderPanel(); });
        lSec.appendChild(row);
      });
      panelBody.appendChild(lSec);
    }
  }

  function renderDetail(a) {
    var back = el("button", "td-back"); back.innerHTML = "&larr; Back"; back.addEventListener("click", function () { state.selected = null; render(); renderPanel(); });
    panelBody.appendChild(back);
    var hero = el("div", "td-detail__hero");
    hero.innerHTML = '<span class="td-badge" style="--c:' + STATUS_COLOR[a.status] + '">' + a.status + '</span><h4 class="td-detail__name">' + a.name + '</h4><p class="td-detail__city mono">' + a.city + ' · ' + a.seg + '</p>';
    panelBody.appendChild(hero);
    var rows = [["Pipeline / ARR", "$" + a.value + "k"], ["Owner", '<span class="td-dotmini" style="background:' + REP_COLORS[a.rep] + '"></span>' + REP_NAMES[a.rep]], ["Last touch", a.lastSeen + " days ago" + (a.lastSeen > STALE ? ' <span class="td-flag">stale</span>' : "")], ["Next activity", a.nextSubj ? (a.nextSubj + " · in " + a.nextIn + "d") : "—"]];
    if (a.status === "SQL") rows.push(["Opportunity", a.oppStage + " · " + a.oppDays + "d in stage"]);
    var fl = el("div", "td-fields");
    rows.forEach(function (r) { var row = el("div", "td-field"); row.innerHTML = '<span class="td-field__k mono">' + r[0] + '</span><span class="td-field__v">' + r[1] + '</span>'; fl.appendChild(row); });
    panelBody.appendChild(fl);
    var team = [{ role: "AE", name: REP_NAMES[a.rep] }, { role: "SE", name: a.se }];
    if (a.status === "Customer") team.push({ role: "CSM", name: a.csm });
    var tSec = el("div", "td-sec"); tSec.appendChild(label("Account team"));
    team.forEach(function (m) { var row = el("div", "td-team"); var ini = m.name.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase(); row.innerHTML = '<span class="td-team__av">' + ini + '</span><span class="td-team__name">' + m.name + '</span><span class="td-team__role mono">' + m.role + '</span>'; tSec.appendChild(row); });
    panelBody.appendChild(tSec);
    var add = el("button", "td-addstop"); add.textContent = (state.route.indexOf(a) === -1 ? "+ Add to route" : "✓ In route — remove");
    add.addEventListener("click", function () { toggleStop(a); syncButtons(); render(); renderDetail(a); });
    panelBody.appendChild(add);
  }

  function renderRoute() {
    var h = el("div", "td-sec"); h.appendChild(label("Route builder"));
    var hint = el("p", "td-routehint"); hint.textContent = "Click accounts on the map to add stops in order."; h.appendChild(hint); panelBody.appendChild(h);
    if (!state.route.length) { var em = el("p", "td-empty"); em.textContent = "No stops yet."; panelBody.appendChild(em); return; }
    var list = el("div", "td-stops");
    state.route.forEach(function (a, i) {
      var row = el("div", "td-stop");
      row.innerHTML = '<span class="td-stop__n">' + (i + 1) + '</span><span class="td-stop__name">' + a.name + '<span class="td-stop__city mono">' + a.city + '</span></span>';
      var rm = el("button", "td-stop__rm"); rm.setAttribute("aria-label", "Remove stop"); rm.innerHTML = "&times;";
      rm.addEventListener("click", function () { toggleStop(a); syncButtons(); render(); renderRoute(); });
      row.appendChild(rm); list.appendChild(row);
    });
    panelBody.appendChild(list);
    var foot = el("div", "td-route__foot");
    foot.innerHTML = '<span class="mono">' + state.route.length + ' stops · ~' + Math.round(routeKm()) + ' km</span>';
    var btns = el("div", "td-route__btns");
    var opt = el("button", "td-mini"); opt.textContent = "Optimize order"; opt.addEventListener("click", function () { optimizeRoute(); render(); renderRoute(); });
    var clr = el("button", "td-mini td-mini--ghost"); clr.textContent = "Clear"; clr.addEventListener("click", function () { state.route = []; syncButtons(); render(); renderRoute(); });
    btns.appendChild(opt); btns.appendChild(clr); foot.appendChild(btns); panelBody.appendChild(foot);
  }

  function renderInsights() {
    var d = intel();
    var h = el("div", "td-sec"); h.appendChild(label("Territory intelligence")); panelBody.appendChild(h);
    var bars = el("div", "td-bars");
    d.rep.forEach(function (rr, i) {
      var row = el("div", "td-barrow"); var w = d.maxCount ? Math.round(rr.count / d.maxCount * 100) : 0;
      row.innerHTML = '<span class="td-barrow__name"><span class="td-dotmini" style="background:' + REP_COLORS[i] + '"></span>' + REP_NAMES[i] + '</span><span class="td-barrow__track"><span class="td-barrow__fill" style="width:' + w + '%;background:' + REP_COLORS[i] + '"></span></span><span class="td-barrow__v mono">' + rr.count + ' · $' + (rr.pipe / 1000).toFixed(1) + 'M</span>';
      bars.appendChild(row);
    });
    panelBody.appendChild(bars);
    var iSec = el("div", "td-sec"); iSec.appendChild(label("What the map is telling you"));
    d.insights.forEach(function (ins) { var card = el("div", "td-insight td-insight--" + ins[0]); card.innerHTML = '<span class="td-insight__dot"></span><span>' + ins[1] + '</span>'; iSec.appendChild(card); });
    panelBody.appendChild(iSec);
    var gap = el("button", "td-mini" + (state.showGaps ? " is-on" : "")); gap.textContent = state.showGaps ? "Hide coverage gaps" : "Highlight coverage gaps on map";
    gap.addEventListener("click", function () { state.showGaps = !state.showGaps; render(); renderInsights(); });
    panelBody.appendChild(gap);
  }

  function tipHtml(a) {
    return '<strong>' + a.name + '</strong><span class="td-tip__row"><span style="color:' + STATUS_COLOR[a.status] + '">' + a.status + '</span><span>$' + a.value + 'k</span></span><span class="td-tip__city">' + a.city + ' · ' + REP_NAMES[a.rep] + '</span>';
  }

  /* ---- open / close -------------------------------------- */
  function openModal() {
    if (!built) build();
    if (!state.region) genRegion("EMEA");
    lastFocus = document.activeElement;
    overlay.classList.add("is-open"); overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    var c = modal.querySelector(".td-close"); if (c) c.focus();
    var fixSize = function () { if (map) { map.invalidateSize(); map.setView(REGIONS[state.region].view, REGIONS[state.region].zoom); } };
    if (!mapReady) {
      ensureLeaflet(function () {
        initMap(); syncButtons(); render(); renderPanel();
        setTimeout(fixSize, 80); setTimeout(fixSize, 450);
      });
    } else {
      setTimeout(fixSize, 80); setTimeout(fixSize, 450);
    }
  }
  function closeModal() {
    overlay.classList.remove("is-open"); overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function onKey(e) { if (e.key === "Escape") closeModal(); }

  document.querySelectorAll('[data-demo="territory"]').forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); openModal(); });
  });
})();
