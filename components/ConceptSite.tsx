"use client";
import { usePathname } from "next/navigation";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Globals, PageData } from "@/lib/types";
import {publishingBackendAvailable} from "@/lib/deployment";
import { apiEndpoint, defaultPages } from "@/lib/data";
import markup from "@/lib/concept-12/markup.json";
import { mountConcept } from "@/lib/concept-12/runtime";
import { bindConcept, keyForRoute } from "@/lib/concept-12/bridge";
import { conceptMetadata } from "@/lib/concept-12/metadata";
import { patchConcept } from "@/lib/concept-12/patch";
import { safeHref } from "@/lib/safe";
import { compatiblePages, compatibleGlobals } from "@/lib/concept-12/compat";
import CustomSite from "./studio2/CustomSite";
import {syncTemplateSections,mountTemplateMotion} from "@/lib/studio2/template-sections";
const EMPTY_STUDIO_MEDIA_URLS: Record<string,string> = {};
type LayoutProps = {
  page: PageData;
  g: Globals;
  catalog?: Record<string, PageData>;
  initialMarkup?: string;
  editor?: boolean;
  onSelect?: (id: string) => void;
  selectedId?: string;
  suppressSubmissions?: boolean;
  urls?: Record<string,string>;
};
/** Public site and Studio mount the same original Concept 12 DOM and runtime. */
function TemplateSiteLayout({
  page,
  g,
  catalog = defaultPages,
  initialMarkup,
  editor,
  onSelect,
  selectedId,
  suppressSubmissions=false,
  urls=EMPTY_STUDIO_MEDIA_URLS,
}: LayoutProps) {
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null),
    select = useRef(onSelect),
    lastRoute = useRef(page.route);
  select.current = onSelect;
  const latest = useRef({page,g,catalog,editor,suppressSubmissions,reduced:false});
  const engine = useRef<ReturnType<typeof mountConcept> | null>(null);
  const templateMotion = useRef<(() => void) | null>(null);
  const rendered = useRef<unknown>(null);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion:reduce)");
    const sync = () => setReduced(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);
  latest.current = {page,g,catalog,editor,suppressSubmissions,reduced};
  function optionsFor(context: typeof latest.current) {
    const {page,g,catalog,editor,reduced}=context;
    return {
      route: keyForRoute(page.route),
      casePaths: Object.fromEntries(Object.values({...catalog,[page.slug]:page}).filter(p=>p.route.startsWith("/work/")).map(p=>[keyForRoute(p.route),p.route])),
      getMetadata: (key: string) => {
        const pages = { ...catalog, [page.slug]: page };
        const entry = Object.values(pages).find(p => keyForRoute(p.route) === key && p.route === location.pathname)
          || Object.values(pages).find(p => keyForRoute(p.route) === key);
        return entry ? conceptMetadata(entry) : undefined;
      },
      editor: !!editor,
      suppressSubmissions: context.suppressSubmissions,
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
    const changingRoute = lastRoute.current !== page.route;
    const y = changingRoute ? 0 : scrollY;
    lastRoute.current = page.route;
    // React-driven route updates must also start at the top before replacing
    // the page content. Keep same-page Studio refresh scroll position intact.
    if (changingRoute) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
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
      if (keyForRoute(page.route) && keyForRoute(page.route) !== "home")
        bindConcept(host, keyForRoute(page.route), {
          catalog: { ...catalog, [page.slug]: page },
          g,
          editor,
        });
      dispose = mountConcept(host, optionsFor(latest.current));
      if(page.builder?.mode !== "custom" && page.builder?.roots.length){
        syncTemplateSections(host,page,urls);
        templateMotion.current?.();
        templateMotion.current = mountTemplateMotion(host,page,!editor && g.motion.enabled && !reduced);
      }
    } catch (error) {
      console.error("SHOWSET interactive page failed; restoring static content", error);
      host.innerHTML = serverMarkup;
      host.dataset.caseMotion = "off";
      host.querySelector("#route-curtain")?.remove();
      // SSR already selects the active view. If the initial markup is not
      // available, select it explicitly so the page remains readable.
      if (!initialMarkup) {
        const key = keyForRoute(page.route) || "home";
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
      templateMotion.current?.();
      templateMotion.current=null;
      dispose?.();
      engine.current=null;
    };
  }, [page.route]);
  useLayoutEffect(() => {
    const host=root.current;
    if (!host || !engine.current || rendered.current===latest.current) return;
    const context=latest.current;
    patchConcept(host, host.dataset.conceptRoute || keyForRoute(page.route) || "home", {catalog:{...catalog,[page.slug]:page},g,editor});
    engine.current.refresh(optionsFor(context));
    templateMotion.current?.();
    templateMotion.current=null;
    if(page.builder?.mode !== "custom" && page.builder?.roots.length){
      syncTemplateSections(host,page,urls);
      templateMotion.current=mountTemplateMotion(host,page,!editor && g.motion.enabled && !reduced);
    }
    rendered.current=context;
  }, [page,g,catalog,editor,reduced,urls]);
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
      data-concept-route={keyForRoute(page.route) || "home"}
      data-static-motion={!g.motion.enabled || reduced || !!editor || undefined}
      data-circle-reveal-off={!g.motion.circleReveal || undefined}
      dangerouslySetInnerHTML={{ __html: initialMarkup || markup }}
    />
  );
}
export function SiteLayout(props:LayoutProps){return props.page.builder?.mode==="custom"?<CustomSite {...props} catalog={props.catalog||defaultPages} />:<TemplateSiteLayout {...props}/>;}
type Props = {
  initialPage: PageData;
  initialGlobals: Globals;
  initialMarkup?: string;
  editor?: boolean;
  onSelect?: (id: string) => void;
  selectedId?: string;
  suppressSubmissions?: boolean;
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
    if(!publishingBackendAvailable(location.hostname))return;
    const controller = new AbortController();
    fetch(
      `${apiEndpoint}?action=published&slug=${encodeURIComponent(initialPage.slug)}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.page?.sections) {
          // The shared story read-model derives missing fields from published
          // records themselves; never substitute demonstration seed copy.
          const incoming = {
            ...initialPage,
            ...j.page,
            caseExperience: j.page.caseExperience,
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
