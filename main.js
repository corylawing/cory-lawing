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

})();
