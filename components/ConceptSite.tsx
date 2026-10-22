"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Globals, PageData } from "@/lib/types";
import { apiEndpoint, defaultPages } from "@/lib/data";
import markup from "@/lib/concept-12/markup.json";
import { mountConcept } from "@/lib/concept-12/runtime";
import { bindConcept, routeKeys } from "@/lib/concept-12/bridge";
import { safeHref } from "@/lib/safe";
import { compatiblePages, compatibleGlobals } from "@/lib/concept-12/compat";
type LayoutProps = {
  page: PageData;
  g: Globals;
  catalog?: Record<string, PageData>;
  editor?: boolean;
  onSelect?: (id: string) => void;
  selectedId?: string;
};
/** Public site and Studio mount the same original Concept 12 DOM and runtime. */
export function SiteLayout({
  page,
  g,
  catalog = defaultPages,
  editor,
  onSelect,
  selectedId,
}: LayoutProps) {
  const root = useRef<HTMLDivElement>(null),
    select = useRef(onSelect),
    lastRoute = useRef(page.route);
  select.current = onSelect;
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion:reduce)");
    const sync = () => setReduced(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);
  useLayoutEffect(() => {
    const host = root.current;
    if (!host) return;
    const y = lastRoute.current === page.route ? scrollY : 0;
    lastRoute.current = page.route;
    // React owns the host; the upstream engine exclusively owns its descendants.
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
    const dispose = mountConcept(host, {
      route: routeKeys[page.route] || "home",
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
    });
    const choose = (event: MouseEvent) => {
      if (!editor) return;
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
      dispose();
    };
  }, [page, g, catalog, editor, reduced]);
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
      data-static-motion={!g.motion.enabled || reduced || !!editor || undefined}
      data-circle-reveal-off={!g.motion.circleReveal || undefined}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
type Props = {
  initialPage: PageData;
  initialGlobals: Globals;
  editor?: boolean;
  onSelect?: (id: string) => void;
  selectedId?: string;
};
export default function SiteShell({
  initialPage,
  initialGlobals,
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
          setPage(j.page);
          setCatalog((x) => ({ ...x, [j.page.slug]: j.page }));
        }
        if (j?.globals?.theme) setGlobals(j.globals);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [editor, initialPage.slug]);
  return (
    <SiteLayout
      page={page}
      g={g}
      catalog={catalog}
      editor={editor}
      onSelect={onSelect}
      selectedId={selectedId}
    />
  );
}
