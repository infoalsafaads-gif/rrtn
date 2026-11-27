import { contentPath, contentErrors, draftKey } from "../landing-schema.js";

const $ = selector => document.querySelector(selector);
const form = $("#fields");
const text = (key, label) => [key, label, "text"];
const long = (key, label) => [key, label, "textarea"];
const raw = (key, label) => [key, label, "ltr"];
const number = (key, label) => [key, label, "number"];
const dimensions = [number("width", "العرض بالبكسل"), number("height", "الارتفاع بالبكسل")];
let data;
let published;

function element(tag, value) {
  const node = document.createElement(tag);
  if (value) node.textContent = value;
  return node;
}

function button(label, action, disabled = false) {
  const node = element("button", label);
  node.type = "button";
  node.className = "button secondary";
  node.disabled = disabled;
  node.addEventListener("click", action);
  return node;
}

function fields(target, definitions, changed = () => {}) {
  const container = element("div");
  container.className = "editor-fields";
  for (const [key, caption, type] of definitions) {
    const label = element("label", caption);
    const input = element(type === "textarea" ? "textarea" : type === "choice" ? "select" : "input");
    input.name = key;
    if (type === "choice") {
      input.add(new Option("صورة", "image"));
      input.add(new Option("فيديو", "video"));
    }
    if (type === "checkbox" || type === "number") input.type = type;
    if (["ltr", "number"].includes(type)) input.dir = "ltr";
    if (type === "checkbox") input.checked = target[key];
    else input.value = target[key] ?? "";
    input.addEventListener("input", () => {
      target[key] = type === "checkbox" ? input.checked : type === "number" ? input.valueAsNumber : input.value;
      changed(key);
      $("#errors").hidden = true;
      $("#status").textContent = "في تعديلات جاهزة للمعاينة أو التصدير.";
    });
    label.append(input);
    container.append(label);
  }
  return container;
}

function section(title, open = false) {
  const node = element("details");
  node.className = "editor-section";
  node.open = open;
  node.append(element("summary", title));
  return node;
}

function group(title, controls) {
  const fieldset = element("fieldset");
  fieldset.append(element("legend", title), controls);
  return fieldset;
}

function collection(parent, items, make, render, noun) {
  function refresh(focusIndex) {
    parent.replaceChildren();
    items.forEach((item, index) => {
      const itemFields = render(item, index);
      const actions = element("div");
      actions.className = "list-actions";
      actions.append(
        button("أعلى ↑", () => {
          [items[index - 1], items[index]] = [items[index], items[index - 1]];
          refresh(index - 1);
        }, index === 0),
        button("أسفل ↓", () => {
          [items[index + 1], items[index]] = [items[index], items[index + 1]];
          refresh(index + 1);
        }, index === items.length - 1),
        button("حذف " + noun, () => {
          items.splice(index, 1);
          refresh(Math.min(index, items.length - 1));
        })
      );
      itemFields.append(actions);
      parent.append(itemFields);
      if (focusIndex === index) itemFields.querySelector("input,select")?.focus();
    });
    const add = button("إضافة " + noun, () => {
      const created = make();
      items.push(created);
      refresh(items.length - 1);
    });
    parent.append(add);
    if (focusIndex === -1) add.focus();
  }
  refresh();
}

function projectFields(project, index) {
  const card = group("المشروع " + (index + 1), fields(project, [
    raw("id", "معرّف المشروع"), text("title", "اسم المشروع"),
    text("category", "التصنيف"), long("summary", "ملخص المشروع")
  ]));
  card.append(group("الغلاف", fields(project.cover, [
    raw("src", "مسار الغلاف"), raw("small", "مسار نسخة الهاتف (اختياري)"),
    number("smallWidth", "عرض نسخة الهاتف إن وجدت"), text("alt", "الوصف البديل"), ...dimensions
  ])));
  const entries = element("div");
  card.append(group("صور وفيديو المشروع", entries));
  collection(entries, project.media, () => ({ type: "image", width: 800, height: 800 }), (item, position) => {
    const box = group("الوسائط " + (position + 1), fields(item, [
      ["type", "النوع", "choice"], raw("src", "مسار الملف"), raw("poster", "مسار ملصق الفيديو"),
      text("alt", "الوصف البديل"), ...dimensions, long("caption", "تعليق الصورة أو وصف الفيديو")
    ], key => {
      if (key === "type") box.querySelector('[name="poster"]').closest("label").hidden = item.type !== "video";
    }));
    box.querySelector('[name="poster"]').closest("label").hidden = item.type !== "video";
    return box;
  }, "وسائط");
  return card;
}

