import { applyReplacementMedia } from "./replacement-media";
import {renderServiceExperience} from "./service-experience";
import type {ServiceKind} from "./service-content";
import { refineHeadingPeriods } from "./typography";
import { renderImmersiveCase } from "./immersive-case";
import { caseExperienceFor } from "./case-content";
import { renderPortfolioIndex } from "./portfolio-content";
import type { Block, Globals, PageData } from "@/lib/types";
import { defaultPages, defaultGlobals } from "@/lib/data";
import { safeHref } from "@/lib/safe";

export const routeKeys: Record<string, string> = {
  "/": "home",
  "/events-experiences/": "events",
  "/creative-design/": "creative",
  "/digital-marketing/": "digital",
  "/content-production/": "production",
  "/our-studio/": "studio",
  "/our-work/": "work",
  "/contact/": "contact",
  "/work/the-amaze-ball/": "case-events",
  "/work/made-to-be-remembered/": "case-identity",
  "/work/provault/": "case-production",
  "/services/": "home",
};
/** Preserve approved route keys, while new Studio projects need no route-map edits. */
export const keyForRoute=(route:string):string=>routeKeys[route]||(route.startsWith('/work/')?'case-project-'+route.split('/').filter(Boolean).slice(1).join('-'):'home');
const homeSelectors: Record<string, string> = {
  hero: "#hero-track",
  split: "#discover",
  story: "#film-track",
  services: "#services-track",
  work: "#portfolio-section",
  dot: "#dot-track",
  cta: "#ending",
};
const equal = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
/** Only the editor's supported inline formatting is accepted; no executable HTML. */
function rich(s: string) {
  return escape(s)
    .replace(/&lt;br\s*\/?&gt;/gi, "<br>")
    .replace(/&lt;(\/?)em&gt;/gi, "<$1em>")
    .replace(/&lt;\/?span[^&]*?&gt;/gi, "");
}
function paragraphs(s: string) {
  return s
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((x) => `<p>${rich(x)}</p>`)
    .join("");
}
function plain(s: string) {
  return s.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, "");
}
type Context = {
  catalog: Record<string, PageData>;
  g: Globals;
  editor?: boolean;
  selectedId?: string;
};
export function bindConcept(
  host: HTMLElement,
  key: string,
  { catalog, g, editor }: Context,
) {
  const document = host.ownerDocument;
  const page =
    Object.values(catalog).find(
      (p) => keyForRoute(p.route) === key && p.route !== "/services/",
    ) || catalog.home;
  const seed = defaultPages[page?.slug];
  if (!page) return;
  const changed = (s: Block, k: keyof Block) =>
    !equal(s[k], seed?.sections.find((x) => x.id === s.id)?.[k]);
  const text = (selector: string, value: string) => {
    const e = host.querySelector(selector);
    if (e) e.textContent = plain(value);
  };
  const html = (selector: string, value: string) => {
    const e = host.querySelector(selector);
    if (e) e.innerHTML = rich(value);
  };
  const image = (selector: string, value: string) => {
    const e = host.querySelector<HTMLImageElement>(selector);
    if (e) e.src = safeHref(value);
  };
  const link = (selector: string, label: string, href: string) => {
    const e = host.querySelector<HTMLAnchorElement>(selector);
    if (!e) return;
    const arrow =
      e.lastElementChild?.outerHTML || '<span aria-hidden="true">â†—</span>';
    e.innerHTML = rich(label) + " " + arrow;
    e.href = safeHref(href);
    delete e.dataset.routeKey;
  };
  const heading = (selector: string, s: Block) => {
    if (!changed(s, "headline") && !changed(s, "accent")) return;
    const e = host.querySelector(selector);
    if (!e) return;
    if (e.classList.contains("studio-scroll-heading")) {
      // On photography, preserve the approved two-tone rectangular wipe.
      // The final punctuation is always ivory rather than turquoise.
      const period = s.accent.trimEnd().match(/[.!?]$/)?.[0] || "";
      const accent = period ? s.accent.trimEnd().slice(0, -1) : s.accent;
      e.innerHTML = '<span class="wipe-line"><span>' + rich(s.headline) + '</span></span>' +
        (s.accent ? '<span class="wipe-line accent-line"><span>' + rich(accent) +
        (period ? '<span class="hero-period">' + period + '</span>' : '') +
        '</span></span>' : '');
      return;
    }
    if (e.classList.contains("studio-editorial-heading") || e.classList.contains("work-intro-title") || e.classList.contains("contact-editorial-heading")) {
      // Keep Studio edits in the same two-line typography as the published page.
      // Editorial punctuation stays ivory; only the wording is turquoise.
      const punctuation = s.accent.match(/[.!?]$/)?.[0] || "";
      const accent = punctuation ? s.accent.slice(0, -1) : s.accent;
      e.innerHTML = '<span class="plain-line">' + rich(s.headline) + '</span>' +
        (s.accent ? '<span class="plain-line accent-text">' + rich(accent) +
          (punctuation ? '<span class="service-period">' + punctuation + '</span>' : '') + '</span>' : '');
      return;
    }
    if (e.classList.contains("services-panel-heading")) {
      const head = rich(s.headline).replace(/\.$/, "");
      const period = s.headline.endsWith(".") ? '<span class="service-heading-period">.</span>' : "";
      const accentPunctuation = s.accent.trimEnd().match(/[.!?]$/)?.[0] || "";
      const accentCopy = accentPunctuation ? s.accent.trimEnd().slice(0, -1) : s.accent;
      e.innerHTML = '<span>' + head + period + '</span>' +
        (s.accent ? '<span class="accent-text">' + rich(accentCopy) +
          (accentPunctuation ? '<span class="service-heading-accent-period showset-ending-punctuation">' + accentPunctuation + '</span>' : '') +
          '</span>' : "");
      return;
    }
    if (e.classList.contains("hero-title")) {
      // Preserve the exact two-line photo-backed heading in Studio edits.
      // The accent period remains ivory and is part of the same swipe line.
      const period = s.accent.trimEnd().endsWith(".");
      const accent = period ? s.accent.trimEnd().slice(0, -1) : s.accent;
      e.innerHTML =
        `<span class="line"><span>${rich(s.headline)}</span></span>` +
        (s.accent
          ? `<span class="line hero-accent-phrase"><span>${rich(accent)}${period ? '<span class="hero-period">.</span>' : ""}</span></span>`
          : "");
      return;
    }
    if (
      !e.classList.contains("hero-title") &&
      !e.classList.contains("plain-heading") &&
      !e.classList.contains("block-heading") &&
      !e.classList.contains("wipe-heading")
    ) {
      e.innerHTML =
        rich(s.headline) +
        (s.accent ? "<br><em>" + rich(s.accent) + "</em>" : "");
      return;
    }
    const line = e.classList.contains("hero-title")
      ? "line"
      : e.classList.contains("plain-heading")
        ? "plain-line"
        : "wipe-line";
    const lines = s.headline.split(/<br\s*\/?>/i);
    e.innerHTML =
      lines
        .map((x) => `<span class="${line}"><span>${rich(x)}</span></span>`)
        .join("") +
      (s.accent
        ? `<span class="${line} accent-line accent-text"><span>${rich(s.accent)}</span></span>`
        : "");
  };
  const body = (selector: string, s: Block) => {
    if (changed(s, "body")) html(selector, s.body);
  };
  const action = (selector: string, s: Block, secondary = false) => {
    const label = secondary ? "secondaryLabel" : "buttonLabel",
      href = secondary ? "secondaryHref" : "buttonHref";
    if (changed(s, label) || changed(s, href))
      link(selector, s[label], s[href]);
  };
  const mark = (node: Element | null, s: Block) => {
    if (!node) return;
    node.setAttribute("data-section", s.id);
    node.classList.toggle("ss-editable-section", !!editor);
    const e = node as HTMLElement,
      d = s.design || {};
    e.dataset.scene = d.motionPreset || "cinematic";
    e.classList.toggle("c12-reveal-off", changed(s, "reveal") && !s.reveal);
    if (d.spaceTop != null) e.style.paddingTop = d.spaceTop + "px";
    if (d.spaceBottom != null) e.style.paddingBottom = d.spaceBottom + "px";
    if (d.headingSize != null) {
      e.style.setProperty("--c12-heading", d.headingSize + "px");
      e.classList.add("c12-custom-heading");
    }
    if (d.mobileHeadingSize != null) {
      e.style.setProperty("--c12-mobile-heading", d.mobileHeadingSize + "px");
      e.classList.add("c12-mobile-heading");
    }
    if (d.bodySize != null) {
      e.style.setProperty("--c12-body", d.bodySize + "px");
      e.classList.add("c12-custom-body");
    }
    if (d.radius != null)
      node
        .querySelectorAll<HTMLElement>(
          ".hero-photo,.case-viewport,.editorial-image",
        )
        .forEach((x) => (x.style.borderRadius = d.radius + "px"));
    if (d.imagePosition || d.mobileImagePosition) {
      e.style.setProperty("--c12-crop", d.imagePosition || "center");
      e.style.setProperty(
        "--c12-mobile-crop",
        d.mobileImagePosition || d.imagePosition || "center",
      );
      e.classList.add("c12-custom-crop");
    }
    if (changed(s, "pattern") && !s.pattern)
      node
        .querySelectorAll<HTMLElement>(".hero-graphic")
        .forEach((x) => (x.style.display = "none"));
  };
  const itemChanged = (s: Block, i: number, k: string) =>
    !equal(
      (s.items[i] as unknown as Record<string, unknown>)?.[k],
      (
        seed?.sections.find((x) => x.id === s.id)?.items[
          i
        ] as unknown as Record<string, unknown>
      )?.[k],
    );
  function repeat(selector: string, count: number, attribute?: string) {
    const nodes = [...host.querySelectorAll<HTMLElement>(selector)],
      template = nodes[0];
    if (!template) return;
    if (nodes.length < count) {
      for (let i = nodes.length; i < count; i++) {
        const clone = template.cloneNode(true) as HTMLElement;
        if (attribute) clone.setAttribute(attribute, String(i));
        clone.classList.remove("is-on", "is-active");
        template.parentElement?.append(clone);
      }
    }
    nodes.slice(count).forEach((e) => e.remove());
  }
  if (key === "home") {
    for (const s of page.sections) {
      mark(host.querySelector(homeSelectors[s.type] || "" || "__none__"), s);
      if (s.type === "hero") {
        heading(".hero-title", s);
        body("#hero-foreground>p", s);
        image("#hero-photo img", s.image);
        action(".hero-links .solid-link", s);
        action(".hero-links .text-arrow-link", s, true);
        action(".hero-second-links .solid-link", s);
        action(".hero-second-links .text-arrow-link", s, true);
        if (changed(s, "items") && s.items[0]) {
          const x = s.items[0];
          host.querySelector("#hero-second h2")!.innerHTML =
            `<span class="wipe-line"><span>${rich(x.title)}</span></span><span class="wipe-line accent-line"><span>${rich(x.accent || "")}</span></span>`;
          text(".hero-second-copy", x.description);
        }
      } else if (s.type === "split") {
        heading("#discover h2", s);
        body(".manifesto-copy>p", s);
        action(".manifesto-heading-group .understated-link", s);
      } else if (s.type === "story") {
        if (changed(s, "items")) {
          repeat("[data-film-step]", s.items.length, "data-film-step");
          repeat("[data-film-image]", s.items.length, "data-film-image");
        }
        s.items.forEach((x, i) => {
            const a = host.querySelector(`[data-film-step="${i}"]`);
            if (!a) return;
            if (itemChanged(s, i, "title") || itemChanged(s, i, "accent"))
              a.querySelector("h2")!.innerHTML =
                `<span class="wipe-line"><span>${rich(x.title)}</span></span><span class="wipe-line accent-line"><span>${rich(x.accent || "")}</span></span>`;
            if (itemChanged(s, i, "description"))
              a.querySelector("p")!.textContent = x.description;
            image(`[data-film-image="${i}"] img`, x.image || "");
          });
      } else if (s.type === "services") {
        if (changed(s, "items")) {
          repeat("[data-service]", s.items.length, "data-service");
          repeat(
            "[data-service-visual]",
            s.items.length,
            "data-service-visual",
          );
        }
        heading(".services-panel-heading", s);
        body(".services-stage-intro>p", s);
        s.items.forEach((x, i) => {
          if (itemChanged(s, i, "title"))
            text(`[data-service="${i}"] .discipline-name`, x.title);
          if (itemChanged(s, i, "href")) {
            const a = host.querySelector<HTMLAnchorElement>(
              `[data-service="${i}"]`,
            );
            if (a) {
              a.href = safeHref(x.href);
              delete a.dataset.routeKey;
            }
          }
          if (itemChanged(s, i, "image") || x.image?.startsWith("/media/showset/")) {
            const visual = host.querySelector(`[data-service-visual="${i}"]`);
            if (visual && !visual.querySelector("img")) {
              const img = document.createElement("img");
              img.alt = "";
              visual.replaceChildren(img);
              visual.classList.remove("service-digital");
            }
            image(`[data-service-visual="${i}"] img`, x.image || "");
          }
        });
      } else if (s.type === "work") {
        heading(".portfolio-heading h2", s);
        body(".portfolio-intro>p", s);
        bindWork(s, "#case-rail > [data-case-slide]");
      } else if (s.type === "dot") {
        if (changed(s, "headline")) {
          // The clipped inverted copy must match the visible source when Studio edits it.
          html(".dot-stage > .dot-words h2", s.headline);
          html(".dot-colour-reveal .dot-words h2", s.headline);
        }
        body(".dot-stage > .dot-words>p", s);
        body(".dot-colour-reveal .dot-words>p", s);
      } else if (s.type === "cta") {
        heading("#ending h2", s);
        body(".end-bottom>p", s);
        action(".end-link", s);
      }
    }
    // The original order is untouched for defaults. Explicit saved Studio order remains usable.
    if (
      seed &&
      !equal(
        page.sections.map((s) => s.id),
        seed.sections.map((s) => s.id),
      )
    ) {
      const v = host.querySelector('[data-view="home"]');
      page.sections.forEach((s) => {
        const node = host.querySelector(homeSelectors[s.type] || "__none__");
        if (v && node) v.append(node);
      });
    }
  } else if (["events", "creative", "digital", "production"].includes(key)) {
    renderServiceExperience(host,page,key as ServiceKind,catalog,mark);
  } else if (key === "studio") {
    // Stable IDs keep older published Studio records from shifting the page
    // composition if they still contain archived FAQ/process sections.
    const scopes: Record<string, string> = {
      "section-1": ".studio-hero",
      "section-2": ".studio-manifesto",
      "section-3": ".studio-exploration",
      "section-5": ".studio-outlook",
      "section-7": ".studio-final",
    };
    page.sections.forEach((s, i) => {
      const scope = host.querySelector<HTMLElement>(scopes[s.id] || "__none__");
      mark(scope, s);
      if (!scope) return;
      const h = scope.querySelector("h1,h2");
      if (h) {
        const id = h.id || `c12-studio-heading-${i}`;
        h.id = id;
        heading("#" + id, s);
      }
      if (s.type === "pagehero")
        image(".studio-hero .studio-hero-photo img", s.image);
      if (s.type === "pagehero" && changed(s, "items") && s.items[0]) {
        const second = scope.querySelector<HTMLElement>("[data-studio-hero-follow]");
        const follow = s.items[0];
        if (second) {
          const subtitle = second.querySelector("h2");
          const copy = second.querySelector("p");
          if (subtitle) {
            const period = (follow.accent || "").trimEnd().match(/[.!?]$/)?.[0] || "";
            const accent = period ? (follow.accent || "").trimEnd().slice(0, -1) : (follow.accent || "");
            subtitle.innerHTML = '<span class="wipe-line"><span>' + rich(follow.title) + '</span></span>' +
              (follow.accent ? '<span class="wipe-line accent-line"><span>' + rich(accent) +
              (period ? '<span class="hero-period">' + period + '</span>' : '') + '</span></span>' : '');
          }
          if (copy) copy.textContent = plain(follow.description);
        }
      }
      if (changed(s, "body")) {
        const content = scope.querySelector<HTMLElement>(
          scope.matches(".studio-manifesto") ? ".studio-manifesto-body" :
          scope.matches(".studio-outlook") ? ".studio-partnership-body" :
          scope.matches(".studio-final") ? ".studio-final-copy" :
          scope.matches(".studio-exploration") ? ".studio-exploration-intro>p" :
          ".studio-hero-scene-first>p"
        );
        if (content) {
          content.innerHTML = scope.matches(".studio-manifesto,.studio-outlook,.studio-final")
            ? paragraphs(s.body) : rich(s.body);
        }
      }
      if (scope.matches(".studio-exploration") && (changed(s, "items") || s.items.some(item => item.image?.startsWith("/media/showset/")))) {
        const journey = scope.querySelector<HTMLElement>("[data-studio-storyboard]");
        if (journey) {
          journey.innerHTML = s.items.map((item, index) =>
            `<article class="studio-storyboard-chapter"><figure class="studio-storyboard-shot" data-studio-shot="${index}"><img src="${escape(safeHref(item.image || "/media/planning.webp"))}" alt="${escape(item.title)} at SHOWSET" loading="lazy" decoding="async"></figure><div class="studio-storyboard-copy"><h3>${rich(item.title)}</h3><p>${rich(item.description)}</p></div></article>`
          ).join("");
        }
      }
      const a = scope.querySelector<HTMLAnchorElement>("a.editorial-action");
      if (a) {
        const id = a.id || `c12-studio-action-${i}`;
        a.id = id;
        action("#" + id, s);
      }
    });
  } else if (key === "work") {
    page.sections.forEach((s) => {
      if (s.type === "pagehero") {
        mark(host.querySelector(".work-hero"), s);
        heading(".work-hero h1", s);
        body(".work-hero .simple-hero-content>p", s);
        image(".work-hero .simple-bg img", s.image);
      } else if (s.type === "split") {
        mark(host.querySelector(".work-page-intro"), s);
        heading(".work-intro-title", s);
        if (changed(s, "body")) {
          const copy = host.querySelector<HTMLElement>(".work-intro-copy");
          if (copy) copy.innerHTML = paragraphs(s.body);
        }
      } else if (s.type === "work") {
        mark(host.querySelector(".work-page-gallery"), s);
        // Our Work starts at the filters; the obsolete editorial header was removed.
        renderPortfolioIndex(host, s, catalog);
      } else if (s.type === "cta") {
        mark(host.querySelector(".work-final"), s);
        heading(".work-final h2", s);
        body(".work-final-copy", s);
        action(".work-final .editorial-action", s);
      }
    });
  } else if (key.startsWith("case-")) {
    renderImmersiveCase(host, page, catalog);
  } else if (key === "contact") {
    const s = page.sections[0];
    if (s) {
      mark(host.querySelector(".contact-view"), s);
      heading(".contact-left h1", s);
      body(".contact-intro>p", s);
      if (changed(s, "image")) image(".contact-photo img", s.image);
      if (changed(s, "formTitle")) text(".contact-form h2", s.formTitle);
      if (changed(s, "helperText")) text(".form-note", s.helperText);
      if (changed(s, "buttonLabel")) {
        const button = host.querySelector<HTMLButtonElement>(".contact-submit");
        if (button) button.innerHTML = rich(s.buttonLabel) + ' <span aria-hidden="true">↗</span>';
      }
      if (changed(s, "items")) {
        const select = host.querySelector<HTMLSelectElement>("#project-type"),
          panel = host.querySelector("#project-options");
        if (
          select &&
          panel &&
          !equal(
            [...select.options].slice(1).map((x) => x.text),
            s.items.map((x) => x.title),
          )
        ) {
          const placeholder =
            select.options[0]?.text || "Choose the closest fit";
          select.innerHTML =
            `<option value="">${escape(placeholder)}</option>` +
            s.items.map((x) => `<option>${escape(x.title)}</option>`).join("");
          panel.innerHTML = s.items
            .map(
              (x) =>
                `<button type="button" role="option" aria-selected="false" tabindex="-1" class="select-option" data-value="${escape(x.title)}">${escape(x.title)}</button>`,
            )
            .join("");
        }
      }
    }
  }
  function bindWork(s: Block, selector: string) {
    if (changed(s, "items"))
      repeat(
        selector,
        s.items.length,
        selector.includes("data-case-slide") ? "data-case-slide" : undefined,
      );
    host.querySelectorAll(selector).forEach((card, i) => {
      const x = s.items[i];
      if (!x) return;
      if (itemChanged(s, i, "title") || x.href?.startsWith("/work/")) {
        const heading = card.querySelector("h2,h3");
        if (heading) {
          // Preserve the approved teal period when Studio adds a new card.
          const period = heading.querySelector(".teal-dot");
          heading.textContent = period ? x.title.trim().replace(/\\.$/, "") : x.title;
          if (period) heading.append(period);
        }
      }
      if (itemChanged(s, i, "description") || x.href?.startsWith("/work/")) {
        const e = card.querySelector("p");
        if (e) e.textContent = x.description;
      }
      if (itemChanged(s, i, "image") || x.href?.startsWith("/work/")) {
        const e = card.querySelector<HTMLImageElement>("img");
        if (e) e.src = safeHref(x.image);
      }
      if (itemChanged(s, i, "href") || x.href?.startsWith("/work/")) {
        const e = card.matches("a")
          ? (card as HTMLAnchorElement)
          : card.querySelector<HTMLAnchorElement>("a");
        if (e) {
          e.href = safeHref(x.href);
          delete e.dataset.routeKey;
        }
      }

      // Featured project photography comes from the case study itself, not
      // a second, potentially stale copy in homepage or Our Work content.
      // The matching project controls its hero image on both index pages.
      const linkedRoute = card.matches("a")
        ? (card as HTMLAnchorElement).getAttribute("href")
        : card.querySelector<HTMLAnchorElement>("a")?.getAttribute("href");
      const project = Object.values(catalog).find((p) =>
        p.route.startsWith("/work/") &&
        (p.route === linkedRoute || p.route === x.href)
      );
      if (project) {
        // Newly repeated homepage cards retain a project-specific accessible label.
        const projectLink = card.matches("a")
          ? (card as HTMLAnchorElement)
          : card.querySelector<HTMLAnchorElement>("a");
        if (projectLink?.hasAttribute("aria-label"))
          projectLink.setAttribute("aria-label", "Explore creative study: " + project.title);
        const featured = safeHref(caseExperienceFor(project).openingImage);
        const photo = card.querySelector<HTMLImageElement>("img");
        if (photo && featured !== "#") {
          photo.setAttribute("src", featured);
          photo.alt = project.title + " project featured photograph";
        }
      }
    });
  }
  // Shared global controls apply only explicit edits; untouched defaults preserve upstream CSS/DOM.
  const themeMap: Record<string, string> = {
    navy: "--navy",
    navyDark: "--deep",
    blue: "--navy2",
    teal: "--teal",
    sand: "--sand",
    white: "--ice",
    fontHeading: "--display",
    fontBody: "--body-font",
  };
  Object.entries(themeMap).forEach(([k, v]) => {
    const field = k as keyof Globals["theme"];
    if (!equal(g.theme[field], defaultGlobals.theme[field]))
      host.style.setProperty(v, String(g.theme[field]));
  });
  const styleIfEdited = (
    field: keyof Globals["theme"],
    selector: string,
    property: string,
  ) => {
    if (!equal(g.theme[field], defaultGlobals.theme[field]))
      host
        .querySelectorAll<HTMLElement>(selector)
        .forEach((e) => e.style.setProperty(property, String(g.theme[field]), "important"));
  };
  styleIfEdited("headingTracking", "h1,h2,h3", "letter-spacing");
  styleIfEdited("bodyTracking", "p", "letter-spacing");
  styleIfEdited("headingLeading", "h1,h2,h3", "line-height");
  styleIfEdited("bodyLeading", "p", "line-height");
  if (g.theme.fontBody !== defaultGlobals.theme.fontBody)
    host.style.fontFamily = g.theme.fontBody;
  if (g.theme.radius !== defaultGlobals.theme.radius)
    host
      .querySelectorAll<HTMLElement>(
        ".hero-photo,.case-viewport,.case-index-image,.contact-form",
      )
      .forEach((e) => (e.style.borderRadius = g.theme.radius + "px"));
  if (g.theme.buttonHeight !== defaultGlobals.theme.buttonHeight)
    host
      .querySelectorAll<HTMLElement>(".solid-link,.header-cta")
      .forEach((e) => (e.style.minHeight = g.theme.buttonHeight + "px"));
  if (g.theme.sectionSpace !== defaultGlobals.theme.sectionSpace)
    host
      .querySelectorAll<HTMLElement>(
        ".section-gutter:not(.hero-track):not(.film-track):not(.services-track):not(.dot-track)",
      )
      .forEach((e) => {
        e.style.paddingTop = g.theme.sectionSpace + "px";
        e.style.paddingBottom = g.theme.sectionSpace + "px";
      });
  if (g.theme.patternOpacity !== defaultGlobals.theme.patternOpacity)
    host
      .querySelectorAll<HTMLElement>(".hero-graphic")
      .forEach((e) => (e.style.opacity = String(g.theme.patternOpacity)));
  // Use approved artwork by default; Studio can still supply a replacement logo.
  host.querySelectorAll(".brand").forEach((e) => {
    const logo = g.brand.logo || "/brand/approved-wordmark.png";
    e.innerHTML = `<img class="approved-wordmark" src="${escape(safeHref(logo))}" alt="${escape(g.brand.wordmark)} — ${escape(g.brand.tagline)}" width="962" height="250">`;
  });
  if (g.theme.patternOpacity !== defaultGlobals.theme.patternOpacity)
    host.style.setProperty("--refine-pattern-opacity", String(g.theme.patternOpacity));
  // Both previous saved defaults and new Studio edits retain the intentional footer break.
  const footerDescription = (g.footer.description ?? defaultGlobals.footer.description)
    .replace(/\n/g, "<br>")
    .replace("We make it happen. We make it feel like something.",
      "We make it happen.<br>We make it feel like something.");
  html(".footer-identity>p", footerDescription);
  const footer = { email:"",phone:"",location:"", ...defaultGlobals.footer.contact, ...g.footer.contact };
  if (footer) {
    const email = host.querySelector<HTMLAnchorElement>("[data-footer-email]");
    const phone = host.querySelector<HTMLAnchorElement>("[data-footer-phone]");
    const location = host.querySelector<HTMLElement>("[data-footer-location]");
    if (email) {
      email.textContent = footer.email;
      email.href = safeHref("mailto:" + footer.email);
    }
    if (phone) {
      phone.textContent = footer.phone;
      phone.href = "tel:" + footer.phone.replace(/[^+\d]/g, "");
    }
    if (location) location.textContent = footer.location;
    const directEmail = host.querySelector<HTMLAnchorElement>("[data-contact-email]");
    const directPhone = host.querySelector<HTMLAnchorElement>("[data-contact-phone]");
    if (directEmail) {
      directEmail.href = safeHref("mailto:" + footer.email);
      const arrow = directEmail.querySelector("span")?.outerHTML || "";
      directEmail.innerHTML = escape(footer.email) + " " + arrow;
    }
    if (directPhone) {
      directPhone.href = "tel:" + footer.phone.replace(/[^+\d]/g, "");
      const arrow = directPhone.querySelector("span")?.outerHTML || "";
      directPhone.innerHTML = escape(footer.phone) + " " + arrow;
    }
    const whatsapp = host.querySelector<HTMLAnchorElement>("[data-contact-whatsapp]");
    if (whatsapp) {
      // One phone source of truth for the contact links and WhatsApp shortcut.
      const digits = footer.phone.replace(/[^\d]/g, "");
      const international = digits.startsWith("0") ? "27" + digits.slice(1) : digits;
      if (/^\d{9,15}$/.test(international)) {
        whatsapp.href = "https://wa.me/" + international;
        whatsapp.removeAttribute("aria-disabled");
      } else {
        whatsapp.removeAttribute("href");
        whatsapp.setAttribute("aria-disabled", "true");
      }
    }
  }
  // Social destinations are optional and stay disabled until the owner enters
  // confirmed official profile URLs in Studio. Never generate generic links.
  const socials = { facebook: "", instagram: "", linkedin: "",
    ...defaultGlobals.footer.socials, ...g.footer.socials };
  (["facebook", "instagram", "linkedin"] as const).forEach((name) => {
    const link = host.querySelector<HTMLAnchorElement>(
      `[data-footer-social="${name}"]`,
    );
    if (!link) return;
    const url = safeHref(socials[name]?.trim());
    if (url !== "#" && url.startsWith("https://")) {
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.removeAttribute("aria-disabled");
    } else {
      link.removeAttribute("href");
      link.removeAttribute("target");
      link.removeAttribute("rel");
      link.setAttribute("aria-disabled", "true");
    }
  });
  // Replace the legacy back-to-top link in every public/Studio footer, including SSR.
  // Do this after static markup binding so the legal links survive client hydration.
  const footerBottom = host.querySelector<HTMLElement>(".footer-bottom");
  const obsoleteBackToTop = footerBottom?.querySelector<HTMLAnchorElement>('a[href="#home"]');
  if (obsoleteBackToTop) {
    const legalLinks = document.createElement("nav");
    legalLinks.className = "footer-legal-links";
    legalLinks.setAttribute("aria-label", "Legal");
    for (const [label, href] of [
      ["Privacy & Policy", "/privacy-policy/"],
      ["Terms & Conditions", "/terms-and-conditions/"],
    ]) {
      const link = document.createElement("a");
      link.textContent = label;
      link.href = href;
      legalLinks.appendChild(link);
    }
    obsoleteBackToTop.replaceWith(legalLinks);
  }
  const signoff = host.querySelector<HTMLElement>(".footer-signoff");
  if (signoff) signoff.textContent = g.footer.signoff ?? defaultGlobals.footer.signoff ?? "Made by Showset.";
  if (g.footer.copyright !== defaultGlobals.footer.copyright) {
    const e = host.querySelector(".footer-bottom>span");
    if (e)
      e.innerHTML =
        'Â© <span id="year">' +
        new Date().getFullYear() +
        "</span> " +
        rich(g.footer.copyright);
  }
  // Keep service links editable through Studio globals, but present them in
  // one branded "What We Do" menu rather than six crowded top-level links.
  const services = g.header.services.length ? g.header.services : defaultGlobals.header.services;
  // Contact is a first-class menu link again, in addition to the CTA.
  // Older Studio-saved globals may lack it, so guarantee one copy here.
  const standardLinks = g.header.links.filter(
    item => item.label.trim().toLowerCase() !== "what we do" &&
      item.label.trim().toLowerCase() !== "contact" &&
      safeHref(item.href) !== "/contact/" &&
      !services.some(service => safeHref(service.href) === safeHref(item.href)),
  );
  const contactLink = g.header.links.find(
    item => item.label.trim().toLowerCase() === "contact" ||
      safeHref(item.href) === "/contact/",
  ) || { label: "Contact", href: "/contact/" };
  const others = [...standardLinks, contactLink];
  const serviceActive = services.some(item => routeKeys[safeHref(item.href)] === key);
  const active = (href: string) => routeKeys[safeHref(href)] === key;
  const current = (href: string) => active(href) ? ' aria-current="page"' : "";
  const itemLink = (item: {label:string;href:string}, isMobile=false) => {
    const href = safeHref(item.href);
    const route = routeKeys[href] || "";
    return '<a class="' + (isMobile ? 'mobile-nav-link' : 'nav-text') +
      (active(href) ? ' active' : '') + '" href="' + escape(href) +
      '" data-route-key="' + escape(route) + '"' + current(href) + '>' +
      escape(plain(item.label)) + '</a>';
  };
  const serviceLinks = services.map(item => {
    const href = safeHref(item.href);
    return '<a class="nav-service-link' + (active(href) ? ' active' : '') +
      '" href="' + escape(href) + '" data-route-key="' +
      escape(routeKeys[href] || '') + '"' + current(href) + '>' +
      '<span>' + escape(plain(item.label)) + '</span><span aria-hidden="true">↗</span></a>';
  }).join("");
  const chevron = '<svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">' +
    '<path d="m2.5 4.5 3.5 3.5 3.5-3.5" /></svg>';
  const nav = host.querySelector<HTMLElement>(".desktop-navigation");
  if (nav) {
    nav.innerHTML = '<div class="nav-dropdown" id="nav-dropdown">' +
      '<button class="nav-text dropdown-button' + (serviceActive ? ' active' : '') +
      '" id="services-button" type="button" aria-controls="nav-panel" aria-expanded="false">' +
      'What We Do ' + chevron + '</button>' +
      '<div class="nav-panel" id="nav-panel"><nav aria-label="Our services">' +
      serviceLinks + '</nav></div></div>' +
      others.map(item => itemLink(item)).join("");
  }
  const mobile = host.querySelector<HTMLElement>("#mobile-panel nav");
  if (mobile) {
    // Phones and tablets show every service as a direct, always-visible link.
    // Active-page styling comes from itemLink (aria-current + .active).
    mobile.innerHTML = [
      itemLink({label:"Home",href:"/"},true),
      ...services.map(item => itemLink(item,true)),
      ...others.map(item => itemLink(item,true)),
    ].join("");
  }
  if (!equal(g.footer.links, defaultGlobals.footer.links)) {
    const group = host.querySelector(".footer-links>div");
    if (group)
      group.innerHTML =
        "<span>DISCOVER</span>" +
        g.footer.links
          .map(
            (x) => `<a href="${escape(safeHref(x.href))}">${rich(x.label)}</a>`,
          )
          .join("");
  }
  if (
    g.header.buttonLabel !== defaultGlobals.header.buttonLabel ||
    g.header.buttonHref !== defaultGlobals.header.buttonHref
  )
    link(".header-cta", g.header.buttonLabel, g.header.buttonHref);
  applyReplacementMedia(host, key);
  refineHeadingPeriods(host);
}
