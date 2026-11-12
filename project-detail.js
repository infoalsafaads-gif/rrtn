(() => {
  "use strict";

  const DATA_URL = "./portfolio-data.json?v=20261112-curated";
  const root = document.getElementById("projectDetail");
  if (!root) return;

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  };

  const isSafeAsset = (value) =>
    typeof value === "string" &&
    value.trim() &&
    !/^(javascript|data|vbscript):/i.test(value.trim()) &&
    (value.startsWith("./") || value.startsWith("../") || /^https:\/\//i.test(value));

  const validProject = (project) =>
    project &&
    typeof project.slug === "string" &&
    /^[a-z0-9-]+$/i.test(project.slug) &&
    typeof project.title === "string" &&
    typeof project.category === "string" &&
    isSafeAsset(project.coverImage);

  const appendTextBlock = (target, block) => {
    if (block.type === "heading" && block.text) {
      target.append(make("h2", "", block.text));
    } else if (block.type === "paragraph" && block.text) {
      target.append(make("p", "", block.text));
    } else if (block.type === "image" && isSafeAsset(block.src)) {
      const figure = make("figure", "case-study-figure");
      const image = document.createElement("img");
      image.src = block.src;
      image.alt = block.alt || "";
      image.loading = "lazy";
      image.decoding = "async";
      figure.append(image);
      if (block.caption) figure.append(make("figcaption", "", block.caption));
      target.append(figure);
    } else if (block.type === "video" && isSafeAsset(block.src)) {
      const video = document.createElement("video");
      video.src = block.src;
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      if (isSafeAsset(block.poster)) video.poster = block.poster;
      target.append(video);
    }
  };

  const unavailable = (message) => {
    root.replaceChildren();
    const panel = make("section", "project-unavailable");
    panel.append(
      make("h1", "", "المشروع غير متاح حاليًا"),
      make("p", "", message || "قد يكون الرابط غير صحيح أو لم تتم إضافة بيانات هذا المشروع إلى معرض الصفا بعد.")
    );
    const link = make("a", "", "العودة إلى معرض الأعمال ←");
    link.href = "./work.html";
    panel.append(link);
    root.append(panel);
  };

  const render = (projects) => {
    const slug = new URLSearchParams(window.location.search).get("slug");
    const index = projects.findIndex((project) => project.slug === slug);
    if (!slug || index < 0) {
      unavailable("ارجع إلى معرض الأعمال لاستكشاف المشاريع المتاحة.");
      return;
    }

    const project = projects[index];
    root.replaceChildren();

    const crumbs = make("div", "project-breadcrumbs");
    const allLink = make("a", "", "كل الأعمال");
    allLink.href = "./work.html";
    crumbs.append(allLink, make("span", "", "／"), make("span", "", project.title));

    const header = make("header", "project-header");
    header.append(
      make("span", "project-category", project.category),
      make("h1", "", project.title)
    );
    if (project.description || project.summary) {
      header.append(make("p", "", project.description || project.summary));
    }

    const facts = make("div", "project-facts");
    const addFact = (label, value) => {
      if (!value) return;
      const fact = make("div", "project-fact");
      fact.append(make("span", "", label), make("strong", "", value));
      facts.append(fact);
    };
    addFact("العميل / العلامة", project.client);
    addFact("السنة", project.year);
    addFact("الخدمات", Array.isArray(project.services) ? project.services.join(" · ") : project.services);
    if (facts.childElementCount) header.append(facts);

    const cover = make("div", "project-cover");
    const coverImage = document.createElement("img");
    coverImage.src = project.coverImage;
    coverImage.alt = project.coverAlt || project.title;
    coverImage.fetchPriority = "high";
    cover.append(coverImage);

    const content = make("article", "project-content");
    if (Array.isArray(project.sections)) {
      project.sections.forEach((block) => {
        if (block && typeof block === "object") appendTextBlock(content, block);
      });
    }

    const navigation = make("nav", "project-navigation");
    navigation.setAttribute("aria-label", "التنقل بين المشاريع");
    const previous = projects[index - 1];
    const next = projects[index + 1];

    if (previous) {
      const link = make("a", "project-nav-link");
      link.href = "./project.html?slug=" + encodeURIComponent(previous.slug);
      link.append(make("small", "", "المشروع السابق ←"), make("strong", "", previous.title));
      navigation.append(link);
    } else {
      const link = make("a", "project-nav-link");
      link.href = "./work.html";
      link.append(make("small", "", "العودة للمعرض ↑"), make("strong", "", "كل المشاريع"));
      navigation.append(link);
    }

    if (next) {
      const link = make("a", "project-nav-link next");
      link.href = "./project.html?slug=" + encodeURIComponent(next.slug);
      link.append(make("small", "", "المشروع التالي →"), make("strong", "", next.title));
      navigation.append(link);
    } else if (projects.length > 1) {
      const link = make("a", "project-nav-link next");
      link.href = "./work.html";
      link.append(make("small", "", "تابع الاستكشاف"), make("strong", "", "العودة لكل الأعمال"));
      navigation.append(link);
    }

    root.append(crumbs, header, cover);
    if (content.childElementCount) root.append(content);
    root.append(navigation);

    const related = projects
      .filter((item, itemIndex) => itemIndex !== index && ((project.collection && item.collection === project.collection) || item.category === project.category))
      .slice(0, 3);

    if (related.length) {
      const section = make("section", "related-projects");
      section.append(make("h2", "", project.collection ? "المزيد من أعمال " + project.collection : "مشاريع ذات صلة"));
      const list = make("div", "related-grid");
      related.forEach((item) => {
        const link = make("a", "related-card");
        link.href = "./project.html?slug=" + encodeURIComponent(item.slug);
        const image = document.createElement("img");
        image.src = item.coverImage;
        image.alt = item.coverAlt || item.title;
        image.loading = "lazy";
        image.decoding = "async";
        link.append(image, make("strong", "", item.title));
        list.append(link);
      });
      section.append(list);
      root.append(section);
    }

    if (project.behanceUrl && /^https:\/\/www\.behance\.net\//i.test(project.behanceUrl)) {
      const sourceLink = make("a", "project-source-link", "عرض النسخة الأصلية على Behance ↗");
      sourceLink.href = project.behanceUrl;
      sourceLink.target = "_blank";
      sourceLink.rel = "noopener noreferrer";
      root.append(sourceLink);
    }

    window.AlSafaSite?.observeReveals();
    document.title = project.title + " | AL SAFA";
    const description = project.summary || project.description || "دراسة حالة من أعمال الصفا للدعاية والإعلان.";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute("content", description.slice(0, 155));
  };

  fetch(DATA_URL, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Project data request failed: " + response.status);
      return response.json();
    })
    .then((data) => render(Array.isArray(data.projects) ? data.projects.filter(validProject) : []))
    .catch((error) => {
      console.error("[AL SAFA] Project details could not be loaded.", error);
      unavailable("تعذّر تحميل بيانات المشاريع. حاول العودة إلى معرض الأعمال مرة أخرى.");
    });
})();