function render() {
  form.replaceChildren();
  const opening = section("واجهة الإعلان", true);
  const heading = [text("title", "بداية العنوان"), text("accent", "الكلمات الملوّنة")];
  opening.append(group("العنوان A", fields(data.hero.a, heading)), group("العنوان B", fields(data.hero.b, heading)), fields(data.hero, [long("description", "وصف الواجهة")]));

  const projects = section("الأعمال");
  const projectList = element("div");
  projects.append(projectList);
  collection(projectList, data.projects, () => ({ cover: {}, media: [] }), projectFields, "مشروع");

  const services = section("الخدمات");
  const serviceList = element("div");
  services.append(serviceList);
  collection(serviceList, data.services, () => ({}), (service, index) => group("الخدمة " + (index + 1), fields(service, [text("title", "اسم الخدمة"), long("description", "وصف الخدمة")])), "خدمة");

  const contact = section("التواصل");
  contact.append(fields(data.contact, [text("title", "عنوان التواصل"), long("description", "نص التواصل")]));
  const analytics = section("القياس وتجربة العناوين");
  analytics.append(fields(data.analytics, [
    raw("measurementId", "معرّف Google Analytics"), raw("experimentId", "معرّف تجربة العناوين"),
    ["experimentEnabled", "تفعيل تقسيم الجمهور بين A وB", "checkbox"]
  ]));
  form.append(opening, projects, services, contact, analytics);
  form.hidden = false;
}

function serialize() {
  const errors = contentErrors(data);
  const list = $("#errors");
  list.replaceChildren(...errors.map(error => element("li", error)));
  list.hidden = errors.length === 0;
  if (errors.length) {
    $("#status").textContent = "صحّح الحقول التالية أولًا.";
    return null;
  }
  return JSON.stringify(data, null, 2) + "\n";
}

$("#preview").addEventListener("click", () => {
  const json = serialize();
  if (!json) return;
  try {
    localStorage.setItem(draftKey, json);
    location.href = "../?draft=1";
  } catch {
    $("#status").textContent = "ما قدر المتصفح يحفظ المسودة. نزّل نسخة من الملف.";
  }
});

$("#export").addEventListener("click", () => {
  const json = serialize();
  if (!json) return;
  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const link = element("a");
  link.href = url;
  link.download = "landing-content.json";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $("#status").textContent = "الملف جاهز للنشر عبر GitHub.";
});

$("#copy").addEventListener("click", async () => {
  const json = serialize();
  if (!json) return;
  try {
    await navigator.clipboard.writeText(json);
    $("#status").textContent = "تم النسخ. الصق المحتوى في محرّر GitHub.";
  } catch {
    $("#status").textContent = "تعذّر النسخ. استخدم زر تنزيل ملف المحتوى.";
  }
});

$("#import").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;
  const status = $("#status");
  try {
    const imported = JSON.parse(await file.text());
    const errors = contentErrors(imported);
    if (errors.length) throw Error(errors.join(" "));
    data = imported;
    render();
    $("#errors").hidden = true;
    status.textContent = "تم فتح الملف في لوحة الإدارة.";
  } catch (error) {
    status.textContent = "تعذّر استيراد الملف. " + error.message;
  } finally {
    event.target.value = "";
  }
});

$("#reset").addEventListener("click", () => {
  if (!confirm("ترجع للمحتوى المنشور وتستبدل المسودة الحالية؟")) return;
  try { localStorage.removeItem(draftKey); } catch {}
  data = structuredClone(published);
  render();
  $("#errors").hidden = true;
  $("#status").textContent = "تم تحميل المحتوى المنشور.";
});
form.addEventListener("submit", event => event.preventDefault());
async function initialize() {
  const response = await fetch(contentPath);
  if (!response.ok) throw Error("تعذّر تحميل الملف.");
  published = await response.json();
  let draft;
  try { draft = JSON.parse(localStorage.getItem(draftKey)); } catch {}
  data = draft && contentErrors(draft).length === 0 ? draft : structuredClone(published);
  if (contentErrors(data).length) throw Error(contentErrors(data).join(" "));
  render();
  ["#preview", "#export", "#copy"].forEach(id => { $(id).disabled = false; });
  $("#reset").hidden = false;
  $("#status").textContent = data === draft ? "تعدّل مسودة محفوظة على هذا الجهاز." : "المحتوى المنشور جاهز للتعديل.";
}
initialize().catch(error => {
  $("#status").textContent = error.message;
});
