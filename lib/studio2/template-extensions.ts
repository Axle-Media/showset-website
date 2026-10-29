import type { PageData } from "../types";
import { renderNodes } from "./render";
import { syncNativeReplacementVisibility } from "./native-rebuild";

/**
 * Stable append-only area for owner-created sections inside approved layouts.
 * Native cinematic scenes are not moved, cloned or removed by this renderer.
 * The same builder nodes work on custom pages and existing-page extensions.
 */
// Reusing unmodified nodes preserves focus and image/video state during
// inspector updates, and avoids spurious MutationObserver-driven rerenders.
const lastMarkup = new WeakMap<HTMLElement,string>();
export function applyTemplateExtensions(
  host: HTMLElement,
  page: PageData,
  urls: Record<string, string> = {},
): HTMLElement | null {
  syncNativeReplacementVisibility(host,page);
  const existing = host.querySelector<HTMLElement>("[data-studio2-template-extensions]");
  if (page.builder?.mode !== "template" || !page.builder.roots.length) {
    existing?.remove();
    return null;
  }

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
  const container = existing && view.contains(existing)
    ? existing : host.ownerDocument.createElement("div");
  if (existing && existing !== container) existing.remove();
  container.className = "s2-template-extensions s2-tree";
  container.dataset.studio2TemplateExtensions = "true";
  container.setAttribute("aria-label", "Additional SHOWSET sections");
  const nextMarkup = renderNodes(page.builder.roots, urls);
  if (lastMarkup.get(container) !== nextMarkup) {
    container.innerHTML = nextMarkup;
    lastMarkup.set(container, nextMarkup);
  }
  if (closing) {
    if (container.nextElementSibling !== closing ||
        container.parentElement !== closing.parentElement)
      closing.before(container);
  } else {
    const destination = page.route.startsWith("/work/")
      ? (view.querySelector(".case-experience") || view)
      : (view.querySelector(".service-experience") || view);
    if (container.parentElement !== destination) destination.append(container);
  }
  return container;
}
