/* ---------------------------------------------------------------------------
   engine.js — works out which parent has the children on any given day.

   The rhythm it encodes:

     Term time
       - Even civil weeks with parent A, from Friday at the end of the school
         day to the following Friday at the start of the school day;
       - Odd civil weeks with parent B;
       - Every Tuesday from the end of the school day to Wednesday 18:00 with
         parent B, until the youngest child starts secondary school.

     Half-term holidays
       - The same even/odd whole-week alternation.

     Summer holidays — eight weeks, split 3 / 3 / 1 / 1
       - weeks 1-3 : A in even years, B in odd years
       - weeks 4-6 : B in even years, A in odd years
       - week 7    : A in even years, B in odd years
       - week 8    : B in even years, A in odd years

     Throughout
       - Even and odd follow ISO-8601 civil week numbering;
       - Holiday dates are those of the children's education district;
       - Each parent has the children for the Mother's Day or Father's Day
         weekend that concerns them.

   Parent A is the father and parent B the mother. Every switch above is
   configurable, since the wording of these arrangements varies. Everything is
   computed in UTC so French summer time never shifts a day.
--------------------------------------------------------------------------- */

(function () {
'use strict';

const H = window.Vacances.helpers;
const { D, ISO, addDays, dayDiff, onOrAfterWeekday } = H;
const easterSunday = window.Vacances.easterSunday;

const other = (p) => (p === 'A' ? 'B' : 'A');

const DEFAULTS = {
  v: 2,
  a: 'Papa',                // parent A — le pere
  b: 'Maman',               // parent B — la mere
  evenWeekParent: 'A',      // even civil weeks with the father

  // Tuesday end-of-school to Wednesday 18:00 at parent B's home, running
  // until the youngest child starts secondary school.
  midweek: true,
  midweekParent: 'B',
  midweekEnd: '2029-09-01',
  midweekReturn: '18:00',

  // Each parent takes the Mother's/Father's Day weekend that concerns them.
  feteDerogation: true,

  // How the even/odd label is read during the half-term holidays:
  //   'friday'   — the Friday-to-Friday block keeps running, labelled by the
  //                week holding its Monday-to-Thursday, exactly as in term
  //                time. This is the default: it keeps the Friday changeover
  //                that the operative wording sets out.
  //   'calendar' — whole Monday-to-Sunday civil weeks by their own number,
  //                so handovers fall on Sunday rather than Friday. Offered
  //                for comparison; it is the whole-week formulation that was
  //                requested but not retained.
  // 'monday' — the eight summer weeks are civil weeks, so week one starts on
  //            the first Monday of the break and the changeovers fall on the
  //            week boundary.
  // 'start'  — week one starts on the first day of the break.
  summerAnchor: 'monday',

  holidayWeeks: 'friday',
  holidayHandover: '18:00',

  time: '16:30',            // Friday handover, at the end of the school day
  holStart: 'fri',          // holidays begin Friday at the end of the school day
  confirmed: false,
};

/* The summer sequence for an EVEN year, one entry per holiday week 1..8.
   Odd years are the mirror image. 3 / 3 / 1 / 1. */
const SUMMER_EVEN = ['A', 'A', 'A', 'B', 'B', 'B', 'A', 'B'];

/* The four "petites vacances". The Ascension bridge is a long weekend rather
   than a holiday period, so the ordinary Friday rotation runs through it. */
const PETITES = new Set(['toussaint', 'noel', 'hiver', 'printemps']);

/* ---------------------------- calendar helpers -------------------------- */

/** ISO-8601 week number — the "numerotation des semaines dans le calendrier civil". */
function isoWeek(dt) {
  const d = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + 3);   // Thursday of this week
  const firstThu = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  firstThu.setUTCDate(firstThu.getUTCDate() - ((firstThu.getUTCDay() + 6) % 7) + 3);
  return 1 + Math.round((d - firstThu) / (7 * 86400000));
}

/**
 * The week number that governs a given day.
 *
 * A custody week runs Friday evening to the following Friday morning, so it
 * straddles two civil weeks: it holds the Saturday and Sunday of one and the
 * Monday-to-Thursday of the next. The school days sit in the later week, so
 * that is the week whose number decides the period — which is the same as
 * taking the civil week of the day three days on.
 */
const custodyWeek = (dt) => isoWeek(addDays(dt, 3));

/** Fete des meres: last Sunday of May, or the first Sunday of June if that Sunday is Pentecost. */
function feteDesMeres(year) {
  const may31 = new Date(Date.UTC(year, 4, 31));
  const lastSun = addDays(may31, -may31.getUTCDay());
  const pentecost = addDays(easterSunday(year), 49);
  if (ISO(lastSun) === ISO(pentecost)) {
    const jun1 = new Date(Date.UTC(year, 5, 1));
    return addDays(jun1, (7 - jun1.getUTCDay()) % 7);
  }
  return lastSun;
}

/** Fete des peres: third Sunday of June. */
function feteDesPeres(year) {
  const jun1 = new Date(Date.UTC(year, 5, 1));
  return addDays(addDays(jun1, (7 - jun1.getUTCDay()) % 7), 14);
}

/** The Saturday+Sunday around a given Sunday. */
const weekendOf = (sunday) => [ISO(addDays(sunday, -1)), ISO(sunday)];

/* --------------------------- school-holiday spans ----------------------- */
/**
 * The arretes start most holidays on a Saturday ("fin des cours le samedi"),
 * but there is no school that day and this judgment hands over at the "sortie
 * des classes". Pulling the start back to the Friday matches the wording and
 * lines the holiday boundary up with the Friday changeover.
 */
function periodsFor(cfg, fromISO, toISO) {
  return window.Vacances.periodsBetween(fromISO, toISO).map((p) => {
    if (cfg.holStart === 'fri' && p.start.getUTCDay() === 6) {
      return { ...p, start: addDays(p.start, -1), shiftedToFriday: true };
    }
    return p;
  });
}

/* ------------------------------ the rhythm ------------------------------ */
/** Base rule: even civil week to one parent, odd to the other. */
function weekParityParent(dt, cfg) {
  const w = custodyWeek(dt);
  return w % 2 === 0 ? cfg.evenWeekParent : other(cfg.evenWeekParent);
}

/**
 * Which of the eight summer weeks a day falls in.
 *
 * Week one begins on the first day of the summer holidays. Eight weeks is 56
 * days and a summer runs 54 to 62, so the eight named weeks never tile the
 * break exactly; there are usually a few days left at the end.
 *
 * Those days stay with the eighth week's parent rather than reverting to the
 * term-time alternation. Two reasons. The order allocates by period — one
 * provision for term time, one for the half-term holidays, one for the summer
 * — so days that are still summer holidays fall under the summer provision,
 * and importing the term-time rule into them would apply a clause expressly
 * limited to "periode scolaire" to days that are expressly not. And because
 * the eighth week alternates with the parity of the year, the leftover days
 * alternate with it, which keeps the arrangement level over time; assigning
 * them by civil-week parity instead drifts one way, since late August tends to
 * fall in even weeks.
 *
 * In a summer shorter than eight weeks the sequence is simply cut short.
 */
function summerWeek(dt, period) {
  const anchor = cfgSummerAnchor === 'monday'
    ? onOrAfterWeekday(period.start, 1)   // first Monday: the weeks are civil weeks
    : period.start;                       // the first day of the holidays
  const n = dayDiff(anchor, dt);
  if (n < 0) return 0;                    // days before week one follow the alternation
  const w = Math.floor(n / 7) + 1;
  return w <= 8 ? w : 8;                  // the eighth week runs to the end of the break
}
let cfgSummerAnchor = 'monday';

function summerParent(week, year, cfg) {
  const seq = SUMMER_EVEN[week - 1];
  const flip = cfg.evenWeekParent !== 'A';           // honour a swapped mapping
  const base = year % 2 === 0 ? seq : other(seq);
  return flip ? other(base) : base;
}

/**
 * Build a day-by-day plan.
 * @returns Map<iso, {date,iso,parent,src,period,summerWk,week,ferie,isHandover,from,note}>
 */
function plan(cfg, fromISO, toISO) {
  cfgSummerAnchor = cfg.summerAnchor || 'monday';
  const from = D(fromISO), to = D(toISO);
  const periods = periodsFor(cfg, fromISO, toISO);
  const feries = window.Vacances.feriesBetween(fromISO, toISO);
  const midweekEnd = cfg.midweekEnd ? D(cfg.midweekEnd) : null;

  // Mother's Day / Father's Day weekends across the span.
  const fetes = new Map();
  if (cfg.feteDerogation) {
    for (let y = from.getUTCFullYear(); y <= to.getUTCFullYear(); y++) {
      weekendOf(feteDesMeres(y)).forEach((k) => fetes.set(k, { parent: 'B', kind: 'meres' }));
      weekendOf(feteDesPeres(y)).forEach((k) => fetes.set(k, { parent: 'A', kind: 'peres' }));
    }
  }

  const out = new Map();
  let prev = null;
  for (let dt = from; dt <= to; dt = addDays(dt, 1)) {
    const iso = ISO(dt);
    const period = periods.find((p) => dt >= p.start && dt <= p.last) || null;
    const isSummer = !!period && period.key === 'ete';

    let parent, src, summerWk = 0, note = null;

    const fete = fetes.get(iso);
    if (fete) {
      // "Par derogation a l'organisation ci-dessus convenue…"
      parent = fete.parent; src = 'fete-' + fete.kind;
    } else if (isSummer && (summerWk = summerWeek(dt, period))) {
      parent = summerParent(summerWk, period.start.getUTCFullYear(), cfg);
      src = 'summer';
    } else if (!period && cfg.midweek && dt.getUTCDay() === 2 &&
               (!midweekEnd || dt < midweekEnd)) {
      // Tuesday night at the mother's, term time only.
      parent = cfg.midweekParent; src = 'midweek';
    } else if (period && PETITES.has(period.key) && cfg.holidayWeeks === 'calendar') {
      // Whole civil weeks, read straight off a calendar.
      const w = isoWeek(dt);
      parent = w % 2 === 0 ? cfg.evenWeekParent : other(cfg.evenWeekParent);
      src = 'holiday-cal';
    } else {
      parent = weekParityParent(dt, cfg);
      src = period ? (isSummer ? 'summer-tail' : 'holiday-week') : 'term-week';
    }

    // Wednesday is shared: at the mother's until 18:00, then the father collects.
    if (!period && cfg.midweek && dt.getUTCDay() === 3 && (!midweekEnd || dt < midweekEnd) &&
        parent !== cfg.midweekParent) {
      note = 'midweek-return';
    }

    const day = {
      date: dt, iso, parent, src, period, summerWk, note,
      week: (period && PETITES.has(period.key) && cfg.holidayWeeks === 'calendar')
        ? isoWeek(dt) : custodyWeek(dt),
      ferie: feries[iso] || null,
      isHandover: prev !== null && prev.parent !== parent,
      from: prev ? prev.parent : null,
    };
    out.set(iso, day);
    prev = day;
  }
  return out;
}

/** Group a plan into continuous blocks held by one parent. */
function blocks(planMap) {
  const res = [];
  for (const d of planMap.values()) {
    const last = res[res.length - 1];
    if (last && last.parent === d.parent) { last.end = d.date; last.days++; }
    else res.push({ parent: d.parent, start: d.date, end: d.date, days: 1,
                    src: d.src, period: d.period, summerWk: d.summerWk, week: d.week });
  }
  return res;
}

/** The next `n` handovers strictly after `afterISO`. */
function nextHandovers(planMap, afterISO, n = 5) {
  return [...planMap.values()].filter((d) => d.iso > afterISO && d.isHandover).slice(0, n);
}

window.Engine = {
  DEFAULTS, plan, blocks, nextHandovers, periodsFor, other,
  isoWeek, custodyWeek, feteDesMeres, feteDesPeres, summerParent,
};

})();
