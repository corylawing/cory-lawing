/* ---------------------------------------------------------------------------
   engine.js — works out which parent has the children on any given day.

   Two layers, in this order of priority:
     1. School-holiday rule  (e.g. "each holiday split in half, alternating
        years") — only applies inside a school-holiday period.
     2. Term-time rotation   (week/week, fortnight, 2-2-3, every other weekend)
        — runs continuously, so it also covers holidays when rule = "continue".

   Everything is computed in UTC so that French summer time never shifts a day.
--------------------------------------------------------------------------- */
(function () {
'use strict';


const H = window.Vacances.helpers;
const { D, ISO, addDays, dayDiff, onOrBeforeWeekday, onOrAfterWeekday } = H;

const mod = (n, m) => ((n % m) + m) % m;
const other = (p) => (p === 'A' ? 'B' : 'A');

/* 2-2-3 rotation over a 14-day cycle, expressed relative to the anchor parent.
   0 = anchor parent, 1 = the other parent.
   Week 1: 2 days / 2 days / 3 days     Week 2: mirrored. */
const CYCLE_223 = [0,0,1,1,0,0,0, 1,1,0,0,1,1,1];

const DEFAULTS = {
  v: 1,
  a: 'Parent A',
  b: 'Parent B',
  pattern: 'week',          // week | fortnight | 223 | eow
  anchor: '2026-07-04',     // start of the 2026 summer holidays
  anchorParent: 'A',
  boundary: 5,              // weekday a new period begins (0=Sun … 5=Fri … 6=Sat)
  time: '16:30',
  holidayRule: 'splitAlt',  // splitAlt | splitFixed | continue
  firstHalf: 'A',           // parent taking the FIRST half (in even years if splitAlt)
  altBasis: 'school',       // school = alternate per school year (2026-2027 counts
                            // as 2026); calendar = alternate per calendar year
  splitShort: false,        // also split the short Ascension break
  resident: 'A',            // main home, only used by pattern 'eow'
  holStart: 'fri',          // fri = holidays begin Friday after school ("sortie des
                            // classes"); exact = the literal date in the arrete
  confirmed: false,         // set once the settings have been checked against the judgment
};

/**
 * School-holiday periods as the judgment reads them.
 *
 * The arretes start most holidays on a Saturday ("fin des cours le samedi"),
 * but there is no school that Saturday, so judgments that hand over at the
 * "sortie des classes" really mean the Friday evening. Pulling the start back
 * to the Friday also makes the holiday boundary line up with a Friday
 * changeover, which stops the rotation from awarding a stray single day
 * immediately before a holiday.
 */
function periodsFor(cfg, fromISO, toISO) {
  return window.Vacances.periodsBetween(fromISO, toISO).map((p) => {
    if (cfg.holStart === 'fri' && p.start.getUTCDay() === 6) {
      return { ...p, start: addDays(p.start, -1), shiftedToFriday: true };
    }
    return p;
  });
}

/** Which parent, purely from the term-time rotation. */
function rotationParent(date, cfg) {
  if (cfg.pattern === 'eow') {
    const anchor = onOrAfterWeekday(D(cfg.anchor), 5);   // first Friday on/after anchor
    const n = dayDiff(anchor, date);
    const weekIdx = mod(Math.floor(n / 7), 2);
    const offset = mod(n, 7);                            // 0=Fri 1=Sat 2=Sun
    const isVisitWeekend = weekIdx === 0 && offset <= 2;
    return isVisitWeekend ? other(cfg.resident) : cfg.resident;
  }

  const anchor = onOrBeforeWeekday(D(cfg.anchor), cfg.boundary);
  const n = dayDiff(anchor, date);
  let idx;
  if (cfg.pattern === 'fortnight')   idx = mod(Math.floor(n / 14), 2);
  else if (cfg.pattern === '223')    idx = CYCLE_223[mod(n, 14)];
  else                               idx = mod(Math.floor(n / 7), 2);   // 'week'
  return idx === 0 ? cfg.anchorParent : other(cfg.anchorParent);
}

/** Is this holiday period one the judgment splits in half? */
function isSplittable(period, cfg) {
  if (cfg.holidayRule === 'continue') return false;
  if (period.key === 'ascension' && !cfg.splitShort) return false;
  return true;
}

/**
 * Which parent takes the FIRST half of a given holiday period.
 * With altBasis 'school' the whole school year swings together, so the parent
 * who takes the first half of Toussaint also takes the first half of the
 * February and spring holidays. With 'calendar' the flip happens on 1 January.
 */
function firstHalfParent(period, cfg) {
  if (cfg.holidayRule === 'splitFixed') return cfg.firstHalf;
  const year = cfg.altBasis === 'calendar'
    ? period.start.getUTCFullYear()
    : Number(period.sy.slice(0, 4));
  return year % 2 === 0 ? cfg.firstHalf : other(cfg.firstHalf);
}

/**
 * Build a day-by-day plan.
 * @returns Map<iso, {date,iso,parent,src,period,half,ferie,isHandover,from}>
 */
function plan(cfg, fromISO, toISO) {
  const from = D(fromISO), to = D(toISO);
  const periods = periodsFor(cfg, fromISO, toISO);
  const feries = window.Vacances.feriesBetween(fromISO, toISO);

  // Pre-compute the half-split boundary of each period once.
  const meta = new Map();
  for (const p of periods) {
    const total = dayDiff(p.start, p.last) + 1;
    meta.set(p, { total, half: Math.ceil(total / 2), first: firstHalfParent(p, cfg) });
  }

  const out = new Map();
  let prev = null;
  for (let dt = from; dt <= to; dt = addDays(dt, 1)) {
    const iso = ISO(dt);
    const period = periods.find((p) => dt >= p.start && dt <= p.last) || null;

    let parent, src = 'rotation', half = null;
    if (period && isSplittable(period, cfg)) {
      const m = meta.get(period);
      const isFirst = dayDiff(period.start, dt) < m.half;
      half = isFirst ? 1 : 2;
      parent = isFirst ? m.first : other(m.first);
      src = 'holiday';
    } else {
      parent = rotationParent(dt, cfg);
    }

    const day = {
      date: dt, iso, parent, src, period, half,
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
  const days = [...planMap.values()];
  const res = [];
  for (const d of days) {
    const last = res[res.length - 1];
    if (last && last.parent === d.parent) { last.end = d.date; last.days++; }
    else res.push({ parent: d.parent, start: d.date, end: d.date, days: 1, src: d.src, period: d.period });
  }
  return res;
}

/** The next `n` handovers strictly after `afterISO`. */
function nextHandovers(planMap, afterISO, n = 5) {
  return [...planMap.values()]
    .filter((d) => d.iso > afterISO && d.isHandover)
    .slice(0, n);
}

window.Engine = { DEFAULTS, plan, blocks, nextHandovers, rotationParent, other, periodsFor };
})();
