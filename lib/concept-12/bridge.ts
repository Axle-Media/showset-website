import { refineHeadingPeriods } from "./typography";
import { renderImmersiveCase } from "./immersive-case";
import { caseExperienceFor } from "./case-content";
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
  "/work/atmosphere-is-everything/": "case-events",
  "/work/made-to-be-remembered/": "case-identity",
  "/work/behind-every-moment/": "case-production",
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
    if (e.classList.contains("services-panel-heading")) {
      const head = rich(s.headline).replace(/\.$/, "");
      const period = s.headline.endsWith(".") ? '<span class="service-heading-period">.</span>' : "";
      e.innerHTML = '<span>' + head + period + '</span>' +
        (s.accent ? '<span class="accent-text">' + rich(s.accent) + '</span>' : "");
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
        if (changed(s, "image")) image("#hero-photo>img", s.image);
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
        if (changed(s, "items"))
          s.items.forEach((x, i) => {
            const a = host.querySelector(`[data-film-step="${i}"]`);
            if (!a) return;
            if (itemChanged(s, i, "title") || itemChanged(s, i, "accent"))
              a.querySelector("h2")!.innerHTML =
                `<span class="wipe-line"><span>${rich(x.title)}</span></span><span class="wipe-line accent-line"><span>${rich(x.accent || "")}</span></span>`;
            if (itemChanged(s, i, "description"))
              a.querySelector("p")!.textContent = x.description;
            if (itemChanged(s, i, "image"))
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
          if (itemChanged(s, i, "image")) {
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
        if (changed(s, "headline")) html(".dot-words h2", s.headline);
        body(".dot-words>p", s);
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
    const ss = page.sections;
    ss.forEach((s, i) => {
      const selectors = [
        ".category-hero",
        ".category-detail",
        ".category-clusters",
        "#category-feature-title",
        ".category-process",
        ".category-capabilities",
        ".category-banner",
        ".category-more",
      ];
      mark(host.querySelector(selectors[i] || "__none__"), s);
      if (s.type === "pagehero") {
        heading("#category-title", s);
        body("#category-description", s);
        if (changed(s, "image")) image("#category-image", s.image);
        action(".category-inner .solid-link", s);
      } else if (i === 1) {
        heading("#category-belief", s);
        body("#category-belief-copy", s);
      } else if (i === 3) {
        heading("#category-feature-title", s);
        body("#category-feature-copy", s);
      } else if (s.type === "visual") {
        heading(".category-banner h2", s);
        if (changed(s, "image")) image("#category-banner", s.image);
        action(".category-banner .solid-link", s);
      } else if (s.type === "items") {
        heading(
          i === 2 ? ".category-clusters-title h2" : ".category-process>h2",
          s,
        );
        if (i === 2) body(".category-clusters-title>p", s);
        const target = host.querySelector(
          i === 2 ? "#category-clusters" : "#category-process-list",
        );
        if (target && changed(s, "items"))
          target.innerHTML = s.items
            .map(
              (x) =>
                `<article><h3>${rich(x.title)}</h3><p>${rich(x.description)}</p></article>`,
            )
            .join("");
      } else if (s.type === "accordion") {
        heading(".category-capabilities-head h2", s);
        body(".category-capabilities-head>p", s);
        const e = host.querySelector("#category-capabilities-list");
        if (e && changed(s, "items"))
          e.innerHTML = s.items
            .map(
              (x) =>
                `<details><summary>${rich(x.title)}<span aria-hidden="true">+</span></summary><p>${rich(x.description)}</p></details>`,
            )
            .join("");
      }
      if (s.type === "cta") heading(".category-more h2", s);
    });
  } else if (key === "studio") {
    const selectors = [
      ".studio-hero",
      ".studio-copy",
      ".values",
      ".studio-belief",
      ".studio-rhythm",
      ".studio-partnership",
      ".studio-faq",
      ".studio-final",
    ];
    page.sections.forEach((s, i) => {
      const scope = host.querySelector(selectors[i] || "__none__");
      mark(scope, s);
      if (!scope) return;
      const h = scope.querySelector("h1,h2");
      if (h) {
        const id = h.id || `c12-studio-heading-${i}`;
        h.id = id;
        heading("#" + id, s);
      }
      if (s.type === "pagehero" && changed(s, "image"))
        image(".studio-hero .simple-bg img", s.image);
      if (changed(s, "body")) {
        const e = scope.querySelector("p");
        if (e) e.innerHTML = rich(s.body);
      }
      if (changed(s, "items")) {
        const list = scope.matches(".values")
          ? scope
          : scope.querySelector(".rhythm-grid");
        if (list)
          list.innerHTML = s.items
            .map(
              (x, j) =>
                `<article>${scope.matches(".values") ? "<span>0" + (j + 1) + "</span>" : ""}<h3>${rich(x.title)}</h3><p>${rich(x.description)}</p></article>`,
            )
            .join("");
        const faq = scope.querySelector(".studio-faq-list");
        if (faq)
          faq.innerHTML = s.items
            .map(
              (x) =>
                `<details><summary>${rich(x.title)}<span aria-hidden="true">+</span></summary><p>${rich(x.description)}</p></details>`,
            )
            .join("");
      }
      const a = scope.querySelector("a:not(.page-back)");
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
        if (changed(s, "image")) image(".work-hero .simple-bg img", s.image);
      } else if (s.type === "split") {
        mark(host.querySelector(".work-editorial-note"), s);
        heading(".work-intro-title", s);
        body(".work-editorial-note>p", s);
      } else if (s.type === "work") {
        mark(host.querySelector(".work-page-gallery"), s);
        bindWork(s, ".work-page-gallery .case-index-item");
      }
    });
  } else if (key.startsWith("case-")) {
    renderImmersiveCase(host, page, catalog);
  } else if (key === "contact") {
    const s = page.sections[0];
    if (s) {
      mark(host.querySelector(".contact-view"), s);
      heading(".contact-left h1", s);
      body(".contact-left>p", s);
      if (changed(s, "formTitle")) text(".contact-form h2", s.formTitle);
      if (changed(s, "helperText")) text(".form-note", s.helperText);
      action(".contact-form>button", s);
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
      if (itemChanged(s, i, "title")) {
        const heading = card.querySelector("h2,h3");
        if (heading) {
          // Preserve the approved teal period when Studio adds a new card.
          const period = heading.querySelector(".teal-dot");
          heading.textContent = period ? x.title.trim().replace(/\\.$/, "") : x.title;
          if (period) heading.append(period);
        }
      }
      if (itemChanged(s, i, "description")) {
        const e = card.querySelector("p");
        if (e) e.textContent = x.description;
      }
      if (itemChanged(s, i, "image")) {
        const e = card.querySelector<HTMLImageElement>("img");
        if (e) e.src = safeHref(x.image);
      }
      if (itemChanged(s, i, "href")) {
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
  if (!equal(g.header.links, defaultGlobals.header.links)) {
    const nav = host.querySelector(".desktop-navigation");
    nav?.querySelectorAll("a.nav-text").forEach((a) => a.remove());
    g.header.links.slice(1).forEach((x) => {
      const a = document.createElement("a");
      a.className = "nav-text";
      a.textContent = x.label;
      a.href = safeHref(x.href);
      nav?.append(a);
    });
    const button = host.querySelector("#services-button");
    if (button?.firstChild)
      button.firstChild.textContent = g.header.links[0]?.label || "What we do";
  }
  if (!equal(g.header.services, defaultGlobals.header.services)) {
    const panel = host.querySelector("#nav-panel");
    if (panel)
      panel.innerHTML = g.header.services
        .map(
          (x) =>
            `<a href="${escape(safeHref(x.href))}">${rich(x.label)} <b>â†—</b></a>`,
        )
        .join("");
  }
  if (
    !equal(g.header.links, defaultGlobals.header.links) ||
    !equal(g.header.services, defaultGlobals.header.services)
  ) {
    const mobile = host.querySelector("#mobile-panel nav");
    if (mobile)
      mobile.innerHTML = [
        { label: "Home", href: "/" },
        ...g.header.services,
        ...g.header.links.slice(1),
      ]
        .map(
          (x) => `<a href="${escape(safeHref(x.href))}">${rich(x.label)}</a>`,
        )
        .join("");
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
  if (typeof getComputedStyle === "function") refineHeadingPeriods(host);
}
