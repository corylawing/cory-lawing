# Calendrier de garde — custody calendar

A single-page calendar that answers one question at a glance: **who has the
children?** Built for the Marseille region (Zone B, académie d'Aix-Marseille)
and designed to be readable by both parents without explanation.

Open `index.html` — there is no build step, no server, and no dependencies.

## What it shows

| View | What you get |
|---|---|
| **Mois** | A month grid. Every day is coloured by parent and stamped with their initial. Handover days carry a `⇄` and the time. |
| **Année** | All twelve months at once — the easiest way to see the rhythm across a whole year. |
| **Vacances** | Every school holiday of the year listed with both halves spelled out: who has which dates. This is the view that settles arguments. |

Plus, at the top: who has the children today, until when, and the next four
handovers.

Other buttons: **FR/EN** toggle, **copy a share link**, **export `.ics`** so the
schedule lands in both parents' phone calendars, and **print/PDF**.

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

Encoded in `engine.js`, and every switch is adjustable in **Réglages**:

**Term time** — even civil weeks with parent A, from Friday at the end of the
school day to the following Friday at the start of the school day; odd weeks
with parent B. Plus every **Tuesday end-of-school to Wednesday 18:00 with
parent B**, until the youngest child starts secondary school.

**Half-term holidays** — the same even/odd whole-week alternation, with no
midweek Tuesday move.

**Summer holidays** — eight weeks split **3 / 3 / 1 / 1**:

| Weeks | Even years | Odd years |
|---|---|---|
| 1-3 | A | B |
| 4-6 | B | A |
| 7 | A | B |
| 8 | B | A |

Any summer days past the eighth week fall back to the even/odd alternation.

**Throughout** — even and odd follow ISO-8601 civil week numbering; holiday
dates are those of the children's education district; and each parent has the
children for the Mother's Day or Father's Day weekend that concerns them
(*fête des mères* is the last Sunday of May, moving to the first Sunday of June
when that Sunday is Pentecost; *fête des pères* is the third Sunday of June).

### How a custody week maps to a week number

A custody week runs Friday evening to the following Friday morning, so it
straddles two civil weeks — it holds the Saturday and Sunday of one and the
Monday-to-Thursday of the next. The school days sit in the later week, so that
is the week whose number decides the period. In code that is simply the civil
week of the day three days on. Week numbers are printed on each Monday in the
month view so either parent can check the parity against any calendar.

### Points that need confirming

Three things are not fully determined and are flagged in the app itself:

1. The half-term clause refers both to an even/odd week alternation and to a
   Sunday 18:00 return, which do not fit together. Whole-week alternation is
   applied.
2. The eight summer weeks are numbered but the start of week 1 is not defined.
   It starts on the first day of the summer holidays here.
3. The Tuesday rule runs "until the youngest starts secondary school" with no
   date. It stops at the September 2029 rentrée; adjustable in the settings.

## Privacy

No judgment text is stored anywhere in this app, by design. The only things
kept are the two names and the rotation settings, and they live in two places
only: this browser's `localStorage`, and the share link if you generate one
(encoded in the part after `#`, which browsers never send to a server).

Nothing is transmitted anywhere. The page is also marked `noindex, nofollow`.

## Files

| File | Role |
|---|---|
| `index.html` | Page shell |
| `app.css` | Layout and theme (light + dark, print stylesheet) |
| `vacances.js` | Zone B holiday dates, projections, jours fériés |
| `engine.js` | Works out which parent has the children on any given day |
| `app.js` | Interface, FR/EN wording, share link, `.ics` export |

## A caveat worth keeping in view

This is a reading aid for a schedule. It renders whatever rotation is set in
**Réglages** — it cannot read a judgment and does not know what yours says. Check
each setting against the judgment before sharing the calendar; the banner at the
top of the page stays up until you confirm you have. Where the two disagree,
the judgment governs.
