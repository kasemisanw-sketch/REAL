/**
 * Configuration — edit these values for your deployment.
 */
const CONFIG = {
  /** ISO datetime for the ceremony in Alexandria (Egypt, UTC+2). Adjust offset if needed. */
  weddingDateIso: "2027-10-10T20:00:00+02:00",
  /** Get a free key at https://web3forms.com — leave empty to use email fallback (mailto). */
  web3formsAccessKey: "a1a2aae3-4acd-43f5-b95a-fc458a4b8bb6",
  /** Email used only for mailto fallback when Web3Forms key is empty */
  rsvpMailto: "your-email@example.com",
  localStorageWelcomeKey: "samaMedoInvitationOpened-v1",
};

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Welcome overlay (first visit) ---------- */
  const welcome = document.getElementById("welcome-overlay");
  const welcomeBtn = document.getElementById("welcome-open");

  function openWelcome() {
    if (!welcome) return;
    const seen = localStorage.getItem(CONFIG.localStorageWelcomeKey);
    if (seen === "1") return;
    welcome.setAttribute("aria-hidden", "false");
    welcome.classList.add("is-visible");
    document.body.classList.add("welcome-active");
  }

  function closeWelcome() {
    if (!welcome) return;
    welcome.classList.add("is-closing");
    welcome.setAttribute("aria-hidden", "true");
    localStorage.setItem(CONFIG.localStorageWelcomeKey, "1");
    document.body.classList.remove("welcome-active");
    setTimeout(function () {
      welcome.classList.remove("is-visible", "is-closing");
    }, 900);
  }

  openWelcome();

  if (welcomeBtn) {
    welcomeBtn.addEventListener("click", function () {
      closeWelcome();
    });
  }

  /* ---------- Floating particles ---------- */
  const canvas = document.getElementById("particles-canvas");
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext("2d");
    let particles = [];
    let rafId;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function initParticles() {
      const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 18000));
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 2.2 + 0.3,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.35 - 0.15,
          a: Math.random() * 0.4 + 0.15,
        });
      }
    }

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, "rgba(232, 213, 163, " + p.a + ")");
        g.addColorStop(1, "rgba(232, 213, 163, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
      });
      rafId = requestAnimationFrame(tick);
    }

    resize();
    initParticles();
    tick();

    window.addEventListener(
      "resize",
      function () {
        resize();
        initParticles();
      },
      { passive: true }
    );
  }

  /* ---------- Countdown ---------- */
  const weddingDate = new Date(CONFIG.weddingDateIso);
  const countdownRoot = document.getElementById("countdown-root");
  const digitEls = countdownRoot
    ? {
        days: countdownRoot.querySelector('[data-unit="days"]'),
        hours: countdownRoot.querySelector('[data-unit="hours"]'),
        minutes: countdownRoot.querySelector('[data-unit="minutes"]'),
        seconds: countdownRoot.querySelector('[data-unit="seconds"]'),
      }
    : null;

  let lastShown = {};

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function updateCountdown() {
    if (!digitEls) return;
    const now = Date.now();
    let diff = weddingDate - now;
    if (diff <= 0) {
      digitEls.days.textContent = "00";
      digitEls.hours.textContent = "00";
      digitEls.minutes.textContent = "00";
      digitEls.seconds.textContent = "00";
      return;
    }
    const s = Math.floor(diff / 1000);
    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;

    const units = [
      ["days", days],
      ["hours", hours],
      ["minutes", minutes],
      ["seconds", seconds],
    ];

    units.forEach(function (_ref) {
      const key = _ref[0];
      const val = _ref[1];
      const el = digitEls[key];
      const display = key === "days" ? String(val) : pad(val);
      if (lastShown[key] !== display) {
        el.textContent = display;
        if (!prefersReducedMotion && lastShown[key] !== undefined) {
          el.classList.remove("tick");
          void el.offsetWidth;
          el.classList.add("tick");
        }
        lastShown[key] = display;
      }
    });
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ---------- Background music ---------- */
  const audio = document.getElementById("bg-music");
  const musicBtn = document.getElementById("music-toggle");

  function setMusicUi(playing) {
    if (musicBtn) musicBtn.setAttribute("aria-pressed", playing ? "true" : "false");
  }

  if (musicBtn && audio) {
    musicBtn.addEventListener("click", function () {
      if (audio.paused) {
        audio.volume = 0.35;
        audio.play().then(function () {
          setMusicUi(true);
        }).catch(function () {
          setMusicUi(false);
        });
      } else {
        audio.pause();
        setMusicUi(false);
      }
    });
  }

  /* ---------- Web3Forms hidden key ---------- */
  const keyInput = document.getElementById("web3forms-key");
  if (keyInput && CONFIG.web3formsAccessKey) {
    keyInput.value = CONFIG.web3formsAccessKey;
  }

  /* ---------- RSVP form ---------- */
  const form = document.getElementById("rsvp-form");
  const statusEl = document.getElementById("rsvp-status");
  const hintEl = document.getElementById("rsvp-hint");
  const submitBtn = document.getElementById("rsvp-submit");

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (statusEl) {
        statusEl.textContent = "";
        statusEl.className = "rsvp-form__status";
      }

      const name = document.getElementById("rsvp-name").value.trim();
      const phone = document.getElementById("rsvp-phone").value.trim();
      const guests = document.getElementById("rsvp-guests").value.trim();
      const message = document.getElementById("rsvp-message").value.trim();

      if (!name || !phone || !guests) {
        if (statusEl) {
          statusEl.textContent = "Please fill in your name, phone, and number of guests.";
          statusEl.classList.add("is-error");
        }
        return;
      }

      const bodyText =
        "RSVP — Sama & Medo Wedding\n\n" +
        "Name: " +
        name +
        "\n" +
        "Phone: " +
        phone +
        "\n" +
        "Guests: " +
        guests +
        "\n\n" +
        "Message:\n" +
        (message || "(none)");

      if (CONFIG.web3formsAccessKey) {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.classList.add("is-loading");
        }
        try {
          const fd = new FormData(form);
          fd.set("access_key", CONFIG.web3formsAccessKey);
          const res = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: fd,
          });
          const data = await res.json();
          if (data.success) {
            if (statusEl) {
              statusEl.textContent = "Thank you — your RSVP was sent. We cannot wait to see you.";
              statusEl.classList.add("is-success");
            }
            form.reset();
          } else {
            throw new Error(data.message || "Submit failed");
          }
        } catch (err) {
          if (statusEl) {
            statusEl.textContent = "Something went wrong. Please try again or email us directly.";
            statusEl.classList.add("is-error");
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove("is-loading");
          }
        }
        return;
      }

      /* mailto fallback */
      const subject = encodeURIComponent("Wedding RSVP — Sama & Medo");
      const body = encodeURIComponent(bodyText);
      const mail = CONFIG.rsvpMailto || "your-email@example.com";
      window.location.href = "mailto:" + mail + "?subject=" + subject + "&body=" + body;
      if (statusEl) {
        statusEl.textContent = "Your email app should open. If it does not, add a Web3Forms key in script.js or email us directly.";
        statusEl.classList.add("is-success");
      }
    });

    if (hintEl) {
      if (CONFIG.web3formsAccessKey) {
        hintEl.style.display = "none";
      }
    }
  }

  /* ---------- GSAP scroll reveals & parallax ---------- */
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add("js-anim");

    const reveals = document.querySelectorAll("[data-reveal]");
    gsap.set(reveals, {
      opacity: prefersReducedMotion ? 1 : 0,
      y: prefersReducedMotion ? 0 : 36,
      scale: prefersReducedMotion ? 1 : 0.97,
    });

    reveals.forEach(function (el) {
      gsap.fromTo(
        el,
        { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 36, scale: prefersReducedMotion ? 1 : 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: prefersReducedMotion ? 0.01 : 1.05,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    const heroInner = document.querySelector(".hero__inner");
    const heroMotion = document.getElementById("hero-motion");
    if (heroInner && !prefersReducedMotion) {
      gsap.fromTo(
        heroInner,
        { opacity: 0, y: 40, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 1.45, ease: "power3.out" }
      );
    } else if (heroInner) {
      gsap.set(heroInner, { opacity: 1, y: 0, scale: 1 });
    }
    if (heroMotion && !prefersReducedMotion) {
      gsap.fromTo(
        heroMotion,
        { y: 0, scale: 1, opacity: 1 },
        {
          y: -56,
          scale: 0.94,
          opacity: 0.88,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: 1.2,
          },
        }
      );
    }

    const galleryItems = document.querySelectorAll(".gallery-item");
    if (!prefersReducedMotion) {
      gsap.set(galleryItems, { opacity: 0, y: 28 });
    }
    galleryItems.forEach(function (item, i) {
      gsap.fromTo(
        item,
        { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 28 },
        {
          opacity: 1,
          y: 0,
          duration: prefersReducedMotion ? 0.01 : 0.85,
          delay: prefersReducedMotion ? 0 : i * 0.06,
          ease: "power2.out",
          scrollTrigger: {
            trigger: item,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    ScrollTrigger.refresh();
  } else {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  }
})();
