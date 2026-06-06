/* ============================================================
   Cory Lawing — Revenue Operations Architect
   Site interactions (vanilla, no dependencies)
   ============================================================ */

(function () {
  "use strict";

  /* --- Footer year ----------------------------------------- */
  var yearEl = document.getElementById("footer-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();


  /* --- Scroll-aware nav ------------------------------------ */
  var nav = document.querySelector(".nav");
  if (nav) {
    var onScroll = function () {
      if (window.scrollY > 12) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }


  /* --- Mobile menu ----------------------------------------- */
  var menuBtn  = document.querySelector(".nav__menu");
  var menu     = document.getElementById("mobile-menu");

  if (menuBtn && menu) {
    var setMenu = function (open) {
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menu.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    };

    menuBtn.addEventListener("click", function () {
      var open = menuBtn.getAttribute("aria-expanded") === "true";
      setMenu(!open);
    });

    // Close when a link inside is tapped
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });

    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") {
        setMenu(false);
      }
    });

    // Close if window resizes past mobile breakpoint
    window.addEventListener("resize", function () {
      if (window.innerWidth > 880 && menuBtn.getAttribute("aria-expanded") === "true") {
        setMenu(false);
      }
    });
  }


  /* --- Reveal-on-scroll ------------------------------------ */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var delay = entry.target.getAttribute("data-reveal-delay") || 0;
          entry.target.style.transitionDelay = delay + "ms";
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    // No IO support — just show everything.
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }


  /* --- Contact form (Web3Forms) ---------------------------- */
  var form    = document.getElementById("contact-form");
  var status  = document.getElementById("contact-form-status");

  if (form && status) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot — if filled, silently abort
      var honeypot = form.querySelector(".contact-form__honeypot");
      if (honeypot && honeypot.checked) return;

      // Native validation
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // Detect un-set access key (catches the placeholder case)
      var key = form.querySelector('input[name="access_key"]');
      if (!key || !key.value || key.value === "YOUR_WEB3FORMS_ACCESS_KEY") {
        status.className = "contact-form__status is-error";
        status.textContent =
          "Form not configured yet — please email corylawing@gmail.com directly, or replace the Web3Forms access key in index.html.";
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalLabel = submitBtn ? submitBtn.innerHTML : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "<span>Sending…</span>";
      }
      status.className = "contact-form__status";
      status.textContent = "";

      var data = new FormData(form);
      var payload = {};
      data.forEach(function (v, k) { payload[k] = v; });

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      })
      .then(function (res) { return res.json().then(function (j) { return { ok: res.ok, body: j }; }); })
      .then(function (r) {
        if (r.ok && r.body && r.body.success) {
          form.reset();
          status.className = "contact-form__status is-success";
          status.textContent = "Note received — I'll get back to you within two business days.";
        } else {
          status.className = "contact-form__status is-error";
          status.textContent = (r.body && r.body.message)
            ? r.body.message
            : "Something went wrong sending the form. Please try again or email corylawing@gmail.com directly.";
        }
      })
      .catch(function () {
        status.className = "contact-form__status is-error";
        status.textContent =
          "Couldn't reach the form service. Please try again or email corylawing@gmail.com directly.";
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalLabel;
        }
      });
    });
  }


  /* --- Motion preference ----------------------------------- */
  var reduceMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;


  /* --- Scroll progress bar --------------------------------- */
  var progress = document.querySelector(".scroll-progress");
  if (progress) {
    var docEl = document.documentElement;
    var progressTick = false;
    var updateProgress = function () {
      var max = docEl.scrollHeight - docEl.clientHeight;
      var ratio = max > 0 ? Math.min(docEl.scrollTop / max, 1) : 0;
      progress.style.transform = "scaleX(" + ratio + ")";
      progressTick = false;
    };
    updateProgress();
    window.addEventListener("scroll", function () {
      if (!progressTick) {
        progressTick = true;
        window.requestAnimationFrame(updateProgress);
      }
    }, { passive: true });
  }


  /* --- Scroll-spy: light the nav link for the section in view */
  var navLinks = document.querySelectorAll(".nav__links a");
  if ("IntersectionObserver" in window && navLinks.length) {
    var linkById = {};
    navLinks.forEach(function (a) {
      var id = (a.getAttribute("href") || "").replace(/^#/, "");
      if (id) linkById[id] = a;
    });

    var spyTargets = Object.keys(linkById)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    if (spyTargets.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            navLinks.forEach(function (l) { l.classList.remove("is-active"); });
            linkById[entry.target.id].classList.add("is-active");
          }
        });
      }, { rootMargin: "-45% 0px -50% 0px" });

      spyTargets.forEach(function (s) { spy.observe(s); });
    }
  }


  /* --- Count-up on the hero stats -------------------------- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    var runCount = function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      var valEl = el.querySelector(".hero__meta-val");
      if (isNaN(target) || !valEl) return;

      if (reduceMotion) { valEl.textContent = String(target); return; }

      valEl.textContent = "0";
      var duration = 1100;
      var start = null;
      var step = function (ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        valEl.textContent = String(Math.round(eased * target));
        if (p < 1) window.requestAnimationFrame(step);
        else valEl.textContent = String(target);
      };
      window.requestAnimationFrame(step);
    };

    if ("IntersectionObserver" in window) {
      var countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCount(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { countObserver.observe(el); });
    } else {
      counters.forEach(runCount);
    }
  }


  /* --- Pointer-tracking spotlight on cards ----------------- */
  // Only on devices with a fine pointer that can hover, and when motion is allowed.
  var canHover = window.matchMedia
    ? window.matchMedia("(hover: hover) and (pointer: fine)").matches
    : false;

  if (canHover && !reduceMotion) {
    var spotlightCards = document.querySelectorAll(".practice-card, .tool, .voice-card");
    spotlightCards.forEach(function (card) {
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

})();
