export const contentPath = new URL("./landing-content.json", import.meta.url);
export const draftKey = "alsafa.landing-draft";
const slug = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
const measurement = /^G-[A-Z0-9]+$/;
const filled = value => typeof value === "string" && value.trim().length > 0;
const dimension = value => Number.isSafeInteger(value) && value > 0 && value <= 8192;

function assetUrl(value) {
  if (!filled(value) || /\s|,|\\/.test(value)) return false;
  if (/^\.\/[a-z\d][a-z\d._/-]*$/i.test(value)) {
    return !value.split("/").slice(1).some(part => part === ".." || part === "." || !part);
  }
  if (!value.startsWith("https://")) return false;
  try {
    const url = new URL(value);
    return !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function contentErrors(content) {
  const errors = [];
  const require = (condition, text) => { if (!condition) errors.push(text); };
  const { hero, contact, services, projects, analytics } = content || {};
  for (const variant of ["a", "b"]) {
    require(filled(hero?.[variant]?.title) && filled(hero?.[variant]?.accent), `أكمل عنوان الواجهة ${variant.toUpperCase()}.`);
  }
  require(filled(hero?.description), "أدخل وصف الواجهة.");
  require(filled(contact?.title) && filled(contact?.description), "أكمل عنوان ووصف التواصل.");
  require(analytics?.measurementId === "" || measurement.test(analytics?.measurementId), "معرّف GA4 يجب أن يبدأ بـ G- أو يبقى فارغًا.");
  require(typeof analytics?.experimentEnabled === "boolean" && filled(analytics?.experimentId) && slug.test(analytics.experimentId), "أدخل معرّف تجربة صالحًا بالأحرف الإنجليزية الصغيرة والأرقام.");
  require(Array.isArray(services) && services.length > 0, "أضف خدمة واحدة على الأقل.");
  require(Array.isArray(projects) && projects.length > 0, "أضف مشروعًا واحدًا على الأقل.");

  const serviceTitles = new Set();
  for (const service of Array.isArray(services) ? services : []) {
    const title = service?.title?.trim?.();
    require(filled(title) && filled(service?.description) && !serviceTitles.has(title), "أكمل حقول الخدمة وتأكد من عدم تكرار اسمها.");
    serviceTitles.add(title);
  }

  const ids = new Set();
  const titles = new Set();
  const assets = new Set();
  const checkAsset = (path, label) => {
    require(assetUrl(path), `مسار الوسائط غير صالح: ${label}.`);
    if (!assetUrl(path)) return;
    const url = new URL(path, contentPath);
    const key = url.origin + url.pathname;
    require(!assets.has(key), `ملف الوسائط مكرر: ${label}.`);
    assets.add(key);
  };

  for (const [index, project] of (Array.isArray(projects) ? projects : []).entries()) {
    const label = filled(project?.title) ? project.title.trim() : String(index + 1);
    const id = project?.id;
    require(filled(id) && slug.test(id) && !ids.has(id), `أدخل معرّف مشروع صالحًا وفريدًا: ${label}.`);
    ids.add(id);
    require(filled(project?.title) && !titles.has(label) && filled(project?.summary) && filled(project?.category), `أكمل حقول المشروع وتأكد من أن العنوان فريد: ${label}.`);
    titles.add(label);
    const cover = project?.cover;
    checkAsset(cover?.src, label);
    if (cover?.small) {
      checkAsset(cover.small, label);
      require(dimension(cover.smallWidth) && cover.smallWidth < cover.width, `أدخل عرضًا صالحًا للغلاف المصغر: ${label}.`);
    }
    require(filled(cover?.alt) && dimension(cover?.width) && dimension(cover?.height), `أكمل وصف وأبعاد الغلاف: ${label}.`);
    require(Array.isArray(project?.media), `أضف قائمة وسائط صالحة: ${label}.`);
    for (const item of Array.isArray(project?.media) ? project.media : []) {
      checkAsset(item?.src, label);
      require(["image", "video"].includes(item?.type) && filled(item?.alt) && dimension(item?.width) && dimension(item?.height), `أكمل النوع والوصف والأبعاد للوسائط: ${label}.`);
      if (item?.type === "video") {
        checkAsset(item.poster, label);
        require(filled(item.caption), `أضف وصفًا مكتوبًا للفيديو: ${label}.`);
      }
    }
  }
  return [...new Set(errors)];
}
