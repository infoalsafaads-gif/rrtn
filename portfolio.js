(() => {
  "use strict";

  const DATA_URL = "./portfolio-data.json?v=20261112-curated";
  const PROFILE_URL = "https://www.behance.net/a2b6d985";
  const filtersRoot = document.getElementById("portfolioFilters");
  const gridRoot = document.getElementById("portfolioGrid");
  const countRoot = document.getElementById("portfolioCount");
  const searchInput = document.getElementById("portfolioSearch");
  const sortSelect = document.getElementById("portfolioSort");
  const resetButton = document.getElementById("portfolioReset");
  const viewButtons = [...document.querySelectorAll(".view-toggle")];
  const toolbar = document.querySelector(".portfolio-toolbar");
  const isFullPage = document.body.classList.contains("work-page");

  if (!filtersRoot || !gridRoot || !countRoot) return;

  const state = {
    filter: "all",
    query: "",
    sort: "featured",
    view: "grid",
    projects: [],
    displayedProjects: []
  };

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  };

  const isSafeAsset = (value) => {
    if (typeof value !== "string" || !value.trim()) return false;
    const clean = value.trim();
    if (/^(javascript|data|vbscript):/i.test(clean)) return false;
    return clean.startsWith("./") || clean.startsWith("../") || /^https:\/\//i.test(clean);
  };

  const validProject = (project) =>
    project &&
    typeof project.slug === "string" &&
    /^[a-z0-9-]+$/i.test(project.slug) &&
    typeof project.title === "string" &&
    project.title.trim() &&
    typeof project.category === "string" &&
    project.category.trim() &&
    isSafeAsset(project.coverImage);

  const setControlsDisabled = (disabled) => {
    [searchInput, sortSelect, resetButton, ...viewButtons].filter(Boolean)
      .forEach((control) => { control.disabled = disabled; });
  };

  const renderEmpty = (failed = false) => {
    gridRoot.replaceChildren();
    toolbar?.classList.add("has-no-projects");
    filtersRoot.replaceChildren();
    setControlsDisabled(true);

    const panel = make("div", "portfolio-empty");
    const art = make("div", "empty-art");
    art.setAttribute("aria-hidden", "true");
    art.innerHTML = '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="m3 15 5-5 4 4 3-3 6 6"></path><circle cx="8.5" cy="8.5" r="1.5"></circle></svg>';

    const copy = make("div", "portfolio-empty-copy");
    copy.append(
      make("span", "empty-kicker", failed ? "PORTFOLIO CONNECTION" : "YOUR WORK, YOUR STORY"),
      make("h3", "", failed ? "تعذّر تحميل معرض الأعمال" : "مساحة أعمالك جاهزة لتُروى."),
      make(
        "p",
        "",
        failed
          ? "تعذّر الوصول إلى بيانات المشاريع في الوقت الحالي. يمكنك متابعة أعمالك عبر Behance، أو إعادة المحاولة بعد قليل."
          : "هذا المعرض مستقل ومهيّأ لعرض مشاريعك بصورها الأصلية، مع بحث وتصنيفات وصفحات تفصيلية. لم نضع أعمالًا تجريبية أو صورًا لا تخصك."
      )
    );

    const actions = make("div", "empty-actions");
    const link = make("a", "empty-action", "استكشف ملف Behance ↗");
    link.href = PROFILE_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    actions.append(link);

    if (failed) {
      const retry = make("button", "empty-retry", "إعادة المحاولة");
      retry.type = "button";
      retry.addEventListener("click", load);
      actions.append(retry);
    }

    panel.append(art, copy, actions);
    gridRoot.append(panel);
    countRoot.textContent = failed ? "تعذّر تحميل المشاريع" : "0 مشروع في المعرض";
    gridRoot.setAttribute("aria-busy", "false");
  };

  const renderNoResults = () => {
    gridRoot.replaceChildren();
    const panel = make("div", "portfolio-no-results");
    const icon = make("span", "no-results-icon", "⌕");
    icon.setAttribute("aria-hidden", "true");
    const copy = make("div", "no-results-copy");
    copy.append(
      make("h3", "", "ما لقينا نتيجة مطابقة"),
      make("p", "", "جرّب كلمة مختلفة أو امسح التصنيف الحالي لعرض كل المشاريع.")
    );
    const clear = make("button", "empty-action", "عرض كل المشاريع");
    clear.type = "button";
    clear.addEventListener("click", resetAll);
    panel.append(icon, copy, clear);
    gridRoot.append(panel);
    countRoot.textContent = "لا توجد نتائج مطابقة";
    gridRoot.setAttribute("aria-busy", "false");
  };

  const updateResetButton = () => {
    if (!resetButton) return;
    const hasState = Boolean(state.query || state.filter !== "all" || state.sort !== "featured");
    resetButton.hidden = !hasState;
  };

  const createFilter = (label, value, count) => {
    const button = make("button", "portfolio-filter");
    button.type = "button";
    button.dataset.filter = value;
    button.setAttribute("aria-pressed", state.filter === value ? "true" : "false");
    const labelNode = make("span", "filter-name", label);
    const countNode = make("span", "filter-count", count);
    button.append(labelNode, countNode);
    button.addEventListener("click", () => {
      state.filter = value;
      draw();
    });
    return button;
  };

  const createCard = (project, index) => {
    const article = make("article", "project-card");
    if (project.category === "الفيديوهات الإعلانية") article.classList.add("project-card--video");
    if (index % 4 === 0) article.classList.add("project-card--wide");
    if (index % 4 === 1) article.classList.add("project-card--narrow");

    const link = make("a", "project-card-link");
    link.href = "./project.html?slug=" + encodeURIComponent(project.slug);
    link.setAttribute("aria-label", "عرض دراسة حالة " + project.title);

    const media = make("div", "project-media");
    const image = document.createElement("img");
    image.src = project.coverImage;
    image.alt = project.coverAlt || project.title;
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => {
      image.remove();
      media.classList.add("project-media-error");
      media.setAttribute("role", "img");
      media.setAttribute("aria-label", "تعذّر تحميل صورة " + project.title);
    }, { once: true });

    const open = make("span", "project-open", "↗");
    open.setAttribute("aria-hidden", "true");
    media.append(image, open);
    if (project.category === "الفيديوهات الإعلانية") {
      const play = make("span", "project-video-indicator", "▶ فيديو");
      play.setAttribute("aria-hidden", "true");
      media.append(play);
    }

    const meta = make("div", "project-meta");
    const copy = make("div", "project-meta-copy");
    copy.append(
      make("span", "project-category", project.category),
      make("h3", "project-title", project.title)
    );
    if (project.summary) copy.append(make("p", "project-summary", project.summary));
    meta.append(copy);
    if (project.year) meta.append(make("span", "project-year", project.year));

    link.append(media, meta);
    article.append(link);
    return article;
  };

  const normalizeSearch = (text) => text.normalize("NFKD").replace(/[\u064B-\u065F\u0670\u0640]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").toLocaleLowerCase("ar");

  const searchableText = (project) => [
    project.title,
    project.category,
    project.summary,
    project.description,
    project.client,
    project.collection,
    ...(Array.isArray(project.services) ? project.services : [project.services || ""]),
    ...(Array.isArray(project.tags) ? project.tags : [])
  ].filter(Boolean).join(" ").toLocaleLowerCase("ar");

  const sortedProjects = (projects) => {
    const list = [...projects];
    const yearOf = (project) => Number.parseInt(project.year, 10) || 0;
    switch (state.sort) {
      case "newest":
        return list.sort((a, b) => yearOf(b) - yearOf(a) || a.title.localeCompare(b.title, "ar"));
      case "oldest":
        return list.sort((a, b) => yearOf(a) - yearOf(b) || a.title.localeCompare(b.title, "ar"));
      case "az":
        return list.sort((a, b) => a.title.localeCompare(b.title, "ar"));
      case "za":
        return list.sort((a, b) => b.title.localeCompare(a.title, "ar"));
      case "featured":
      default:
        return list.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || yearOf(b) - yearOf(a));
    }
  };

  const drawFilters = () => {
    filtersRoot.replaceChildren();
    const projects = state.displayedProjects;
    filtersRoot.append(createFilter("كل الأعمال", "all", projects.length));

    const priority = ["الحملات الإعلانية", "تصميم السوشال ميديا", "الهوية البصرية والمطبوعات", "الفيديوهات الإعلانية"];
    const categories = [...new Set(projects.map((p) => p.category.trim()))].sort((a, b) => {
      const ai = priority.indexOf(a), bi = priority.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) || a.localeCompare(b, "ar");
    });
    categories.forEach((category) => {
      const count = projects.filter((p) => p.category.trim() === category).length;
      filtersRoot.append(createFilter(category, category, count));
    });
  };

  const draw = () => {
    const query = normalizeSearch(state.query.trim());
    const filtered = state.displayedProjects.filter((project) => {
      const matchesCategory = state.filter === "all" || project.category.trim() === state.filter;
      const matchesQuery = !query || normalizeSearch(searchableText(project)).includes(query);
      return matchesCategory && matchesQuery;
    });
    const visible = sortedProjects(filtered);

    filtersRoot.querySelectorAll("button").forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.filter === state.filter ? "true" : "false");
    });

    gridRoot.replaceChildren();
    gridRoot.classList.toggle("is-list-view", state.view === "list");
    if (!visible.length) {
      renderNoResults();
    } else {
      visible.forEach((project, index) => gridRoot.append(createCard(project, index)));
      countRoot.textContent = isFullPage
        ? visible.length + " من " + state.displayedProjects.length + " مشروع"
        : visible.length + " من " + state.projects.length + " مشروع";
      gridRoot.setAttribute("aria-busy", "false");
    }

    viewButtons.forEach((button) => {
      const active = button.dataset.view === state.view;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    updateResetButton();

    if (window.AlSafaSite && typeof window.AlSafaSite.observeReveals === "function") {
      window.AlSafaSite.observeReveals();
    }
  };

  const resetAll = () => {
    state.filter = "all";
    state.query = "";
    state.sort = "featured";
    if (searchInput) searchInput.value = "";
    if (sortSelect) sortSelect.value = "featured";
    draw();
  };

  const bindControls = () => {
    searchInput?.addEventListener("input", () => {
      state.query = searchInput.value;
      draw();
    });
    sortSelect?.addEventListener("change", () => {
      state.sort = sortSelect.value;
      draw();
    });
    resetButton?.addEventListener("click", resetAll);

    viewButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.view = button.dataset.view === "list" ? "list" : "grid";
        draw();
      });
    });

    document.addEventListener("keydown", (event) => {
      const target = event.target;
      const typing = target && (target.matches("input, textarea, select") || target.isContentEditable);
      if (event.key === "/" && !typing && searchInput && !searchInput.disabled) {
        event.preventDefault();
        searchInput.focus();
      }
      if (event.key === "Escape" && searchInput && document.activeElement === searchInput) {
        searchInput.value = "";
        state.query = "";
        searchInput.blur();
        draw();
      }
    });
  };

  function load() {
    gridRoot.setAttribute("aria-busy", "true");
    gridRoot.replaceChildren();
    gridRoot.append(make("div", "portfolio-loading", "يتم تحديث معرض الأعمال…"));

    fetch(DATA_URL, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Portfolio data request failed: " + response.status);
        return response.json();
      })
      .then((data) => {
        const projects = Array.isArray(data.projects) ? data.projects.filter(validProject) : [];
        state.projects = projects;
        const featured = projects.filter((project) => project.featured === true);
        state.displayedProjects = isFullPage
          ? projects
          : (featured.length ? featured.slice(0, 4) : projects.slice(0, 4));

        toolbar?.classList.remove("has-no-projects");
        if (!projects.length) {
          renderEmpty(false);
          return;
        }
        setControlsDisabled(false);
        drawFilters();
        draw();
      })
      .catch((error) => {
        console.error("[AL SAFA] Portfolio could not be loaded.", error);
        renderEmpty(true);
      });
  }

  bindControls();
  load();
})();
