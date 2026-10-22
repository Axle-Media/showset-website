import "server-only";
import { parseHTML } from "linkedom";
import type { Globals, PageData } from "@/lib/types";
import { defaultPages } from "@/lib/data";
import markup from "./markup.json";
import services from "./data.json";
import cases from "./caseStudies.json";
import { bindConcept, routeKeys } from "./bridge";
import { populateCategory, populateCaseStudy, selectCurrentView } from "./route-content";
/** Build-time only: the browser receives route-specific HTML, not a DOM parser. */
export function conceptDocument(page: PageData, g: Globals): string {
  const { document } = parseHTML("<!doctype html><html><body><div id=ssr-host></div></body></html>");
  const host = document.getElementById("ssr-host")!;
  host.innerHTML = markup;
  const key = routeKeys[page.route] || "home";
  if (key in services) populateCategory(host, key, services);
  if (key in cases) populateCaseStudy(host, key, cases);
  const catalog = { ...defaultPages, [page.slug]: page };
  bindConcept(host as unknown as HTMLElement, "home", { catalog, g });
  if (key !== "home") bindConcept(host as unknown as HTMLElement, key, { catalog, g });
  selectCurrentView(host, key);
  // Initial HTML has one meaningful route and primary heading. The browser engine
  // mounts the full inactive scene catalogue only after hydration, for its transitions.
  host.querySelectorAll(".view:not(.is-current)").forEach(view => view.remove());
  const paths = Object.fromEntries(Object.entries(routeKeys).filter(([path]) => path !== "/services/").map(([path,key]) => [key,path]));
  host.querySelectorAll('a[href^="#"]').forEach(anchor => {
    const key = anchor.getAttribute("href")!.slice(1);
    if (paths[key]) anchor.setAttribute("href", paths[key]);
  });
  // No-JS visitors get the same second-scene content without inert scroll controls.
  const second=host.querySelector("#hero-second");
  if(second){
    const copy=second.cloneNode(true) as unknown as HTMLElement;
    copy.id="hero-second-nojs";copy.className="hero-nojs-scene";
    copy.removeAttribute("inert");copy.removeAttribute("aria-hidden");
    const fallback=document.createElement("noscript");fallback.innerHTML=copy.outerHTML;
    second.after(fallback);
  }
  return host.innerHTML;
}
