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

## Settings

Everything about the rotation is configurable, because judgments word these
things differently. Open **Réglages**:

- **Rythme** — one week / one week, two weeks / two weeks, 2-2-3, or one weekend
  in two.
- **Point de départ** — the date the alternation is anchored to, and which
  parent has the children then. Defaults to the start of the 2026 summer
  holidays.
- **Jour et heure de l'échange** — which weekday a new period begins, and at
  what time.
- **Vacances scolaires** — split in half alternating each year, split in half
  always in the same order, or let the rotation simply run through.
- **L'alternance des moitiés change** — per *school* year (2026-2027 stays
  coherent throughout) or per *calendar* year (the order flips on 1 January).
  Both readings are common; pick the one your judgment uses.
- **Début des vacances** — Friday at the *sortie des classes*, or the literal
  Saturday in the arrêté. The arrêtés start most holidays on a Saturday, but
  there is no school that day; choosing Friday matches how most judgments are
  worded and avoids a pointless one-day handover the evening before a holiday.

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
