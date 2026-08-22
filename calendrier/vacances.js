/* ---------------------------------------------------------------------------
   vacances.js — School holidays & public holidays for the Marseille region
   Zone B — Academie d'Aix-Marseille (Marseille, Aix-en-Provence, Bouches-du-Rhone)

   OFFICIAL data below is transcribed from the arretes published in the Journal
   Officiel:
     - 2026-2027 : arrete du 22 octobre 2025  (JORFTEXT000052416058)
     - 2027-2028 : arrete du 21 juillet 2026  (JORFTEXT000054457294)

   Convention used here:
     start  = FIRST full day with no school
     resume = day school starts again ("reprise des cours")
     The holiday therefore covers  [start .. resume-1]  inclusive.

   HOW TO UPDATE WHEN A NEW ARRETE IS PUBLISHED
   --------------------------------------------
   The Ministry publishes the calendar about 3 school years ahead. When the
   2028-2029 arrete appears, add its Zone B lines to OFFICIAL below and the
   app will automatically stop projecting that year and use the real dates.
--------------------------------------------------------------------------- */
(function () {
'use strict';


const ZONE = { zone: 'B', academie: "Aix-Marseille" };

/* Every line here is an officially published Zone B date. */
const OFFICIAL = [
  // school year 2025-2026 (tail end only - the summer we are currently in)
  { sy: '2025-2026', key: 'ete',       start: '2026-07-04', resume: '2026-09-01' },

  // school year 2026-2027
  { sy: '2026-2027', key: 'toussaint', start: '2026-10-17', resume: '2026-11-02' },
  { sy: '2026-2027', key: 'noel',      start: '2026-12-19', resume: '2027-01-04' },
  { sy: '2026-2027', key: 'hiver',     start: '2027-02-20', resume: '2027-03-08' },
  { sy: '2026-2027', key: 'printemps', start: '2027-04-17', resume: '2027-05-03' },
  { sy: '2026-2027', key: 'ascension', start: '2027-05-06', resume: '2027-05-10' },
  { sy: '2026-2027', key: 'ete',       start: '2027-07-03', resume: '2027-09-02' },

  // school year 2027-2028
  { sy: '2027-2028', key: 'toussaint', start: '2027-10-23', resume: '2027-11-08' },
  { sy: '2027-2028', key: 'noel',      start: '2027-12-18', resume: '2028-01-03' },
  { sy: '2027-2028', key: 'hiver',     start: '2028-02-05', resume: '2028-02-21' },
  { sy: '2027-2028', key: 'printemps', start: '2028-04-08', resume: '2028-04-24' },
  { sy: '2027-2028', key: 'ascension', start: '2028-05-25', resume: '2028-05-29' },
  // Summer 2028 start is official; the September 2028 rentree is not published
  // yet, so the end of this period is a projection.
  { sy: '2027-2028', key: 'ete',       start: '2028-07-04', resume: '2028-09-04',
    resumeProjected: true },
];

/* Last school year for which we hold real, published dates. */
const LAST_OFFICIAL_SY = '2027-2028';

/* ------------------------------- date helpers ---------------------------- */
const MS_DAY = 86400000;
const D  = (s) => { const [y,m,d] = s.split('-').map(Number); return new Date(Date.UTC(y, m-1, d)); };
const ISO = (dt) => dt.toISOString().slice(0, 10);
const addDays = (dt, n) => new Date(dt.getTime() + n * MS_DAY);
const dayDiff = (a, b) => Math.round((b - a) / MS_DAY);
/** JS getUTCDay(): 0=Sun .. 6=Sat */
const onOrAfterWeekday = (dt, wd) => addDays(dt, (wd - dt.getUTCDay() + 7) % 7);
const onOrBeforeWeekday = (dt, wd) => addDays(dt, -((dt.getUTCDay() - wd + 7) % 7));

/** Easter Sunday (Gregorian, Meeus/Jones/Butcher). */
function easterSunday(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

/* ---------------------------- jours feries ------------------------------- */
/** French public holidays (metropole) for a calendar year -> {iso: key}. */
function joursFeries(year) {
  const E = easterSunday(year);
  const out = {};
  const put = (dt, key) => { out[ISO(dt)] = key; };
  put(new Date(Date.UTC(year, 0, 1)),  'jourAn');
  put(addDays(E, 1),                    'paques');      // Lundi de Paques
  put(new Date(Date.UTC(year, 4, 1)),  'travail');
  put(new Date(Date.UTC(year, 4, 8)),  'victoire');
  put(addDays(E, 39),                   'ascension');
  put(addDays(E, 50),                   'pentecote');   // Lundi de Pentecote
  put(new Date(Date.UTC(year, 6, 14)), 'nationale');
  put(new Date(Date.UTC(year, 7, 15)), 'assomption');
  put(new Date(Date.UTC(year, 10, 1)), 'toussaint');
  put(new Date(Date.UTC(year, 10, 11)),'armistice');
  put(new Date(Date.UTC(year, 11, 25)),'noel');
  return out;
}

/* --------------------------- projected periods --------------------------- */
/* Rules below reproduce the pattern of the published arretes. They are
   PROJECTIONS, flagged projected:true, and the UI marks them clearly.
   Zone rotation for hiver/printemps is decided year by year by the Ministry
   and can move those two by a week or two. */
const SAT = 6, MON = 1;

/** Projected rentree: first Mon-Thu on/after 1 Sept; if 1 Sept falls Fri-Sun, the following Monday. */
function projectedRentree(year) {
  const s = new Date(Date.UTC(year, 8, 1));
  const wd = s.getUTCDay();
  if (wd >= 1 && wd <= 4) return s;          // Mon..Thu
  return onOrAfterWeekday(s, MON);           // Fri/Sat/Sun -> next Monday
}

/** Build the projected periods for one school year (Sept `year` -> summer `year+1`). */
function projectedSchoolYear(year) {
  const sy = `${year}-${year + 1}`;
  const twoWeeks = (start) => ({ start: ISO(start), resume: ISO(addDays(start, 16)) });

  const toussaint = onOrAfterWeekday(new Date(Date.UTC(year, 9, 17)), SAT);
  const noel      = onOrBeforeWeekday(new Date(Date.UTC(year, 11, 23)), SAT);
  const hiver     = onOrAfterWeekday(new Date(Date.UTC(year + 1, 1, 4)), SAT);
  const printemps = onOrAfterWeekday(new Date(Date.UTC(year + 1, 3, 7)), SAT);
  // Ascension is derived from Easter, so this one is exact rather than guessed.
  const asc       = addDays(easterSunday(year + 1), 39);
  const ete       = onOrAfterWeekday(new Date(Date.UTC(year + 1, 6, 4)), SAT);

  return [
    { sy, key: 'toussaint', ...twoWeeks(toussaint), projected: true },
    { sy, key: 'noel',      ...twoWeeks(noel),      projected: true },
    { sy, key: 'hiver',     ...twoWeeks(hiver),     projected: true, zoneRotation: true },
    { sy, key: 'printemps', ...twoWeeks(printemps), projected: true, zoneRotation: true },
    { sy, key: 'ascension', start: ISO(asc), resume: ISO(onOrAfterWeekday(addDays(asc, 1), MON)), projected: true },
    { sy, key: 'ete',       start: ISO(ete), resume: ISO(projectedRentree(year + 1)), projected: true },
  ];
}

/* ------------------------------- public API ------------------------------ */
/**
 * All school-holiday periods overlapping [fromISO, toISO], official where
 * published and projected beyond that.
 * Each period: {sy, key, start:Date, last:Date, resume:Date, projected, ...}
 */
function periodsBetween(fromISO, toISO) {
  const from = D(fromISO), to = D(toISO);
  const rows = OFFICIAL.slice();

  // Extend with projections until we cover the requested range.
  const lastOfficialYear = Number(LAST_OFFICIAL_SY.slice(0, 4));   // 2027
  for (let y = lastOfficialYear + 1; y <= to.getUTCFullYear() + 1; y++) {
    rows.push(...projectedSchoolYear(y));
  }

  return rows
    .map((r) => ({
      ...r,
      start: D(r.start),
      resume: D(r.resume),
      last: addDays(D(r.resume), -1),
      projected: !!r.projected,
    }))
    .filter((p) => p.last >= from && p.start <= to)
    .sort((a, b) => a.start - b.start);
}

/** Public holidays across a span of calendar years -> {iso: key}. */
function feriesBetween(fromISO, toISO) {
  const y0 = D(fromISO).getUTCFullYear(), y1 = D(toISO).getUTCFullYear();
  let out = {};
  for (let y = y0; y <= y1; y++) out = { ...out, ...joursFeries(y) };
  return out;
}

window.Vacances = {
  ZONE, OFFICIAL, LAST_OFFICIAL_SY,
  periodsBetween, feriesBetween, joursFeries, easterSunday,
  helpers: { D, ISO, addDays, dayDiff, onOrAfterWeekday, onOrBeforeWeekday },
};
})();
