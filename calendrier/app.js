/* ---------------------------------------------------------------------------
   app.js — user interface.

   Nothing here talks to a server. No judgment text is stored: the only things
   kept are the two display names and the rhythm switches, held in this browser
   and, if you copy a share link, in the part of the URL after "#" (which
   browsers never send to a server).
--------------------------------------------------------------------------- */
(function () {
  const V = window.Vacances, E = window.Engine, H = V.helpers;
  const { D, ISO, addDays, dayDiff } = H;

  const RANGE_FROM = '2026-07-01';
  const RANGE_TO   = '2036-12-31';
  const STORE_KEY  = 'calendrier-garde/v2';

  /* Parent A is the father, parent B the mother. Names follow the interface
     language until someone types their own. */
  const DEFAULT_NAMES = { fr: { A: 'Papa', B: 'Maman' }, en: { A: 'Dad', B: 'Mom' } };
  const IS_DEFAULT_NAME = (s, p) =>
    !s || s === DEFAULT_NAMES.fr[p] || s === DEFAULT_NAMES.en[p];

  const I18N = {
    fr: {
      title: 'Calendrier de garde', sub: 'Zone B · Académie d’Aix-Marseille',
      today: 'Aujourd’hui', with: 'Les enfants sont chez',
      until: 'jusqu’au {d} à {t}',
      next: 'Prochains échanges', handoverTo: 'passage chez {n}',
      month: 'Mois', year: 'Année', hol: 'Vacances',
      settings: 'Prénoms', todayBtn: 'Aujourd’hui',
      schoolYear: 'Année scolaire {y}',
      dows: ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'],
      months: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
      vac: { toussaint:'Toussaint', noel:'Noël', hiver:'Hiver', printemps:'Printemps', ascension:'Ascension', ete:'Été' },
      fer: { jourAn:'Jour de l’An', paques:'Lundi de Pâques', travail:'Fête du Travail', victoire:'8 Mai',
             ascension:'Ascension', pentecote:'Lundi de Pentecôte', nationale:'14 Juillet',
             assomption:'Assomption', toussaint:'Toussaint', armistice:'11 Novembre', noel:'Noël' },
      wk: 'S{n}', wkEven: 'Semaine {n} · paire', wkOdd: 'Semaine {n} · impaire',
      rTerm: 'Période scolaire', rHol: 'Petites vacances',
      half1: '1re moitié', half2: '2e moitié',
      sheetPeriod: 'Période', sheetWhy: 'Motif', sheetHand: 'Échange', sheetHol: 'Vacances',
      wkEvenPlain: 'Semaine paire', wkOddPlain: 'Semaine impaire',
      sheetFer: 'Jour férié', sheetWeek: 'Semaine civile',
      rSummer: 'Vacances d’été · semaine {w}', rSummerTail: 'Fin des vacances d’été',
      rMidweek: 'Mardi soir → mercredi {t}', rMidweekShort: 'Mardi',
      rReturn: 'Retour {t}', rMeres: 'Fête des mères', rPeres: 'Fête des pères',
      official: 'dates officielles', projected: 'prévisionnel',
      legendVac: 'Vacances scolaires', legendToday: 'Aujourd’hui', legendHand: 'échange',
      copy: 'Copier le lien à partager', copied: 'Lien copié ✓',
      ics: 'Ajouter à mon téléphone (.ics)', print: 'Imprimer / PDF',
      projWarn: 'Dates prévisionnelles à partir de septembre 2028',
      projWarnBody: 'Le ministère publie le calendrier scolaire environ trois ans à l’avance. Les dates officielles vont jusqu’à l’été 2028. Au-delà, les vacances sont estimées et signalées « prévisionnel ». L’alternance des semaines paires et impaires, elle, reste exacte.',
      disclaimer: 'Cet outil est une aide à la lecture du planning. En cas de désaccord, seul le jugement fait foi. Dates scolaires : Zone B, académie d’Aix-Marseille (arrêtés du 22 octobre 2025 et du 21 juillet 2026).',
      ruleLine: 'Semaine paire → {a}. Semaine impaire → {b}. Échange le vendredi — {t} à la sortie des classes, {h} pendant les vacances.',
      ruleExtra: 'Plus : mardi soir → mercredi {m} chez {b}. Petites vacances partagées en deux moitiés, la 1re à {a} les années paires. Été partagé en huit semaines.',
      privacy: 'Aucun texte du jugement n’est enregistré. Les prénoms et les réglages restent dans ce navigateur et dans le lien que vous partagez. Rien n’est envoyé sur Internet.',
      sTitle: 'Prénoms affichés', sSub: 'Seuls les prénoms sont modifiables.',
      sLocked: 'Le rythme, les dates et les heures sont fixés et ne peuvent pas être modifiés depuis cette page : semaines paires et impaires, échange du vendredi, mardi soir chez la mère, huit semaines d’été, week-ends de la fête des mères et de la fête des pères. Ils figurent sous « Règles appliquées ».',
      sNameA: 'Nom du père affiché', sNameB: 'Nom de la mère affiché',
      sEven: 'Les semaines paires sont chez',
      sEvenH: 'Le caractère pair ou impair suit la numérotation des semaines du calendrier civil.',
      sTime: 'Heure de l’échange du vendredi (période scolaire)',
      sHolHour: 'Heure de l’échange pendant les vacances',
      sMid: 'Mardi soir → mercredi chez la mère',
      sMidOn: 'Appliquer cette règle', sMidEnd: 'Jusqu’au', sMidRet: 'Heure du retour le mercredi',
      sMidEndH: 'Entrée au collège du plus jeune enfant.',
      sFete: 'Week-ends fête des mères et fête des pères',
      sFeteOn: 'Appliquer la dérogation',
      sHolStart: 'Début des vacances',
      hsFri: 'Le vendredi, à la sortie des classes',
      hsExact: 'Le samedi, date exacte de l’arrêté',
      save: 'Enregistrer', reset: 'Réinitialiser', close: 'Fermer',
      days: '{n} jours', day1: '1 jour', weeks: '{n} semaines',
      beforeStart: 'Avant le début du calendrier',
      },
    en: {
      title: 'Custody calendar', sub: 'Zone B · Aix-Marseille education district',
      today: 'Today', with: 'The children are with',
      until: 'until {d} at {t}',
      next: 'Next handovers', handoverTo: 'moves to {n}',
      month: 'Month', year: 'Year', hol: 'Holidays',
      settings: 'Names', todayBtn: 'Today',
      schoolYear: 'School year {y}',
      dows: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
      vac: { toussaint:'October half-term', noel:'Christmas', hiver:'February half-term', printemps:'Spring', ascension:'Ascension break', ete:'Summer' },
      fer: { jourAn:'New Year’s Day', paques:'Easter Monday', travail:'Labour Day', victoire:'VE Day',
             ascension:'Ascension', pentecote:'Whit Monday', nationale:'Bastille Day',
             assomption:'Assumption', toussaint:'All Saints', armistice:'Armistice Day', noel:'Christmas Day' },
      wk: 'W{n}', wkEven: 'Week {n} · even', wkOdd: 'Week {n} · odd',
      rTerm: 'Term time', rHol: 'Half-term holidays',
      half1: '1st half', half2: '2nd half',
      sheetPeriod: 'Period', sheetWhy: 'Reason', sheetHand: 'Handover', sheetHol: 'School holiday',
      wkEvenPlain: 'Even week', wkOddPlain: 'Odd week',
      sheetFer: 'Public holiday', sheetWeek: 'Civil week',
      rSummer: 'Summer holidays · week {w}', rSummerTail: 'End of the summer holidays',
      rMidweek: 'Tuesday evening → Wednesday {t}', rMidweekShort: 'Tuesday',
      rReturn: 'Back at {t}', rMeres: 'Mother’s Day', rPeres: 'Father’s Day',
      official: 'official dates', projected: 'projected',
      legendVac: 'School holidays', legendToday: 'Today', legendHand: 'handover',
      copy: 'Copy link to share', copied: 'Link copied ✓',
      ics: 'Add to my phone (.ics)', print: 'Print / PDF',
      projWarn: 'Projected dates from September 2028 onwards',
      projWarnBody: 'The ministry publishes the school calendar about three years ahead. Official dates run to summer 2028. Beyond that, holidays are estimates and marked “projected”. The even/odd week alternation itself stays exact.',
      disclaimer: 'This tool is a reading aid for the schedule. If there is any disagreement, only the judgment counts. School dates: Zone B, Aix-Marseille district (decrees of 22 October 2025 and 21 July 2026).',
      ruleLine: 'Even week → {a}. Odd week → {b}. Changeover on Friday — {t} at the end of school, {h} during the holidays.',
      ruleExtra: 'Plus: Tuesday evening → Wednesday {m} with {b}. Half-term holidays split in two halves, the first to {a} in even years. Summer split into eight weeks.',
      privacy: 'No judgment text is stored. The names and settings stay in this browser and in the link you share. Nothing is sent over the internet.',
      sTitle: 'Display names', sSub: 'Only the names can be changed.',
      sLocked: 'The rhythm, the dates and the times are fixed and cannot be changed from this page: even and odd weeks, the Friday changeover, Tuesday night with the mother, the eight summer weeks, and the Mother’s and Father’s Day weekends. They are set out under “Rules applied”.',
      sNameA: 'Name shown for the father', sNameB: 'Name shown for the mother',
      sEven: 'Even weeks are with',
      sEvenH: 'Even and odd follow the civil calendar week numbering.',
      sTime: 'Friday handover time (term time)',
      sHolHour: 'Handover time during the holidays',
      sMid: 'Tuesday evening → Wednesday with the mother',
      sMidOn: 'Apply this rule', sMidEnd: 'Until', sMidRet: 'Wednesday return time',
      sMidEndH: 'The youngest child starting collège.',
      sFete: 'Mother’s Day and Father’s Day weekends',
      sFeteOn: 'Apply the derogation',
      sHolStart: 'Holidays begin',
      hsFri: 'Friday, at the end of the school day',
      hsExact: 'Saturday, the literal date in the decree',
      save: 'Save', reset: 'Reset', close: 'Close',
      days: '{n} days', day1: '1 day', weeks: '{n} weeks',
      beforeStart: 'Before the calendar starts',
      },
  };

  // French when the browser's own language is French; English for anything else.
  const browserLang = String(
    (navigator.languages && navigator.languages[0]) || navigator.language || ''
  ).toLowerCase();
  let lang = browserLang.startsWith('fr') ? 'fr' : 'en';
  const L = () => I18N[lang];
  const t = (k, vars) => {
    let s = L()[k];
    if (s == null) return k;
    if (vars) for (const [a, b] of Object.entries(vars)) s = s.split(`{${a}}`).join(b);
    return s;
  };

  let cfg = loadCfg();
  let plan = null;
  let view = 'month';
  let cur = clampToRange(new Date());
  let showPoints = false;
  const TODAY_ISO = ISO(new Date());

  function nameOf(p) {
    const custom = p === 'A' ? cfg.a : cfg.b;
    return IS_DEFAULT_NAME(custom, p) ? DEFAULT_NAMES[lang][p] : custom;
  }
  const initialOf = (p) => nameOf(p).trim().charAt(0).toUpperCase();

  /**
   * Only the display names are taken from a stored or shared config. Every
   * value that decides a date or an allocation comes from Engine.DEFAULTS, so
   * neither an edited link nor stale browser storage can shift the schedule.
   */
  // A function declaration, not a const: loadCfg runs while the module body is
  // still executing, and a const would still be uninitialised at that point.
  function namesOnly(o) {
    return {
      ...E.DEFAULTS,
      ...(typeof o.a === 'string' && o.a.trim() ? { a: o.a.trim().slice(0, 40) } : {}),
      ...(typeof o.b === 'string' && o.b.trim() ? { b: o.b.trim().slice(0, 40) } : {}),
    };
  }

  function loadCfg() {
    const hash = location.hash.match(/cfg=([A-Za-z0-9_-]+)/);
    if (hash) {
      try {
        return namesOnly(JSON.parse(
          decodeURIComponent(escape(atob(hash[1].replace(/-/g, '+').replace(/_/g, '/'))))));
      } catch (e) { /* fall through */ }
    }
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return namesOnly(JSON.parse(raw));
    } catch (e) {}
    return { ...E.DEFAULTS };
  }
  const saveCfg = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(cfg)); } catch (e) {} };

  function clampToRange(dt) {
    const lo = D(RANGE_FROM), hi = D(RANGE_TO), u = D(ISO(dt));
    return u < lo ? lo : u > hi ? hi : u;
  }
  const rebuild = () => { plan = E.plan(cfg, RANGE_FROM, RANGE_TO); };

  const loc = () => (lang === 'fr' ? 'fr-FR' : 'en-US');
  const fmtLong  = (dt) => new Intl.DateTimeFormat(loc(), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(dt);
  const fmtShort = (dt) => new Intl.DateTimeFormat(loc(), { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(dt);
  const fmtFull  = (dt) => new Intl.DateTimeFormat(loc(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(dt);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const isProjected = (p) => !!(p && (p.projected || p.resumeProjected));

  /**
   * The time a handover happens on a given day.
   * Tuesday's move and the Friday changeover both happen at the end of the
   * school day; the Wednesday hand-back happens at the later fixed time.
   */
  function handoverTime(d) {
    if (!d) return cfg.time;
    if (d.src === 'midweek') return cfg.time;
    const prev = plan.get(ISO(addDays(d.date, -1)));
    if (prev && prev.src === 'midweek') return cfg.midweekReturn;
    // Inside a school holiday there is no end of the school day to hand over
    // at, so the changeover runs on the fixed evening hour. The exception is
    // the Friday the holidays start on, which is still a school day.
    if (d.period) {
      const firstDayIsSchoolDay = d.period.shiftedToFriday && ISO(d.period.start) === d.iso;
      return firstDayIsSchoolDay ? cfg.time : cfg.holidayHandover;
    }
    return cfg.time;
  }

  /** True when the changeover is pegged to the school bell rather than a clock. */
  const isSchoolBell = (d) => !!d && !d.period && d.src !== 'midweek-return';

  /** A short human reason for why a day belongs to whom. */
  function reasonOf(d, short) {
    switch (d.src) {
      case 'fete-meres': return t('rMeres');
      case 'fete-peres': return t('rPeres');
      case 'midweek':    return short ? t('rMidweekShort') : t('rMidweek', { t: cfg.midweekReturn });
      case 'summer':     return t('rSummer', { w: d.summerWk });
      case 'summer-tail':return t('rSummerTail');
      case 'holiday-h1':
      case 'holiday-h2': return (d.period ? L().vac[d.period.key] + ' · ' : '') +
                                  t(d.src === 'holiday-h1' ? 'half1' : 'half2');
      case 'holiday-week': return (d.period ? L().vac[d.period.key] + ' · ' : '') +
                                  t(d.week % 2 ? 'wkOdd' : 'wkEven', { n: d.week });
      default:           return t(d.week % 2 ? 'wkOdd' : 'wkEven', { n: d.week });
    }
  }

  /* ------------------------------ rendering ----------------------------- */
  function render() {
    document.documentElement.lang = lang;
    document.title = t('title');
    $('#brandTitle').textContent = t('title');
    $('#brandSub').textContent = t('sub');
    $('#langBtn').textContent = lang === 'fr' ? 'EN' : 'FR';
    $('#settingsBtn').innerHTML = '⚙ ' + esc(t('settings'));
    $('#todayBtn').textContent = t('todayBtn');
    $('#tabMonth').textContent = t('month');
    $('#tabYear').textContent = t('year');
    $('#tabHol').textContent = t('hol');
    $('#copyBtn').textContent = t('copy');
    $('#icsBtn').textContent = t('ics');
    $('#printBtn').textContent = t('print');
    $('#disclaimer').textContent = t('disclaimer');
    $('#privacy').textContent = t('privacy');
    $('#tabMonth').setAttribute('aria-pressed', String(view === 'month'));
    $('#tabYear').setAttribute('aria-pressed', String(view === 'year'));
    $('#tabHol').setAttribute('aria-pressed', String(view === 'hol'));
    document.querySelectorAll('.tabbar button').forEach((b) => {
      b.setAttribute('aria-current', String(b.dataset.v === view));
      b.querySelector('.tl').textContent = t(b.dataset.v === 'hol' ? 'hol' : b.dataset.v);
    });

    $('#ruleLine').innerHTML =
      '<strong>' + esc(t('ruleLine', { a: nameOf('A'), b: nameOf('B'), t: cfg.time, h: cfg.holidayHandover })) + '</strong>' +
      (cfg.midweek ? ' <span class="rx">' + esc(t('ruleExtra',
        { a: nameOf('A'), b: nameOf('B'), m: cfg.midweekReturn })) + '</span>' : '');

    renderHero();
    renderUpcoming();
    renderProjWarn();

    const root = $('#viewRoot');
    root.innerHTML = '';
    if (view === 'month') {
      $('#periodLabel').textContent = `${L().months[cur.getUTCMonth()]} ${cur.getUTCFullYear()}`;
      root.appendChild(monthCard(cur.getUTCFullYear(), cur.getUTCMonth()));
    } else if (view === 'year') {
      $('#periodLabel').textContent = String(cur.getUTCFullYear());
      root.appendChild(yearView(cur.getUTCFullYear()));
    } else {
      const sy = schoolYearOf(cur);
      $('#periodLabel').textContent = t('schoolYear', { y: sy });
      root.appendChild(holView(sy));
    }
    renderLegend();
  }

  function renderProjWarn() {
    const b = $('#projBanner');
    const show = cur.getUTCFullYear() >= 2028;
    b.classList.toggle('hidden', !show);
    if (show) b.innerHTML = `<div>📅</div><div><strong>${esc(t('projWarn'))}</strong>${esc(t('projWarnBody'))}</div>`;
  }

  function renderHero() {
    const d = plan.get(TODAY_ISO) || plan.get(RANGE_FROM);
    const hero = $('#hero');
    hero.className = 'hero p' + d.parent;
    let end = d.date;
    for (;;) {
      const nxt = plan.get(ISO(addDays(end, 1)));
      if (!nxt || nxt.parent !== d.parent) break;
      end = nxt.date;
    }
    const nextDay = plan.get(ISO(addDays(end, 1)));
    const time = handoverTime(nextDay);
    const chips = [];
    if (d.src !== 'term-week') chips.push(reasonOf(d));     // a plain week needs no label
    if (d.period && d.src === 'term-week') chips.push(L().vac[d.period.key]);
    if (d.period && isProjected(d.period)) chips.push(t('projected'));
    if (d.ferie) chips.push(L().fer[d.ferie]);
    hero.innerHTML = `
      <div class="label">${esc(t('today'))} · ${esc(cap(fmtFull(d.date)))}</div>
      <div class="who">${esc(t('with'))} ${esc(nameOf(d.parent))}</div>
      <div class="until">${nextDay ? esc(t('until', { d: fmtLong(addDays(end, 1)), t: time })) : ''}</div>
      <div class="ctx">${chips.map((c) => `<span class="chip">${esc(c)}</span>`).join('')}</div>`;
  }

  function renderUpcoming() {
    $('#upcomingTitle').textContent = t('next');
    const hs = E.nextHandovers(plan, TODAY_ISO, 4);
    $('#upcoming').innerHTML = hs.map((h) => {
      const time = handoverTime(h);
      return `<div class="hand">
        <div class="when">${esc(cap(fmtLong(h.date)))} · ${esc(time)}</div>
        <div class="move"><span class="who-i i${h.parent}">${esc(initialOf(h.parent))}</span>
          ${esc(t('handoverTo', { n: nameOf(h.parent) }))} · <span style="opacity:.8">${esc(reasonOf(h))}</span></div>
      </div>`;
    }).join('');
  }

  /* ---- month view: day numbers, then a bar per continuous run ---------- */

  /** Group seven days into runs of the same parent. A gap breaks a run. */
  function runsOf(days, keyFn) {
    const out = [];
    days.forEach((d, i) => {
      const k = d ? keyFn(d) : null;
      const last = out[out.length - 1];
      if (k !== null && last && last.key === k && last.end === i - 1) { last.end = i; last.days.push(d); }
      else if (k !== null) out.push({ key: k, start: i, end: i, days: [d] });
    });
    return out;
  }

  function monthCard(year, month) {
    const card = document.createElement('div'); card.className = 'cal';

    const head = document.createElement('div'); head.className = 'cal-hd';
    head.appendChild(document.createElement('span'));
    L().dows.forEach((x) => { const h = document.createElement('span'); h.textContent = x; head.appendChild(h); });
    card.appendChild(head);

    const first = new Date(Date.UTC(year, month, 1));
    let dt = addDays(first, -((first.getUTCDay() + 6) % 7));

    for (let row = 0; row < 6; row++) {
      const week = []; const start = dt;
      for (let i = 0; i < 7; i++) { week.push(plan.get(ISO(dt)) || null); dt = addDays(dt, 1); }

      const wr = document.createElement('div'); wr.className = 'wkrow';
      const num = document.createElement('div'); num.className = 'wknum';
      num.textContent = week.find(Boolean) ? week.find(Boolean).civilWeek : '';
      wr.appendChild(num);

      const body = document.createElement('div'); body.className = 'wkbody';

      // row 1 — the dates
      week.forEach((d, i) => {
        const day = addDays(start, i);
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'dnum' + (day.getUTCMonth() === month ? '' : ' out')
          + (ISO(day) === TODAY_ISO ? ' now' : '') + (d ? '' : ' nil');
        cell.style.gridColumn = (i + 1) + ' / span 1';
        cell.innerHTML = `<span>${day.getUTCDate()}</span>` + (d && d.ferie ? '<i class="fdot"></i>' : '');
        if (d) { cell.onclick = () => openSheet(ISO(day)); cell.title = cap(fmtFull(day)); }
        body.appendChild(cell);
      });

      // row 2 — one bar per run, carrying the name
      runsOf(week, (d) => d.parent).forEach((r) => {
        const bar = document.createElement('button');
        bar.type = 'button';
        bar.className = 'bar p' + r.key + (r.days.some((d) => d.isHandover) ? ' opens' : '');
        bar.style.gridColumn = (r.start + 1) + ' / span ' + (r.end - r.start + 1);
        const wide = r.end - r.start >= 1;
        bar.textContent = wide ? nameOf(r.key) : initialOf(r.key);
        const h = r.days.find((d) => d.isHandover);
        if (h && wide) bar.innerHTML = `${esc(nameOf(r.key))}<i>${esc(handoverTime(h))}</i>`;
        bar.onclick = () => openSheet(r.days[0].iso);
        bar.title = nameOf(r.key) + ' · ' + reasonOf(r.days[0]);
        body.appendChild(bar);
      });

      // row 3 — a school-holiday band, named once
      runsOf(week, (d) => (d.period ? d.period.key : null)).forEach((r) => {
        const band = document.createElement('div');
        band.className = 'band';
        band.style.gridColumn = (r.start + 1) + ' / span ' + (r.end - r.start + 1);
        band.textContent = L().vac[r.key];
        band.title = L().vac[r.key];
        body.appendChild(band);
      });

      wr.appendChild(body); card.appendChild(wr);
      if (dt.getUTCMonth() !== month && row >= 4) break;
    }
    return card;
  }

  /** The continuous run of days a given day sits in. */
  function runBounds(d) {
    let a = d.date, b = d.date;
    for (;;) { const p = plan.get(ISO(addDays(a, -1))); if (!p || p.parent !== d.parent) break; a = p.date; }
    for (;;) { const n = plan.get(ISO(addDays(b, 1))); if (!n || n.parent !== d.parent) break; b = n.date; }
    return { a, b };
  }

  /* ---- day detail sheet ------------------------------------------------ */
  function openSheet(iso) {
    const d = plan.get(iso); if (!d) return;
    const el = $('#sheet');
    const rows = [];
    const { a, b } = runBounds(d);
    rows.push([t('sheetPeriod'), fmtShort(a) + ' → ' + fmtShort(b)]);
    // for a plain term week, say which parity applies without a number: the
    // period's number and the calendar's differ from Monday to Thursday
    rows.push([t('sheetWhy'), d.src === 'term-week'
      ? t(d.week % 2 ? 'wkOddPlain' : 'wkEvenPlain') : reasonOf(d)]);
    if (d.isHandover) rows.push([t('sheetHand'), handoverTime(d)]);
    if (d.period) rows.push([t('sheetHol'), L().vac[d.period.key] + (isProjected(d.period) ? ' · ' + t('projected') : '')]);
    if (d.ferie) rows.push([t('sheetFer'), L().fer[d.ferie]]);
    rows.push([t('sheetWeek'), String(d.civilWeek)]);

    el.className = 'sheet p' + d.parent;
    el.innerHTML = `<div class="sheet-top">
        <div><div class="sheet-lab">${esc(cap(fmtFull(d.date)))}</div>
        <div class="sheet-who">${esc(nameOf(d.parent))}</div></div>
        <button class="btn small" id="sheetX" aria-label="${esc(t('close'))}">✕</button>
      </div>
      <dl class="sheet-dl">${rows.map(([k, v]) =>
        `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`;
    el.classList.remove('hidden'); $('#scrim').classList.remove('hidden');
    $('#sheetX').onclick = closeSheet;
  }
  const closeSheet = () => { $('#sheet').classList.add('hidden'); $('#scrim').classList.add('hidden'); };

  function yearView(year) {
    const wrap = document.createElement('div'); wrap.className = 'year';
    for (let m = 0; m < 12; m++) {
      const box = document.createElement('div'); box.className = 'mini';
      const h = document.createElement('h3'); h.textContent = L().months[m];
      const mg = document.createElement('div'); mg.className = 'mg';
      L().dows.forEach((x) => { const s = document.createElement('span'); s.className = 'blank'; s.textContent = x[0]; mg.appendChild(s); });
      const first = new Date(Date.UTC(year, m, 1));
      for (let i = 0; i < (first.getUTCDay() + 6) % 7; i++) { const s = document.createElement('span'); s.className = 'blank'; mg.appendChild(s); }
      const dim = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
      let covered = 0;
      for (let day = 1; day <= dim; day++) {
        const dt = new Date(Date.UTC(year, m, day)), iso = ISO(dt), d = plan.get(iso);
        const s = document.createElement('span');
        s.className = d ? 'p' + d.parent + (d.period ? ' vac' : '') + (iso === TODAY_ISO ? ' today' : '') : 'blank';
        s.textContent = day;
        if (d) { covered++; s.title = `${cap(fmtFull(dt))} — ${nameOf(d.parent)} · ${reasonOf(d)}`; }
        mg.appendChild(s);
      }
      box.appendChild(h); box.appendChild(mg);
      if (!covered) { const n = document.createElement('div'); n.className = 'outside'; n.textContent = t('beforeStart'); box.appendChild(n); }
      wrap.appendChild(box);
    }
    return wrap;
  }

  const schoolYearOf = (dt) => {
    const y = dt.getUTCFullYear();
    return dt.getUTCMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
  };

  function holView(sy) {
    const wrap = document.createElement('div'); wrap.className = 'vlist';
    const periods = E.periodsFor(cfg, RANGE_FROM, RANGE_TO).filter((p) => p.sy === sy);
    if (!periods.length) { wrap.innerHTML = '<div class="vrow">—</div>'; return wrap; }

    for (const p of periods) {
      const total = dayDiff(p.start, p.last) + 1;
      const inner = E.blocks(new Map([...plan].filter(([k]) => k >= ISO(p.start) && k <= ISO(p.last))));
      const row = document.createElement('div'); row.className = 'vrow';
      row.innerHTML = `<h3>${esc(L().vac[p.key])}
          <span class="pill ${isProjected(p) ? '' : 'ok'}">${esc(isProjected(p) ? t('projected') : t('official'))}</span></h3>
        <div class="dates">${esc(cap(fmtLong(p.start)))} → ${esc(cap(fmtLong(p.last)))} · ${esc(t('days', { n: total }))}</div>
        <div class="halves">` + inner.map((b) => {
          const label = b.src === 'summer'
            ? t('rSummer', { w: b.summerWk }) + (b.days > 7 ? ` – ${b.summerWk + Math.round(b.days / 7) - 1}` : '')
            : b.src === 'summer-tail' ? t('rSummerTail')
            : b.src === 'holiday-h1' ? t('half1')
            : b.src === 'holiday-h2' ? t('half2')
            : t(b.week % 2 ? 'wkOdd' : 'wkEven', { n: b.week });
          return `<div class="halfbox p${b.parent}"><b>${esc(label)}</b>
            <span class="nm">${esc(nameOf(b.parent))}</span>
            <div>${esc(fmtShort(b.start))} → ${esc(fmtShort(b.end))} · ${esc(b.days === 1 ? t('day1') : t('days', { n: b.days }))}</div></div>`;
        }).join('') + '</div>';
      wrap.appendChild(row);
    }
    return wrap;
  }

  function renderLegend() {
    $('#legend').innerHTML = `
      <span class="k"><span class="sw a"></span>${esc(nameOf('A'))}</span>
      <span class="k"><span class="sw b"></span>${esc(nameOf('B'))}</span>
      <span class="k"><span class="sw v"></span>${esc(t('legendVac'))}</span>
      <span class="k"><span class="sw t"></span>${esc(t('legendToday'))}</span>`;
  }

  /* ------------------------------ settings ------------------------------ */
  /**
   * The drawer holds the display names and nothing else. Every value that
   * decides a date or an allocation is fixed in Engine.DEFAULTS, so the
   * calendar cannot be altered from the page.
   */
  function openSettings() {
    const s = $('#drawer');
    s.innerHTML = `
      <h2>${esc(t('sTitle'))}</h2><div class="sub">${esc(t('sSub'))}</div>

      <div class="field"><label for="fA">${esc(t('sNameA'))}</label>
        <input type="text" id="fA" value="${esc(IS_DEFAULT_NAME(cfg.a, 'A') ? '' : cfg.a)}" placeholder="${esc(DEFAULT_NAMES[lang].A)}"></div>
      <div class="field"><label for="fB">${esc(t('sNameB'))}</label>
        <input type="text" id="fB" value="${esc(IS_DEFAULT_NAME(cfg.b, 'B') ? '' : cfg.b)}" placeholder="${esc(DEFAULT_NAMES[lang].B)}"></div>

      <div class="field"><div class="locked">${esc(t('sLocked'))}</div></div>

      <div class="actions">
        <button class="btn primary" id="fSave">${esc(t('save'))}</button>
        <button class="btn" id="fClose">${esc(t('close'))}</button>
        <span class="spacer"></span>
        <button class="btn" id="fReset">${esc(t('reset'))}</button>
      </div>`;
    s.classList.remove('hidden'); $('#scrim').classList.remove('hidden');

    $('#fClose').onclick = closeSettings;
    $('#fReset').onclick = () => {
      cfg = { ...E.DEFAULTS };
      saveCfg(); rebuild(); closeSettings(); render();
    };
    $('#fSave').onclick = () => {
      cfg = { ...E.DEFAULTS,
        a: $('#fA').value.trim() || DEFAULT_NAMES.fr.A,
        b: $('#fB').value.trim() || DEFAULT_NAMES.fr.B };
      saveCfg(); rebuild(); closeSettings(); render();
    };
  }
  const closeSettings = () => { $('#drawer').classList.add('hidden'); $('#scrim').classList.add('hidden'); };

  /* ------------------------------- sharing ------------------------------ */
  const shareLink = () => location.origin + location.pathname + '#cfg=' +
    btoa(unescape(encodeURIComponent(JSON.stringify({ a: cfg.a, b: cfg.b }))))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  function buildIcs() {
    const to = ISO(new Date(Date.UTC(new Date().getUTCFullYear() + 5, 11, 31)));
    const bl = E.blocks(new Map([...plan].filter(([k]) => k >= TODAY_ISO && k <= to)));
    const stamp = TODAY_ISO.replace(/-/g, '') + 'T000000Z';
    const pack = (s) => String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//calendrier-garde//FR',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${pack(t('title'))}`];
    bl.forEach((b, i) => {
      lines.push('BEGIN:VEVENT', `UID:garde-${ISO(b.start).replace(/-/g, '')}-${i}@calendrier`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${ISO(b.start).replace(/-/g, '')}`,
        `DTEND;VALUE=DATE:${ISO(addDays(b.end, 1)).replace(/-/g, '')}`,
        `SUMMARY:${pack((lang === 'fr' ? 'Enfants chez ' : 'Children with ') + nameOf(b.parent))}`,
        `DESCRIPTION:${pack(reasonOf(b.src === 'midweek' ? { src: 'midweek', week: b.week } : b))}`,
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
    const m = view === 'month' ? cur.getUTCMonth() + dir : cur.getUTCMonth();
    const y = view === 'month' ? cur.getUTCFullYear() : cur.getUTCFullYear() + dir;
    cur = clampToRange(new Date(Date.UTC(y, m, 1)));
    render();
  }
  function init() {
    rebuild();
    $('#langBtn').onclick = () => { lang = lang === 'fr' ? 'en' : 'fr'; render(); };
    $('#settingsBtn').onclick = openSettings;
    $('#scrim').onclick = () => { closeSettings(); closeSheet(); };
    $('#prev').onclick = () => step(-1);
    $('#next').onclick = () => step(1);
    $('#todayBtn').onclick = () => { cur = clampToRange(new Date()); render(); };
    $('#tabMonth').onclick = () => { view = 'month'; render(); };
    $('#tabYear').onclick = () => { view = 'year'; render(); };
    $('#tabHol').onclick = () => { view = 'hol'; render(); };
    document.querySelectorAll('.tabbar button').forEach((b) => {
      b.onclick = () => { view = b.dataset.v; closeSheet(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    });
    $('#printBtn').onclick = () => window.print();
    $('#copyBtn').onclick = async () => {
      const url = shareLink();
      try { await navigator.clipboard.writeText(url); } catch (e) { prompt(t('copy'), url); }
      const b = $('#copyBtn'), old = b.textContent;
      b.textContent = t('copied'); setTimeout(() => { b.textContent = old; }, 1800);
    };
    $('#icsBtn').onclick = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([buildIcs()], { type: 'text/calendar;charset=utf-8' }));
      a.download = 'calendrier-garde.ics';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    };
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeSettings(); closeSheet(); }
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
    render();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
