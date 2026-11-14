/* ---------- homepage: demo cards, hero phase row, motion, contact note ---------- */
(function () {
  "use strict";
  var $ = K.$, $$ = K.$$;

  /* --- demo cards: a real screenshot, a title and one line --- */
  var THUMB = {
    "voice": "assets/img/demos/voice.webp",
    "cockpit": "assets/img/demos/cockpit.webp",
    "cpq": "assets/img/demos/cpq.webp",
    "expense": "assets/img/demos/expense.webp",
    "org-health": "assets/img/demos/org-health.webp",
    "territory": "assets/img/demos/territory.webp",
    "social": "assets/img/demos/social.webp",
    "brace": "https://corylawing.github.io/practice-hub-mockup/assets/home-brace-preview.png"
  };
  var CARDS = [
    { id: "cpq", copy: "Quotes go out in minutes, inside the pricing rules, approved and signed in one flow." },
    { id: "voice", copy: "Reps talk for a minute after a meeting. The CRM update and the follow-up are done for them." },
    { id: "cockpit", copy: "Every rep sees what to do next and why, ranked by what moves revenue." },
    { id: "expense", copy: "Finance reviews only the exceptions. Every expense is checked against policy and activity." },
    { id: "org-health", copy: "Finds the hidden automation conflicts in a Salesforce org and plans a safe cleanup." },
    { id: "territory", copy: "Fair territories and efficient field days, planned on a live map." },
    { id: "social", copy: "One team plans, writes and schedules content across channels with an AI copilot." },
    { id: "brace", title: "Home-Brace", ext: "https://corylawing.github.io/practice-hub-mockup/", copy: "Every location runs from one hub: schedules, requests, scorecards and documents." }
  ];
  var grid = $("#work-grid");
  if (grid) {
    grid.innerHTML = CARDS.map(function (c) {
      var meta = K.catalog[c.id] || c;
      var tag = c.ext ? 'a href="' + c.ext + '" target="_blank" rel="noopener"' : 'a href="#' + c.id + '" data-go="' + c.id + '"';
      var shot = THUMB[c.id]
        ? '<span class="h-card__shot"><img src="' + THUMB[c.id] + '" alt="" loading="lazy" onerror="this.parentNode.classList.add(\'h-card__shot--ph\');this.outerHTML=\'' + K.icon("grid").replace(/"/g, "&quot;") + '\'" /></span>'
        : '<span class="h-card__shot h-card__shot--ph">' + K.icon("grid") + "<span>Preview image loads on the live site</span></span>";
      return "<" + tag + ' class="h-card">' + shot +
        '<span class="h-card__body"><h3 class="h-card__title">' + K.esc(meta.title) + K.icon(c.ext ? "external" : "arrow-right") + '</h3><p class="h-card__copy">' + K.esc(c.copy) + "</p></span></a>";
    }).join("");
  }

  /* --- hero phase row: follows the art; a click jumps the art to that phase --- */
  var phaseBtns = $$(".h-phases [data-phase]"), say = $("#hero-say"), sayTimer = null;
  document.addEventListener("cl:phase", function (e) {
    if (say) {
      var b0 = phaseBtns[e.detail.index], name = e.detail.names[e.detail.index], line = b0 ? b0.getAttribute("title") : "";
      var put = function () { $(".h-say__n", say).textContent = "0" + (e.detail.index + 1) + " · " + name; $(".h-say__t", say).textContent = line; say.classList.remove("is-swap"); };
      clearTimeout(sayTimer);
      if (K.reduced || $(".h-say__t", say).textContent === line) put(); else { say.classList.add("is-swap"); sayTimer = setTimeout(put, 300); }
    }
    phaseBtns.forEach(function (b) {
      var on = +b.getAttribute("data-phase") === e.detail.index;
      b.classList.remove("is-on"); void b.offsetWidth;
      if (on) { b.style.setProperty("--d", e.detail.duration + "s"); b.classList.add("is-on"); }
      b.setAttribute("aria-pressed", String(on));
    });
  });
  phaseBtns.forEach(function (b) { b.addEventListener("click", function () { if (window.CLHero) window.CLHero.jump(+b.getAttribute("data-phase")); }); });

  /* --- scroll progress: the accent line along the top, homepage only --- */
  var bar = $("#scroll-progress");
  if (bar) {
    var ticking = false;
    var update = function () {
      var d = document.documentElement, home = !$("#view-home").hidden, max = d.scrollHeight - d.clientHeight;
      bar.style.transform = "scaleX(" + (home && max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ")";
      ticking = false;
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("hashchange", function () { window.requestAnimationFrame(update); });
    update();
  }

  /* --- pointer glow on cards (fine pointers only) --- */
  var canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (canHover && !K.reduced) {
    $$(".h-card, .h-offer").forEach(function (card) {
      var frame = null;
      card.addEventListener("pointermove", function (e) {
        if (frame) return;
        frame = window.requestAnimationFrame(function () {
          var r = card.getBoundingClientRect();
          card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
          card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
          frame = null;
        });
      });
    });
  }

  /* --- contact: the note form opens on request and posts to Web3Forms (the mockup has no key, so it sends nothing) --- */
  var toggle = $("#note-toggle"), form = $("#contact-form");
  if (toggle && form) {
    toggle.addEventListener("click", function () {
      var open = form.hidden;
      form.hidden = !open; toggle.setAttribute("aria-expanded", String(open));
      if (open) $("#cf-name").focus();
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var st = $("#contact-status");
      if (!form.checkValidity()) { st.textContent = "Add your name, a work email and a short note."; return; }
      var key = form.querySelector('input[name="access_key"]');
      if (!key) { st.textContent = "Mockup only: nothing was sent. The live form posts to your Web3Forms inbox."; return; }
      var bot = form.querySelector('input[name="botcheck"]');
      if (bot && bot.checked) return;
      var btn = form.querySelector('button[type="submit"]'), data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      btn.disabled = true; st.textContent = "Sending...";
      fetch("https://api.web3forms.com/submit", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (r) {
          if (r.ok && r.j && r.j.success) { form.reset(); st.textContent = "Thanks, your note is in. I reply within two business days."; }
          else st.textContent = (r.j && r.j.message) || "That didn't send. Please email corylawing@gmail.com.";
        })
        .catch(function () { st.textContent = "That didn't send. Please email corylawing@gmail.com."; })
        .then(function () { btn.disabled = false; });
    });
  }
})();
