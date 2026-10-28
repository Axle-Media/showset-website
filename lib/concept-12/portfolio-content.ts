import type { Block, PageData } from "@/lib/types";
import { safeHref } from "@/lib/safe";
import { caseExperienceFor } from "./case-content";

/**
 * The published case-study pages are the source of truth for the portfolio.
 * The Our Work items are optional ordering/category/caption overrides, NOT
 * a fixed list of cases. A newly published /work/ page appears automatically.
 */
const escapeHTML = (value: string) => String(value).replace(/&/g, "&amp;")
  .replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function portfolioEntries(section: Block, catalog: Record<string, PageData>) {
  const cases = Object.values(catalog).filter(page =>
    /^\/work\/[^/]+\/$/.test(page.route) && page.sections.length > 0);
  const caseByRoute = new Map(cases.map(page => [page.route, page]));
  const curated = section.items
    .filter(item => item.href && caseByRoute.has(item.href))
    .map(item => ({ page: caseByRoute.get(item.href)!, item }));
  const seen = new Set(curated.map(entry => entry.page.route));
  const rest = cases.filter(page => !seen.has(page.route))
    .map(page => ({ page, item: undefined }));
  return [...curated, ...rest].map(({ page, item }) => {
    const detail = caseExperienceFor(page);
    const label = detail.demo ? "Concept study" : (item?.accent?.trim() || "Project");
    return {
      route: page.route,
      title: item?.title?.trim() || page.title,
      description: item?.description?.trim() || page.sections[0]?.body?.trim() || detail.openingBody || "",
      category: item?.category?.trim() || "Selected work",
      label: detail.demo ? "Concept study" : label,
      image: safeHref(detail.openingImage || item?.image || page.sections[0]?.image || ""),
    };
  });
}

/** Render on the server as well as in the Studio, without a JS-only portfolio. */
export function renderPortfolioIndex(
  host: HTMLElement, section: Block, catalog: Record<string, PageData>,
) {
  const index = host.querySelector<HTMLElement>('.view[data-view="work"] [data-work-index]');
  const tools = host.querySelector<HTMLElement>('.view[data-view="work"] [data-work-filters]');
  const more = host.querySelector<HTMLElement>('.view[data-view="work"] [data-work-more]');
  if (!index || !tools || !more) return;
  const projects = portfolioEntries(section, catalog);
  index.innerHTML = projects.map((project, index) => {
    const title = project.title.replace(/[.!?]\s*$/, "");
    const href = safeHref(project.route);
    const src = project.image !== "#" ? project.image : "/media/planning.webp";
    return `<a class="case-index-item work-feature work-portfolio-card${index === 0 ? " work-portfolio-featured" : ""}" href="${escapeHTML(href)}" data-work-category="${escapeHTML(project.category)}" data-work-order="${index}">
<div class="case-index-image"><img src="${escapeHTML(src)}" alt="${escapeHTML(project.title)} portfolio visual" loading="${index === 0 ? "eager" : "lazy"}" decoding="async"/></div>
<div class="case-index-info"><div class="work-feature-top"><span class="work-feature-type">${escapeHTML(project.label)}</span><span class="work-feature-category">${escapeHTML(project.category)}</span><span class="work-feature-arrow" aria-hidden="true">↗</span></div>
<h2>${escapeHTML(title)}<span class="teal-dot">.</span></h2>
<p>${escapeHTML(project.description)}</p><span class="work-feature-discover">Explore the story <span aria-hidden="true">↗</span></span></div></a>`;
  }).join("");
  const categories = [...new Set(projects.map(p => p.category))];
  const showFilters = projects.length >= 6 && categories.length >= 2;
  tools.innerHTML = showFilters
    ? ['All work', ...categories].map((name, i) =>
        `<button type="button" class="work-filter${i === 0 ? " is-current" : ""}" data-work-filter="${escapeHTML(i === 0 ? "all" : name)}" aria-pressed="${i === 0}">${escapeHTML(name)}</button>`).join("")
    : "";
  tools.hidden = !showFilters;
  more.hidden = true; // client reveals only when filtering/pagination is active
  if (projects.length === 0) {
    index.innerHTML = '<p class="work-index-empty">New stories are on their way. In the meantime, tell us what you have in mind.</p>';
  }
}
