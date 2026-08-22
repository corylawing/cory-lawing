/* ---------------------------------------------------------------------------
   app.js — user interface.
   Nothing here talks to a server. The only thing stored is the rotation
   settings and the two parents' names: in this browser (localStorage) and,
   if you use "copy link", inside the link itself. No judgment text is kept.
--------------------------------------------------------------------------- */
(function () {
  const V = window.Vacances, E = window.Engine, H = V.helpers;
  const { D, ISO, addDays, dayDiff } = H;

  const RANGE_FROM = '2026-07-01';
  const RANGE_TO   = '2036-12-31';
  const STORE_KEY  = 'calendrier-garde/v1';

  /* ------------------------------ wording ------------------------------- */
  const I18N = {
    fr: {
      title: 'Calendrier de garde', sub: 'Zone B · Académie d’Aix-Marseille',
      today: 'Aujourd’hui', with: 'Les enfants sont chez',
      until: 'jusqu’au {d} à {t}', untilNoTime: 'jusqu’au {d}',
      next: 'Prochains échanges', handoverTo: 'passage chez {n}',
      month: 'Mois', year: 'Année', hol: 'Vacances',
      settings: 'Réglages', todayBtn: 'Aujourd’hui',
      schoolYear: 'Année scolaire {y}',
      dows: ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'],
      months: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
      vac: { toussaint:'Toussaint', noel:'Noël', hiver:'Hiver', printemps:'Printemps', ascension:'Ascension', ete:'Été' },
      fer: { jourAn:'Jour de l’An', paques:'Lundi de Pâques', travail:'Fête du Travail', victoire:'8 Mai',
             ascension:'Ascension', pentecote:'Lundi de Pentecôte', nationale:'14 Juillet',
             assomption:'Assomption', toussaint:'Toussaint', armistice:'11 Novembre', noel:'Noël' },
      half1: '1re moitié', half2: '2e moitié', holidays: 'Vacances scolaires',
      official: 'dates officielles', projected: 'dates prévisionnelles',
      legendA: 'Chez {n}', legendB: 'Chez {n}', legendVac: 'Vacances scolaires', legendToday: 'Aujourd’hui',
      legendHand: 'échange',
      copy: 'Copier le lien à partager', copied: 'Lien copié ✓',
      ics: 'Ajouter à mon téléphone (.ics)', print: 'Imprimer / PDF',
      confirmTitle: 'Vérifiez les réglages avant de partager ce calendrier',
      confirmBody: 'Ces réglages sont des valeurs par défaut, pas le contenu de votre jugement. Ouvrez « Réglages » et vérifiez chaque ligne contre le jugement, puis confirmez.',
      confirmBtn: 'J’ai vérifié — ces réglages correspondent au jugement',
      projWarn: 'Dates prévisionnelles à partir de septembre 2028',
      projWarnBody: 'Le ministère publie le calendrier scolaire environ trois ans à l’avance. Les dates officielles vont jusqu’à l’été 2028. Au-delà, les vacances sont estimées et signalées « prévisionnel » ; l’alternance semaine/semaine, elle, reste exacte.',
      rot: 'Alternance', holRule: 'Règle des vacances',
      disclaimer: 'Cet outil est une aide à la lecture du planning. En cas de désaccord, seul le jugement fait foi. Dates scolaires : Zone B, académie d’Aix-Marseille (arrêtés du 22 octobre 2025 et du 21 juillet 2026).',
      privacy: 'Aucune donnée n’est envoyée sur Internet. Les réglages restent dans ce navigateur et dans le lien que vous partagez.',
      // settings
      sTitle: 'Réglages', sSub: 'À renseigner d’après le jugement.',
      sNameA: 'Nom du parent A', sNameB: 'Nom du parent B',
      sPattern: 'Rythme pendant l’école',
      pWeek: 'Une semaine / une semaine', pWeekD: 'Résidence alternée classique : les enfants changent chaque semaine.',
      pFort: 'Deux semaines / deux semaines', pFortD: 'Les enfants changent tous les quinze jours.',
      p223: 'Rotation 2-2-3', p223D: '2 nuits / 2 nuits / 3 nuits, puis on inverse.',
      pEow: 'Un week-end sur deux', pEowD: 'Les enfants vivent chez un parent ; l’autre a un week-end sur deux.',
      sResident: 'Résidence principale chez',
      sAnchor: 'Point de départ de l’alternance', sAnchorH: 'Par défaut : début des vacances d’été 2026.',
      sAnchorParent: 'À cette date, les enfants sont chez',
      sBoundary: 'Jour de l’échange', sTime: 'Heure de l’échange',
      dFri: 'Vendredi', dSun: 'Dimanche', dSat: 'Samedi', dMon: 'Lundi',
      sHol: 'Vacances scolaires',
      hAlt: 'Moitié / moitié, en alternant chaque année', hAltD: 'Chaque période coupée en deux ; celui qui prend la 1re moitié change d’une année sur l’autre.',
      hFix: 'Moitié / moitié, toujours dans le même ordre', hFixD: 'Le même parent prend toujours la première moitié.',
      hCont: 'L’alternance continue normalement', hContD: 'Aucune règle particulière : le rythme habituel se poursuit pendant les vacances.',
      sAltBasis: 'L’alternance des moitiés change',
      abSchool: 'À chaque année scolaire', abCalendar: 'À chaque année civile (1er janvier)',
      sAltBasisH: 'Année scolaire : toute l’année 2026-2027 suit le même ordre. Année civile : l’ordre s’inverse au 1er janvier, au milieu de l’année scolaire.',
      sHolStart: 'Début des vacances',
      hsFri: 'Le vendredi, à la sortie des classes',
      hsExact: 'Le samedi, date exacte de l’arrêté',
      sHolStartH: 'Les arrêtés font commencer les vacances le samedi, mais il n’y a pas école ce jour-là. « Sortie des classes » correspond à ce que disent la plupart des jugements et évite un échange inutile la veille des vacances.',
      sFirstHalf: 'Première moitié (années paires) pour',
      sSplitShort: 'Couper aussi le pont de l’Ascension',
      save: 'Enregistrer', reset: 'Réinitialiser', close: 'Fermer',
      nights: '{n} nuits', days: '{n} jours',
      beforeStart: 'Avant le début du calendrier',
    },
    en: {
      title: 'Custody calendar', sub: 'Zone B · Aix-Marseille education district',
      today: 'Today', with: 'The children are with',
      until: 'until {d} at {t}', untilNoTime: 'until {d}',
      next: 'Next handovers', handoverTo: 'moves to {n}',
      month: 'Month', year: 'Year', hol: 'Holidays',
      settings: 'Settings', todayBtn: 'Today',
      schoolYear: 'School year {y}',
      dows: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
      vac: { toussaint:'October half-term', noel:'Christmas', hiver:'February half-term', printemps:'Spring', ascension:'Ascension break', ete:'Summer' },
      fer: { jourAn:'New Year’s Day', paques:'Easter Monday', travail:'Labour Day', victoire:'VE Day',
             ascension:'Ascension', pentecote:'Whit Monday', nationale:'Bastille Day',
             assomption:'Assumption', toussaint:'All Saints', armistice:'Armistice Day', noel:'Christmas Day' },
      half1: '1st half', half2: '2nd half', holidays: 'School holidays',
      official: 'official dates', projected: 'projected dates',
      legendA: 'With {n}', legendB: 'With {n}', legendVac: 'School holidays', legendToday: 'Today',
      legendHand: 'handover',
      copy: 'Copy link to share', copied: 'Link copied ✓',
      ics: 'Add to my phone (.ics)', print: 'Print / PDF',
      confirmTitle: 'Check the settings before sharing this calendar',
      confirmBody: 'These settings are defaults, not the contents of your judgment. Open “Settings”, check every line against the judgment, then confirm.',
      confirmBtn: 'Checked — these settings match the judgment',
      projWarn: 'Projected dates from September 2028 onwards',
      projWarnBody: 'The ministry publishes the school calendar about three years ahead. Official dates run to summer 2028. Beyond that, holidays are estimates and marked “projected”; the week-on/week-off rotation itself stays exact.',
      rot: 'Rotation', holRule: 'Holiday rule',
      disclaimer: 'This tool is a reading aid for the schedule. If there is any disagreement, only the judgment counts. School dates: Zone B, Aix-Marseille district (decrees of 22 October 2025 and 21 July 2026).',
      privacy: 'Nothing is sent over the internet. Settings stay in this browser and in the link you share.',
      sTitle: 'Settings', sSub: 'Fill these in from the judgment.',
      sNameA: 'Parent A’s name', sNameB: 'Parent B’s name',
      sPattern: 'Rhythm during term time',
      pWeek: 'One week / one week', pWeekD: 'Standard shared residence: the children swap every week.',
      pFort: 'Two weeks / two weeks', pFortD: 'The children swap every fortnight.',
      p223: '2-2-3 rotation', p223D: '2 nights / 2 nights / 3 nights, then it flips.',
      pEow: 'Every other weekend', pEowD: 'The children live with one parent; the other has one weekend in two.',
      sResident: 'Main home with',
      sAnchor: 'Start point of the rotation', sAnchorH: 'Default: the start of the 2026 summer holidays.',
      sAnchorParent: 'On that date, the children are with',
      sBoundary: 'Handover day', sTime: 'Handover time',
      dFri: 'Friday', dSun: 'Sunday', dSat: 'Saturday', dMon: 'Monday',
      sHol: 'School holidays',
      hAlt: 'Half and half, alternating each year', hAltD: 'Each period cut in two; whoever takes the 1st half swaps from one year to the next.',
      hFix: 'Half and half, always the same order', hFixD: 'The same parent always takes the first half.',
      hCont: 'The rotation simply continues', hContD: 'No special rule: the usual rhythm runs through the holidays.',
      sAltBasis: 'The halves swap over',
      abSchool: 'Every school year', abCalendar: 'Every calendar year (1 January)',
      sAltBasisH: 'School year: the whole of 2026-2027 follows the same order. Calendar year: the order flips on 1 January, halfway through the school year.',
      sHolStart: 'Holidays begin',
      hsFri: 'Friday, at the end of the school day',
      hsExact: 'Saturday, the literal date in the decree',
      sHolStartH: 'The decrees start holidays on a Saturday, but there is no school that day. “End of the school day” matches what most judgments say and avoids a pointless handover the evening before a holiday.',
      sFirstHalf: 'First half (even years) goes to',
      sSplitShort: 'Also split the Ascension long weekend',
      save: 'Save', reset: 'Reset', close: 'Close',
      nights: '{n} nights', days: '{n} days',
      beforeStart: 'Before the calendar starts',
    },
  };

  let lang = (navigator.language || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr';
  const t = (k, vars) => {
    let s = I18N[lang][k];
    if (s == null) return k;
    if (vars) for (const [a, b] of Object.entries(vars)) s = s.replace(`{${a}}`, b);
    return s;
  };
  const L = () => I18N[lang];

  /* ------------------------------- state -------------------------------- */
  let cfg = loadCfg();
  let plan = null;
  let view = 'month';
  let cur = clampToRange(new Date());

  const TODAY_ISO = ISO(new Date());

  function nameOf(p) { return (p === 'A' ? cfg.a : cfg.b) || (p === 'A' ? 'Parent A' : 'Parent B'); }

  function loadCfg() {
    // A shared link wins over whatever this browser remembers.
    const hash = location.hash.match(/cfg=([A-Za-z0-9_-]+)/);
    if (hash) {
      try {
        const json = atob(hash[1].replace(/-/g, '+').replace(/_/g, '/'));
        return { ...E.DEFAULTS, ...JSON.parse(json) };
      } catch (e) { /* fall through to local */ }
    }
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return { ...E.DEFAULTS, ...JSON.parse(raw) };
    } catch (e) { /* private mode, ignore */ }
    return { ...E.DEFAULTS };
  }
  function saveCfg() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(cfg)); } catch (e) {}
  }
  function clampToRange(dt) {
    const lo = D(RANGE_FROM), hi = D(RANGE_TO);
    const u = D(ISO(dt));
    return u < lo ? lo : u > hi ? hi : u;
  }
  function rebuild() { plan = E.plan(cfg, RANGE_FROM, RANGE_TO); }

  /* ---------------------------- formatting ------------------------------ */
  const fmtLong  = (dt) => new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB',
    { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(dt);
  const fmtShort = (dt) => new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB',
    { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(dt);
  const fmtFull  = (dt) => new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(dt);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /** Does this period fall wholly inside officially published dates? */
  const isProjected = (p) => p.projected || p.resumeProjected;

  /* ------------------------------ rendering ----------------------------- */
  function render() {
    document.documentElement.lang = lang;
    document.title = t('title');
    $('#brandTitle').textContent = t('title');
    $('#brandSub').textContent = t('sub');
    $('#langBtn').textContent = lang === 'fr' ? 'EN' : 'FR';
    $('#settingsBtn').innerHTML = '⚙ ' + t('settings');
    $('#todayBtn').textContent = t('todayBtn');
    $('#tabMonth').textContent = t('month');
    $('#tabYear').textContent = t('year');
    $('#tabHol').textContent = t('hol');
    $('#copyBtn').textContent = t('copy');
    $('#icsBtn').textContent = t('ics');
    $('#printBtn').textContent = t('print');
    $('#disclaimer').textContent = t('disclaimer');
    $('#privacy').textContent = t('privacy');

    ['month','year','hol'].forEach((v) => {
      const el = $('#tab' + cap(v === 'hol' ? 'hol' : v));
      if (el) el.setAttribute('aria-pressed', String(view === v));
    });

    renderConfirm();
    renderHero();
    renderUpcoming();
    renderProjWarn();

    const root = $('#viewRoot');
    root.innerHTML = '';
    if (view === 'month') { $('#periodLabel').textContent = `${L().months[cur.getUTCMonth()]} ${cur.getUTCFullYear()}`; root.appendChild(monthCard(cur.getUTCFullYear(), cur.getUTCMonth())); }
    else if (view === 'year') { $('#periodLabel').textContent = String(cur.getUTCFullYear()); root.appendChild(yearView(cur.getUTCFullYear())); }
    else { const sy = schoolYearOf(cur); $('#periodLabel').textContent = t('schoolYear', { y: sy }); root.appendChild(holView(sy)); }

    renderLegend();
  }

  function renderConfirm() {
    const b = $('#confirmBanner');
    b.classList.toggle('hidden', !!cfg.confirmed);
    if (cfg.confirmed) return;
    b.innerHTML = `<div>⚠</div><div><strong>${esc(t('confirmTitle'))}</strong>${esc(t('confirmBody'))}
      <div><button class="btn small" id="confirmBtn">${esc(t('confirmBtn'))}</button></div></div>`;
    $('#confirmBtn').onclick = () => { cfg.confirmed = true; saveCfg(); render(); };
  }

  function renderProjWarn() {
    const b = $('#projBanner');
    const showing = cur.getUTCFullYear();
    b.classList.toggle('hidden', showing < 2028);
    if (showing < 2028) return;
    b.innerHTML = `<div>📅</div><div><strong>${esc(t('projWarn'))}</strong>${esc(t('projWarnBody'))}</div>`;
  }

  function renderHero() {
    const d = plan.get(TODAY_ISO) || plan.get(RANGE_FROM);
    const hero = $('#hero');
    hero.className = 'hero p' + d.parent;

    // walk forward to the last day of the current block
    let end = d.date;
    for (;;) {
      const nxt = plan.get(ISO(addDays(end, 1)));
      if (!nxt || nxt.parent !== d.parent) break;
      end = nxt.date;
    }
    const nextDay = plan.get(ISO(addDays(end, 1)));
    const untilTxt = t('until', { d: fmtLong(addDays(end, 1)), t: cfg.time });

    const chips = [];
    if (d.period) {
      chips.push(`${L().vac[d.period.key]}${d.half ? ' · ' + t('half' + d.half) : ''}`);
      if (isProjected(d.period)) chips.push(t('projected'));
    }
    if (d.ferie) chips.push(L().fer[d.ferie]);

    hero.innerHTML = `
      <div class="label">${esc(t('today'))} · ${esc(cap(fmtFull(d.date)))}</div>
      <div class="who">${esc(t('with'))} ${esc(nameOf(d.parent))}</div>
      <div class="until">${nextDay ? esc(untilTxt) : ''}</div>
      ${chips.length ? `<div class="ctx">${chips.map((c) => `<span class="chip">${esc(c)}</span>`).join('')}</div>` : ''}`;
  }

  function renderUpcoming() {
    const hs = E.nextHandovers(plan, TODAY_ISO, 4);
    $('#upcomingTitle').textContent = t('next');
    $('#upcoming').innerHTML = hs.map((h) => {
      const reason = h.period ? `${L().vac[h.period.key]}${h.half ? ' · ' + t('half' + h.half) : ''}` : t('rot');
      return `<div class="hand">
        <div class="when">${esc(cap(fmtLong(h.date)))} · ${esc(cfg.time)}</div>
        <div class="move"><span class="who-i" style="background:var(--${h.parent === 'A' ? 'a' : 'b'});color:#fff;width:18px;height:18px;border-radius:5px;display:grid;place-items:center;font-size:.66rem;font-weight:800">${h.parent}</span>
          ${esc(t('handoverTo', { n: nameOf(h.parent) }))} · <span style="opacity:.8">${esc(reason)}</span></div>
      </div>`;
    }).join('');
  }

  function dayCell(dt, inMonth) {
    const iso = ISO(dt), d = plan.get(iso);
    const el = document.createElement('div');
    if (!d) { el.className = 'day out'; el.innerHTML = `<div class="num">${dt.getUTCDate()}</div>`; return el; }

    el.className = 'day p' + d.parent + (inMonth ? '' : ' out') + (d.period ? ' vacday' : '') +
      (d.isHandover ? ' handover' : '') + (iso === TODAY_ISO ? ' today' : '');
    if (d.isHandover && d.from) el.style.setProperty('--out-c', `var(--${d.from === 'A' ? 'a' : 'b'})`);
    el.title = `${cap(fmtFull(dt))} — ${nameOf(d.parent)}` +
      (d.period ? ` · ${L().vac[d.period.key]}${d.half ? ' ' + t('half' + d.half) : ''}` : '') +
      (d.ferie ? ` · ${L().fer[d.ferie]}` : '');

    let html = `<div class="num"><span>${dt.getUTCDate()}</span><span class="who-i">${d.parent}</span></div>`;
    if (d.period && dt.getUTCDate() === 1 || (d.period && dayDiff(d.period.start, dt) === 0)) {
      html += `<span class="tag vac">${esc(L().vac[d.period.key])}${d.half ? ' ' + esc(t('half' + d.half)) : ''}</span>`;
      if (isProjected(d.period)) html += `<span class="tag proj">${esc(t('projected'))}</span>`;
    }
    if (d.ferie) html += `<span class="tag fer">${esc(L().fer[d.ferie])}</span>`;
    if (d.isHandover) html += `<span class="hx">⇄<span class="hxt"> ${esc(cfg.time)}</span></span>`;
    el.innerHTML = html;
    return el;
  }

  function monthCard(year, month) {
    const card = document.createElement('div'); card.className = 'card';
    const dow = document.createElement('div'); dow.className = 'dow';
    dow.innerHTML = L().dows.map((x) => `<span>${x}</span>`).join('');
    const grid = document.createElement('div'); grid.className = 'grid';

    const first = new Date(Date.UTC(year, month, 1));
    const lead = (first.getUTCDay() + 6) % 7;            // Monday-first
    let dt = addDays(first, -lead);
    for (let i = 0; i < 42; i++) {
      grid.appendChild(dayCell(dt, dt.getUTCMonth() === month));
      dt = addDays(dt, 1);
      if (i >= 34 && dt.getUTCMonth() !== month && dt.getUTCDay() === 1) break;
    }
    card.appendChild(dow); card.appendChild(grid);
    return card;
  }

  function yearView(year) {
    const wrap = document.createElement('div'); wrap.className = 'year';
    for (let m = 0; m < 12; m++) {
      const box = document.createElement('div'); box.className = 'mini';
      const h = document.createElement('h3'); h.textContent = L().months[m];
      const mg = document.createElement('div'); mg.className = 'mg';
      L().dows.forEach((x) => { const s = document.createElement('span'); s.className = 'blank'; s.textContent = x[0]; mg.appendChild(s); });
      const first = new Date(Date.UTC(year, m, 1));
      const lead = (first.getUTCDay() + 6) % 7;
      for (let i = 0; i < lead; i++) { const s = document.createElement('span'); s.className = 'blank'; mg.appendChild(s); }
      const dim = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
      let covered = 0;
      for (let day = 1; day <= dim; day++) {
        const dt = new Date(Date.UTC(year, m, day)), iso = ISO(dt), d = plan.get(iso);
        const s = document.createElement('span');
        s.className = d ? 'p' + d.parent + (d.period ? ' vac' : '') + (iso === TODAY_ISO ? ' today' : '') : 'blank';
        s.textContent = day;
        if (d) { covered++; s.title = `${cap(fmtFull(dt))} — ${nameOf(d.parent)}` + (d.period ? ` · ${L().vac[d.period.key]}` : ''); }
        mg.appendChild(s);
      }
      box.appendChild(h); box.appendChild(mg);
      if (!covered) {
        const note = document.createElement('div');
        note.className = 'outside';
        note.textContent = t('beforeStart');
        box.appendChild(note);
      }
      wrap.appendChild(box);
    }
    return wrap;
  }

  function schoolYearOf(dt) {
    const y = dt.getUTCFullYear();
    return dt.getUTCMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
  }

  function holView(sy) {
    const wrap = document.createElement('div'); wrap.className = 'vlist';
    const periods = E.periodsFor(cfg, RANGE_FROM, RANGE_TO).filter((p) => p.sy === sy);
    if (!periods.length) { wrap.innerHTML = `<div class="vrow">—</div>`; return wrap; }

    for (const p of periods) {
      const total = dayDiff(p.start, p.last) + 1;
      const half = Math.ceil(total / 2);
      const midEnd = addDays(p.start, half - 1);
      const d1 = plan.get(ISO(p.start)), d2 = plan.get(ISO(addDays(midEnd, 1))) || plan.get(ISO(p.last));
      // Only call it a half-split when the holiday RULE actually applied; if the
      // rotation just ran through, show the real blocks instead.
      const split = !!(d1 && d2 && d1.src === 'holiday');

      const row = document.createElement('div'); row.className = 'vrow';
      let html = `<h3>${esc(L().vac[p.key])}
        <span class="pill ${isProjected(p) ? '' : 'ok'}">${esc(isProjected(p) ? t('projected') : t('official'))}</span></h3>
        <div class="dates">${esc(cap(fmtLong(p.start)))} → ${esc(cap(fmtLong(p.last)))} · ${esc(t('days', { n: total }))}</div>`;

      if (split) {
        html += `<div class="halves">
          <div class="halfbox p${d1.parent}"><b>${esc(t('half1'))}</b><span class="nm">${esc(nameOf(d1.parent))}</span>
            <div>${esc(fmtShort(p.start))} → ${esc(fmtShort(midEnd))}</div></div>
          <div class="halfbox p${d2.parent}"><b>${esc(t('half2'))}</b><span class="nm">${esc(nameOf(d2.parent))}</span>
            <div>${esc(fmtShort(addDays(midEnd, 1)))} → ${esc(fmtShort(p.last))}</div></div>
        </div>`;
      } else {
        // rotation runs through: show the actual blocks inside the period
        const inner = E.blocks(new Map([...plan].filter(([k]) => k >= ISO(p.start) && k <= ISO(p.last))));
        html += `<div class="halves">` + inner.map((b) => `<div class="halfbox p${b.parent}">
          <b>${esc(t('days', { n: b.days }))}</b><span class="nm">${esc(nameOf(b.parent))}</span>
          <div>${esc(fmtShort(b.start))} → ${esc(fmtShort(b.end))}</div></div>`).join('') + `</div>`;
      }
      row.innerHTML = html; wrap.appendChild(row);
    }
    return wrap;
  }

  function renderLegend() {
    $('#legend').innerHTML = `
      <span class="k"><span class="sw a"></span>${esc(t('legendA', { n: nameOf('A') }))}</span>
      <span class="k"><span class="sw b"></span>${esc(t('legendB', { n: nameOf('B') }))}</span>
      <span class="k"><span class="sw v"></span>${esc(t('legendVac'))}</span>
      <span class="k"><span class="sw" style="outline:2px solid var(--ink);outline-offset:-2px"></span>${esc(t('legendToday'))}</span>
      <span class="k">⇄ ${esc(t('legendHand'))} ${esc(cfg.time)}</span>`;
  }

  /* ------------------------------ settings ------------------------------ */
  function openSettings() {
    const s = $('#drawer'), scrim = $('#scrim');
    const radio = (name, val, cur, title, desc) => `<label><input type="radio" name="${name}" value="${val}" ${cur === val ? 'checked' : ''}>
      <span><span class="t">${esc(title)}</span><br><span class="d">${esc(desc)}</span></span></label>`;
    const opt = (v, l, cur) => `<option value="${v}" ${String(cur) === String(v) ? 'selected' : ''}>${esc(l)}</option>`;

    s.innerHTML = `
      <h2>${esc(t('sTitle'))}</h2><div class="sub">${esc(t('sSub'))}</div>

      <div class="field"><label for="fA">${esc(t('sNameA'))}</label><input type="text" id="fA" value="${esc(cfg.a)}"></div>
      <div class="field"><label for="fB">${esc(t('sNameB'))}</label><input type="text" id="fB" value="${esc(cfg.b)}"></div>

      <div class="field"><label>${esc(t('sPattern'))}</label><div class="radios">
        ${radio('pat','week',cfg.pattern,t('pWeek'),t('pWeekD'))}
        ${radio('pat','fortnight',cfg.pattern,t('pFort'),t('pFortD'))}
        ${radio('pat','223',cfg.pattern,t('p223'),t('p223D'))}
        ${radio('pat','eow',cfg.pattern,t('pEow'),t('pEowD'))}
      </div></div>

      <div class="field" id="wrapResident" ${cfg.pattern === 'eow' ? '' : 'hidden'}>
        <label for="fRes">${esc(t('sResident'))}</label>
        <select id="fRes">${opt('A', nameOf('A'), cfg.resident)}${opt('B', nameOf('B'), cfg.resident)}</select></div>

      <div class="field"><label for="fAnchor">${esc(t('sAnchor'))}</label>
        <input type="date" id="fAnchor" value="${esc(cfg.anchor)}" min="${RANGE_FROM}" max="${RANGE_TO}">
        <div class="help" id="anchorEcho">${esc(cap(fmtFull(D(cfg.anchor))))} · ${esc(t('sAnchorH'))}</div></div>

      <div class="field" id="wrapAnchorP" ${cfg.pattern === 'eow' ? 'hidden' : ''}>
        <label for="fAP">${esc(t('sAnchorParent'))}</label>
        <select id="fAP">${opt('A', nameOf('A'), cfg.anchorParent)}${opt('B', nameOf('B'), cfg.anchorParent)}</select></div>

      <div class="field"><label for="fBound">${esc(t('sBoundary'))}</label>
        <select id="fBound">${opt(5, t('dFri'), cfg.boundary)}${opt(6, t('dSat'), cfg.boundary)}${opt(0, t('dSun'), cfg.boundary)}${opt(1, t('dMon'), cfg.boundary)}</select></div>

      <div class="field"><label for="fTime">${esc(t('sTime'))}</label><input type="time" id="fTime" value="${esc(cfg.time)}"></div>

      <div class="field"><label>${esc(t('sHol'))}</label><div class="radios">
        ${radio('hol','splitAlt',cfg.holidayRule,t('hAlt'),t('hAltD'))}
        ${radio('hol','splitFixed',cfg.holidayRule,t('hFix'),t('hFixD'))}
        ${radio('hol','continue',cfg.holidayRule,t('hCont'),t('hContD'))}
      </div></div>

      <div class="field"><label for="fHS">${esc(t('sHolStart'))}</label>
        <select id="fHS">${opt('fri', t('hsFri'), cfg.holStart)}${opt('exact', t('hsExact'), cfg.holStart)}</select>
        <div class="help">${esc(t('sHolStartH'))}</div></div>

      <div class="field" id="wrapFirst" ${cfg.holidayRule === 'continue' ? 'hidden' : ''}>
        <label for="fFH">${esc(t('sFirstHalf'))}</label>
        <select id="fFH">${opt('A', nameOf('A'), cfg.firstHalf)}${opt('B', nameOf('B'), cfg.firstHalf)}</select></div>

      <div class="field" id="wrapBasis" ${cfg.holidayRule === 'splitAlt' ? '' : 'hidden'}>
        <label for="fAB">${esc(t('sAltBasis'))}</label>
        <select id="fAB">${opt('school', t('abSchool'), cfg.altBasis)}${opt('calendar', t('abCalendar'), cfg.altBasis)}</select>
        <div class="help">${esc(t('sAltBasisH'))}</div></div>

      <div class="field" id="wrapShort" ${cfg.holidayRule === 'continue' ? 'hidden' : ''}>
        <label style="display:flex;gap:9px;align-items:center;font-weight:600">
          <input type="checkbox" id="fShort" ${cfg.splitShort ? 'checked' : ''}> ${esc(t('sSplitShort'))}</label></div>

      <div class="actions">
        <button class="btn primary" id="fSave">${esc(t('save'))}</button>
        <button class="btn" id="fClose">${esc(t('close'))}</button>
        <span class="spacer"></span>
        <button class="btn" id="fReset">${esc(t('reset'))}</button>
      </div>`;

    s.classList.remove('hidden'); scrim.classList.remove('hidden');

    s.querySelectorAll('input[name=pat]').forEach((r) => r.onchange = () => {
      const eow = s.querySelector('input[name=pat]:checked').value === 'eow';
      $('#wrapResident').hidden = !eow; $('#wrapAnchorP').hidden = eow;
    });
    s.querySelectorAll('input[name=hol]').forEach((r) => r.onchange = () => {
      const val = s.querySelector('input[name=hol]:checked').value;
      $('#wrapFirst').hidden = val === 'continue';
      $('#wrapShort').hidden = val === 'continue';
      $('#wrapBasis').hidden = val !== 'splitAlt';
    });
    $('#fAnchor').oninput = (e) => {
      if (!e.target.value) return;
      $('#anchorEcho').textContent = cap(fmtFull(D(e.target.value))) + ' · ' + t('sAnchorH');
    };
    $('#fClose').onclick = closeSettings;
    $('#fReset').onclick = () => { cfg = { ...E.DEFAULTS }; saveCfg(); rebuild(); closeSettings(); render(); };
    $('#fSave').onclick = () => {
      cfg.a = $('#fA').value.trim() || 'Parent A';
      cfg.b = $('#fB').value.trim() || 'Parent B';
      cfg.pattern = s.querySelector('input[name=pat]:checked').value;
      cfg.resident = $('#fRes').value;
      cfg.anchor = $('#fAnchor').value || E.DEFAULTS.anchor;
      cfg.anchorParent = $('#fAP').value;
      cfg.boundary = Number($('#fBound').value);
      cfg.time = $('#fTime').value || '16:30';
      cfg.holStart = $('#fHS').value;
      cfg.holidayRule = s.querySelector('input[name=hol]:checked').value;
      cfg.firstHalf = $('#fFH').value;
      cfg.altBasis = $('#fAB').value;
      cfg.splitShort = $('#fShort').checked;
      saveCfg(); rebuild(); closeSettings(); render();
    };
  }
  function closeSettings() { $('#drawer').classList.add('hidden'); $('#scrim').classList.add('hidden'); }

  /* ------------------------------- sharing ------------------------------ */
  function shareLink() {
    const json = JSON.stringify(cfg);
    const b64 = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return location.origin + location.pathname + '#cfg=' + b64;
  }

  /** All-day .ics events, one per continuous block, for the next 5 years. */
  function buildIcs() {
    const to = ISO(new Date(Date.UTC(new Date().getUTCFullYear() + 5, 11, 31)));
    const sub = new Map([...plan].filter(([k]) => k >= TODAY_ISO && k <= to));
    const bl = E.blocks(sub);
    const stamp = ISO(new Date()).replace(/-/g, '') + 'T000000Z';
    const pack = (s) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//calendrier-garde//FR', 'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH', `X-WR-CALNAME:${pack(t('title'))}`,
    ];
    bl.forEach((b, i) => {
      const s = ISO(b.start).replace(/-/g, ''), e = ISO(addDays(b.end, 1)).replace(/-/g, '');
      lines.push('BEGIN:VEVENT', `UID:garde-${s}-${i}@calendrier`, `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${s}`, `DTEND;VALUE=DATE:${e}`,
        `SUMMARY:${pack((lang === 'fr' ? 'Enfants chez ' : 'Children with ') + nameOf(b.parent))}`,
        `DESCRIPTION:${pack(b.period ? L().vac[b.period.key] : t('rot'))}`,
        'TRANSP:TRANSPARENT', 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  /* -------------------------------- wiring ------------------------------ */
  const $ = (sel) => document.querySelector(sel);
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function step(dir) {
    if (view === 'month') cur = clampToRange(new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + dir, 1)));
    else if (view === 'year') cur = clampToRange(new Date(Date.UTC(cur.getUTCFullYear() + dir, cur.getUTCMonth(), 1)));
    else cur = clampToRange(new Date(Date.UTC(cur.getUTCFullYear() + dir, cur.getUTCMonth(), 1)));
    render();
  }

  function init() {
    rebuild();
    $('#langBtn').onclick = () => { lang = lang === 'fr' ? 'en' : 'fr'; render(); };
    $('#settingsBtn').onclick = openSettings;
    $('#scrim').onclick = closeSettings;
    $('#prev').onclick = () => step(-1);
    $('#next').onclick = () => step(1);
    $('#todayBtn').onclick = () => { cur = clampToRange(new Date()); render(); };
    $('#tabMonth').onclick = () => { view = 'month'; render(); };
    $('#tabYear').onclick = () => { view = 'year'; render(); };
    $('#tabHol').onclick = () => { view = 'hol'; render(); };
    $('#printBtn').onclick = () => window.print();
    $('#copyBtn').onclick = async () => {
      const url = shareLink();
      try { await navigator.clipboard.writeText(url); } catch (e) { prompt(t('copy'), url); }
      const b = $('#copyBtn'), old = b.textContent;
      b.textContent = t('copied'); setTimeout(() => { b.textContent = old; }, 1800);
    };
    $('#icsBtn').onclick = () => {
      const blob = new Blob([buildIcs()], { type: 'text/calendar;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'calendrier-garde.ics';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    };
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSettings();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
    render();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
