import { contentPath, contentErrors, draftKey } from "./landing-schema.js";

const $ = selector => document.querySelector(selector);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const dialog = $("#project-dialog");
const mediaList = $("#project-media");
let report = () => {};
let selectedProjectButton;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function arrow() {
  const node = element("span", "arrow");
  node.setAttribute("aria-hidden", "true");
  return node;
}

function image(source, { alt, width, height }, lazy = true) {
  const node = new Image(width, height);
  node.alt = alt;
  node.loading = lazy ? "lazy" : "eager";
  node.decoding = "async";
  node.src = source;
  return node;
}

function makeReel(item, projectId) {
  const launch = element("button", "reel-launch");
  launch.type = "button";
  launch.setAttribute("aria-label", "شغّل " + item.alt);
  launch.append(image(item.poster, { ...item, alt: "" }), element("span", "button primary", "▶  شغّل الفيديو"));
  launch.addEventListener("click", () => {
    const video = element("video");
    video.controls = true;
    video.playsInline = true;
    video.preload = "none";
    video.poster = item.poster;
    video.src = item.src;
    video.style.setProperty("--media-ratio", `${item.width}/${item.height}`);
    video.setAttribute("aria-label", item.alt);
    video.tabIndex = 0;
    const status = element("p");
    status.setAttribute("role", "status");
    video.addEventListener("error", () => {
      status.textContent = "تعذر تشغيل الفيديو.";
      const direct = element("a", "text-link", "افتح ملف الفيديو");
      direct.href = item.src;
      status.after(direct);
    }, { once: true });
    video.addEventListener("play", () => {
      mediaList.querySelectorAll("video").forEach(other => { if (video !== other) other.pause(); });
    });
    video.addEventListener("playing", () => report("video_start", { project_id: projectId }), { once: true });
    video.addEventListener("ended", () => report("video_complete", { project_id: projectId }), { once: true });
    launch.replaceWith(video, status);
    video.focus({ preventScroll: true });
    video.play().catch(() => {});
  });
  return launch;
}

function openProject(project, button) {
  selectedProjectButton = button;
  $("#project-title").textContent = project.title;
  mediaList.replaceChildren();
  if (!project.media.length) mediaList.append(element("p", "", project.summary));
  for (const item of project.media) {
    const figure = element("figure");
    figure.append(item.type === "video" ? makeReel(item, project.id) : image(item.src, item));
    if (item.caption) figure.append(element("figcaption", "", item.caption));
    mediaList.append(figure);
  }
  dialog.showModal();
  dialog.scrollTop = 0;
  report("project_open", { project_id: project.id });
}

function renderProjects(projects) {
  const grid = $("#projects");
  for (const project of projects) {
    const card = element("article", "project");
    card.id = "work-" + project.id;
    card.dataset.reveal = "";
    const picture = element("div", "project-image");
    if (project.media.some(item => item.type === "video") && !$("#videos")) picture.id = "videos";
    const cover = image(project.cover.src, project.cover);
    if (project.cover.small) {
      const smallWidth = project.cover.smallWidth;
      cover.srcset = `${project.cover.small} ${smallWidth}w, ${project.cover.src} ${project.cover.width}w`;
      cover.sizes = "(min-width: 1440px) 640px, (min-width: 630px) 45vw, 90vw";
    }
    const info = element("div", "project-info");
    const title = element("h3", "", project.title);
    title.id = "title-" + project.id;
    card.setAttribute("aria-labelledby", title.id);
    const button = element("button", "project-action", "تفاصيل المشروع");
    button.type = "button";
    button.setAttribute("aria-label", "تفاصيل مشروع " + project.title);
    button.setAttribute("aria-haspopup", "dialog");
    button.append(arrow());
    button.addEventListener("click", () => openProject(project, button));
    picture.append(cover);
    info.append(element("p", "category", project.category), title, element("p", "summary", project.summary), button);
    card.append(picture, info);
    grid.append(card);
  }
  if (location.hash === "#videos" && $("#videos")) $("#videos").scrollIntoView({ behavior: "instant" });
}

function renderServices(services) {
  const list = $("#service-list");
  list.replaceChildren();
  services.forEach((service, index) => {
    const details = element("details", "service");
    details.dataset.reveal = "";
    details.open = index === 0;
    details.append(element("summary", "", service.title), element("p", "", service.description));
    details.addEventListener("toggle", () => {
      if (details.open) report("service_open", { service_position: index + 1 });
    });
    list.append(details);
  });
}

function animateOnScroll() {
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.16 });
  document.querySelectorAll("[data-reveal]").forEach(node => observer.observe(node));
}

