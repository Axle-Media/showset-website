import type { PageData, Globals } from "../types";
import markup from "../concept-12/markup.json";
import { bindConcept, routeKeys } from "../concept-12/bridge";
import { renderNodes } from "./render";
export function composeCustom(
  host: HTMLElement,
  page: PageData,
  g: Globals,
  catalog: Record<string, PageData>,
  urls: Record<string, string> = {},
) {
  host.innerHTML = markup;
  bindConcept(host, "home", { catalog, g });
  host.querySelectorAll(".view").forEach((el) => el.remove());
  host.querySelector("#main")?.remove();
  const main = host.ownerDocument.createElement("main");
  main.className = "s2-tree";
  main.id = "main";
  main.innerHTML = renderNodes(page.builder?.roots || [], urls);
  host.querySelector(".footer")?.before(main);
  host.querySelector("#reading-progress")?.remove();
  host.querySelectorAll('a[href^="#"]').forEach((a) => {
    const href = a.getAttribute("href")?.slice(1),
      route = Object.entries(routeKeys).find(([, key]) => key === href)?.[0];
    if (route) a.setAttribute("href", route);
  });
}
