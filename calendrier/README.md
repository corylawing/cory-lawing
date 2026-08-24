# Calendrier de garde — custody calendar

A single-page calendar that answers one question at a glance: **who has the
children?** Built for the Marseille region (Zone B, académie d'Aix-Marseille)
and designed to be readable by both parents without explanation.

Open `index.html` — there is no build step, no server, and no dependencies.

## What it shows

| View | What you get |
|---|---|
| **Mois** | A month grid with the civil week number down the left. Each stretch is drawn as one filled bar carrying the parent's name and, on a changeover day, the time. |
| **Année** | All twelve months at once — the easiest way to see the rhythm across a whole year. |
| **Vacances** | Every school holiday of the year listed with both halves spelled out: who has which dates. This is the view that settles arguments. |

Plus, at the top: who has the children today, until when, and the next four
handovers.

Other buttons: **FR/EN** toggle, **copy a share link**, **export `.ics`** so the
schedule lands in both parents' phone calendars, and **print/PDF**.

### Colour coding

Two things are colour-coded at once, so a single glance answers both "when is
this?" and "who has them?".

| | Term time (*période scolaire*) | School holidays (*vacances*) |
|---|---|---|
| **Parent A** | filled blue | filled green |
| **Parent B** | outlined blue | outlined green |

Blue is the school term, green is the holidays; filled is parent A, outlined is
parent B. The week number in the left-hand gutter is the ordinary ISO week
number of that calendar row, so it can be checked against any wall calendar.

## School holiday dates

Zone B (Marseille, Aix-en-Provence, Bouches-du-Rhône), transcribed from the
arrêtés published in the *Journal Officiel*:

- **2026-2027** — arrêté du 22 octobre 2025 (JORFTEXT000052416058)
- **2027-2028** — arrêté du 21 juillet 2026 (JORFTEXT000054457294)

The ministry publishes about three school years ahead, so **official dates run
to summer 2028**. Beyond that the app projects the holidays from the pattern of
the published years and labels every projected period *prévisionnel* /
*projected*, with a warning banner on the year. The week-on/week-off rotation
itself is arithmetic, so it stays exact indefinitely.

French public holidays (*jours fériés*) are computed, including the movable ones
— Easter Monday, Ascension and Whit Monday are derived from the Gregorian Easter
algorithm rather than hard-coded.

### Updating when a new arrêté is published

Add the new Zone B lines to `OFFICIAL` in `vacances.js`, using the same shape:

```js
{ sy: '2028-2029', key: 'toussaint', start: '2028-10-21', resume: '2028-11-06' },
```

`start` is the first full day off; `resume` is the day school starts again. The
app stops projecting that year automatically and drops the *prévisionnel* label.

## The rhythm

Encoded in `engine.js`. It is fixed: the settings drawer holds the two display
names and nothing else, so neither an edited share link nor stale browser
storage can move a date.

**Term time** — even weeks with parent A, odd weeks with parent B, handing over
on Friday at the *sortie des classes* (16:30). Plus every **Tuesday end-of-school
to Wednesday 18:00 with parent B**, until the youngest child starts secondary
school.

**Half-term holidays** (*petites vacances*: Toussaint, Noël, hiver, printemps) —
split in two halves. The first half goes to parent A in even years and to parent
B in odd years; the second half to the other. The closing Sunday hands back at
18:00 to whoever the following week belongs to, so the split reads 9 nights / 7
nights + the last Sunday.

**When a holiday starts** — the *arrêté* names the day after the last class,
almost always a Saturday. There is no school that day, and this judgment hands
over at the *sortie des classes*, so a Saturday start is pulled back to the
Friday before. Where an *arrêté* names a weekday instead — summer 2028 begins
Tuesday 4 July *après la classe* — that day is itself the last school day and
nothing is shifted.

**Summer holidays** — eight weeks split **3 / 3 / 1 / 1**:

| Weeks | Even years | Odd years |
|---|---|---|
| 1-3 | A | B |
| 4-6 | B | A |
| 7 | A | B |
| 8 | B | A |

The eighth week absorbs any days past it, so the summer never falls back to the
term-time rhythm mid-August.

**Throughout** — even and odd follow ISO-8601 civil week numbering; holiday
dates are those of the children's education district; and each parent has the
children for the Mother's Day or Father's Day weekend that concerns them
(*fête des mères* is the last Sunday of May, moving to the first Sunday of June
when that Sunday is Pentecost; *fête des pères* is the third Sunday of June).

### Years with 53 weeks

2026, 2032, 2037 and 2043 have 53 ISO weeks. The extra week is always an odd
one, so it always falls to parent B — a 53-week year can never hand parent A the
double week. The app says so in a banner on those years.

### How a custody week maps to a week number

A custody week runs Friday evening to the following Friday, so it straddles two
civil weeks: the Saturday and Sunday of one, the Monday to Thursday of the next.
The period takes the number of its opening Friday, which means that from Monday
to Thursday the period's number is one behind the number the wall calendar shows
for that date. The gutter prints the calendar's own number, not the period's, so
it always agrees with any other calendar.

### Points that need confirming

Two things are not fully determined by the wording:

1. The half-term clause refers both to an even/odd week alternation and to a
   Sunday 18:00 return, which do not sit together. Two halves plus a Sunday
   18:00 hand-back is applied — the reading both parents used in October 2026.
2. Which civil week names a Friday-to-Friday period, given the straddle above.

### Checking it

`node verifier.js` re-runs every assertion — dates both parents have confirmed,
the civil week numbers, the term parity, the holiday splits, the summer 3/3/1/1,
the Tuesday clause, and the published *arrêté* dates — over eleven school years.

## Privacy

No judgment text is stored anywhere in this app, by design. The only thing kept
is the two display names, and they live in two places only: this browser's
`localStorage`, and the share link if you generate one (encoded in the part
after `#`, which browsers never send to a server). A shared or edited link can
change the names and nothing else — every value that decides a date is fixed in
the code.

Nothing is transmitted anywhere. The page is also marked `noindex, nofollow`.

## Files

| File | Role |
|---|---|
| `index.html` | Page shell |
| `app.css` | Layout and theme (light + dark, print stylesheet) |
| `vacances.js` | Zone B holiday dates, projections, jours fériés |
| `engine.js` | Works out which parent has the children on any given day |
| `app.js` | Interface, FR/EN wording, share link, `.ics` export |
| `verifier.js` | `node verifier.js` — the checks described above |

## A caveat worth keeping in view

This is a reading aid. It renders one settled reading of one judgment; it is not
the judgment. Where the two disagree, the judgment governs.
