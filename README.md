# cory-lawing

Personal site for **Cory Lawing**: I architect and build custom software, operational systems and AI products.

A static site for GitHub Pages: no build step, no framework, no dependencies. The live URL is `https://corylawing.github.io/cory-lawing/`.

---

## What's in here

```
.
├── index.html                  ← the homepage (all copy lives here)
├── assets/
│   ├── css/site.css            ← design tokens (Midnight scheme) and page styles
│   ├── js/site.js              ← icons, the #hash router, the in-site demo frame, Calendly pop-up
│   ├── js/home.js              ← demo cards, hero phase row and caption, scroll progress, contact form
│   ├── js/hero-art.js          ← the hero motion art (canvas, no libraries)
│   ├── demos/                  ← the interactive demo apps, each a self-contained HTML page
│   └── img/
│       ├── og.png              ← share image (1200 × 630)
│       ├── cory.jpg            ← About photo
│       └── demos/*.webp        ← demo card thumbnails
├── calendrier/                 ← separate project, not part of the portfolio
└── .nojekyll                   ← tells GitHub Pages to serve files as they are
```

## How the page works

- **Homepage sections:** hero, What I fix, Why me, Results, Demos, the 80% / 100% section, About, Work with me, Contact.
- **Demos open inside the site.** Each card links to `#cpq`, `#voice` and so on. `site.js` loads the matching file from `assets/demos/` into a full-screen frame under a slim site bar, with Portfolio, Restart, previous and next, and Book a call. Every app is also usable on its own at its own URL.

| Hash | File | App |
|---|---|---|
| `#voice` | `voice-activity.html` | Activity Voice Recorder |
| `#cockpit` | `revenue-cockpit.html` | Sales Command Center |
| `#cpq` | `cpq.html` | Custom CPQ Engine |
| `#expense` | `expense-guard.html` | Expense Guard |
| `#org-health` | `org-health-auditor.html` | Org Health Auditor |
| `#territory` | `territory-intelligence.html` | Territory Intelligence (has its own share card) |
| `#social` | `social-command-center.html` | Social Command Center |

Home-Brace links out to `corylawing.github.io/practice-hub-mockup/`.

- **Hero art:** about 2,600 particles morph through four forms: Architect (blueprint layers), Build (modules), Ship (a paper plane) and Scale (a connected globe with orbiting data).
  - Pointer and click make the particles scatter, then they rebuild.
  - The art pauses when off screen and draws a still frame for people who prefer reduced motion.
  - The caption under it and the phase row follow along; clicking a phase jumps to it.

## Editing

| To change… | Edit… |
|---|---|
| Copy, sections, offers, stats | `index.html` |
| Demo cards (order, one-line copy) | `CARDS` in `assets/js/home.js` |
| Demo titles in the site bar | `K.catalog` in `assets/js/site.js` |
| Hero captions | the `title` attributes on the `.h-phases` buttons in `index.html` |
| Colours | the tokens at the top of `assets/css/site.css` (one hue; the accent is `--accent`) |

## Contact form and booking

- **Contact form:** the note form posts to **Web3Forms** with the access key in `index.html`, and submissions arrive at the inbox registered with that key.
- **Booking:** "Book a free call" links point at Calendly. When Calendly's script loads they open the pop-up; otherwise they open Calendly in a new tab.

## Share image

`assets/img/og.png` is the card LinkedIn, Slack and X show.

1. When you replace it, bump `?v=` in the `og:image` and `twitter:image` tags in `index.html`, so the networks fetch the new image.
2. Then paste the URL into LinkedIn's Post Inspector to refresh LinkedIn's cache.

## Local preview

```bash
python3 -m http.server 8080   # then open http://localhost:8080
```
