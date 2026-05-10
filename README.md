# cory-lawing

Personal site for **Cory Lawing — Operations Architect**.
*Strategy, architecture, and the build, by one operator.*

Built as a static site for GitHub Pages. No build step, no dependencies, no framework — just `index.html`, one stylesheet, one script, and the assets you drop in. Designed so the same code works as a user site, project site, or behind a custom domain without changes.

---

## What's in here

```
.
├── index.html               ← all page content
├── assets/
│   ├── css/style.css        ← design system + page styles
│   ├── js/main.js           ← nav, mobile menu, reveal animations, form handler
│   └── img/
│       └── tools/           ← drop tool screenshots / videos here
├── .nojekyll                ← tells GitHub Pages "serve files as-is"
├── .gitignore
└── README.md                ← you are here
```

The site is a single page with seven sections: hero, positioning, practice (services), built (tools), approach, stack, voices (testimonials), contact.

---

## Deploy to GitHub Pages

1. **Create the repo** on github.com:
   - Name: `cory-lawing`
   - Visibility: **Public** (required for free GitHub Pages)
   - Do NOT initialise with a README, .gitignore, or license — those are already in this project.

2. **Upload the files.** Easiest way: unzip the project, then on the empty repo page, drag the *contents* of the `site/` folder (not the folder itself) onto the web uploader. `index.html` must end up at the repo root.

3. **Enable Pages.** Repo → `Settings → Pages → Build and deployment`:
   - Source: `Deploy from a branch`
   - Branch: `main`, folder: `/ (root)`
   - Save.
   GitHub publishes within 30–60 seconds. The live URL appears at the top of the Pages settings page.

4. **Live URL:** `https://corylawing.github.io/cory-lawing/`

5. **(Later) Custom domain.** When you have `corylawing.com`:
   - Add a `CNAME` file at the repo root containing just `corylawing.com`.
   - At your DNS provider: A records pointing to GitHub's IPs (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`), plus a CNAME for `www` → `corylawing.github.io`.
   - In `Settings → Pages`, enter the custom domain and tick **Enforce HTTPS** once it provisions (can take an hour).

---

## Things to do before sharing the live link

There are three pieces of placeholder content that need replacing before this site goes to a real prospect. They're all clearly marked.

### 1. Wire up the contact form (5 minutes)

The form posts to **Web3Forms** — no backend, no server, submissions go straight to your inbox.

1. Sign up free at https://web3forms.com/ → enter your email → they email you an **access key**.
2. Open `index.html`, search for `YOUR_WEB3FORMS_ACCESS_KEY`, replace with the key.
3. Done. Submissions arrive at the email registered with the key.

The form has a hidden honeypot for spam, native HTML validation, and graceful error states. If the access key isn't set, it tells the visitor to email `corylawing@gmail.com` directly instead of failing silently.

### 2. Replace the placeholder testimonials in the Voices section

Three testimonial cards in `index.html` use `[ Placeholder Name ]` and `[ Placeholder Company ]` markers. There's a visible warning pill in the Voices section header that says these are placeholders. Replace each card's quote, name, and role/company. Then delete the warning pill (`<p class="placeholder-flag …">…</p>`).

The placeholder quotes were drafted around three angles worth fishing for in real testimonial collection: (a) one operator covering both strategy AND build, (b) no surprises in implementation because the same person scoped it, (c) team is stronger after the engagement than before. If your real quotes come back covering different angles, just use them — those were starter prompts.

### 3. Drop in tool media + replace placeholder build cards

The Built section has six cards: four real builds (DM Maps, Voice-to-CRM, Custom CPQ, Excellence Center) and two placeholder cards explicitly marked with `[ AI Workflow Build ]` and `[ Cross-System Build ]` titles plus a "PLACEHOLDER" pill.

**For the four real builds:** each has a `tool__media-placeholder` block. To replace with video or image:

```html
<div class="tool__media">
  <!-- replace this: -->
  <div class="tool__media-placeholder">
    <span class="mono">[ media · drop in dm-maps.mp4 or .png ]</span>
  </div>
  <!-- with one of these: -->
  <video src="assets/img/tools/dm-maps.mp4" autoplay muted loop playsinline></video>
  <!-- or -->
  <img src="assets/img/tools/dm-maps.png" alt="DM Maps screenshot" />
  <span class="tool__chip mono">salesforce · lwc · maps api</span>
</div>
```

