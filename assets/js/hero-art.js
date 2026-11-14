/* ============================================================
   Hero motion art: Architect, Build, Ship, Scale.
   A few thousand points morph between four forms that tell how
   Cory works: a stack of blueprint layers (architect), modular
   blocks (build), a flowing knot (ship) and a globe with orbits
   (scale). Points swirl between forms, scatter away from the
   pointer and burst on click. The phase row under the hero
   buttons follows along, and clicking it jumps to that phase.
   Canvas 2D with its own 3D projection, no libraries. Colours
   come from the site tokens. Pauses off screen; reduced motion
   gets one still frame.
   ============================================================ */
(function () {
  "use strict";
  var canvas = document.getElementById("hero-art");
  if (!canvas || !canvas.getContext || !window.K) return;
  var ctx = canvas.getContext("2d"), host = canvas.parentNode, hero = canvas.closest(".h-hero");
  var TAU = Math.PI * 2, CAM = 5.2, reduced = K.reduced;
  var HOLD = 4.2, MORPH = 1.9, PERIOD = HOLD + MORPH;
  var W = 1, H = 1, cx = 0, cy = 0, S = 100, t = 0, last = 0, running = false, onScreen = true;
  var col = {}, dark = true, sprite = null, spriteHi = null;
  var mouse = { x: -9999, y: -9999, inside: false }, cam = { yaw: 0, pitch: 0.42, ty: 0, tp: 0.42 };

  var seed = 7051;
  function rand() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var r = Math.imul(seed ^ seed >>> 15, 1 | seed); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(u) { u = clamp(u, 0, 1); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }

  /* ---------- colours ---------- */
  function rgb(name) {
    var p = document.createElement("i"); p.style.color = "var(" + name + ")"; p.style.display = "none"; document.body.appendChild(p);
    var m = getComputedStyle(p).color.match(/[\d.]+/g) || [255, 255, 255]; p.remove();
    return [Math.round(+m[0]), Math.round(+m[1]), Math.round(+m[2])];
  }
  function rgba(c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }
  function makeSprite(c, size) {
    var s = document.createElement("canvas"); s.width = s.height = size;
    var g = s.getContext("2d"), r = size / 2, gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, rgba(c, 1)); gr.addColorStop(0.22, rgba(c, 0.85)); gr.addColorStop(0.5, rgba(c, 0.22)); gr.addColorStop(1, rgba(c, 0));
    g.fillStyle = gr; g.fillRect(0, 0, size, size); return s;
  }
  function readColours() {
    col.accent = rgb("--accent"); col.hi = rgb("--accent-hi"); col.text = rgb("--text"); col.bg = rgb("--bg");
    dark = col.bg[0] * 0.299 + col.bg[1] * 0.587 + col.bg[2] * 0.114 < 128;
    sprite = makeSprite(dark ? col.accent : col.accent, 32);
    spriteHi = makeSprite(dark ? col.text : col.accent, 32);
  }

  /* ---------- particles and the four forms ---------- */
  /* ---------- Ship and Scale data (roles are by particle index, so these forms are stored unshuffled) ---------- */
  var FR2, FU2, FS2, J2x, J2y, J2z, FR3, FA3, FU3, J3x, J3y, J3z, kq2 = [0, 0, 0];
  var HUBS = [], ARCS = [], ARC_OM = [], ARC_LIFT = [], NPK = 0, PK_ARC, PK_A, PK_B, PK_P, PK_S, PK_H, PULSE, ARC_ACT, ARC_FL;
  var RINGS3 = [], ORB_BASE = [], FLASHES = [], nextFlash = 0;
  function frac(x) { return x - Math.floor(x); }
  function storeKeep(k, pts) { SX[k] = new Float32Array(N); SY[k] = new Float32Array(N); SZ[k] = new Float32Array(N); for (var i = 0; i < N; i++) { SX[k][i] = pts[i][0]; SY[k][i] = pts[i][1]; SZ[k][i] = pts[i][2]; } }
  function lerp3(a, b, u) { return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; }
  function triPt(a, b, c) { var r1 = Math.sqrt(rand()), r2 = rand(), wa = 1 - r1, wb = r1 * (1 - r2), wc = r1 * r2; return [a[0] * wa + b[0] * wb + c[0] * wc, a[1] * wa + b[1] * wb + c[1] * wc, a[2] * wa + b[2] * wb + c[2] * wc]; }
  /* the plane flies in place: a steady three-quarter view, a gentle sway and bob */
  function shipXf(x, y, z, out) {
    var A = -0.5 - t * 0.14 + 0.16 * Math.sin(t * 0.6), c = Math.cos(A), sn = Math.sin(A), bob = Math.sin(t * 1.5) * 0.07;
    var R = 0.78 + 0.08 * Math.sin(t * 0.9), cr = Math.cos(R), sr = Math.sin(R), y1, z1;
    x = (x - 0.3) * 1.12; y *= 1.12; z *= 1.12;
    y1 = y * cr - z * sr; z1 = y * sr + z * cr;          /* bank the wings toward the viewer */
    out[0] = x * c + z1 * sn; out[1] = y1 + bob; out[2] = -x * sn + z1 * c; return out;
  }
  /* a point on the arc between two hubs, lifted off the globe in the middle */
  function arcPt(a, b, om, lift, u, out) {
    var so = Math.sin(om) || 1e-6, wa = Math.sin((1 - u) * om) / so, wb = Math.sin(u * om) / so, l = 1.02 + lift * Math.sin(Math.PI * u);
    out[0] = (a[0] * wa + b[0] * wb) * l; out[1] = (a[1] * wa + b[1] * wb) * l; out[2] = (a[2] * wa + b[2] * wb) * l; return out;
  }
  /* a point on one of the orbit rings */
  function ringPt(r, an, out) {
    var x = Math.cos(an) * r.rad, z = Math.sin(an) * r.rad, y = -z * Math.sin(r.tilt), cy2 = Math.cos(r.yaw), sy2 = Math.sin(r.yaw);
    z = z * Math.cos(r.tilt);
    out[0] = x * cy2 + z * sy2; out[1] = y; out[2] = -x * sy2 + z * cy2; return out;
  }
  /* once per frame: where every data packet is, which links are busy, which hubs are flaring */
  function prepFrame() {
    if (!NPK) return;
    var j, k;
    for (j = 0; j < HUBS.length; j++) PULSE[j] = 0;
    for (k = 0; k < ARCS.length; k++) { ARC_ACT[k] = 0; ARC_FL[k] = 0; }
    for (k = 0; k < NPK; k++) {
      var h = frac(PK_P[k] + t * PK_S[k]), age = h / PK_S[k];
      PK_H[k] = h;
      PULSE[PK_B[k]] = Math.max(PULSE[PK_B[k]], Math.exp(-age * 3.2));
      PULSE[PK_A[k]] = Math.max(PULSE[PK_A[k]], Math.exp(-age * 5) * 0.55);
      ARC_ACT[PK_ARC[k]] = Math.max(ARC_ACT[PK_ARC[k]], Math.sin(Math.PI * h));
      ARC_FL[PK_ARC[k]] = Math.max(ARC_FL[PK_ARC[k]], Math.exp(-age * 6));
    }
    /* flash connections: a link of light strikes between two hubs, then fades */
    if (phase === 3 && t >= nextFlash) {
      var a5 = (rand() * HUBS.length) | 0, b5 = (rand() * HUBS.length) | 0;
      if (a5 !== b5) {
        var A5 = HUBS[a5], B5 = HUBS[b5], om5 = Math.acos(clamp(A5[0] * B5[0] + A5[1] * B5[1] + A5[2] * B5[2], -1, 1));
        if (om5 > 0.35) FLASHES.push({ a: a5, b: b5, om: om5, lift: 0.08 + 0.22 * om5 / Math.PI, t0: t });
      }
      nextFlash = t + 0.16 + rand() * 0.28;
    }
    for (k = FLASHES.length - 1; k >= 0; k--) {
      var fa = t - FLASHES[k].t0;
      if (fa > 1.3 || fa < 0) { FLASHES.splice(k, 1); continue; }
      if (fa > 0.28) PULSE[FLASHES[k].b] = Math.max(PULSE[FLASHES[k].b], Math.exp(-(fa - 0.28) * 4));
    }
  }
  var N = 0, SX = [], SY = [], SZ = [], FX, FY, FZ, CX, CY, CZ, dl, cu, cv, cw, ph, hi, ku, kx, ky, kz, ox, oy, vx, vy, guides = [];
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = (rand() * (i + 1)) | 0, x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function store(k, pts) { shuffle(pts); SX[k] = new Float32Array(N); SY[k] = new Float32Array(N); SZ[k] = new Float32Array(N); for (var i = 0; i < N; i++) { SX[k][i] = pts[i][0]; SY[k][i] = pts[i][1]; SZ[k][i] = pts[i][2]; } }
  function seg(list, a, b) { list.push([a[0], a[1], a[2], b[0], b[1], b[2]]); }

  function build(n) {
    N = n;
    FX = new Float32Array(n); FY = new Float32Array(n); FZ = new Float32Array(n); CX = new Float32Array(n); CY = new Float32Array(n); CZ = new Float32Array(n);
    dl = new Float32Array(n); cu = new Float32Array(n); cv = new Float32Array(n); cw = new Float32Array(n); ph = new Float32Array(n); hi = new Uint8Array(n);
    ku = new Float32Array(n); kx = new Float32Array(n); ky = new Float32Array(n); kz = new Float32Array(n);
    ox = new Float32Array(n); oy = new Float32Array(n); vx = new Float32Array(n); vy = new Float32Array(n);
    var i, k, pts;
    for (i = 0; i < n; i++) {
      dl[i] = rand() * 0.55; ph[i] = rand() * TAU; hi[i] = rand() < 0.12 ? 1 : 0;
      var th = rand() * TAU, v = rand() * 2 - 1, r = Math.sqrt(1 - v * v), m = 0.5 + rand() * 0.7;
      cu[i] = Math.cos(th) * r * m; cv[i] = v * m; cw[i] = Math.sin(th) * r * m;
      FX[i] = (rand() * 2 - 1) * 3.2; FY[i] = (rand() * 2 - 1) * 2; FZ[i] = (rand() * 2 - 1) * 2;
    }
    /* 0. Architect: three blueprint layers joined by pillars */
    var g0 = [], L = [-0.66, 0, 0.66], lines = 7;
    pts = [];
    for (i = 0; i < n; i++) {
      if (rand() < 0.13) { var cx0 = rand() < 0.5 ? -1 : 1, cz0 = rand() < 0.5 ? -1 : 1; if (rand() < 0.2) { cx0 = 0; cz0 = 0; } pts.push([cx0, -0.66 + rand() * 1.32, cz0]); continue; }
      var y = L[(rand() * 3) | 0], line = -1 + ((rand() * lines) | 0) * (2 / (lines - 1)), along = rand() * 2 - 1;
      pts.push(rand() < 0.5 ? [line, y, along] : [along, y, line]);
    }
    store(0, pts);
    L.forEach(function (y) { seg(g0, [-1, y, -1], [1, y, -1]); seg(g0, [1, y, -1], [1, y, 1]); seg(g0, [1, y, 1], [-1, y, 1]); seg(g0, [-1, y, 1], [-1, y, -1]); });
    [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 0]].forEach(function (c) { seg(g0, [c[0], -0.66, c[1]], [c[0], 0.66, c[1]]); });
    /* 1. Build: eight modules, mostly on their edges */
    var g1 = [], half = 0.4, off = 0.5, corners = [];
    for (var a = -1; a <= 1; a += 2) for (var b = -1; b <= 1; b += 2) for (var c = -1; c <= 1; c += 2) corners.push([a * off, b * off, c * off]);
    pts = [];
    for (i = 0; i < n; i++) {
      var ctr = corners[(rand() * 8) | 0], p = [0, 0, 0];
      if (rand() < 0.72) { var ax = (rand() * 3) | 0; for (k = 0; k < 3; k++) p[k] = k === ax ? rand() * 2 - 1 : (rand() < 0.5 ? -1 : 1); }
      else { var fa = (rand() * 3) | 0; for (k = 0; k < 3; k++) p[k] = k === fa ? (rand() < 0.5 ? -1 : 1) : rand() * 2 - 1; }
      pts.push([ctr[0] + p[0] * half, ctr[1] + p[1] * half, ctr[2] + p[2] * half]);
    }
    store(1, pts);
    corners.forEach(function (ctr) {
      var e = function (x, y, z) { return [ctr[0] + x * half, ctr[1] + y * half, ctr[2] + z * half]; };
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (q, j, arr) { var nq = arr[(j + 1) % 4]; seg(g1, e(q[0], -1, q[1]), e(nq[0], -1, nq[1])); seg(g1, e(q[0], 1, q[1]), e(nq[0], 1, nq[1])); seg(g1, e(q[0], -1, q[1]), e(q[0], 1, q[1])); });
    });
    /* 2. Ship: a paper plane made of light, flying, with a stream trailing behind it */
    FR2 = new Uint8Array(n); FU2 = new Float32Array(n); FS2 = new Float32Array(n); J2x = new Float32Array(n); J2y = new Float32Array(n); J2z = new Float32Array(n);
    var PN = [1.45, 0.02, 0], PL = [-0.8, 0.3, -0.85], PR = [-0.8, 0.3, 0.85], PT = [-0.8, 0.06, 0], PK = [-0.8, -0.36, 0];
    var FACES = [[PN, PL, PT], [PN, PT, PR], [PN, PT, PK]], FW = [0.4, 0.4, 0.2];
    var EDG = [[PN, PL], [PL, PT], [PN, PR], [PR, PT], [PN, PK], [PK, PT], [PN, PT]], g2 = [];
    var elen = EDG.map(function (e) { var d = [e[1][0] - e[0][0], e[1][1] - e[0][1], e[1][2] - e[0][2]]; return Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]); }), etot = elen.reduce(function (x, y) { return x + y; }, 0);
    function pickEdge() { var r = rand() * etot; for (var q = 0; q < EDG.length; q++) { r -= elen[q]; if (r <= 0) return EDG[q]; } return EDG[0]; }
    pts = [];
    for (i = 0; i < n; i++) {
      var r2 = rand();
      J2x[i] = rand() * 2 - 1; J2y[i] = rand() * 2 - 1; J2z[i] = rand() * 2 - 1;
      if (r2 < 0.4) { var e2 = pickEdge(); pts.push(lerp3(e2[0], e2[1], rand())); }
      else if (r2 < 0.7) { var fr = rand(), f2 = fr < FW[0] ? FACES[0] : fr < FW[0] + FW[1] ? FACES[1] : FACES[2]; pts.push(triPt(f2[0], f2[1], f2[2])); }
      else { FR2[i] = 1; FU2[i] = rand(); FS2[i] = 0.25 + rand() * 0.22; pts.push([0, 0, 0]); }
    }
    storeKeep(2, pts);
    EDG.forEach(function (e) { seg(g2, e[0], e[1]); });
    /* 3. Scale: the globe and its orbits, with regional hubs linked by connections that carry data */
    FR3 = new Uint8Array(n); FA3 = new Uint8Array(n); FU3 = new Float32Array(n); J3x = new Float32Array(n); J3y = new Float32Array(n); J3z = new Float32Array(n);
    HUBS = [[37, -122], [41, -74], [-23, -46], [51, 0], [6, 3], [-26, 28], [25, 55], [19, 73], [1, 104], [36, 140], [-34, 151], [56, 38]].map(function (ll) {
      var la = ll[0] * Math.PI / 180, lo = ll[1] * Math.PI / 180; return [Math.cos(la) * Math.cos(lo), Math.sin(la), -Math.cos(la) * Math.sin(lo)];
    });
    ARCS = [[0, 1], [1, 3], [3, 11], [11, 6], [6, 7], [7, 8], [8, 9], [9, 10], [3, 4], [4, 5], [2, 4], [1, 2], [0, 9], [5, 6], [7, 10], [8, 10], [2, 5], [0, 2], [3, 6], [1, 11]];
    ARC_OM = ARCS.map(function (p) { var a1 = HUBS[p[0]], b1 = HUBS[p[1]]; return Math.acos(clamp(a1[0] * b1[0] + a1[1] * b1[1] + a1[2] * b1[2], -1, 1)); });
    ARC_LIFT = ARC_OM.map(function (om) { return 0.06 + 0.2 * om / Math.PI; });
    NPK = ARCS.length * 3;
    PK_ARC = new Uint8Array(NPK); PK_A = new Uint8Array(NPK); PK_B = new Uint8Array(NPK); PK_P = new Float32Array(NPK); PK_S = new Float32Array(NPK); PK_H = new Float32Array(NPK);
    PULSE = new Float32Array(HUBS.length); ARC_ACT = new Float32Array(ARCS.length); ARC_FL = new Float32Array(ARCS.length);
    RINGS3 = [{ rad: 1.42, tilt: 0.36, yaw: 0, dir: 1, spd: 0.85 }, { rad: 1.72, tilt: -0.5, yaw: 0, dir: -1, spd: 0.62 }, { rad: 1.57, tilt: 1.2, yaw: 0.9, dir: 1, spd: 1.05 }];
    ORB_BASE = RINGS3.map(function () { var b = []; for (var q = 0; q < 7; q++) b.push(q / 7 * TAU + rand() * 0.4); return b; });
    for (k = 0; k < NPK; k++) {
      var ak = (k / 3) | 0, fwd = rand() < 0.55;
      PK_ARC[k] = ak; PK_A[k] = fwd ? ARCS[ak][0] : ARCS[ak][1]; PK_B[k] = fwd ? ARCS[ak][1] : ARCS[ak][0];
      PK_P[k] = rand(); PK_S[k] = 0.3 + rand() * 0.25;
    }
    var g3 = [], golden = Math.PI * (3 - Math.sqrt(5)), ns = Math.round(n * 0.42), no = Math.round(n * 0.16), nh = Math.round(n * 0.1), j3 = 0;
    pts = [];
    for (i = 0; i < n; i++) {
      if (i < ns) { var yy = 1 - 2 * (j3 + 0.5) / ns, rr = Math.sqrt(1 - yy * yy), aa = j3 * golden; j3++; pts.push([Math.cos(aa) * rr, yy, Math.sin(aa) * rr]); }
      else if (i < ns + no) {
        var rq = rand(), ri = rq < 0.38 ? 0 : rq < 0.7 ? 1 : 2, rgd = RINGS3[ri];
        FR3[i] = 3; FA3[i] = ri;
        FU3[i] = rand() < 0.68 ? ORB_BASE[ri][(rand() * 7) | 0] - rgd.dir * Math.pow(rand(), 1.5) * 0.45 : rand() * TAU;
        J3x[i] = (rand() * 2 - 1) * 0.02; J3y[i] = (rand() * 2 - 1) * 0.02; J3z[i] = (rand() * 2 - 1) * 0.02;
        pts.push(ringPt(rgd, FU3[i], [0, 0, 0]));
      }
      else if (i < ns + no + nh) {
        var hj = (rand() * HUBS.length) | 0, th3 = rand() * TAU, v3 = rand() * 2 - 1, q3 = Math.sqrt(1 - v3 * v3), m3 = 0.07 * (0.6 + 0.4 * rand());
        FR3[i] = 2; FA3[i] = hj; J3x[i] = Math.cos(th3) * q3 * m3; J3y[i] = v3 * m3; J3z[i] = Math.sin(th3) * q3 * m3;
        pts.push([HUBS[hj][0] * 1.03, HUBS[hj][1] * 1.03, HUBS[hj][2] * 1.03]);
      } else {
        FR3[i] = 1; FA3[i] = (rand() * NPK) | 0; FU3[i] = -Math.pow(rand(), 1.6) * 0.1;
        J3x[i] = (rand() * 2 - 1) * 0.018; J3y[i] = (rand() * 2 - 1) * 0.018; J3z[i] = (rand() * 2 - 1) * 0.018; pts.push([0, 0, 0]);
      }
    }
    storeKeep(3, pts);
    RINGS3.forEach(function (rg) { for (var s = 0; s < 72; s++) seg(g3, ringPt(rg, s / 72 * TAU, [0, 0, 0]), ringPt(rg, (s + 1) / 72 * TAU, [0, 0, 0])); });
    guides = [g0, g1, g2, g3];
  }
  function knot(u, out) {
    var f = u * TAU, r = Math.cos(3 * f) + 2.15;
    out[0] = r * Math.cos(2 * f) * 0.37; out[1] = -Math.sin(3 * f) * 0.4; out[2] = r * Math.sin(2 * f) * 0.37;
    return out;
  }

  /* ---------- phase machine ---------- */
  var phase = 0, tStart = 0.15, kq = [0, 0, 0];
  function announce() { document.dispatchEvent(new CustomEvent("cl:phase", { detail: { index: phase, duration: PERIOD, names: ["Architect", "Build", "Ship", "Scale"] } })); }
  function snapshot() { FX.set(CX); FY.set(CY); FZ.set(CZ); }
  function jump(k) { snapshot(); phase = ((k % 4) + 4) % 4; tStart = t; announce(); if (!running) still(); }

  /* ---------- simulation ---------- */
  var cyw = 1, syw = 0, cpt = 1, spt = 0;
  function update(dt) {
    var f = 1 - Math.exp(-dt * 3);
    cam.yaw += (cam.ty - cam.yaw) * f; cam.pitch += (cam.tp - cam.pitch) * f;
    if (t - tStart > PERIOD) { snapshot(); phase = (phase + 1) % 4; tStart += PERIOD; if (t - tStart > PERIOD) tStart = t; announce(); }
    var local = t - tStart, sx = SX[phase], sy = SY[phase], sz = SZ[phase], flow = t * 0.032, wob = 0.016, i;
    prepFrame();
    for (i = 0; i < N; i++) {
      var tx, ty, tz;
      if (phase === 2) {
        var lx = sx[i], ly = sy[i], lz = sz[i];
        if (FR2[i]) {
          var u2 = frac(FU2[i] + t * FS2[i]), w2 = J2x[i];
          lx = -0.8 - u2 * 1.25; ly = 0.18 - 0.16 * u2 * u2 + J2y[i] * u2 * 0.24; lz = w2 * 0.7 * (1 - 0.35 * u2) + J2z[i] * u2 * 0.24;
        }
        shipXf(lx, ly, lz, kq); tx = kq[0]; ty = kq[1]; tz = kq[2];
      } else if (phase === 3 && FR3[i] === 1) {
        var pk = FA3[i], ak3 = PK_ARC[pk], fw3 = ARCS[ak3][0] === PK_A[pk], u3 = clamp(PK_H[pk] + FU3[i], 0, 1);
        arcPt(HUBS[ARCS[ak3][0]], HUBS[ARCS[ak3][1]], ARC_OM[ak3], ARC_LIFT[ak3], fw3 ? u3 : 1 - u3, kq);
        tx = kq[0] + J3x[i]; ty = kq[1] + J3y[i]; tz = kq[2] + J3z[i];
      } else if (phase === 3 && FR3[i] === 3) {
        var rg3 = RINGS3[FA3[i]]; ringPt(rg3, FU3[i] + rg3.dir * t * rg3.spd, kq);
        tx = kq[0] + J3x[i]; ty = kq[1] + J3y[i]; tz = kq[2] + J3z[i];
      } else if (phase === 3 && FR3[i] === 2) {
        var hb = HUBS[FA3[i]], gr = 1 + 1.3 * PULSE[FA3[i]];
        tx = hb[0] * 1.03 + J3x[i] * gr; ty = hb[1] * 1.03 + J3y[i] * gr; tz = hb[2] * 1.03 + J3z[i] * gr;
      } else { tx = sx[i]; ty = sy[i]; tz = sz[i]; }
      var e = ease((local - dl[i]) / (MORPH - 0.55)), arc = Math.sin(Math.PI * e) * 0.9;
      var w = Math.sin(t * 1.4 + ph[i]) * wob;
      CX[i] = FX[i] + (tx - FX[i]) * e + cu[i] * arc + w;
      CY[i] = FY[i] + (ty - FY[i]) * e + cv[i] * arc + w;
      CZ[i] = FZ[i] + (tz - FZ[i]) * e + cw[i] * arc;
    }
    /* pointer: points within reach are pushed away, then spring home */
    var rr = 120 * 120;
    for (i = 0; i < N; i++) {
      vx[i] += -ox[i] * 9 * dt; vy[i] += -oy[i] * 9 * dt;
      vx[i] *= Math.exp(-dt * 4.2); vy[i] *= Math.exp(-dt * 4.2);
      ox[i] += vx[i] * dt; oy[i] += vy[i] * dt;
    }
    if (mouse.inside) {
      cyw = Math.cos(cam.yaw + t * 0.14); syw = Math.sin(cam.yaw + t * 0.14); cpt = Math.cos(cam.pitch); spt = Math.sin(cam.pitch);
      for (i = 0; i < N; i++) {
        var p = proj(CX[i], CY[i], CZ[i]), dx = p.x + ox[i] - mouse.x, dy = p.y + oy[i] - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < rr && d2 > 0.01) { var d = Math.sqrt(d2), k = (1 - d / 120) * 900 * dt; vx[i] += dx / d * k; vy[i] += dy / d * k; }
      }
    }
  }
  var P = { x: 0, y: 0, z: 0, s: 1 };
  function proj(x, y, z) {
    var x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y2 = y * cpt - z1 * spt, z2 = y * spt + z1 * cpt, s = CAM / (CAM - z2);
    P.x = cx + x1 * S * s; P.y = cy + y2 * S * s; P.z = z2; P.s = s; return P;
  }
  function burst(x, y) {
    for (var i = 0; i < N; i++) {
      var p = proj(CX[i], CY[i], CZ[i]), dx = p.x + ox[i] - x, dy = p.y + oy[i] - y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      if (d < 320) { var k = (1 - d / 320) * 900; vx[i] += dx / d * k; vy[i] += dy / d * k; }
    }
  }

  /* ---------- drawing ---------- */
  function gpt(x, y, z) { if (phase === 2) { shipXf(x, y, z, kq2); return proj(kq2[0], kq2[1], kq2[2]); } return proj(x, y, z); }
  /* Scale: connections light up while data is on them, packets run as comets, hubs flare on arrival */
  function drawNet(vis) {
    if (vis < 0.02 || !NPK) return;
    var k, j, sgm, u, lx, ly, lz, dn, q = [0, 0, 0];
    if (dark) ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (k = 0; k < ARCS.length; k++) {
      var A3 = HUBS[ARCS[k][0]], B3 = HUBS[ARCS[k][1]], act = ARC_ACT[k], fl = ARC_FL[k], base = Math.min(1, 0.1 + 0.45 * act + 0.9 * fl);
      arcPt(A3, B3, ARC_OM[k], ARC_LIFT[k], 0, q); proj(q[0], q[1], q[2]); lx = P.x; ly = P.y; lz = P.z;
      ctx.lineWidth = 1 + act * 0.8 + fl * 1.6;
      for (sgm = 1; sgm <= 22; sgm++) {
        arcPt(A3, B3, ARC_OM[k], ARC_LIFT[k], sgm / 22, q); proj(q[0], q[1], q[2]);
        dn = clamp(((P.z + lz) * 0.5 + 1.1) / 2.2, 0.12, 1);
        ctx.strokeStyle = rgba(col.accent, base * dn * vis); ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(P.x, P.y); ctx.stroke();
        lx = P.x; ly = P.y; lz = P.z;
      }
    }
    for (k = 0; k < NPK; k++) {
      var ak = PK_ARC[k], fw = ARCS[ak][0] === PK_A[k], h = PK_H[k], tail = Math.max(0, h - 0.17), A4 = HUBS[ARCS[ak][0]], B4 = HUBS[ARCS[ak][1]];
      if (h < 0.01) continue;
      arcPt(A4, B4, ARC_OM[ak], ARC_LIFT[ak], fw ? tail : 1 - tail, q); proj(q[0], q[1], q[2]); lx = P.x; ly = P.y; lz = P.z;
      for (sgm = 1; sgm <= 10; sgm++) {
        u = tail + (h - tail) * sgm / 10;
        arcPt(A4, B4, ARC_OM[ak], ARC_LIFT[ak], fw ? u : 1 - u, q); proj(q[0], q[1], q[2]);
        dn = clamp(((P.z + lz) * 0.5 + 1.1) / 2.2, 0.1, 1);
        ctx.strokeStyle = rgba(dark ? col.hi : col.accent, (0.1 + 0.9 * sgm / 10) * dn * vis);
        ctx.lineWidth = 0.8 + 1.8 * sgm / 10; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(P.x, P.y); ctx.stroke();
        lx = P.x; ly = P.y; lz = P.z;
      }
      dn = clamp((lz + 1.1) / 2.2, 0.1, 1);
      ctx.globalAlpha = dn * vis; ctx.drawImage(spriteHi, lx - 7, ly - 7, 14, 14); ctx.globalAlpha = 1;
    }
    /* orbiting data: bright packets racing around the rings */
    for (k = 0; k < RINGS3.length; k++) {
      var rgo = RINGS3[k];
      for (j = 0; j < ORB_BASE[k].length; j++) {
        var head = ORB_BASE[k][j] + rgo.dir * t * rgo.spd, tl = 0.42;
        ringPt(rgo, head - rgo.dir * tl, q); proj(q[0], q[1], q[2]); lx = P.x; ly = P.y; lz = P.z;
        for (sgm = 1; sgm <= 10; sgm++) {
          ringPt(rgo, head - rgo.dir * tl * (1 - sgm / 10), q); proj(q[0], q[1], q[2]);
          dn = clamp(((P.z + lz) * 0.5 + 1.6) / 3.2, 0.12, 1);
          ctx.strokeStyle = rgba(dark ? col.hi : col.accent, (0.08 + 0.92 * sgm / 10) * dn * vis);
          ctx.lineWidth = 0.7 + 1.6 * sgm / 10; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(P.x, P.y); ctx.stroke();
          lx = P.x; ly = P.y; lz = P.z;
        }
        dn = clamp((lz + 1.6) / 3.2, 0.12, 1);
        ctx.globalAlpha = dn * vis; ctx.drawImage(spriteHi, lx - 8, ly - 8, 16, 16); ctx.globalAlpha = 1;
      }
    }
    /* flash connections: strike fast, then fade */
    for (k = 0; k < FLASHES.length; k++) {
      var f5 = FLASHES[k], age5 = t - f5.t0, grow = clamp(age5 / 0.28, 0, 1), fade = age5 < 0.28 ? 1 : clamp(1 - (age5 - 0.28) / 0.9, 0, 1);
      if (fade <= 0) continue;
      var FA = HUBS[f5.a], FB = HUBS[f5.b];
      arcPt(FA, FB, f5.om, f5.lift, 0, q); proj(q[0], q[1], q[2]); lx = P.x; ly = P.y; lz = P.z;
      for (sgm = 1; sgm <= 18; sgm++) {
        u = grow * sgm / 18;
        arcPt(FA, FB, f5.om, f5.lift, u, q); proj(q[0], q[1], q[2]);
        dn = clamp(((P.z + lz) * 0.5 + 1.1) / 2.2, 0.12, 1);
        var near = grow < 1 ? 0.3 + 0.7 * sgm / 18 : 1;
        ctx.strokeStyle = rgba(dark ? col.hi : col.accent, near * fade * dn * vis);
        ctx.lineWidth = (0.8 + 1.4 * fade) * (grow < 1 ? 0.6 + 0.6 * sgm / 18 : 1); ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(P.x, P.y); ctx.stroke();
        lx = P.x; ly = P.y; lz = P.z;
      }
      if (grow < 1) { dn = clamp((lz + 1.1) / 2.2, 0.12, 1); ctx.globalAlpha = dn * vis; ctx.drawImage(spriteHi, lx - 9, ly - 9, 18, 18); ctx.globalAlpha = 1; }
    }
    for (j = 0; j < HUBS.length; j++) {
      var p = PULSE[j], hb = HUBS[j];
      proj(hb[0] * 1.03, hb[1] * 1.03, hb[2] * 1.03); dn = clamp((P.z + 1.1) / 2.2, 0.1, 1);
      var sz = 12 + 46 * p;
      ctx.globalAlpha = (0.35 + 0.65 * p) * dn * vis; ctx.drawImage(sprite, P.x - sz / 2, P.y - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    cyw = Math.cos(cam.yaw + t * 0.14); syw = Math.sin(cam.yaw + t * 0.14); cpt = Math.cos(cam.pitch); spt = Math.sin(cam.pitch);
    var local = t - tStart, settle = clamp((local - MORPH + 0.1) / 0.7, 0, 1) * clamp((PERIOD - local) / 0.5, 0, 1), i;

    /* bloom behind the form */
    var aura = ctx.createRadialGradient(cx, cy, S * 0.2, cx, cy, S * 2.6);
    aura.addColorStop(0, rgba(col.accent, dark ? 0.16 : 0.1)); aura.addColorStop(1, rgba(col.accent, 0));
    ctx.fillStyle = aura; ctx.fillRect(cx - S * 2.6, cy - S * 2.6, S * 5.2, S * 5.2);

    /* the form's structure lines fade in once the points settle */
    var g = guides[phase];
    if (g && g.length && settle > 0.01) {
      ctx.lineWidth = 1; ctx.strokeStyle = rgba(col.accent, (dark ? 0.32 : 0.4) * settle); ctx.beginPath();
      for (i = 0; i < g.length; i++) { var q = g[i]; gpt(q[0], q[1], q[2]); ctx.moveTo(P.x, P.y); gpt(q[3], q[4], q[5]); ctx.lineTo(P.x, P.y); }
      ctx.stroke();
    }

    /* points */
    if (dark) ctx.globalCompositeOperation = "lighter";
    for (i = 0; i < N; i++) {
      proj(CX[i], CY[i], CZ[i]);
      var x = P.x + ox[i], y = P.y + oy[i];
      if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
      var dn = clamp((P.z + 1.8) / 3.6, 0, 1), sz = (hi[i] ? 7.5 : 5.2) * (0.55 + 0.75 * dn) * P.s * (S / 150 > 1 ? 1 : 0.85);
      ctx.globalAlpha = (0.16 + 0.84 * dn * dn) * (hi[i] ? 1 : 0.85);
      ctx.drawImage(hi[i] ? spriteHi : sprite, x - sz / 2, y - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    if (phase === 3) drawNet(clamp((local - 0.9) / 0.9, 0, 1) * clamp((PERIOD - local) / 0.5, 0, 1));
  }

  /* ---------- running, sizing, input ---------- */
  function frame(now) {
    if (!running) return;
    var dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000)); last = now; t += dt;
    update(dt); draw();
    window.requestAnimationFrame(frame);
  }
  function setRunning() {
    var want = !reduced && onScreen && !document.hidden;
    if (want && !running) { running = true; last = performance.now(); window.requestAnimationFrame(frame); }
    else if (!want) running = false;
  }
  function still() { update(0.016); draw(); }
  function resize() {
    var r = host.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    W = Math.round(r.width); H = Math.round(r.height);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var wide = W >= 1000;
    cx = wide ? W * 0.7 : W / 2; cy = H / 2 + (wide ? 6 : 0);
    S = wide ? Math.min(H * 0.23, W * 0.118) : Math.min(H * 0.27, W * 0.27);
    if (!running) still();
  }

  readColours();
  build(window.innerWidth < 700 ? 1100 : window.innerWidth < 1100 ? 1800 : 2600);
  if (reduced) { phase = 3; tStart = -10; t = 0; }
  announce();
  resize();
  window.CLHero = { jump: jump };

  if (window.ResizeObserver) new ResizeObserver(resize).observe(host); else window.addEventListener("resize", resize);
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; setRunning(); }, { threshold: 0.02 }).observe(host);
  document.addEventListener("visibilitychange", setRunning);
  document.addEventListener("cl:palette", function () { readColours(); if (!running) still(); });

  if (!reduced && hero) {
    hero.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      mouse.inside = mouse.x >= 0 && mouse.y >= 0 && mouse.x <= r.width && mouse.y <= r.height && !e.target.closest(".h-hero__copy");
      cam.ty = clamp((mouse.x - cx) / (r.width * 0.5), -1.5, 1.5) * 0.35;
      cam.tp = 0.42 + clamp((mouse.y - cy) / (r.height * 0.5), -1, 1) * 0.18;
    });
    hero.addEventListener("pointerleave", function () { mouse.inside = false; cam.ty = 0; cam.tp = 0.42; });
    hero.addEventListener("click", function (e) {
      if (e.target.closest("a, button, .h-hero__copy")) return;
      var r = canvas.getBoundingClientRect(); burst(e.clientX - r.left, e.clientY - r.top);
    });
  }
  setRunning();
})();