function readChoice(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function saveChoice(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

function chooseVariant(config, preview) {
  if (preview === "a" || preview === "b") return preview;
  if (!config.experimentEnabled) return "a";
  const key = "alsafa.variant." + config.experimentId;
  const saved = readChoice(key);
  if (saved === "a" || saved === "b") return saved;
  const variant = Math.random() < 0.5 ? "a" : "b";
  saveChoice(key, variant);
  return variant;
}

function configureAnalytics(config, variant, isPreview) {
  const id = config.measurementId.trim();
  if (!id || isPreview) return;
  const consentKey = "alsafa.analytics-consent";
  const blocked = "ga-disable-" + id;
  const panel = $("#privacy");
  const toggle = $("#privacy-toggle");
  const measuredSections = new Set();
  const pageLocation = location.origin + location.pathname;
  const experiment = config.experimentEnabled ? config.experimentId : "production";
  let sectionObserver;
  let initialized = false;
  let enabled = false;

  const send = (name, parameters = {}) => {
    if (!enabled) return;
    window.gtag("event", name, {
      ...parameters,
      send_to: id,
      page_location: pageLocation,
      experiment_id: experiment,
      headline_variant: variant
    });
  };

  function enable() {
    if (enabled) return;
    window[blocked] = false;
    enabled = true;
    if (!initialized) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", id, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        page_location: pageLocation
      });
      const script = element("script");
      script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
      script.async = true;
      document.head.append(script);
      send("page_view");
      if (config.experimentEnabled) send("headline_exposure");
      initialized = true;
    }
    report = send;
    if ("IntersectionObserver" in window) {
      sectionObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.6) continue;
          const section = entry.target.closest("section").id;
          if (!measuredSections.has(section)) send("section_view", { section_id: section });
          measuredSections.add(section);
          sectionObserver.unobserve(entry.target);
        }
      }, { threshold: 0.6 });
      document.querySelectorAll("#work-title, #services-title, #contact-title").forEach(node => sectionObserver.observe(node));
    }
  }

  toggle.hidden = false;
  toggle.addEventListener("click", () => panel.showModal());
  $("#consent-yes").addEventListener("click", () => {
    saveChoice(consentKey, "yes");
    enable();
    panel.close();
  });
  $("#consent-no").addEventListener("click", () => {
    saveChoice(consentKey, "no");
    enabled = false;
    window[blocked] = true;
    sectionObserver?.disconnect();
    panel.close();
  });
  if (readChoice(consentKey) === "yes") enable();
}

dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
$("#close-project").addEventListener("click", () => dialog.close());
dialog.addEventListener("close", () => {
  mediaList.querySelectorAll("video").forEach(video => video.pause());
  mediaList.replaceChildren();
  selectedProjectButton?.focus({ preventScroll: true });
  selectedProjectButton = undefined;
});
document.addEventListener("click", event => {
  const link = event.target.closest("[data-event]");
  if (link) report(link.dataset.event, { click_location: link.dataset.location });
});

async function initialize() {
  const params = new URLSearchParams(location.search);
  const isDraft = params.get("draft") === "1";
  const saved = isDraft && readChoice(draftKey);
  let data;
  if (saved) {
    data = JSON.parse(saved);
  } else {
    const response = await fetch(contentPath);
    if (!response.ok) throw Error("Missing landing content");
    data = await response.json();
  }
  const errors = contentErrors(data);
  if (errors.length) throw Error(errors.join(" "));
  if (isDraft) {
    const banner = element("a", "draft-banner", "معاينة مسودة · العودة إلى لوحة الإدارة");
    banner.href = "./admin/";
    $(".site-header").before(banner);
  }
  const preview = params.get("variant")?.toLowerCase();
  const variant = chooseVariant(data.analytics, preview || (isDraft ? "a" : ""));
  const headline = data.hero[variant];
  $("#headline").replaceChildren(headline.title + " ", element("em", "", headline.accent));
  $(".hero-lead").textContent = data.hero.description;
  $("#contact-title").textContent = data.contact.title;
  $("#contact-copy").textContent = data.contact.description;
  renderProjects(data.projects);
  renderServices(data.services);
  animateOnScroll();
  configureAnalytics(data.analytics, variant, isDraft || preview === "a" || preview === "b");
}

initialize().catch(error => {
  console.error(error);
  const status = $("#work-status");
  const link = element("a", "text-link", "افتح معرض المشاريع");
  link.href = "./work.html";
  status.replaceChildren("تعذر تحميل الأعمال. ", link);
  status.hidden = false;
});
