import type { PageData } from "../types";
import { renderNodes } from "./render";

/**
 * Stable append-only area for owner-created sections inside approved layouts.
 * Native cinematic scenes are not moved, cloned or removed by this renderer.
 * The same builder nodes work on custom pages and existing-page extensions.
 */
export function applyTemplateExtensions(
  host: HTMLElement,
  page: PageData,
  urls: Record<string, string> = {},
): HTMLElement | null {
  host.querySelectorAll("[data-studio2-template-extensions]").forEach((node) => node.remove());
  if (page.builder?.mode !== "template" || !page.builder.roots.length) return null;

  const view = page.route === "/"
    ? host.querySelector<HTMLElement>('.view[data-view="home"]')
    : page.route.startsWith("/work/")
      ? host.querySelector<HTMLElement>('.view[data-view="case-study"]')
      : ["/events-experiences/", "/creative-design/", "/digital-marketing/",
          "/content-production/"].includes(page.route)
        ? host.querySelector<HTMLElement>('.view[data-view="service"]')
        : page.route === "/our-studio/"
          ? host.querySelector<HTMLElement>('.view[data-view="studio"]')
          : page.route === "/our-work/"
            ? host.querySelector<HTMLElement>('.view[data-view="work"]')
            : page.route === "/contact/"
              ? host.querySelector<HTMLElement>('.view[data-view="contact"]')
              : null;
  if (!view) return null;

  // Keep authored intro/scroll scenes and terminal CTA in their approved order.
  // The safe insertion point is immediately before the closing CTA, or at the
  // end of the current view when there is no closing CTA.
  const closing = page.route === "/"
    ? view.querySelector<HTMLElement>("#ending")
    : page.route.startsWith("/work/")
      ? view.querySelector<HTMLElement>(".case-related")
      : view.querySelector<HTMLElement>(
        ".service-close, .studio-final, .work-final, .end-section",
      );
  const container = host.ownerDocument.createElement("div");
  container.className = "s2-template-extensions s2-tree";
  container.dataset.studio2TemplateExtensions = "true";
  container.setAttribute("aria-label", "Additional SHOWSET sections");
  container.innerHTML = renderNodes(page.builder.roots, urls);
  if (closing) closing.before(container);
  else if (page.route.startsWith("/work/"))
    (view.querySelector(".case-experience") || view).append(container);
  else (view.querySelector(".service-experience") || view).append(container);
  return container;
}
