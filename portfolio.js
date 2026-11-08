(() => {
  "use strict";

  const DATA_URL = "./portfolio-data.json?v=20261108-portfolio";
  const PROFILE_URL = "https://www.behance.net/a2b6d985";
  const filtersRoot = document.getElementById("portfolioFilters");
  const gridRoot = document.getElementById("portfolioGrid");
  const countRoot = document.getElementById("portfolioCount");
  const isFullPage = document.body.classList.contains("work-page");

  if (!filtersRoot || !gridRoot || !countRoot) return;

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  };

  const isSafeAsset = (value) => {
    if (typeof value !== "string" || !value.trim()) return false;
    if (/^(javascript|data|vbscript):/i.test(value.trim())) return false;
    return value.startsWith("./") || value.startsWith("../") || /^https:\/\//i.test(value);
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

  const renderEmpty = (failed = false) => {
    gridRoot.replaceChildren();
    const panel = make("div", "portfolio-empty");
    const art = make("div", "empty-art");
    art.setAttribute("aria-hidden", "true");
    art.innerHTML = '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="m3 15 5-5 4 4 3-3 6 6"></path><circle cx="8.5" cy="8.5" r="1.5"></circle></svg>';

    const copy = make("div", "portfolio-empty-copy");
    copy.append(
      make("h3", "", failed ? "تعذّر تحميل معرض الأعمال" : "معرض أعمالك قيد التجهيز"),
      make(
        "p",
        "",
        failed
          ? "واجهنا مشكلة في تحميل بيانات المشاريع. يمكنك زيارة ملف Behance مباشرة، وسيبقى معرضك المستقل جاهزًا لعرض المشاريع فور إضافتها."
          : "سيظهر هنا عملك بصوره الأصلية، وتصنيفه، ووصفه، وصفحة تفصيلية مستقلة. لم نضف نماذج تجريبية حتى يبقى المعرض ممثلًا لأعمالك الحقيقية."
      )
    );

    const link = make("a", "empty-action", "استكشف أعمال Behance ↗");
    link.href = PROFILE_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    panel.append(art, copy, link);
    gridRoot.append(panel);
    countRoot.textContent = failed ? "تعذّر تحميل البيانات" : "بانتظار إضافة المشاريع";
    gridRoot.setAttribute("aria-busy", "false");
    filtersRoot.replaceChildren();
  };

  const createFilter = (label, value, selected, onSelect) => {
    const button = make("button", "portfolio-filter", label);
    button.type = "button";
    button.dataset.filter = value;
    button.setAttribute("aria-pressed", selected ? "true" : "false");
    button.addEventListener("click", () => onSelect(value));
    return button;
  };

  const createCard = (project, index) => {
    const article = make("article", "project-card");
    if (index % 4 === 0) article.classList.add("project-card--wide");
    if (index % 4 === 1) article.classList.add("project-card--narrow");

    const link = make("a", "project-card-link");
    link.href = "./project.html?slug=" + encodeURIComponent(project.slug);
    link.setAttribute("aria-label", "عرض مشروع " + project.title);

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

  const render = (projects) => {
    let activeFilter = "all";
    const featured = projects.filter((project) => project.featured === true);
    const displayedProjects = isFullPage ? projects : (featured.length ? featured.slice(0, 4) : projects.slice(0, 4));
    const categories = [...new Set(displayedProjects.map((p) => p.category.trim()).filter(Boolean))];

    const draw = () => {
      const visible = activeFilter === "all"
        ? displayedProjects
        : displayedProjects.filter((project) => project.category.trim() === activeFilter);

      filtersRoot.querySelectorAll("button").forEach((button) => {
        button.setAttribute("aria-pressed", button.dataset.filter === activeFilter ? "true" : "false");
      });

      gridRoot.replaceChildren();
      visible.forEach((project, index) => gridRoot.append(createCard(project, index)));
      countRoot.textContent = isFullPage
        ? visible.length + (visible.length === 1 ? " مشروع" : " مشاريع")
        : visible.length + " من " + projects.length + " مشروع";
      gridRoot.setAttribute("aria-busy", "false");

      if (window.AlSafaSite && typeof window.AlSafaSite.observeReveals === "function") {
        window.AlSafaSite.observeReveals();
      }
    };

    filtersRoot.replaceChildren();
    filtersRoot.append(createFilter("كل الأعمال", "all", true, (value) => {
      activeFilter = value;
      draw();
    }));

    categories.forEach((category) => {
      filtersRoot.append(createFilter(category, category, false, (value) => {
        activeFilter = value;
        draw();
      }));
    });

    if (projects.length === 0) {
      renderEmpty(false);
      return;
    }
    draw();
  };

  fetch(DATA_URL, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Portfolio data request failed: " + response.status);
      return response.json();
    })
    .then((data) => {
      const projects = Array.isArray(data.projects) ? data.projects.filter(validProject) : [];
      render(projects);
    })
    .catch((error) => {
      console.error("[AL SAFA] Portfolio could not be loaded.", error);
      renderEmpty(true);
    });
})();
