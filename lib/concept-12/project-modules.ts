import type { PageData, ProjectModule } from "@/lib/types";
import { safeHref } from "@/lib/safe";

/**
 * Case-study storytelling modules. Shared by the server-rendered public page,
 * the browser's route transitions, and the Studio preview.
 * Only safe DOM APIs are used for editable copy and media addresses.
 */
export function renderProjectModules(host: HTMLElement, page: PageData) {
  const body = host.querySelector(".case-detail-body");
  const next = body?.querySelector(".case-detail-next");
  if (!body || !next) return;

  body.querySelector(".case-story-modules")?.remove();
  const modules = page.projectModules || [];
  if (!modules.length) return;

  const doc = host.ownerDocument;
  const collection = doc.createElement("div");
  collection.className = "case-story-modules";
  collection.setAttribute("aria-label", "Project story");

  const make = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string) => {
    const el = doc.createElement(tag);
    if (className) el.className = className;
    return el;
  };
  const heading = (title: string) => {
    const h = make("h2", "case-story-heading");
    h.textContent = title;
    return h;
  };
  const paragraphs = (bodyText?: string) => {
    const wrap = make("div", "case-story-copy");
    (bodyText || "").split(/\n\s*\n/).filter(Boolean).forEach(part => {
      const p = make("p");
      p.textContent = part;
      wrap.append(p);
    });
    return wrap;
  };
  const image = (src?: string, alt = "") => {
    const img = make("img");
    img.src = safeHref(src);
    img.alt = alt;
    img.loading = "lazy";
    img.decoding = "async";
    return img;
  };
  const caption = (value?: string) => {
    if (!value) return null;
    const figcaption = make("figcaption");
    figcaption.textContent = value;
    return figcaption;
  };

  modules.forEach((module: ProjectModule, index) => {
    const section = make("section", "case-story-module case-story-" + module.kind);
    section.dataset.moduleId = module.id;
    if (module.title) section.append(heading(module.title));
    if (module.body) section.append(paragraphs(module.body));

    if (module.kind === "image" && module.src && safeHref(module.src) !== "#") {
      const figure = make("figure", "case-story-figure");
      figure.append(image(module.src, module.alt || module.title));
      const note = caption(module.captions);
      if (note) figure.append(note);
      section.append(figure);
    }
    if (module.kind === "video" && module.src && safeHref(module.src) !== "#") {
      const figure = make("figure", "case-story-figure");
      const video = make("video");
      video.src = safeHref(module.src);
      video.controls = true;
      video.preload = "metadata";
      video.playsInline = true;
      video.setAttribute("aria-label", module.alt || module.title || "Project video");
      figure.append(video);
      const note = caption(module.captions);
      if (note) figure.append(note);
      section.append(figure);
    }
    if (module.kind === "comparison" && module.src && module.after &&
        safeHref(module.src) !== "#" && safeHref(module.after) !== "#") {
      const figure = make("figure", "case-story-comparison");
      const before = make("div");
      const after = make("div");
      before.append(image(module.src, module.alt ? module.alt + " before" : "Before"));
      after.append(image(module.after, module.alt ? module.alt + " after" : "After"));
      const beforeLabel = make("span");
      beforeLabel.textContent = "Before";
      const afterLabel = make("span");
      afterLabel.textContent = "After";
      before.append(beforeLabel);
      after.append(afterLabel);
      figure.append(before, after);
      const note = caption(module.captions);
      if (note) figure.append(note);
      section.append(figure);
    }
    section.dataset.moduleIndex = String(index);
    collection.append(section);
  });
  next.before(collection);
}
