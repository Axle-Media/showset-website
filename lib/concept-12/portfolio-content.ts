import type { Block, PageData } from "@/lib/types";
import { safeHref } from "@/lib/safe";
import { caseExperienceFor } from "./case-content";

/**
 * Real published /work/ pages, not a curated three-project limit, power this gallery.
 * The older Our Work item list remains a compatible fallback for captions and tags.
 * New case studies sort first by publication date; undated legacy studies retain
 * their original editorial order until dates are assigned in SHOWSET Studio.
 */
const escapeHTML = (value: string) => String(value).replace(/&/g, "&amp;")
  .replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export const workCategoryNames = ["Events", "Creative", "Digital", "Content"] as const;
const aliases: Record<string, string> = {
  "event": "Events", "events": "Events", "events & experiences": "Events",
  "creative": "Creative", "creative & design": "Creative", "design": "Creative",
  "digital": "Digital", "digital & marketing": "Digital", "marketing": "Digital",
  "content": "Content", "production": "Content", "content & production": "Content",
};
function normalizeTag(value: string) {
  const name = value.trim().replace(/\s+/g, " ");
  return aliases[name.toLowerCase()] || name;
}
function uniqueTags(values: string[]) {
  return [...new Set(values.map(normalizeTag).filter(Boolean))];
}
function publicationTime(value?: string) {
  const date = value ? Date.parse(value) : NaN;
  return Number.isFinite(date) ? date : null;
}
export function portfolioEntries(section: Block, catalog: Record<string, PageData>) {
  const cases = Object.values(catalog).filter(page =>
    /^\/work\/[^/]+\/$/.test(page.route) && page.sections.length > 0);
  const caseByRoute = new Map(cases.map(page => [page.route, page]));
  const curated = section.items
    .filter(item => item.href && caseByRoute.has(item.href))
    .map((item, index) => ({ page: caseByRoute.get(item.href || "")!, item, index, legacy: true }));
  const seen = new Set(curated.map(entry => entry.page.route));
  const rest = cases.filter(page => !seen.has(page.route))
    .map((page, index) => ({ page, item: undefined, index, legacy: false }));
  return [...curated, ...rest].map(({ page, item, index, legacy }) => {
    const detail = caseExperienceFor(page);
    const labels = uniqueTags(page.caseExperience?.tags?.length
      ? page.caseExperience.tags
      : item?.category ? [item.category] : []);
    return {
      route: page.route,
      title: item?.title?.trim() || page.title,
      description: item?.description?.trim() || page.sections[0]?.body?.trim() || detail.openingBody || "",
      tags: labels.length ? labels : ["Other"],
      category: labels[0] || "Other",
      label: detail.demo ? "Concept study" : (item?.accent?.trim() || "Project"),
      image: safeHref(detail.openingImage || item?.image || page.sections[0]?.image || ""),
      published: publicationTime(page.publishedAt),
      legacy, index,
    };
  }).sort((a, b) => {
    if (a.published !== null && b.published !== null && a.published !== b.published)
      return b.published - a.published;
    if (a.published !== null && b.published === null) return -1;
    if (b.published !== null && a.published === null) return 1;
    if (a.legacy !== b.legacy) return a.legacy ? 1 : -1;
    return a.legacy ? a.index - b.index : b.index - a.index;
  });
}

/** Render from the same content in the static export and Studio preview. */
export function renderPortfolioIndex(
  host: HTMLElement, section: Block, catalog: Record<string, PageData>,
) {
  const index = host.querySelector<HTMLElement>('.view[data-view="work"] [data-work-index]');
  const tools = host.querySelector<HTMLElement>('.view[data-view="work"] [data-work-filters]');
  const more = host.querySelector<HTMLElement>('.view[data-view="work"] [data-work-more]');
  if (!index || !tools || !more) return;
  const projects = portfolioEntries(section, catalog);
  index.innerHTML = projects.map((project, order) => {
    const title = project.title.replace(/[.!?]\s*$/, "");
    const href = safeHref(project.route);
    const src = project.image !== "#" ? project.image : "/media/planning.webp";
    const tags = project.tags.map(tag => '<span class="work-card-tag">' + escapeHTML(tag) + '</span>').join("");
    return `<a class="case-index-item case-slide work-portfolio-card" href="${escapeHTML(href)}" aria-label="Explore ${escapeHTML(project.label.toLowerCase())}: ${escapeHTML(project.title)}" data-work-category="${escapeHTML(project.category)}" data-work-tags="${escapeHTML(project.tags.join("|"))}" data-work-order="${order}">
<div class="case-photo case-index-image"><img src="${escapeHTML(src)}" alt="${escapeHTML(project.title)} portfolio visual" loading="${order < 3 ? "eager" : "lazy"}" decoding="async"/></div>
<div class="case-story case-index-info"><div class="work-card-meta"><span class="work-feature-type">${escapeHTML(project.label)}</span><span class="work-card-tags">${tags}</span></div>
<h2>${escapeHTML(title)}<span class="teal-dot">.</span></h2>
<p>${escapeHTML(project.description)}</p><span class="case-slide-link work-feature-discover">Explore the study <b aria-hidden="true">↗</b></span></div></a>`;
  }).join("") + (projects.length ? '<p class="work-filter-empty" data-work-empty hidden role="status">Nothing in this category yet. Explore another side of our work.</p>' : '<p class="work-index-empty">New stories are on their way. In the meantime, tell us what you have in mind.</p>');
  const categoryNames = [...workCategoryNames,
    ...new Set(projects.flatMap(p => p.tags).filter(tag => !workCategoryNames.includes(tag as typeof workCategoryNames[number])))];
  tools.innerHTML = projects.length
    ? ['All', ...categoryNames].map((name, i) =>
      `<button type="button" class="work-filter${i === 0 ? " is-current" : ""}" data-work-filter="${escapeHTML(i === 0 ? "all" : name)}" aria-pressed="${i === 0}">${escapeHTML(name)}</button>`).join("")
    : "";
  tools.hidden = projects.length === 0;
  more.hidden = projects.length <= 6;
}
