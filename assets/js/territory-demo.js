/* ============================================================
   Territory Intelligence — interactive demo (self-contained)
   Sample data only. Plots clinic accounts, assigns each to the
   nearest rep hub to form territories, and lets you re-optimize.
   No external data, no dependencies.
   ============================================================ */
(function () {
  "use strict";

  var REP_COLORS = ["#D9F77B", "#6FD3E6", "#B79CFF", "#F2C879", "#F58CA6"];
  var REP_NAMES  = ["A. Rivera", "M. Chen", "L. Okafor", "S. Dubois", "K. Nakamura"];
  var GAP_COLOR  = "#FF7A7A";
  var W = 600, H = 440, K = 5, N = 84;
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

  var REGIONS = {
    "EMEA":        { seed: 101, cities: ["London","Paris","Berlin","Madrid","Milan","Amsterdam","Dublin","Lisbon","Munich","Vienna","Zurich","Oslo"] },
    "N. America":  { seed: 202, cities: ["New York","Chicago","Toronto","Austin","Denver","Boston","Seattle","Miami","Atlanta","Dallas","Vancouver","San Diego"] },
    "APAC":        { seed: 303, cities: ["Tokyo","Sydney","Singapore","Seoul","Melbourne","Osaka","Auckland","Bangkok","Taipei","Mumbai","Jakarta","Manila"] }
  };
  var CLINIC = ["Bright Smile","Clear Aligners","Cityview Dental","Harbor Orthodontics","Summit Dental","Lumino Dental","NorthStar Ortho","Pearl Dental","Meridian Smiles","Apex Orthodontics","Riverside Dental","Crown & Co","Evergreen Dental","Smile Studio","Helix Orthodontics","Cedar Dental"];
  var SEG = ["Enterprise","Mid-market","SMB"];

  function rng(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function svg(tag) { return document.createElementNS("http://www.w3.org/2000/svg", tag); }

  var state = { region: null, accounts: [], hubs: [], view: "owner", isolate: -1, rebalances: 0 };
  var built = false, overlay, modal, svgEl, gHull, gDot, gHub, tip, kpiEls = {}, legendEl, lastFocus = null;

  /* ---- data ---------------------------------------------- */
  function genRegion(name) {
    var r = rng(REGIONS[name].seed), cities = REGIONS[name].cities, centers = [], i;
    for (i = 0; i < 6; i++) centers.push({ x: 70 + r() * 460, y: 55 + r() * 330 });
    var accts = [];
    for (i = 0; i < N; i++) {
      var c = centers[(r() * centers.length) | 0];
      var x = clamp(c.x + (r() + r() + r() - 1.5) * 78, 26, W - 26);
      var y = clamp(c.y + (r() + r() + r() - 1.5) * 58, 26, H - 26);
      accts.push({
        x: x, y: y,
        value: 40 + Math.floor(r() * 860),
        name: CLINIC[(r() * CLINIC.length) | 0],
        city: cities[(r() * cities.length) | 0],
        seg: SEG[r() < 0.38 ? 0 : r() < 0.75 ? 1 : 2],
        visit: 1 + Math.floor(r() * 84),
        rep: 0, el: null
      });
    }
    var hubs = [{ x: 140, y: 120 }, { x: 460, y: 120 }, { x: 300, y: 225 }, { x: 150, y: 330 }, { x: 450, y: 330 }]
      .map(function (h) { return { x: h.x, y: h.y, el: null }; });
    state.region = name; state.accounts = accts; state.hubs = hubs; state.isolate = -1; state.rebalances = 0;
    assign();
  }
  function assign() {
    state.accounts.forEach(function (a) {
      var best = 0, bd = 1e9;
      state.hubs.forEach(function (h, i) { var dx = a.x - h.x, dy = a.y - h.y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } });
      a.rep = best;
    });
  }
  function rebalanceStep() {
    var sums = state.hubs.map(function () { return { x: 0, y: 0, n: 0 }; });
    state.accounts.forEach(function (a) { var s = sums[a.rep]; s.x += a.x; s.y += a.y; s.n++; });
    state.hubs.forEach(function (h, i) { if (sums[i].n) { h.x = sums[i].x / sums[i].n; h.y = sums[i].y / sums[i].n; } });
    assign(); state.rebalances++;
  }
  function dist(a, h) { var dx = a.x - h.x, dy = a.y - h.y; return Math.sqrt(dx * dx + dy * dy); }

  /* ---- geometry: convex hull (monotone chain) ------------ */
  function hull(pts) {
    if (pts.length < 3) return pts.slice();
    var p = pts.slice().sort(function (a, b) { return a.x - b.x || a.y - b.y; });
    function cross(o, a, b) { return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x); }
    var lo = [], up = [], i;
    for (i = 0; i < p.length; i++) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p[i]) <= 0) lo.pop(); lo.push(p[i]); }
    for (i = p.length - 1; i >= 0; i--) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p[i]) <= 0) up.pop(); up.push(p[i]); }
    lo.pop(); up.pop();
    var h = lo.concat(up);
    // expand slightly around centroid so dots sit inside the territory
    var cx = 0, cy = 0; h.forEach(function (q) { cx += q.x; cy += q.y; }); cx /= h.length; cy /= h.length;
    return h.map(function (q) { return { x: cx + (q.x - cx) * 1.12, y: cy + (q.y - cy) * 1.12 }; });
  }

  /* ---- metrics ------------------------------------------- */
  function metrics() {
    var counts = [0, 0, 0, 0, 0], pipe = 0, totDist = 0;
    state.accounts.forEach(function (a) { counts[a.rep]++; pipe += a.value; totDist += dist(a, state.hubs[a.rep]); });
    var avg = totDist / state.accounts.length;
    var coverage = clamp(Math.round(100 - avg / 1.7), 0, 99);
    var spread = Math.max.apply(null, counts) - Math.min.apply(null, counts);
    return { counts: counts, pipe: pipe, coverage: coverage, spread: spread };
  }

  /* ---- DOM build ----------------------------------------- */
  function build() {
    overlay = el("div", "td-overlay"); overlay.setAttribute("aria-hidden", "true");
    modal = el("div", "td-modal"); modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Territory Intelligence — interactive demo");

    // header
    var head = el("div", "td-head");
    var ttl = el("div", "td-head__titles");
    ttl.innerHTML = '<p class="td-head__eyebrow mono">Interactive demo · sample data</p><h3 class="td-head__title">Territory Intelligence</h3>';
    var close = el("button", "td-close"); close.setAttribute("aria-label", "Close demo"); close.innerHTML = "&times;";
    close.addEventListener("click", closeModal);
    head.appendChild(ttl); head.appendChild(close);

    // toolbar
    var bar = el("div", "td-bar");
    var regWrap = el("div", "td-seg"); regWrap.setAttribute("role", "tablist"); regWrap.setAttribute("aria-label", "Region");
    Object.keys(REGIONS).forEach(function (name, i) {
      var b = el("button", "td-seg__btn"); b.textContent = name; b.dataset.region = name;
      if (i === 0) b.classList.add("is-on");
      b.addEventListener("click", function () { setRegion(name, regWrap, b); });
      regWrap.appendChild(b);
    });
    var viewWrap = el("div", "td-seg td-seg--view"); viewWrap.setAttribute("aria-label", "View");
    [["owner", "Owner"], ["opportunity", "Opportunity"], ["coverage", "Coverage gaps"]].forEach(function (v, i) {
      var b = el("button", "td-seg__btn"); b.textContent = v[1]; b.dataset.view = v[0];
      if (i === 0) b.classList.add("is-on");
      b.addEventListener("click", function () {
        viewWrap.querySelectorAll(".td-seg__btn").forEach(function (x) { x.classList.remove("is-on"); });
        b.classList.add("is-on"); state.view = v[0]; render();
      });
      viewWrap.appendChild(b);
    });
    var reb = el("button", "td-reb"); reb.innerHTML = "<span>Rebalance territories</span>";
    reb.addEventListener("click", function () { rebalanceStep(); render(true); });
    bar.appendChild(regWrap); bar.appendChild(viewWrap); bar.appendChild(reb);

    // stage: map + panel
    var stage = el("div", "td-stage");
    var mapWrap = el("div", "td-map");
    svgEl = svg("svg"); svgEl.setAttribute("viewBox", "0 0 " + W + " " + H);
    svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet"); svgEl.classList.add("td-svg");
    var defs = svg("defs");
    var pat = svg("pattern"); pat.setAttribute("id", "tdgrid"); pat.setAttribute("width", "30"); pat.setAttribute("height", "30"); pat.setAttribute("patternUnits", "userSpaceOnUse");
    var pp = svg("path"); pp.setAttribute("d", "M30 0H0V30"); pp.setAttribute("fill", "none"); pp.setAttribute("stroke", "rgba(255,255,255,.05)"); pp.setAttribute("stroke-width", "1");
    pat.appendChild(pp); defs.appendChild(pat);
    svgEl.appendChild(defs);
    var bg = svg("rect"); bg.setAttribute("width", W); bg.setAttribute("height", H); bg.setAttribute("fill", "url(#tdgrid)");
    svgEl.appendChild(bg);
    gHull = svg("g"); gDot = svg("g"); gHub = svg("g");
    svgEl.appendChild(gHull); svgEl.appendChild(gDot); svgEl.appendChild(gHub);
    mapWrap.appendChild(svgEl);
    tip = el("div", "td-tip"); mapWrap.appendChild(tip);

    var panel = el("div", "td-panel");
    var kpis = el("div", "td-kpis");
    [["accounts", "Accounts"], ["pipe", "Pipeline"], ["coverage", "Coverage"], ["spread", "Load spread"]].forEach(function (k) {
      var c = el("div", "td-kpi");
      var v = el("p", "td-kpi__val"); var l = el("p", "td-kpi__lbl mono"); l.textContent = k[1];
      c.appendChild(v); c.appendChild(l); kpis.appendChild(c); kpiEls[k[0]] = v;
    });
    legendEl = el("div", "td-legend");
    panel.appendChild(kpis); panel.appendChild(legendEl);

    stage.appendChild(mapWrap); stage.appendChild(panel);

    var foot = el("p", "td-foot mono");
    foot.textContent = "Sample data — illustrates how the live tool clusters accounts into territories by coverage. Click a rep to isolate · drag the dataset with Rebalance.";

    modal.appendChild(head); modal.appendChild(bar); modal.appendChild(stage); modal.appendChild(foot);
    overlay.appendChild(modal); document.body.appendChild(overlay);

    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });
    built = true;
  }

  function setRegion(name, wrap, btn) {
    wrap.querySelectorAll(".td-seg__btn").forEach(function (x) { x.classList.remove("is-on"); });
    btn.classList.add("is-on");
    genRegion(name); buildScene(); render();
  }

  /* ---- scene: create persistent dot + hub elements ------- */
  function buildScene() {
    gHull.innerHTML = ""; gDot.innerHTML = ""; gHub.innerHTML = "";
    state.accounts.forEach(function (a) {
      var c = svg("circle"); c.setAttribute("cx", a.x.toFixed(1)); c.setAttribute("cy", a.y.toFixed(1));
      c.setAttribute("r", "4"); c.classList.add("td-dot");
      c.addEventListener("pointerover", function (e) { showTip(e, a); });
      c.addEventListener("pointermove", function (e) { moveTip(e); });
      c.addEventListener("pointerout", hideTip);
      c.addEventListener("click", function (e) { showTip(e, a); });
      gDot.appendChild(c); a.el = c;
    });
    state.hubs.forEach(function (h, i) {
      var g = svg("g"); g.classList.add("td-hub");
      var ring = svg("circle"); ring.setAttribute("r", "11"); ring.setAttribute("class", "td-hub__ring");
      var dot = svg("circle"); dot.setAttribute("r", "5"); dot.setAttribute("fill", REP_COLORS[i]); dot.setAttribute("class", "td-hub__dot");
      g.appendChild(ring); g.appendChild(dot);
      gHub.appendChild(g); h.el = g;
    });
  }

  /* ---- render -------------------------------------------- */
  function render(animate) {
    // territory hulls
    gHull.innerHTML = "";
    for (var i = 0; i < K; i++) {
      var pts = state.accounts.filter(function (a) { return a.rep === i; });
      var dim = state.isolate !== -1 && state.isolate !== i;
      if (pts.length >= 3) {
        var hp = hull(pts);
        var poly = svg("polygon");
        poly.setAttribute("points", hp.map(function (q) { return q.x.toFixed(1) + "," + q.y.toFixed(1); }).join(" "));
        poly.setAttribute("class", "td-hull");
        poly.setAttribute("fill", REP_COLORS[i]);
        poly.setAttribute("stroke", REP_COLORS[i]);
        poly.style.opacity = dim ? 0.04 : 0.10;
        gHull.appendChild(poly);
      }
    }
    // dots
    state.accounts.forEach(function (a) {
      var c = a.el, color = REP_COLORS[a.rep], r = 4, op = 0.92, dim = state.isolate !== -1 && state.isolate !== a.rep;
      if (state.view === "opportunity") { r = 3 + (a.value / 900) * 7; op = 0.85; }
      else if (state.view === "coverage") {
        var d = dist(a, state.hubs[a.rep]);
        if (d > 96) { color = GAP_COLOR; r = 5.5; op = 0.95; }
        else { r = 3.4; op = 0.5; }
      }
      c.setAttribute("fill", color);
      c.setAttribute("r", r.toFixed(1));
      c.style.opacity = dim ? 0.1 : op;
    });
    // hubs
    state.hubs.forEach(function (h, i) {
      var dim = state.isolate !== -1 && state.isolate !== i;
      if (!reduce && animate) h.el.style.transition = "transform .6s cubic-bezier(.2,.65,.2,1)";
      else h.el.style.transition = "none";
      h.el.style.transform = "translate(" + h.x.toFixed(1) + "px," + h.y.toFixed(1) + "px)";
      h.el.style.opacity = dim ? 0.25 : 1;
      h.el.querySelector(".td-hub__ring").setAttribute("stroke", REP_COLORS[i]);
    });
    updatePanel();
  }

  function updatePanel() {
    var m = metrics();
    kpiEls.accounts.textContent = state.accounts.length;
    kpiEls.pipe.innerHTML = '<span class="td-kpi__pre">$</span>' + (m.pipe / 1000).toFixed(1) + '<span class="td-kpi__unit">M</span>';
    kpiEls.coverage.innerHTML = m.coverage + '<span class="td-kpi__unit">%</span>';
    kpiEls.spread.innerHTML = '±' + m.spread;
    // legend
    legendEl.innerHTML = "";
    REP_NAMES.forEach(function (name, i) {
      var b = el("button", "td-rep" + (state.isolate === i ? " is-on" : ""));
      b.innerHTML = '<span class="td-rep__sw" style="background:' + REP_COLORS[i] + '"></span>' +
        '<span class="td-rep__name">' + name + '</span>' +
        '<span class="td-rep__n mono">' + m.counts[i] + '</span>';
      b.addEventListener("click", function () { state.isolate = state.isolate === i ? -1 : i; render(); });
      legendEl.appendChild(b);
    });
  }

  /* ---- tooltip ------------------------------------------- */
  function showTip(e, a) {
    tip.innerHTML = '<strong>' + a.name + '</strong><span class="td-tip__city">' + a.city + '</span>' +
      '<span class="td-tip__row"><span>' + a.seg + '</span><span>$' + a.value + 'k</span></span>' +
      '<span class="td-tip__row"><span style="color:' + REP_COLORS[a.rep] + '">' + REP_NAMES[a.rep] + '</span><span>seen ' + a.visit + 'd ago</span></span>';
    tip.classList.add("is-on"); moveTip(e);
  }
  function moveTip(e) {
    var box = tip.parentNode.getBoundingClientRect(); // positioned relative to the map container
    var x = e.clientX - box.left + 14, y = e.clientY - box.top + 14;
    x = Math.min(Math.max(x, 6), box.width - tip.offsetWidth - 6);
    y = Math.min(Math.max(y, 6), box.height - tip.offsetHeight - 6);
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  function hideTip() { tip.classList.remove("is-on"); }

  /* ---- open / close -------------------------------------- */
  function openModal() {
    if (!built) build();
    if (!state.region) { genRegion("EMEA"); buildScene(); render(); }
    lastFocus = document.activeElement;
    overlay.classList.add("is-open"); overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    var c = modal.querySelector(".td-close"); if (c) c.focus();
  }
  function closeModal() {
    overlay.classList.remove("is-open"); overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = ""; hideTip();
    document.removeEventListener("keydown", onKey);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function onKey(e) { if (e.key === "Escape") closeModal(); }

  /* ---- wire launchers ------------------------------------ */
  document.querySelectorAll('[data-demo="territory"]').forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); openModal(); });
  });
})();