Recommended specs:
- **Video:** MP4 (H.264), 1920×1080, 8–20 seconds, autoplay-loop friendly. Compress to under 4 MB if you can — HandBrake or ffmpeg work well.
- **Image:** PNG or WebP, 16:9, slight bezel/shadow if it's a Salesforce screen capture.

**For the two placeholder cards:** rewrite the title, subtitle, copy, and chip with a real recent build. Remove the `tool--placeholder` class from the `<article>` and the `<span class="tool__placeholder-tag">placeholder</span>` from the index line so they render as normal cards.

### 4. (Optional) Open Graph / social-share image

When the URL gets shared on LinkedIn or Slack, you'll want a preview card. Drop a 1200×630 PNG into `assets/img/og.png` then add inside `<head>`:

```html
<meta property="og:image" content="https://corylawing.com/assets/img/og.png" />
<meta name="twitter:image" content="https://corylawing.com/assets/img/og.png" />
```

---

## Editing content later

Everything is in `index.html`. There's no CMS — for a personal site at this scale, plain HTML is faster than any CMS.

| Want to change… | Edit in `index.html`… |
|---|---|
| Title in the browser tab | `<title>` and the OG/Twitter `<meta>` tags |
| Hero headline | `<h1 class="hero__title">` |
| Hero metrics (12+, 0, 5+, EN/FR) | `<ul class="hero__meta">` |
| Practice card titles or copy | `<article class="practice-card">` blocks |
| The four built items | `<article class="tool">` blocks (skip the `tool--placeholder` ones) |
| Approach principles | `<article class="approach-card">` blocks |
| Stack lists | `<div class="stack__group">` blocks |
| Testimonials | `<figure class="voice-card">` blocks |
| Contact form options | `<select id="cf-engagement">` |
| Footer location / credits | `<p class="footer__meta">` |

---

## Brand-name swap (if you ever rebrand)

The site is built so you can rebrand from "Cory Lawing" to a studio name in a few small edits. Search `index.html` for these spots:

- `<title>` and the OG/Twitter `<meta>` tags
- `<meta name="description">`
- The `data-brand` attribute on `<div class="page">` (single source of truth)
- `.nav__brand-name` text
- `#brand-mark` text (the "CL" monogram in the nav)
- `.footer__name`, `.footer__sub`, and `.footer__mark`
- The favicon SVG inside `<link rel="icon">` if you want to update the monogram

---

## Visual tweaks

All design tokens live at the top of `assets/css/style.css` under `:root`. Common ones:

| Variable | What it controls |
|---|---|
| `--accent` | Signature electric-lime colour (`#D9F77B`). Change once, propagates everywhere. |
| `--bg`, `--surface`, `--card` | Background layers (near-black). |
| `--text-1`, `--text-2`, `--text-3` | Three levels of foreground type. |
| `--serif` / `--sans` / `--mono` | Font families. Currently Fraunces / Geist / Geist Mono via Google Fonts. |
| `--container` | Max content width. |

---

## What this site is *not*

- **Not a CMS.** Edit `index.html` directly.
- **Not analytics-instrumented.** If you want Plausible / Fathom / GA4, paste their snippet in `<head>`. Plausible is the cleanest fit aesthetically and respects privacy.
- **Not blog-capable out of the box.** If/when you add writing, a separate `/writing/` directory with markdown + a tiny static-site generator (Eleventy is good) is the cleanest route.

---

## Local preview

Any static server works:

```bash
# from the project root, pick one:
python3 -m http.server 8080
# or
npx serve .
```

Then open `http://localhost:8080`.

---

## Notes

- **Web3Forms free tier:** 250 submissions/month. Plenty for inbound consulting. Paid tiers exist if you ever need more, plus options to forward submissions to Slack / Discord / a CRM.
- **Google Fonts:** loaded from CDN with `display=swap` so initial render isn't blocked. To self-host (faster + privacy), grab them from Google Fonts and serve from `assets/fonts/`.
- **Browser support:** modern Chrome/Safari/Firefox/Edge, iOS Safari, Android Chrome. Uses CSS Grid, IntersectionObserver, custom properties, `aspect-ratio`, `backdrop-filter`. Older browsers get a degraded but readable experience.
- **Paths are relative.** The same code works at `corylawing.github.io/cory-lawing/`, `corylawing.com`, or anywhere else you host it. No URL changes needed.

---

Built with intent. Edit with care.
