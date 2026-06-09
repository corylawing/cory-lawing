/* ============================================================
   Territory Intelligence — interactive demo (self-contained)
   Generic B2B revenue map. Sample data only — no real/proprietary
   data or branding. Plots accounts, colors them by status or by
   rep territory, filters, and lets you re-optimize coverage.
   Vanilla JS, no dependencies.
   ============================================================ */
(function () {
  "use strict";

  /* ---- palette ------------------------------------------- */
  var STATUS = ["Customer", "SQL", "Prospect", "Churned"];
  var STATUS_COLOR = { Customer: "#3DC6CE", SQL: "#F2C879", Prospect: "#F2778C", Churned: "#B79CFF" };
  var REP_COLORS = ["#D9F77B", "#6FD3E6", "#B79CFF", "#F2C879", "#F58CA6"];
  var REP_NAMES  = ["A. Rivera", "M. Chen", "L. Okafor", "S. Dubois", "K. Nakamura"];
  var W = 600, H = 440, K = 5, N = 88;
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

  var REGIONS = {
    "EMEA":       { seed: 101, cities: ["London","Paris","Berlin","Madrid","Milan","Amsterdam","Dublin","Munich","Vienna","Zurich","Oslo","Lisbon"] },
    "N. America": { seed: 202, cities: ["New York","Chicago","Toronto","Austin","Denver","Boston","Seattle","Miami","Atlanta","Dallas","Vancouver","San Diego"] },
    "APAC":       { seed: 303, cities: ["Tokyo","Sydney","Singapore","Seoul","Melbourne","Osaka","Auckland","Bangkok","Taipei","Mumbai","Jakarta","Manila"] }
  };
  var PREFIX = ["Northwind","Atlas","Vertex","Summit","Cobalt","Meridian","Lumen","Beacon","Apex","Cedar","Harbor","Orbit","Pioneer","Keystone","Nimbus","Granite"];
  var SUFFIX = ["Systems","Logistics","Software","Group","Labs","Industries","Partners","Networks","Retail","Capital","Robotics","Health"];
  var SEG = ["Enterprise", "Mid-market", "SMB"];
  var STAGES = ["Discovery", "Qualification", "Proposal", "Negotiation", "Contracting"];
  var NEXT = ["Discovery call", "Product demo", "QBR", "Renewal review", "Pricing review", "Exec sync", "Onboarding kickoff", "Check-in"];
  var SE_NAMES = ["T. Alvarez", "P. Novak", "R. Haddad", "J. Kim", "B. Costa"];
  var CSM_NAMES = ["D. Flynn", "N. Roy", "E. Brandt", "Y. Sato", "C. Mbeki"];

  function rng(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function pick(r, arr) { return arr[(r() * arr.length) | 0]; }
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function svg(tag) { return document.createElementNS("http://www.w3.org/2000/svg", tag); }

  var state = {
    region: null, accounts: [], hubs: [], colorBy: "status",
    filters: { Customer: true, SQL: true, Prospect: true, Churned: true },
    isolateRep: -1, selected: null, q: ""
  };
  var built = false, overlay, modal, svgEl, gHull, gDot, gHub, tip, panelBody, kpiWrap, searchInput, rebBtn, lastFocus = null;

  /* ---- data ---------------------------------------------- */
  function genRegion(name) {
    var r = rng(REGIONS[name].seed), cities = REGIONS[name].cities, centers = [], i;
    for (i = 0; i < 6; i++) centers.push({ x: 70 + r() * 460, y: 55 + r() * 330 });
    var accts = [];
    for (i = 0; i < N; i++) {
      var c = centers[(r() * centers.length) | 0];
      var x = clamp(c.x + (r() + r() + r() - 1.5) * 78, 26, W - 26);
      var y = clamp(c.y + (r() + r() + r() - 1.5) * 58, 26, H - 26);
      var s = r(), status = s < 0.45 ? "Customer" : s < 0.6 ? "SQL" : s < 0.9 ? "Prospect" : "Churned";
      var base = status === "Customer" ? 120 + r() * 780
               : status === "SQL" ? 80 + r() * 420
               : status === "Prospect" ? 20 + r() * 180
               : r() * 90;
      accts.push({
        x: x, y: y, value: Math.round(base),
        name: pick(r, PREFIX) + " " + pick(r, SUFFIX),
        city: pick(r, cities), status: status, seg: pick(r, SEG),
        rep: 0, lastSeen: 1 + Math.floor(r() * 120),
        nextSubj: r() < 0.82 ? pick(r, NEXT) : null,
        nextIn: 1 + Math.floor(r() * 28),
        oppStage: status === "SQL" ? pick(r, STAGES) : null,
        oppDays: 3 + Math.floor(r() * 80),
        se: pick(r, SE_NAMES), csm: pick(r, CSM_NAMES),
        el: null
      });
    }
    var hubs = [{ x: 140, y: 120 }, { x: 460, y: 120 }, { x: 300, y: 225 }, { x: 150, y: 330 }, { x: 450, y: 330 }]
      .map(function (h) { return { x: h.x, y: h.y, el: null }; });
    state.region = name; state.accounts = accts; state.hubs = hubs;
    state.isolateRep = -1; state.selected = null; state.q = "";
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
    assign();
  }
  function dist(a, h) { var dx = a.x - h.x, dy = a.y - h.y; return Math.sqrt(dx * dx + dy * dy); }
  function isShown(a) {
    if (!state.filters[a.status]) return false;
    if (state.q && a.name.toLowerCase().indexOf(state.q) === -1) return false;
    return true;
  }

  /* ---- convex hull --------------------------------------- */
  function hull(pts) {
    if (pts.length < 3) return pts.slice();
    var p = pts.slice().sort(function (a, b) { return a.x - b.x || a.y - b.y; });
    function cr(o, a, b) { return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x); }
    var lo = [], up = [], i;
    for (i = 0; i < p.length; i++) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p[i]) <= 0) lo.pop(); lo.push(p[i]); }
    for (i = p.length - 1; i >= 0; i--) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p[i]) <= 0) up.pop(); up.push(p[i]); }
    lo.pop(); up.pop();
    var h = lo.concat(up), cx = 0, cy = 0;
    h.forEach(function (q) { cx += q.x; cy += q.y; }); cx /= h.length; cy /= h.length;
    return h.map(function (q) { return { x: cx + (q.x - cx) * 1.12, y: cy + (q.y - cy) * 1.12 }; });
  }

  /* ---- metrics ------------------------------------------- */
  function metrics() {
    var shown = state.accounts.filter(isShown);
    var pipe = 0, cust = 0, sql = 0, counts = [0, 0, 0, 0, 0], totDist = 0;
    shown.forEach(function (a) {
      pipe += a.value;
      if (a.status === "Customer") cust++;
      if (a.status === "SQL") sql++;
      counts[a.rep]++; totDist += dist(a, state.hubs[a.rep]);
    });
    var avg = shown.length ? totDist / shown.length : 0;
    return {
      shown: shown.length, pipe: pipe, cust: cust, sql: sql,
      coverage: clamp(Math.round(100 - avg / 1.7), 0, 99),
      spread: Math.max.apply(null, counts) - Math.min.apply(null, counts)
    };
  }
  function statusCounts() {
    var c = { Customer: 0, SQL: 0, Prospect: 0, Churned: 0 };
    state.accounts.forEach(function (a) { c[a.status]++; });
    return c;
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
    // region tabs
    var regWrap = el("div", "td-seg"); regWrap.setAttribute("aria-label", "Region");
    Object.keys(REGIONS).forEach(function (name, i) {
      var b = el("button", "td-seg__btn"); b.textContent = name;
      if (i === 0) b.classList.add("is-on");
      b.addEventListener("click", function () {
        regWrap.querySelectorAll(".td-seg__btn").forEach(function (x) { x.classList.remove("is-on"); });
        b.classList.add("is-on"); genRegion(name); buildScene(); render(); renderPanel();
        if (searchInput) searchInput.value = "";
      });
      regWrap.appendChild(b);
    });
    // color-by toggle
    var colWrap = el("div", "td-seg"); colWrap.setAttribute("aria-label", "Color by");
    [["status", "By status"], ["territory", "By territory"]].forEach(function (v, i) {
      var b = el("button", "td-seg__btn"); b.textContent = v[1];
      if (i === 0) b.classList.add("is-on");
      b.addEventListener("click", function () {
        colWrap.querySelectorAll(".td-seg__btn").forEach(function (x) { x.classList.remove("is-on"); });
        b.classList.add("is-on"); state.colorBy = v[0];
        rebBtn.style.display = v[0] === "territory" ? "" : "none";
        render(); renderPanel();
      });
      colWrap.appendChild(b);
    });
    // search
    var search = el("div", "td-search");
    searchInput = el("input"); searchInput.type = "search"; searchInput.placeholder = "Search accounts…";
    searchInput.setAttribute("aria-label", "Search accounts");
    searchInput.addEventListener("input", function () {
      state.q = searchInput.value.trim().toLowerCase(); render(); updateKpis();
    });
    search.appendChild(searchInput);
    // rebalance
    rebBtn = el("button", "td-reb"); rebBtn.innerHTML = "<span>Rebalance</span>"; rebBtn.style.display = "none";
    rebBtn.title = "Re-optimize territories for coverage";
    rebBtn.addEventListener("click", function () { rebalanceStep(); render(true); renderPanel(); });

    bar.appendChild(regWrap); bar.appendChild(colWrap); bar.appendChild(search); bar.appendChild(rebBtn);

    var stage = el("div", "td-stage");
    var mapWrap = el("div", "td-map");
    svgEl = svg("svg"); svgEl.setAttribute("viewBox", "0 0 " + W + " " + H);
    svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet"); svgEl.classList.add("td-svg");
    var defs = svg("defs");
    var pat = svg("pattern"); pat.setAttribute("id", "tdgrid"); pat.setAttribute("width", "30"); pat.setAttribute("height", "30"); pat.setAttribute("patternUnits", "userSpaceOnUse");
    var pp = svg("path"); pp.setAttribute("d", "M30 0H0V30"); pp.setAttribute("fill", "none"); pp.setAttribute("stroke", "rgba(255,255,255,.05)"); pp.setAttribute("stroke-width", "1");
    pat.appendChild(pp); defs.appendChild(pat); svgEl.appendChild(defs);
    var bg = svg("rect"); bg.setAttribute("width", W); bg.setAttribute("height", H); bg.setAttribute("fill", "url(#tdgrid)");
    svgEl.appendChild(bg);
    gHull = svg("g"); gDot = svg("g"); gHub = svg("g");
    svgEl.appendChild(gHull); svgEl.appendChild(gDot); svgEl.appendChild(gHub);
    bg.addEventListener("click", function () { if (state.selected) { state.selected = null; render(); renderPanel(); } });
    mapWrap.appendChild(svgEl);
    tip = el("div", "td-tip"); mapWrap.appendChild(tip);

    var panel = el("div", "td-panel");
    kpiWrap = el("div", "td-kpis");
    panelBody = el("div", "td-panel__body");
    panel.appendChild(kpiWrap); panel.appendChild(panelBody);

    stage.appendChild(mapWrap); stage.appendChild(panel);

    var foot = el("p", "td-foot mono");
    foot.textContent = "Sample data — illustrates how the live tool maps accounts, colours them by status or rep territory, and re-optimises coverage. Click a marker for detail.";

    modal.appendChild(head); modal.appendChild(bar); modal.appendChild(stage); modal.appendChild(foot);
    overlay.appendChild(modal); document.body.appendChild(overlay);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });
    built = true;
  }

  /* ---- scene --------------------------------------------- */
  function buildScene() {
    gHull.innerHTML = ""; gDot.innerHTML = ""; gHub.innerHTML = "";
    state.accounts.forEach(function (a) {
      var c = svg("circle"); c.setAttribute("cx", a.x.toFixed(1)); c.setAttribute("cy", a.y.toFixed(1));
      c.setAttribute("r", "4.5"); c.classList.add("td-dot");
      c.addEventListener("pointerover", function (e) { showTip(e, a); });
      c.addEventListener("pointermove", moveTip);
      c.addEventListener("pointerout", hideTip);
      c.addEventListener("click", function (e) { e.stopPropagation(); state.selected = a; hideTip(); render(); renderPanel(); });
      gDot.appendChild(c); a.el = c;
    });
    state.hubs.forEach(function (h, i) {
      var g = svg("g"); g.classList.add("td-hub");
      var ring = svg("circle"); ring.setAttribute("r", "11"); ring.setAttribute("class", "td-hub__ring"); ring.setAttribute("stroke", REP_COLORS[i]);
      var dot = svg("circle"); dot.setAttribute("r", "5"); dot.setAttribute("fill", REP_COLORS[i]); dot.setAttribute("class", "td-hub__dot");
      g.appendChild(ring); g.appendChild(dot); gHub.appendChild(g); h.el = g;
    });
  }

  /* ---- render map ---------------------------------------- */
  function render(animate) {
    var terr = state.colorBy === "territory";
    gHull.style.display = terr ? "" : "none";
    gHub.style.display = terr ? "" : "none";

    gHull.innerHTML = "";
    if (terr) {
      for (var i = 0; i < K; i++) {
        var pts = state.accounts.filter(function (a) { return a.rep === i && isShown(a); });
        var dim = state.isolateRep !== -1 && state.isolateRep !== i;
        if (pts.length >= 3) {
          var hp = hull(pts), poly = svg("polygon");
          poly.setAttribute("points", hp.map(function (q) { return q.x.toFixed(1) + "," + q.y.toFixed(1); }).join(" "));
          poly.setAttribute("class", "td-hull"); poly.setAttribute("fill", REP_COLORS[i]); poly.setAttribute("stroke", REP_COLORS[i]);
          poly.style.opacity = dim ? 0.04 : 0.10;
          gHull.appendChild(poly);
        }
      }
    }

    state.accounts.forEach(function (a) {
      var c = a.el, shown = isShown(a);
      if (!shown) { c.style.opacity = 0.05; c.style.pointerEvents = "none"; c.setAttribute("r", "3"); return; }
      c.style.pointerEvents = "";
      var color = terr ? REP_COLORS[a.rep] : STATUS_COLOR[a.status];
      var r = 4.5, op = 0.9;
      if (terr && state.isolateRep !== -1 && state.isolateRep !== a.rep) { op = 0.12; }
      if (a === state.selected) { r = 7.5; op = 1; c.classList.add("is-selected"); }
      else c.classList.remove("is-selected");
      c.setAttribute("fill", color); c.setAttribute("stroke", a === state.selected ? "#FFFFFF" : "none");
      c.setAttribute("stroke-width", a === state.selected ? "2" : "0");
      c.setAttribute("r", r.toFixed(1)); c.style.opacity = op;
    });

    if (terr) {
      state.hubs.forEach(function (h, i) {
        var dim = state.isolateRep !== -1 && state.isolateRep !== i;
        h.el.style.transition = (!reduce && animate) ? "transform .6s cubic-bezier(.2,.65,.2,1)" : "none";
        h.el.style.transform = "translate(" + h.x.toFixed(1) + "px," + h.y.toFixed(1) + "px)";
        h.el.style.opacity = dim ? 0.25 : 1;
      });
    }
    updateKpis();
  }

  /* ---- KPIs ---------------------------------------------- */
  function kpi(val, label) {
    var c = el("div", "td-kpi");
    var v = el("p", "td-kpi__val"); v.innerHTML = val;
    var l = el("p", "td-kpi__lbl mono"); l.textContent = label;
    c.appendChild(v); c.appendChild(l); return c;
  }
  function updateKpis() {
    var m = metrics();
    kpiWrap.innerHTML = "";
    kpiWrap.appendChild(kpi(String(m.shown), "Accounts shown"));
    kpiWrap.appendChild(kpi('<span class="td-kpi__pre">$</span>' + (m.pipe / 1000).toFixed(1) + '<span class="td-kpi__unit">M</span>', "Pipeline + ARR"));
    if (state.colorBy === "territory") {
      kpiWrap.appendChild(kpi(m.coverage + '<span class="td-kpi__unit">%</span>', "Coverage score"));
      kpiWrap.appendChild(kpi('±' + m.spread, "Load spread"));
    } else {
      kpiWrap.appendChild(kpi(String(m.cust), "Customers"));
      kpiWrap.appendChild(kpi(String(m.sql), "Open SQLs"));
    }
  }

  /* ---- right panel: filters/legend OR account detail ----- */
  function renderPanel() {
    panelBody.innerHTML = "";
    if (state.selected) { renderDetail(state.selected); return; }

    // status filters
    var fSec = el("div", "td-sec");
    fSec.appendChild(label("Filter by status"));
    var counts = statusCounts();
    STATUS.forEach(function (s) {
      var row = el("button", "td-filter" + (state.filters[s] ? " is-on" : ""));
      row.innerHTML = '<span class="td-filter__box"></span>' +
        '<span class="td-filter__dot" style="background:' + STATUS_COLOR[s] + '"></span>' +
        '<span class="td-filter__name">' + s + '</span>' +
        '<span class="td-filter__n mono">' + counts[s] + '</span>';
      row.addEventListener("click", function () { state.filters[s] = !state.filters[s]; render(); renderPanel(); });
      fSec.appendChild(row);
    });
    panelBody.appendChild(fSec);

    // territory legend (only in territory mode)
    if (state.colorBy === "territory") {
      var lSec = el("div", "td-sec");
      lSec.appendChild(label("Reps — click to isolate"));
      var counts2 = [0, 0, 0, 0, 0]; state.accounts.forEach(function (a) { if (isShown(a)) counts2[a.rep]++; });
      REP_NAMES.forEach(function (nm, i) {
        var row = el("button", "td-rep" + (state.isolateRep === i ? " is-on" : ""));
        row.innerHTML = '<span class="td-rep__sw" style="background:' + REP_COLORS[i] + '"></span>' +
          '<span class="td-rep__name">' + nm + '</span><span class="td-rep__n mono">' + counts2[i] + '</span>';
        row.addEventListener("click", function () { state.isolateRep = state.isolateRep === i ? -1 : i; render(); renderPanel(); });
        lSec.appendChild(row);
      });
      panelBody.appendChild(lSec);
    }
  }
  function label(txt) { var p = el("p", "td-sec__label mono"); p.textContent = txt; return p; }

  function renderDetail(a) {
    var back = el("button", "td-back"); back.innerHTML = "&larr; Back to map";
    back.addEventListener("click", function () { state.selected = null; render(); renderPanel(); });
    panelBody.appendChild(back);

    var hero = el("div", "td-detail__hero");
    hero.innerHTML =
      '<span class="td-badge" style="--c:' + STATUS_COLOR[a.status] + '">' + a.status + '</span>' +
      '<h4 class="td-detail__name">' + a.name + '</h4>' +
      '<p class="td-detail__city mono">' + a.city + ' · ' + a.seg + '</p>';
    panelBody.appendChild(hero);

    var rows = [
      ["Pipeline / ARR", "$" + a.value + "k"],
      ["Owner", '<span class="td-dotmini" style="background:' + REP_COLORS[a.rep] + '"></span>' + REP_NAMES[a.rep]],
      ["Last touch", a.lastSeen + " days ago"],
      ["Next activity", a.nextSubj ? (a.nextSubj + " · in " + a.nextIn + "d") : "—"]
    ];
    if (a.status === "SQL") rows.push(["Opportunity", a.oppStage + " · " + a.oppDays + "d in stage"]);
    var fl = el("div", "td-fields");
    rows.forEach(function (r) {
      var row = el("div", "td-field");
      row.innerHTML = '<span class="td-field__k mono">' + r[0] + '</span><span class="td-field__v">' + r[1] + '</span>';
      fl.appendChild(row);
    });
    panelBody.appendChild(fl);

    // account team
    var team = [{ role: "AE", name: REP_NAMES[a.rep] }, { role: "SE", name: a.se }];
    if (a.status === "Customer") team.push({ role: "CSM", name: a.csm });
    var tSec = el("div", "td-sec");
    tSec.appendChild(label("Account team"));
    team.forEach(function (m) {
      var row = el("div", "td-team");
      var initials = m.name.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();
      row.innerHTML = '<span class="td-team__av">' + initials + '</span>' +
        '<span class="td-team__name">' + m.name + '</span><span class="td-team__role mono">' + m.role + '</span>';
      tSec.appendChild(row);
    });
    panelBody.appendChild(tSec);
  }

  /* ---- tooltip ------------------------------------------- */
  function showTip(e, a) {
    if (!isShown(a)) return;
    tip.innerHTML = '<strong>' + a.name + '</strong>' +
      '<span class="td-tip__row"><span style="color:' + STATUS_COLOR[a.status] + '">' + a.status + '</span><span>$' + a.value + 'k</span></span>' +
      '<span class="td-tip__city">' + a.city + ' · ' + REP_NAMES[a.rep] + '</span>';
    tip.classList.add("is-on"); moveTip(e);
  }
  function moveTip(e) {
    var box = tip.parentNode.getBoundingClientRect();
    var x = e.clientX - box.left + 14, y = e.clientY - box.top + 14;
    x = Math.min(Math.max(x, 6), box.width - tip.offsetWidth - 6);
    y = Math.min(Math.max(y, 6), box.height - tip.offsetHeight - 6);
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  function hideTip() { tip.classList.remove("is-on"); }

  /* ---- open / close -------------------------------------- */
  function openModal() {
    if (!built) build();
    if (!state.region) { genRegion("EMEA"); buildScene(); render(); renderPanel(); }
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

  document.querySelectorAll('[data-demo="territory"]').forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); openModal(); });
  });
})();
