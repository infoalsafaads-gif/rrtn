(() => {
  "use strict";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const intro = document.getElementById("cinematicIntro");
  const body = document.body;

  if (intro) {
    let introSeen = false;
    try { introSeen = sessionStorage.getItem("al-safa-cinematic-seen") === "1"; } catch (_) {}
    if (reducedMotion || introSeen) {
      intro.remove();
    } else {
      body.classList.add("sa-intro-running");
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        try { sessionStorage.setItem("al-safa-cinematic-seen", "1"); } catch (_) {}
        body.classList.remove("sa-intro-running");
        intro.classList.add("is-leaving");
        window.setTimeout(() => intro.remove(), 700);
      };
      intro.querySelector(".cinematic-skip")?.addEventListener("click", finish, { once: true });
      // Preserve the first-visit introduction without delaying every page.
      window.setTimeout(finish, 3000);
    }
  }

  const particlesRoot = document.querySelector(".sa-particles");
  if (particlesRoot && !reducedMotion) {
    const amount = window.matchMedia("(max-width: 760px)").matches ? 7 : 15;
    for (let i = 0; i < amount; i += 1) {
      const particle = document.createElement("i");
      particle.className = "sa-particle";
      particle.style.left = ((i * 37 + 11) % 100) + "%";
      particle.style.top = ((i * 29 + 17) % 100) + "%";
      particle.style.setProperty("--dust-delay", (-(i % 7) * 1.6) + "s");
      particle.style.setProperty("--dust-duration", (10 + (i % 6) * 2.1) + "s");
      particlesRoot.append(particle);
    }
  }

  const revealTargets = (root = document) => {
    if (reducedMotion || !("IntersectionObserver" in window)) return;
    const selector = ".hero h1,.intro,.cta,.sec-head,.w,.svc,.contact h2,.infinite-gallery-head,.ticker-card,.archive-hero-copy,.archive-feature-card,.archive-work-heading,.portfolio-toolbar,.project-card,.project-header,.project-cover,.project-content,.related-card,.sa-service-wheel-section,.sa-video-card";
    const nodes = root.querySelectorAll ? root.querySelectorAll(selector) : [];
    nodes.forEach((node, index) => {
      if (node.classList.contains("sa-reveal")) return;
      node.classList.add("sa-reveal");
      revealObserver.observe(node);
      node.style.transitionDelay = (Math.min(index % 4, 3) * 65) + "ms";
    });
  };

  const revealObserver = !reducedMotion && "IntersectionObserver" in window
    ? new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("sa-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -32px 0px" })
    : null;

  revealTargets();
  const dynamicRoots = ["portfolioGrid", "projectDetail", "grid"].map((id) => document.getElementById(id)).filter(Boolean);
  if (dynamicRoots.length && "MutationObserver" in window && !reducedMotion) {
    const mutations = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.matches?.(".project-card,.related-card,.w")) {
          node.classList.add("sa-reveal");
          revealObserver?.observe(node);
        }
        revealTargets(node);
      }));
    });
    dynamicRoots.forEach((root) => mutations.observe(root, { childList: true, subtree: true }));
  }

  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!canHover || reducedMotion) return;

  const cursor = document.createElement("div");
  cursor.className = "sa-cursor";
  cursor.setAttribute("aria-hidden", "true");
  const glow = document.createElement("div");
  glow.className = "sa-cursor-glow";
  glow.setAttribute("aria-hidden", "true");
  body.append(cursor, glow);
  body.classList.add("sa-custom-cursor");

  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  let frame = 0;
  const moveCursor = (event) => {
    if (event.pointerType && event.pointerType !== "mouse") return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      cursor.style.left = pointerX + "px";
      cursor.style.top = pointerY + "px";
      glow.style.left = pointerX + "px";
      glow.style.top = pointerY + "px";
      body.style.setProperty("--sa-pointer-x", pointerX + "px");
      body.style.setProperty("--sa-pointer-y", pointerY + "px");
      frame = 0;
    });
  };
  window.addEventListener("pointermove", moveCursor, { passive: true });
  window.addEventListener("pointerover", (event) => {
    const target = event.target?.closest?.("a,button,[role='button']");
    cursor.classList.toggle("is-view", Boolean(target?.closest(".w,.project-card-link,.ticker-card")));
    cursor.style.opacity = "1";
    glow.style.opacity = ".36";
  }, { passive: true });
  window.addEventListener("pointerout", (event) => {
    if (!event.relatedTarget) {
      cursor.style.opacity = "0";
      glow.style.opacity = "0";
    }
  }, { passive: true });

  const addMagnetic = (element) => {
    if (element.dataset.saMagnetic === "1") return;
    element.dataset.saMagnetic = "1";
    element.classList.add("sa-magnetic");
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const dx = (event.clientX - rect.left - rect.width / 2) / Math.max(rect.width / 2, 1);
      const dy = (event.clientY - rect.top - rect.height / 2) / Math.max(rect.height / 2, 1);
      element.style.translate = (dx * 5) + "px " + (dy * 4) + "px";
    });
    element.addEventListener("pointerleave", () => { element.style.translate = "0 0"; });
  };
  document.querySelectorAll(".btn,.pill,.editorial-header-cta,.editorial-primary-link,.archive-cta-link,.mbar a,.editorial-mobile-bar a").forEach(addMagnetic);

  const addTilt = (element) => {
    if (element.dataset.saTilt === "1") return;
    element.dataset.saTilt = "1";
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const px = (event.clientX - rect.left) / Math.max(rect.width, 1);
      const py = (event.clientY - rect.top) / Math.max(rect.height, 1);
      const rx = (0.5 - py) * 5;
      const ry = (px - 0.5) * 6;
      element.style.transform = "perspective(900px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-3px)";
    });
    element.addEventListener("pointerleave", () => { element.style.transform = ""; });
  };
  document.querySelectorAll(".w,.project-card,.ticker-card").forEach(addTilt);

  const pointerObserver = new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node.nodeType !== 1) return;
      if (node.matches?.(".project-card,.w,.ticker-card")) addTilt(node);
      node.querySelectorAll?.(".project-card,.w,.ticker-card").forEach(addTilt);
      node.querySelectorAll?.(".btn,.pill,.editorial-header-cta,.editorial-primary-link,.archive-cta-link").forEach(addMagnetic);
    }));
  });
  pointerObserver.observe(body, { childList: true, subtree: true });
})();