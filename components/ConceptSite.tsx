"use client";
import { usePathname } from "next/navigation";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Globals, PageData } from "@/lib/types";
import { apiEndpoint, defaultPages } from "@/lib/data";
import markup from "@/lib/concept-12/markup.json";
import { mountConcept } from "@/lib/concept-12/runtime";
import { bindConcept, routeKeys } from "@/lib/concept-12/bridge";
import { conceptMetadata } from "@/lib/concept-12/metadata";
import { patchConcept } from "@/lib/concept-12/patch";
import { safeHref } from "@/lib/safe";
import { compatiblePages, compatibleGlobals } from "@/lib/concept-12/compat";
type LayoutProps = {
  page: PageData;
  g: Globals;
  catalog?: Record<string, PageData>;
  initialMarkup?: string;
  editor?: boolean;
  onSelect?: (id: string) => void;
  selectedId?: string;
};
/** Public site and Studio mount the same original Concept 12 DOM and runtime. */
export function SiteLayout({
  page,
  g,
  catalog = defaultPages,
  initialMarkup,
  editor,
  onSelect,
  selectedId,
}: LayoutProps) {
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null),
    select = useRef(onSelect),
    lastRoute = useRef(page.route);
  select.current = onSelect;
  const latest = useRef({page,g,catalog,editor,reduced:false});
  const engine = useRef<ReturnType<typeof mountConcept> | null>(null);
  const rendered = useRef<unknown>(null);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion:reduce)");
    const sync = () => setReduced(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);
  latest.current = {page,g,catalog,editor,reduced};
  function optionsFor(context: typeof latest.current) {
    const {page,g,catalog,editor,reduced}=context;
    return {
      route: routeKeys[page.route] || "home",
      getMetadata: (key: string) => {
        const pages = { ...catalog, [page.slug]: page };
        const entry = Object.values(pages).find(p => routeKeys[p.route] === key && p.route === location.pathname)
          || Object.values(pages).find(p => routeKeys[p.route] === key);
        return entry ? conceptMetadata(entry) : undefined;
      },
      editor: !!editor,
      staticMotion: !g.motion.enabled || reduced || !!editor,
      heroScale: Math.max(1, Math.min(3, g.motion.heroScale)),
      storyParallax: Math.max(0, Math.min(3, g.motion.storyParallax)),
      carouselSeconds: (() => {
        const work = (catalog.home || page).sections.find(
            (x) => x.type === "work",
          ),
          seed = defaultPages.home.sections.find((x) => x.type === "work");
        return work && work.speed !== seed?.speed
          ? work.speed
          : g.motion.carouselSeconds;
      })(),
      heroRadius:
        (catalog.home || page).sections.find((x) => x.type === "hero")?.design
          ?.radius ?? (g.theme.radius !== 20 ? g.theme.radius : undefined),
      stillScenes: (catalog.home || page).sections
        .filter((x) => x.design?.motionPreset === "still")
        .map((x) => x.type),
      filmCount:
        (catalog.home || page).sections.find((x) => x.type === "story")?.items
          .length || 3,
      serviceCount:
        (catalog.home || page).sections.find((x) => x.type === "services")
          ?.items.length ?? 4,
      serviceOverrides: (catalog.home || page).sections
        .find((x) => x.type === "services")
        ?.items.map((item, i) => {
          const seed = defaultPages.home.sections.find(
            (x) => x.type === "services",
          )?.items[i];
          return {
            title: item.title,
            description:
              item.description !== seed?.description
                ? item.description
                : undefined,
            href: item.href !== seed?.href ? safeHref(item.href) : undefined,
          };
        }),
      bind: (element: HTMLElement, key: string) =>
        bindConcept(element, key, {
          catalog: { ...catalog, [page.slug]: page },
          g,
          editor,
        }),
      configure: (data: Record<string, { preview: string }>) => {
        const home = catalog.home || page,
          s = home.sections.find((x) => x.type === "services"),
          seed = defaultPages.home.sections.find((x) => x.type === "services");
        s?.items.forEach((item, i) => {
          const key = ["events", "creative", "digital", "production"][i];
          if (data[key] && item.description !== seed?.items[i]?.description)
            data[key].preview = item.description;
        });
      },
    };
  }
  useLayoutEffect(() => {
    const host = root.current;
    if (!host) return;
    const y = lastRoute.current === page.route ? scrollY : 0;
    lastRoute.current = page.route;
    // React owns the host; the upstream engine exclusively owns its descendants.
    // Keep the server-rendered route as a recovery snapshot. A client-side
    // animation error must not replace a complete page with hidden views.
    const serverMarkup = initialMarkup || host.innerHTML;
    let dispose: ReturnType<typeof mountConcept> | null = null;
    try {
      host.innerHTML = markup;
      bindConcept(host, "home", {
        catalog: { ...catalog, [page.slug]: page },
        g,
        editor,
      });
      if (routeKeys[page.route] && routeKeys[page.route] !== "home")
        bindConcept(host, routeKeys[page.route], {
          catalog: { ...catalog, [page.slug]: page },
          g,
          editor,
        });
      dispose = mountConcept(host, optionsFor(latest.current));
    } catch (error) {
      console.error("SHOWSET interactive page failed; restoring static content", error);
      host.innerHTML = serverMarkup;
      host.dataset.caseMotion = "off";
      host.querySelector("#route-curtain")?.remove();
      // SSR already selects the active view. If the initial markup is not
      // available, select it explicitly so the page remains readable.
      if (!initialMarkup) {
        const key = routeKeys[page.route] || "home";
        const name = key.startsWith("case-") ? "case-study"
          : ["events", "creative", "digital", "production"].includes(key) ? "service" : key;
        host.querySelectorAll<HTMLElement>(".view").forEach(view => {
          const active = view.dataset.view === name;
          view.classList.toggle("is-current", active);
          view.toggleAttribute("hidden", !active);
        });
      }
    }
    engine.current=dispose;
    rendered.current=latest.current;
    const choose = (event: MouseEvent) => {
      if (!latest.current.editor) return;
      const e = (event.target as Element).closest<HTMLElement>(
        "[data-section]",
      );
      if (e) {
        event.preventDefault();
        select.current?.(e.dataset.section!);
      }
    };
    host.addEventListener("click", choose, true);
    if (y > 0) scrollTo({ top: y, behavior: "instant" });
    return () => {
      host.removeEventListener("click", choose, true);
      dispose?.();
      engine.current=null;
    };
  }, [page.route]);
  useLayoutEffect(() => {
    const host=root.current;
    if (!host || !engine.current || rendered.current===latest.current) return;
    const context=latest.current;
    patchConcept(host, host.dataset.conceptRoute || routeKeys[page.route] || "home", {catalog:{...catalog,[page.slug]:page},g,editor});
    engine.current.refresh(optionsFor(context));
    rendered.current=context;
  }, [page,g,catalog,editor,reduced]);
  useEffect(() => {
    root.current
      ?.querySelectorAll("[data-section]")
      .forEach((e) =>
        e.classList.toggle(
          "selected",
          e.getAttribute("data-section") === selectedId,
        ),
      );
  }, [selectedId, page]);
  return (
    <div
      ref={root}
      className="concept-12-root"
      data-next-path={pathname}
      data-static-motion={!g.motion.enabled || reduced || !!editor || undefined}
      data-circle-reveal-off={!g.motion.circleReveal || undefined}
      dangerouslySetInnerHTML={{ __html: initialMarkup || markup }}
    />
  );
}
type Props = {
  initialPage: PageData;
  initialGlobals: Globals;
  initialMarkup?: string;
  editor?: boolean;
  onSelect?: (id: string) => void;
  selectedId?: string;
};
export default function SiteShell({
  initialPage,
  initialGlobals,
  initialMarkup,
  editor,
  onSelect,
  selectedId,
}: Props) {
  const [catalog, setCatalog] = useState(defaultPages),
    [page, setPage] = useState(initialPage),
    [g, setGlobals] = useState(initialGlobals);
  useEffect(() => {
    setPage(initialPage);
    setGlobals(initialGlobals);
  }, [initialPage, initialGlobals]);
  useEffect(() => {
    if (editor) return;
    if (["localhost", "127.0.0.1"].includes(location.hostname)) {
      try {
        const storedPages = JSON.parse(
            localStorage.getItem("showset-preview-published-pages") || "null",
          ),
          storedGlobals = JSON.parse(
            localStorage.getItem("showset-preview-published-globals") || "null",
          );
        const pages = storedPages ? compatiblePages(storedPages) : null,
          globals = storedGlobals ? compatibleGlobals(storedGlobals) : null;
        if (pages?.[initialPage.slug]?.sections) {
          setCatalog({ ...defaultPages, ...pages });
          setPage(pages[initialPage.slug]);
        }
        if (globals?.theme) setGlobals(globals);
      } catch (e) {
        console.warn("Invalid local preview; defaults retained", e);
      }
      return;
    }
    const controller = new AbortController();
    fetch(
      `${apiEndpoint}?action=published&slug=${encodeURIComponent(initialPage.slug)}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.page?.sections) {
          // Older published records predate the cinematic case-study fields.
          // Retain canonical story data until an editor explicitly publishes it.
          const incoming = {
            ...initialPage,
            ...j.page,
            caseExperience: j.page.caseExperience ?? initialPage.caseExperience,
          } as PageData;
          setPage(incoming);
          setCatalog((x) => ({ ...x, [incoming.slug]: incoming }));
        }
        if (j?.globals?.theme) setGlobals(j.globals);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [editor, initialPage.slug]);
  return (
    <SiteLayout
      page={page}
      initialMarkup={initialMarkup}
      g={g}
      catalog={catalog}
      editor={editor}
      onSelect={onSelect}
      selectedId={selectedId}
    />
  );
}
