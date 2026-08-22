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
      settings: 'Réglages', todayBtn: 'Aujourd’hui',
      schoolYear: 'Année scolaire {y}',
      dows: ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'],
      months: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
      vac: { toussaint:'Toussaint', noel:'Noël', hiver:'Hiver', printemps:'Printemps', ascension:'Ascension', ete:'Été' },
      fer: { jourAn:'Jour de l’An', paques:'Lundi de Pâques', travail:'Fête du Travail', victoire:'8 Mai',
             ascension:'Ascension', pentecote:'Lundi de Pentecôte', nationale:'14 Juillet',
             assomption:'Assomption', toussaint:'Toussaint', armistice:'11 Novembre', noel:'Noël' },
      wk: 'S{n}', wkEven: 'Semaine {n} · paire', wkOdd: 'Semaine {n} · impaire',
      rTerm: 'Période scolaire', rHol: 'Petites vacances',
      rSummer: 'Vacances d’été · semaine {w}', rSummerTail: 'Fin des vacances d’été',
      rMidweek: 'Mardi soir → mercredi {t}', rMidweekShort: 'Mardi',
      rReturn: 'Retour {t}', rMeres: 'Fête des mères', rPeres: 'Fête des pères',
      official: 'dates officielles', projected: 'prévisionnel',
      legendVac: 'Vacances scolaires', legendToday: 'Aujourd’hui', legendHand: 'échange',
      copy: 'Copier le lien à partager', copied: 'Lien copié ✓',
      ics: 'Ajouter à mon téléphone (.ics)', print: 'Imprimer / PDF',
      rulesTitle: 'Règles appliquées',
      r1: 'Semaine paire chez {a}, semaine impaire chez {b}, d’après la numérotation des semaines du calendrier civil.',
      r2: 'Échange le vendredi à la sortie des classes ({t}). La semaine de garde va du vendredi au vendredi suivant.',
      r3: 'Du mardi soir, sortie des classes, au mercredi {m} chez {b} — jusqu’à la rentrée de septembre 2029, entrée en 6e du plus jeune.',
      r4: 'Petites vacances : la même alternance paire / impaire se poursuit, avec le même échange du vendredi.',
      r5: 'Vacances d’été : huit semaines. Les 1re, 2e, 3e et la 7e chez {a} les années paires, les 4e, 5e, 6e et la 8e chez {b} ; inversement les années impaires. La première semaine démarre au premier jour des vacances ; les jours restants suivent l’alternance des semaines.',
      r6: 'Week-end de la fête des mères chez {b}, week-end de la fête des pères chez {a}.',
      r7: 'Dates de vacances : celles de l’académie où résident les enfants — Zone B, Aix-Marseille.',
      projWarn: 'Dates prévisionnelles à partir de septembre 2028',
      projWarnBody: 'Le ministère publie le calendrier scolaire environ trois ans à l’avance. Les dates officielles vont jusqu’à l’été 2028. Au-delà, les vacances sont estimées et signalées « prévisionnel ». L’alternance des semaines paires et impaires, elle, reste exacte.',
      disclaimer: 'Cet outil est une aide à la lecture du planning. En cas de désaccord, seul le jugement fait foi. Dates scolaires : Zone B, académie d’Aix-Marseille (arrêtés du 22 octobre 2025 et du 21 juillet 2026).',
      ruleLine: 'Semaine paire → {a}. Semaine impaire → {b}. Échange le vendredi à la sortie des classes, {t}.',
      ruleExtra: 'Plus : mardi soir → mercredi {m} chez {b}. Vacances d’été partagées en huit semaines.',
      privacy: 'Aucun texte du jugement n’est enregistré. Les prénoms et les réglages restent dans ce navigateur et dans le lien que vous partagez. Rien n’est envoyé sur Internet.',
      sTitle: 'Réglages', sSub: 'Le rythme fixé pour la garde alternée.',
      sNameA: 'Nom du père affiché', sNameB: 'Nom de la mère affiché',
      sEven: 'Les semaines paires sont chez',
      sEvenH: 'Le caractère pair ou impair suit la numérotation des semaines du calendrier civil.',
      sTime: 'Heure de l’échange du vendredi',
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
      longTitle: 'Périodes longues à anticiper',
      longBody: 'Une même période de {n} jours d’affilée chez le même parent. Cela vient de la numérotation civile des semaines et non d’une décision : certaines années comptent 53 semaines, et deux semaines impaires se suivent alors. À regarder à l’avance plutôt qu’en décembre.',
      longNone: 'Aucune période de plus de 9 jours cette année.',
      ferHandTitle: 'Échange tombant un jour férié',
      ferHandBody: 'L’échange tombe ce jour-là parce que c’est un vendredi, pas par choix. À convenir à l’avance plutôt que le jour même.',
      holBalance: 'Bilan des vacances · {y}',
      holSmall: 'Petites vacances', holAll: 'Toutes les vacances',
      holEqual: 'à égalité', holGap: 'écart de {n} j',
      dcount: '{n} j',
      nightsTitle: 'Répartition des nuits',
      nightsBody: '{a} : {na} nuits ({pa} %) · {b} : {nb} nuits ({pb} %) sur {y}',
    },
    en: {
      title: 'Custody calendar', sub: 'Zone B · Aix-Marseille education district',
      today: 'Today', with: 'The children are with',
      until: 'until {d} at {t}',
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
      wk: 'W{n}', wkEven: 'Week {n} · even', wkOdd: 'Week {n} · odd',
      rTerm: 'Term time', rHol: 'Half-term holidays',
      rSummer: 'Summer holidays · week {w}', rSummerTail: 'End of the summer holidays',
      rMidweek: 'Tuesday evening → Wednesday {t}', rMidweekShort: 'Tuesday',
      rReturn: 'Back at {t}', rMeres: 'Mother’s Day', rPeres: 'Father’s Day',
      official: 'official dates', projected: 'projected',
      legendVac: 'School holidays', legendToday: 'Today', legendHand: 'handover',
      copy: 'Copy link to share', copied: 'Link copied ✓',
      ics: 'Add to my phone (.ics)', print: 'Print / PDF',
      rulesTitle: 'Rules applied',
      r1: 'Even week with {a}, odd week with {b}, by civil calendar week numbering.',
      r2: 'Changeover Friday at the end of the school day ({t}). A custody week runs Friday to the following Friday.',
      r3: 'Tuesday from the end of the school day to Wednesday {m} with {b} — until the September 2029 rentrée, when the youngest starts collège.',
      r4: 'Half-term holidays: the same even / odd alternation continues, with the same Friday changeover.',
      r5: 'Summer holidays: eight weeks. The 1st, 2nd, 3rd and 7th with {a} in even years, the 4th, 5th, 6th and 8th with {b}; reversed in odd years. Week one starts on the first day of the holidays; any remaining days follow the week alternation.',
      r6: 'Mother’s Day weekend with {b}, Father’s Day weekend with {a}.',
      r7: 'Holiday dates: those of the district where the children live — Zone B, Aix-Marseille.',
      projWarn: 'Projected dates from September 2028 onwards',
      projWarnBody: 'The ministry publishes the school calendar about three years ahead. Official dates run to summer 2028. Beyond that, holidays are estimates and marked “projected”. The even/odd week alternation itself stays exact.',
      disclaimer: 'This tool is a reading aid for the schedule. If there is any disagreement, only the judgment counts. School dates: Zone B, Aix-Marseille district (decrees of 22 October 2025 and 21 July 2026).',
      ruleLine: 'Even week → {a}. Odd week → {b}. Changeover every Friday at the end of school, {t}.',
      ruleExtra: 'Plus: Tuesday evening → Wednesday {m} with {b}. Summer split into eight weeks.',
      privacy: 'No judgment text is stored. The names and settings stay in this browser and in the link you share. Nothing is sent over the internet.',
      sTitle: 'Settings', sSub: 'The rhythm set for shared residence.',
      sNameA: 'Name shown for the father', sNameB: 'Name shown for the mother',
      sEven: 'Even weeks are with',
      sEvenH: 'Even and odd follow the civil calendar week numbering.',
      sTime: 'Friday handover time',
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
      longTitle: 'Long stretches worth planning for',
      longBody: 'A single run of {n} days with the same parent. This comes from civil week numbering rather than from any decision: some years have 53 weeks, and two odd weeks then fall back to back. Better looked at in advance than in December.',
      longNone: 'No stretch longer than 9 days this year.',
      ferHandTitle: 'Handover falling on a public holiday',
      ferHandBody: 'The changeover lands there because it is a Friday, not by choice. Worth agreeing in advance rather than on the day itself.',
      holBalance: 'Holiday balance · {y}',
      holSmall: 'Half-term holidays', holAll: 'All holidays',
      holEqual: 'level', holGap: '{n}-day gap',
      dcount: '{n} d',
      nightsTitle: 'Split of nights',
      nightsBody: '{a}: {na} nights ({pa}%) · {b}: {nb} nights ({pb}%) over {y}',
    },
  };

  let lang = (navigator.language || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr';
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

  function loadCfg() {
    const hash = location.hash.match(/cfg=([A-Za-z0-9_-]+)/);
    if (hash) {
      try {
        const json = decodeURIComponent(escape(atob(hash[1].replace(/-/g, '+').replace(/_/g, '/'))));
        return { ...E.DEFAULTS, ...JSON.parse(json) };
      } catch (e) { /* fall through */ }
    }
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return { ...E.DEFAULTS, ...JSON.parse(raw) };
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
    // Whole-civil-week holidays change over on Sunday evening, not Friday.
    if (d.src === 'holiday-cal' && d.date.getUTCDay() === 1) return cfg.holidayHandover;
    return cfg.time;
  }

  /** A short human reason for why a day belongs to whom. */
  function reasonOf(d, short) {
    switch (d.src) {
      case 'fete-meres': return t('rMeres');
      case 'fete-peres': return t('rPeres');
      case 'midweek':    return short ? t('rMidweekShort') : t('rMidweek', { t: cfg.midweekReturn });
      case 'summer':     return t('rSummer', { w: d.summerWk });
      case 'summer-tail':return t('rSummerTail');
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

    $('#ruleLine').innerHTML =
      '<strong>' + esc(t('ruleLine', { a: nameOf('A'), b: nameOf('B'), t: cfg.time })) + '</strong>' +
      (cfg.midweek ? ' <span class="rx">' + esc(t('ruleExtra', { b: nameOf('B'), m: cfg.midweekReturn })) + '</span>' : '');

    renderRules();
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
      root.appendChild(nightsCard(cur.getUTCFullYear()));
    } else {
      const sy = schoolYearOf(cur);
      $('#periodLabel').textContent = t('schoolYear', { y: sy });
      root.appendChild(holView(sy));
    }
    renderLegend();
  }

  function renderRules() {
    const v = { a: nameOf('A'), b: nameOf('B'), t: cfg.time, m: cfg.midweekReturn };
    const items = ['r1', 'r2'];
    if (cfg.midweek) items.push('r3');
    items.push('r4', 'r5');
    if (cfg.feteDerogation) items.push('r6');
    items.push('r7');
    $('#rulesBox').innerHTML =
      `<summary>${esc(t('rulesTitle'))}</summary><ul>` +
      items.map((k) => `<li>${esc(t(k, v))}</li>`).join('') + '</ul>';
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
    const chips = [reasonOf(d)];
    if (d.period) chips.push(L().vac[d.period.key] + (isProjected(d.period) ? ' · ' + t('projected') : ''));
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

  function dayCell(dt, inMonth) {
    const iso = ISO(dt), d = plan.get(iso);
    const el = document.createElement('div');
    if (!d) { el.className = 'day out'; el.innerHTML = `<div class="num"><span>${dt.getUTCDate()}</span></div>`; return el; }

    el.className = 'day p' + d.parent + (inMonth ? '' : ' out') + (d.period ? ' vacday' : '') +
      (d.isHandover ? ' handover' : '') + (iso === TODAY_ISO ? ' today' : '');
    if (d.isHandover && d.from) el.style.setProperty('--out-c', `var(--${d.from === 'A' ? 'a' : 'b'})`);
    el.title = `${cap(fmtFull(dt))} — ${nameOf(d.parent)} · ${reasonOf(d)}` +
      (d.ferie ? ` · ${L().fer[d.ferie]}` : '');

    let html = `<div class="num"><span>${dt.getUTCDate()}</span><span class="who-i i${d.parent}">${esc(initialOf(d.parent))}</span></div>`;
    // Week number on Mondays, so anyone can check the parity themselves.
    if (dt.getUTCDay() === 1) html += `<span class="tag wk">${esc(t('wk', { n: d.week }))}</span>`;
    // Only flag the Tuesday move when it actually changes household — on the
    // mother's own weeks the children are already there.
    if (d.src === 'midweek' && d.isHandover) html += `<span class="tag mid">${esc(t('rMidweekShort'))}</span>`;
    if (d.note === 'midweek-return') html += `<span class="tag mid">${esc(t('rReturn', { t: cfg.midweekReturn }))}</span>`;
    if (d.src.startsWith('fete')) html += `<span class="tag fete">${esc(d.src === 'fete-meres' ? t('rMeres') : t('rPeres'))}</span>`;
    if (d.period && (dt.getUTCDate() === 1 || dayDiff(d.period.start, dt) === 0)) {
      html += `<span class="tag vac">${esc(L().vac[d.period.key])}</span>`;
      if (isProjected(d.period)) html += `<span class="tag proj">${esc(t('projected'))}</span>`;
    }
    if (d.src === 'summer' && (dayDiff(d.period.start, dt) % 7 === 0)) html += `<span class="tag vac">${esc(t('rSummer', { w: d.summerWk }))}</span>`;
    if (d.ferie) html += `<span class="tag fer">${esc(L().fer[d.ferie])}</span>`;
    if (d.isHandover) html += `<span class="hx">⇄<span class="hxt"> ${esc(handoverTime(d))}</span></span>`;
    el.innerHTML = html;
    return el;
  }

  function monthCard(year, month) {
    const card = document.createElement('div'); card.className = 'card';
    const dow = document.createElement('div'); dow.className = 'dow';
    dow.innerHTML = L().dows.map((x) => `<span>${x}</span>`).join('');
    const grid = document.createElement('div'); grid.className = 'grid';
    const first = new Date(Date.UTC(year, month, 1));
    let dt = addDays(first, -((first.getUTCDay() + 6) % 7));
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

  /** How the nights actually fall over a year — the question both parents ask. */
  function nightsCard(year) {
    let na = 0, nb = 0;
    for (let dt = new Date(Date.UTC(year, 0, 1)); dt.getUTCFullYear() === year; dt = addDays(dt, 1)) {
      const d = plan.get(ISO(dt));
      if (d) (d.parent === 'A' ? na++ : nb++);
    }
    const box = document.createElement('div'); box.className = 'vrow'; box.style.marginTop = '16px';
    const tot = na + nb || 1;
    box.innerHTML = `<h3>${esc(t('nightsTitle'))}</h3><div class="dates">${esc(t('nightsBody', {
      a: nameOf('A'), na, pa: (100 * na / tot).toFixed(1),
      b: nameOf('B'), nb, pb: (100 * nb / tot).toFixed(1), y: year }))}</div>`;
    return box;
  }

  const schoolYearOf = (dt) => {
    const y = dt.getUTCFullYear();
    return dt.getUTCMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
  };

  /** Days held by each parent inside one period. */
  function countPeriod(p) {
    let a = 0, b = 0;
    for (let dt = p.start; dt <= p.last; dt = addDays(dt, 1)) {
      const d = plan.get(ISO(dt));
      if (d) (d.parent === 'A' ? a++ : b++);
    }
    return { a, b };
  }

  function balanceCard(sy, periods) {
    const small = { a: 0, b: 0 }, all = { a: 0, b: 0 };
    for (const p of periods) {
      const c = countPeriod(p);
      all.a += c.a; all.b += c.b;
      if (p.key !== 'ete' && p.key !== 'ascension') { small.a += c.a; small.b += c.b; }
    }
    const line = (label, c) => {
      const gap = Math.abs(c.a - c.b);
      return `<div class="balrow"><span class="ball">${esc(label)}</span>
        <span class="halfbox pA bal">${esc(nameOf('A'))} <b>${esc(t('dcount', { n: c.a }))}</b></span>
        <span class="halfbox pB bal">${esc(nameOf('B'))} <b>${esc(t('dcount', { n: c.b }))}</b></span>
        <span class="pill ${gap === 0 ? 'ok' : ''}">${esc(gap === 0 ? t('holEqual') : t('holGap', { n: gap }))}</span></div>`;
    };
    const box = document.createElement('div'); box.className = 'vrow bal-card';
    box.innerHTML = `<h3>${esc(t('holBalance', { y: sy }))}</h3>
      ${line(t('holSmall'), small)}${line(t('holAll'), all)}`;

    // Long unbroken stretches are the thing that actually causes arguments,
    // so surface them a year ahead instead of letting December find them.
    const y0 = Number(sy.slice(0, 4));
    const span = new Map([...plan].filter(([k]) => k >= `${y0}-09-01` && k < `${y0 + 1}-09-01`));
    const longs = E.blocks(span).filter((b) => b.days >= 10);
    // A changeover landing on Christmas Day or another holiday is the classic
    // avoidable row. Name it months ahead.
    const ferHand = [...span.values()].filter((d) => d.isHandover && d.ferie);
    if (ferHand.length) {
      box.innerHTML += `<div class="longwarn"><strong>${esc(t('ferHandTitle'))}</strong>` +
        ferHand.map((d) => `<div class="longrow">
          <span class="halfbox p${d.parent} bal">${esc(nameOf(d.parent))} <b>${esc(handoverTime(d))}</b></span>
          <span>${esc(cap(fmtLong(d.date)))} — ${esc(L().fer[d.ferie])}</span></div>`).join('') +
        `<div class="longnote">${esc(t('ferHandBody'))}</div></div>`;
    }
    if (longs.length) {
      box.innerHTML += `<div class="longwarn"><strong>${esc(t('longTitle'))}</strong>` +
        longs.map((b) => `<div class="longrow">
          <span class="halfbox p${b.parent} bal">${esc(nameOf(b.parent))} <b>${esc(t('dcount', { n: b.days }))}</b></span>
          <span>${esc(cap(fmtLong(b.start)))} → ${esc(cap(fmtLong(b.end)))}</span></div>`).join('') +
        `<div class="longnote">${esc(t('longBody', { n: Math.max(...longs.map((b) => b.days)) }))}</div></div>`;
    }
    return box;
  }

  function holView(sy) {
    const wrap = document.createElement('div'); wrap.className = 'vlist';
    const periods = E.periodsFor(cfg, RANGE_FROM, RANGE_TO).filter((p) => p.sy === sy);
    if (!periods.length) { wrap.innerHTML = '<div class="vrow">—</div>'; return wrap; }
    wrap.appendChild(balanceCard(sy, periods));

    for (const p of periods) {
      const total = dayDiff(p.start, p.last) + 1;
      const inner = E.blocks(new Map([...plan].filter(([k]) => k >= ISO(p.start) && k <= ISO(p.last))));
      const row = document.createElement('div'); row.className = 'vrow';
      const c = countPeriod(p);
      row.innerHTML = `<h3>${esc(L().vac[p.key])}
          <span class="pill ${isProjected(p) ? '' : 'ok'}">${esc(isProjected(p) ? t('projected') : t('official'))}</span></h3>
        <div class="dates">${esc(cap(fmtLong(p.start)))} → ${esc(cap(fmtLong(p.last)))} · ${esc(t('days', { n: total }))}
          &nbsp;·&nbsp; <b>${esc(nameOf('A'))} ${esc(t('dcount', { n: c.a }))}</b> · <b>${esc(nameOf('B'))} ${esc(t('dcount', { n: c.b }))}</b></div>
        <div class="halves">` + inner.map((b) => {
          const label = b.src === 'summer'
            ? t('rSummer', { w: b.summerWk }) + (b.days > 7 ? ` – ${b.summerWk + Math.round(b.days / 7) - 1}` : '')
            : b.src === 'summer-tail' ? t('rSummerTail')
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
      <span class="k"><span class="sw" style="outline:2px solid var(--ink);outline-offset:-2px"></span>${esc(t('legendToday'))}</span>
      <span class="k">⇄ ${esc(t('legendHand'))}</span>`;
  }

  /* ------------------------------ settings ------------------------------ */
  function openSettings() {
    const s = $('#drawer');
    const opt = (v, l, c) => `<option value="${v}" ${String(c) === String(v) ? 'selected' : ''}>${esc(l)}</option>`;
    s.innerHTML = `
      <h2>${esc(t('sTitle'))}</h2><div class="sub">${esc(t('sSub'))}</div>

      <div class="field"><label for="fA">${esc(t('sNameA'))}</label><input type="text" id="fA" value="${esc(IS_DEFAULT_NAME(cfg.a,'A') ? '' : cfg.a)}" placeholder="${esc(DEFAULT_NAMES[lang].A)}"></div>
      <div class="field"><label for="fB">${esc(t('sNameB'))}</label><input type="text" id="fB" value="${esc(IS_DEFAULT_NAME(cfg.b,'B') ? '' : cfg.b)}" placeholder="${esc(DEFAULT_NAMES[lang].B)}"></div>

      <div class="field"><label for="fEven">${esc(t('sEven'))}</label>
        <select id="fEven">${opt('A', nameOf('A'), cfg.evenWeekParent)}${opt('B', nameOf('B'), cfg.evenWeekParent)}</select>
        <div class="help">${esc(t('sEvenH'))}</div></div>

      <div class="field"><label for="fTime">${esc(t('sTime'))}</label><input type="time" id="fTime" value="${esc(cfg.time)}"></div>

      <div class="field"><label>${esc(t('sMid'))}</label>
        <label style="display:flex;gap:9px;align-items:center;font-weight:600;margin-bottom:8px">
          <input type="checkbox" id="fMid" ${cfg.midweek ? 'checked' : ''}> ${esc(t('sMidOn'))}</label>
        <label for="fMidEnd" style="font-size:.84rem;font-weight:600">${esc(t('sMidEnd'))}</label>
        <input type="date" id="fMidEnd" value="${esc(cfg.midweekEnd)}" min="${RANGE_FROM}" max="${RANGE_TO}">
        <div class="help" id="midEcho">${esc(cap(fmtFull(D(cfg.midweekEnd))))} · ${esc(t('sMidEndH'))}</div>
        <label for="fMidRet" style="font-size:.84rem;font-weight:600;margin-top:9px;display:block">${esc(t('sMidRet'))}</label>
        <input type="time" id="fMidRet" value="${esc(cfg.midweekReturn)}"></div>

      <div class="field"><label>${esc(t('sFete'))}</label>
        <label style="display:flex;gap:9px;align-items:center;font-weight:600">
          <input type="checkbox" id="fFete" ${cfg.feteDerogation ? 'checked' : ''}> ${esc(t('sFeteOn'))}</label></div>

      <div class="field"><label for="fHS">${esc(t('sHolStart'))}</label>
        <select id="fHS">${opt('fri', t('hsFri'), cfg.holStart)}${opt('exact', t('hsExact'), cfg.holStart)}</select></div>

      <div class="actions">
        <button class="btn primary" id="fSave">${esc(t('save'))}</button>
        <button class="btn" id="fClose">${esc(t('close'))}</button>
        <span class="spacer"></span>
        <button class="btn" id="fReset">${esc(t('reset'))}</button>
      </div>`;
    s.classList.remove('hidden'); $('#scrim').classList.remove('hidden');

    $('#fMidEnd').oninput = (e) => {
      if (e.target.value) $('#midEcho').textContent = cap(fmtFull(D(e.target.value))) + ' · ' + t('sMidEndH');
    };
    $('#fClose').onclick = closeSettings;
    $('#fReset').onclick = () => { cfg = { ...E.DEFAULTS }; saveCfg(); rebuild(); closeSettings(); render(); };
    $('#fSave').onclick = () => {
      cfg.a = $('#fA').value.trim() || DEFAULT_NAMES.fr.A;
      cfg.b = $('#fB').value.trim() || DEFAULT_NAMES.fr.B;
      cfg.evenWeekParent = $('#fEven').value;
      cfg.time = $('#fTime').value || '16:30';
      cfg.midweek = $('#fMid').checked;
      cfg.midweekEnd = $('#fMidEnd').value || E.DEFAULTS.midweekEnd;
      cfg.midweekReturn = $('#fMidRet').value || '18:00';
      cfg.feteDerogation = $('#fFete').checked;
      cfg.holStart = $('#fHS').value;
      saveCfg(); rebuild(); closeSettings(); render();
    };
  }
  const closeSettings = () => { $('#drawer').classList.add('hidden'); $('#scrim').classList.add('hidden'); };

  /* ------------------------------- sharing ------------------------------ */
  const shareLink = () => location.origin + location.pathname + '#cfg=' +
    btoa(unescape(encodeURIComponent(JSON.stringify(cfg)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

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
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([buildIcs()], { type: 'text/calendar;charset=utf-8' }));
      a.download = 'calendrier-garde.ics';
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
