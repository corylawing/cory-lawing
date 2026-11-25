/* ============================================================
   Site script: helpers, icons, the hash router and the demo frame.
   Demos are complete standalone apps. Each one opens full screen
   inside the site, in an iframe under a slim site bar.
   Mockup: the app source is embedded and loaded with srcdoc.
   Live site: the same file is loaded from assets/demos/.
   ============================================================ */
(function () {
  "use strict";
  var ICONS = {
    "arrow-right": "M5 12h14M13 6l6 6-6 6",
    "arrow-left": "M19 12H5M11 6l-6 6 6 6",
    check: "M5 12.5l4.5 4.5L19 7.5",
    x: "M6 6l12 12M18 6L6 18",
    spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
    mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3",
    play: "M8 5l11 7-11 7z",
    stop: "M7 7h10v10H7z",
    shield: "M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6zM9 12l2 2 4-4",
    pin: "M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
    route: "M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6",
    mail: "M4 6h16v12H4zM4 7l8 6 8-6",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
    alert: "M12 4l9 16H3zM12 10v4M12 17h.01",
    doc: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
    chevron: "M9 6l6 6-6 6",
    "chevron-down": "M6 9l6 6 6-6",
    plus: "M12 5v14M5 12h14",
    minus: "M5 12h14",
    refresh: "M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4",
    send: "M4 12l16-8-6 16-3-7z",
    eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    tool: "M14.5 6.5a4 4 0 0 0-5 5L4 17l3 3 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-2.5-2.5z",
    cpu: "M8 8h8v8H8zM4 10h4M4 14h4M16 10h4M16 14h4M10 4v4M14 4v4M10 16v4M14 16v4",
    pen: "M4 20l4-1L19 8l-3-3L5 16zM14 7l3 3",
    lock: "M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3",
    calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
    chart: "M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8",
    layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
    search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
    flag: "M5 21V4M5 4h11l-2 4 2 4H5",
    external: "M14 5h5v5M19 5l-8 8M11 7H6v11h11v-5",
    database: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
    undo: "M9 7L4 12l5 5M4 12h10a5 5 0 0 1 0 10h-2",
    copy: "M9 9h11v11H9zM5 15V4h11",
    filter: "M4 5h16l-6 8v6l-4-2v-4z",
    grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
    message: "M4 5h16v11H9l-5 4z",
    trend: "M3 17l6-6 4 4 8-8M15 7h6v6",
    receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
    home: "M4 11l8-7 8 7v9h-5v-6H9v6H4z",
    inbox: "M4 13l2.5-8h11L20 13v6H4zM4 13h5l1 2h4l1-2h5",
    upload: "M12 16V5M7 10l5-5 5 5M5 19h14",
    download: "M12 5v11M7 11l5 5 5-5M5 19h14",
    sliders: "M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M6 15v4",
    users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6 6 0 0 1 3.5 6",
    bell: "M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0",
    moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
    sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5",
    help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01",
    info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01",
    star: "M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.300-4.100 5.900-.8z",
    phone: "M6 3h3l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v3a3 3 0 0 1-3 3A15 15 0 0 1 3 6a3 3 0 0 1 3-3z",
    map: "M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14",
    list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
    columns: "M4 4h4.5v16H4zM9.75 4h4.5v11h-4.5zM15.5 4H20v7h-4.5z",
    bolt: "M13 3L5 13h6l-1 8 8-10h-6z",
    target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01",
    dollar: "M12 3v18M16 7.5C15.5 6.3 14 5.5 12 5.5c-2.3 0-4 1.200-4 3 0 4 8.500 2 8.500 6.500 0 1.900-1.900 3.200-4.500 3.200-2.300 0-4-.9-4.500-2.300",
    tag: "M3 12V4h8l10 10-8 8zM7.5 8h.01",
    percent: "M19 5L5 19M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5",
    more: "M5 12h.01M12 12h.01M19 12h.01",
    menu: "M4 6h16M4 12h16M4 18h16",
    link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.700-5.700l-1 1M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1",
    globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.5 3.8 5.500 3.800 9s-1.300 6.500-3.800 9c-2.500-2.500-3.800-5.500-3.800-9S9.500 5.500 12 3z",
    building: "M5 21V4h9v17M14 9h5v12M3 21h18M8 8h3M8 12h3M8 16h3",
    briefcase: "M3 8h18v11H3zM9 8V5h6v3M3 13h18",
    folder: "M3 6h6l2 2h10v11H3z",
    image: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9.5h.01",
    camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
    pause: "M8 5v14M16 5v14",
    record: "M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14z",
    wave: "M4 10v4M8 7v10M12 4v16M16 8v8M20 10v4",
    "check-circle": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12.5l3 3 5-6",
    "x-circle": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 9l6 6M15 9l-6 6",
    unlock: "M6 11h12v9H6zM9 11V8a3 3 0 0 1 5.8-1",
    "zoom-in": "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4M11 8v6M8 11h6",
    "zoom-out": "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4M8 11h6",
    crosshair: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 2v5M12 17v5M2 12h5M17 12h5",
    navigation: "M4 11l16-7-7 16-2-7z",
    car: "M5 16l1.5-6h11L19 16M4 16h16v3H4zM7 19v1.5M17 19v1.5M8 13h.01M16 13h.01",
    branch: "M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9",
    code: "M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16",
    terminal: "M4 5h16v14H4zM7 9l3 3-3 3M12 15h5",
    repeat: "M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3M20 13v2a3 3 0 0 1-3 3H4",
    card: "M3 6h18v12H3zM3 10h18M7 15h3",
    "thumbs-up": "M7 11v9H4v-9zM7 11l4-8a2.5 2.5 0 0 1 2.500 2.500V9h5a2 2 0 0 1 2 2.300l-1.200 7a2 2 0 0 1-2 1.700H7",
    history: "M4 12a8 8 0 1 0 2.5-5.800L4 8.500M4 4v4.500h4.500M12 8v4.500l3 2",
    archive: "M3 5h18v4H3zM5 9v10h14V9M10 13h4",
    compass: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z",
    grip: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
    sort: "M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4",
    "arrow-up": "M12 19V5M6 11l6-6 6 6",
    "arrow-down": "M12 5v14M6 13l6 6 6-6",
    expand: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
    logout: "M9 4H5v16h4M16 8l4 4-4 4M20 12H9",
    bank: "M3 9l9-5 9 5M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 20h18",
    paperclip: "M20 11l-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.500 8.500a2 2 0 0 1-3-3L14 7",
    hash: "M5 9h14M5 15h14M10 4L8 20M16 4l-2 16",
    gauge: "M4 16a8 8 0 1 1 16 0M12 16l4-5M12 16h.01",
    pie: "M12 3v9h9a9 9 0 1 1-9-9zM15 3.5A9 9 0 0 1 20.5 9H15z",
    activity: "M3 12h4l3-8 4 16 3-8h4",
    heart: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.500A4 4 0 0 1 19 10c0 5.500-7 10-7 10z",
    gift: "M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-1.5-3-5-3-5-.5S10 7 12 7zM12 7c1.500-3 5-3 5-.5S14 7 12 7z",
    signature: "M3 18c3-6 5-10 7-10s0 8 2 8 3-5 5-5 2 4 4 4M3 21h18",
    shuffle: "M3 7h4l10 10h4M17 21l4-4-4-4M3 17h4l3-3M14 10l3-3h4M17 3l4 4-4 4",
    save: "M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6",
    smartphone: "M8 3h8v18H8zM11 18h2",
    award: "M12 14a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM8.5 13L7 21l5-3 5 3-1.500-8",
    trophy: "M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8M10 17h4",
    bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.500 1 2.500h6c0-1 .3-1.800 1-2.500A6 6 0 0 0 12 3z"
  };

  var K = window.K = {};
  K.reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  K.$ = function (s, r) { return (r || document).querySelector(s); };
  K.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  K.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  K.h = function (html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  K.icon = function (n) { return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (ICONS[n] || "") + '"/></svg>'; };
  K.icons = function (root) { K.$$("i[data-i]", root).forEach(function (e) { e.outerHTML = K.icon(e.getAttribute("data-i")); }); };

  /* ---------- the demos ---------- */
  K.order = ["voice", "cockpit", "cpq", "expense", "org-health", "territory", "social"];
  K.catalog = {
    voice: { title: "Activity Voice Recorder", kicker: "Sales · voice to CRM", file: "voice-activity.html" },
    cockpit: { title: "Sales Command Center", kicker: "Revenue · next-best action", file: "revenue-cockpit.html" },
    cpq: { title: "Custom CPQ Engine", kicker: "Deal execution · quote to signature", file: "cpq.html" },
    expense: { title: "Expense Guard", kicker: "Finance · AI compliance", file: "expense-guard.html" },
    "org-health": { title: "Org Health Auditor", kicker: "Salesforce · governance", file: "org-health-auditor.html" },
    territory: { title: "Territory Intelligence", kicker: "Field sales · coverage and routing", file: "territory-intelligence.html" },
    social: { title: "Social Command Center", kicker: "Marketing · content operations", file: "social-command-center.html" }
  };
  function appSource(id) {
    var b64 = window.CL_APPS && window.CL_APPS[id];
    if (!b64) return null;
    var bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }
  var frame = null, loaded = null;
  function load(id, force) {
    frame = frame || K.$("#demo-frame");
    if (!frame || (loaded === id && !force)) return;
    loaded = id;
    K.$("#view-demo").setAttribute("data-loading", "true");
    frame.setAttribute("title", K.catalog[id].title + ", interactive demo");
    var html = appSource(id);
    if (html !== null) { frame.removeAttribute("src"); frame.srcdoc = html; }
    else { frame.removeAttribute("srcdoc"); frame.src = "assets/demos/" + K.catalog[id].file; }
  }

  /* the frame is as tall as the screen minus the site chrome above it */
  function setChrome() {
    var top = K.$(".top"); if (!top) return;
    document.documentElement.style.setProperty("--chrome-h", Math.round(top.getBoundingClientRect().bottom + window.scrollY) + "px");
  }

  /* ---------- router (hash names only) ---------- */
  var homeY = 0, current = null;
  function route() {
    var id = (location.hash || "#home").slice(1);
    if (id !== "home" && !K.catalog[id]) id = "home";
    if (current === "home" && id !== "home") homeY = window.scrollY;
    var was = current, isDemo = id !== "home";
    current = id;
    K.$("#view-home").hidden = isDemo;
    K.$("#view-demo").hidden = !isDemo;
    K.$("#top-home").hidden = isDemo;
    K.$("#top-stage").hidden = !isDemo;
    document.body.classList.toggle("in-demo", isDemo);
    K.$$(".rev__btn[data-go]").forEach(function (b) { b.setAttribute("aria-current", String(b.getAttribute("data-go") === id)); });
    if (isDemo) {
      var meta = K.catalog[id], i = K.order.indexOf(id);
      K.$("#stage-title").textContent = meta.title;
      K.$("#stage-kicker").textContent = "Demo version · " + meta.kicker + " · sample data";
      K.$("#stage-count").textContent = (i + 1) + " / " + K.order.length;
      K.$("#stage-prev").setAttribute("data-go", K.order[(i - 1 + K.order.length) % K.order.length]);
      K.$("#stage-next").setAttribute("data-go", K.order[(i + 1) % K.order.length]);
      window.scrollTo(0, 0); setChrome(); load(id);
    } else if (was && was !== "home") {
      window.scrollTo(0, homeY);
    }
  }
  K.go = function (id) { if (("#" + id) === location.hash) route(); else location.hash = id; };

  document.addEventListener("click", function (e) {
    /* booking links open the Calendly pop-up when its script has loaded; otherwise the link opens Calendly in a new tab */
    var cal = e.target.closest('a[href*="calendly.com"]');
    if (cal && window.Calendly && typeof window.Calendly.initPopupWidget === "function") { e.preventDefault(); window.Calendly.initPopupWidget({ url: cal.href }); return; }
    var rs = e.target.closest("[data-restart]");
    if (rs) { if (current && current !== "home") load(current, true); return; }
    var go = e.target.closest("[data-go]");
    if (go) { e.preventDefault(); K.go(go.getAttribute("data-go")); return; }
    var sc = e.target.closest("[data-scroll]");
    if (sc) {
      e.preventDefault();
      var t = document.getElementById(sc.getAttribute("data-scroll"));
      if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 72, behavior: K.reduced ? "auto" : "smooth" });
    }
  });
  window.addEventListener("hashchange", route);
  window.addEventListener("resize", setChrome);
  document.addEventListener("DOMContentLoaded", function () {
    K.icons(document);
    var f = K.$("#demo-frame");
    if (f) f.addEventListener("load", function () { K.$("#view-demo").removeAttribute("data-loading"); });
    route();
  });
})();
