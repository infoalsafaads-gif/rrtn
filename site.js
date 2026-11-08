(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const setupIntro = () => {
    const screen = document.getElementById("introScreen");
    if (!screen) return;

    const skipButton = document.getElementById("introSkip");
    const forceReplay = new URLSearchParams(window.location.search).has("intro");
    let alreadyPlayed = false;

    try {
      alreadyPlayed = sessionStorage.getItem("al-safa-intro-seen") === "1";
    } catch (_) {
      alreadyPlayed = false;
    }

    if (reducedMotion || (alreadyPlayed && !forceReplay)) {
      screen.hidden = true;
      document.body.classList.add("intro-done");
      return;
    }

    document.body.classList.add("intro-active");
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      screen.classList.add("is-leaving");
      document.body.classList.remove("intro-active");
      document.body.classList.add("intro-done");

      try {
        sessionStorage.setItem("al-safa-intro-seen", "1");
      } catch (_) {}

      window.setTimeout(() => {
        screen.hidden = true;
      }, 680);
    };

    skipButton?.addEventListener("click", finish);
    window.setTimeout(finish, 1450);
  };

  const setupMenu = () => {
    const toggle = document.getElementById("menuToggle");
    const panel = document.getElementById("menuOverlay");
    const closeButton = document.getElementById("menuClose");
    if (!toggle || !panel) return;

    let closeTimer = null;
    const close = () => {
      toggle.setAttribute("aria-expanded", "false");
      panel.setAttribute("aria-hidden", "true");
      panel.classList.remove("is-open");
      document.body.classList.remove("menu-open");
      if (closeTimer) window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(() => {
        panel.hidden = true;
      }, 380);
    };

    const open = () => {
      if (closeTimer) window.clearTimeout(closeTimer);
      panel.hidden = false;
      panel.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("menu-open");
      window.requestAnimationFrame(() => panel.classList.add("is-open"));
      const firstLink = panel.querySelector("a");
      window.setTimeout(() => firstLink?.focus(), 80);
    };

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (isOpen) close();
      else open();
    });

    closeButton?.addEventListener("click", close);
    panel.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        close();
        toggle.focus();
      }
    });
  };

  const createProgress = () => {
    let bar = document.querySelector(".scroll-progress");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "scroll-progress";
      bar.setAttribute("aria-hidden", "true");
      document.body.prepend(bar);
    }

    let scheduled = false;
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      bar.style.width = (Math.min(1, Math.max(0, progress)) * 100) + "%";
      scheduled = false;
    };

    window.addEventListener("scroll", () => {
      if (!scheduled) {
        scheduled = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  };

  const observeReveals = () => {
    const targets = document.querySelectorAll(
      ".hero-copy, .hero-visual, .contact-panel, .contact-strip, .portfolio-heading, .portfolio-toolbar, .project-card, .section-heading, .service-card, .service-row, .approach-intro, .approach-step, .final-cta"
    );

    if (reducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          instance.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });

    targets.forEach((node) => {
      if (node.classList.contains("is-visible") || node.classList.contains("reveal-on-scroll")) return;
      node.classList.add("reveal-on-scroll");
      observer.observe(node);
    });
  };

  const setupNavigation = () => {
    const links = [...document.querySelectorAll('.main-nav a[href^="#"]')];
    if (!links.length || !("IntersectionObserver" in window)) return;

    const sections = links
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);
    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-25% 0px -65% 0px", threshold: 0 });

    sections.forEach((section) => observer.observe(section));
  };

  const start = () => {
    setupIntro();
    setupMenu();
    createProgress();
    observeReveals();
    setupNavigation();
  };

  window.AlSafaSite = { observeReveals };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
