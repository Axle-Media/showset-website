import type { PageData, ProjectModule } from "@/lib/types";
import { safeHref } from "@/lib/safe";

/**
 * One case-study composition for SSR, browser navigation and SHOWSET Studio.
 * Copy is inserted as text, and editable media URLs are validated.
 */
export function renderProjectModules(
  host: HTMLElement,
  page: PageData,
  catalog: Record<string, PageData>,
) {
  const body = host.querySelector(".case-detail-body");
  const next = body?.querySelector(".case-detail-next");
  if (!body || !next) return;

  body.querySelector(".case-story-modules")?.remove();
  body.querySelector(".case-next-project")?.remove();
  const modules = page.projectModules || [];
  const doc = host.ownerDocument;

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
  const image = (src: string, alt: string) => {
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

  if (modules.length) {
    const collection = make("div", "case-story-modules");
    collection.setAttribute("aria-label", "Project story");

    modules.forEach((module: ProjectModule, index) => {
      const section = make("section", "case-story-module case-story-" + module.kind);
      section.dataset.moduleId = module.id;
      section.dataset.moduleIndex = String(index);

      if (module.kind === "text") {
        if (module.title) section.append(heading(module.title));
        if (module.body) section.append(paragraphs(module.body));
      } else {
        const hasSrc = !!module.src && safeHref(module.src) !== "#";
        if (hasSrc) {
          const figure = make("figure", "case-story-figure");
          if (module.kind === "image") {
            figure.append(image(module.src!, module.alt || module.title));
          } else if (module.kind === "video") {
            const video = make("video");
            video.src = safeHref(module.src);
            video.controls = true;
            video.preload = "metadata";
            video.playsInline = true;
            video.setAttribute("aria-label", module.alt || module.title || "Project video");
            figure.append(video);
          } else if (module.kind === "comparison" && module.after &&
              safeHref(module.after) !== "#") {
            figure.classList.add("case-story-compare");
            const before = make("div", "case-compare-before");
            const after = make("div", "case-compare-after");
            before.append(image(module.src!, module.alt ? module.alt + " before" : "Before"));
            after.append(image(module.after, module.alt ? module.alt + " after" : "After"));
            const beforeLabel = make("span", "case-compare-label");
            beforeLabel.textContent = "Before";
            const afterLabel = make("span", "case-compare-label");
            afterLabel.textContent = "After";
            before.append(beforeLabel);
            after.append(afterLabel);
            const slider = make("input", "case-compare-slider");
            slider.type = "range";
            slider.min = "0";
            slider.max = "100";
            slider.value = "50";
            slider.setAttribute("aria-label", "Drag to compare before and after");
            figure.append(before, after, slider);
            figure.style.setProperty("--case-split", "50%");
          }
          const note = caption(module.captions);
          if (note) figure.append(note);
          if (figure.querySelector("img,video")) section.append(figure);
        }
        if (module.title || module.body) {
          const description = make("div", "case-story-media-caption");
          if (module.title) description.append(heading(module.title));
          if (module.body) description.append(paragraphs(module.body));
          section.append(description);
        }
      }
      if (section.children.length) collection.append(section);
    });
    next.before(collection);
  }

  const studies = Object.values(catalog).filter(p => p.route.startsWith("/work/"));
  const index = studies.findIndex(p => p.route === page.route);
  if (index >= 0 && studies.length > 1) {
    const following = studies[(index + 1) % studies.length];
    const nextProject = make("a", "case-next-project");
    nextProject.href = safeHref(following.route);
    const photo = following.sections.find(s => s.type === "pagehero")?.image;
    if (photo && safeHref(photo) !== "#") {
      const visual = make("div", "case-next-visual");
      visual.append(image(photo, ""));
      nextProject.append(visual);
    }
    const copy = make("div", "case-next-copy");
    const line = make("p");
    line.textContent = "Next story.";
    const title = make("h2");
    title.textContent = following.sections[0]?.headline || following.title;
    const arrow = make("span", "case-next-arrow");
    arrow.textContent = "↗";
    arrow.setAttribute("aria-hidden", "true");
    copy.append(line, title, arrow);
    nextProject.append(copy);
    next.after(nextProject);
  }
}
