import type { PageData } from "../types";
import { renderNodes, nodeMotions } from "./render";
import { mountNodeMotion } from "./motion";

/**
 * Owner-added sections are separate from the approved cinematic route scenes.
 * The native scenes remain under the Concept runtime, while these authored
 * chapters occupy a predictable space immediately before the closing CTA.
 *
 * This function is idempotent: the preview observes child-list mutations and
 * therefore must not rewrite the same builder markup on every observation.
 */
const lastMarkup = new WeakMap<HTMLElement, string>();
const STYLE = `<style data-studio2-template-style>
.s2-template-sections{width:100%;min-width:0;position:relative}
.s2-template-sections>.s2-node-section{display:flex;flex-direction:column;justify-content:center;gap:clamp(16px,2vw,28px);position:relative;min-height:280px;padding:clamp(64px,9vw,136px) var(--page-gutter,clamp(24px,7vw,120px));background:#0d2f49;color:#faf9fd}
.s2-template-sections .s2-node-heading{max-width:100%;font-family:Poppins,sans-serif;font-size:clamp(36px,5vw,76px);font-weight:700;line-height:1.08;letter-spacing:-.035em;margin:0}
.s2-template-sections .s2-node-text{max-width:68ch;font-family:Poppins,sans-serif;font-size:17px;line-height:1.55;margin:0}
.s2-template-sections .s2-accent{color:var(--teal,#12baaf)}
.s2-template-sections .s2-node-button{align-self:flex-start;display:inline-flex;gap:14px;align-items:center;background:var(--teal,#12baaf);color:#062739;font:600 14px Poppins,sans-serif;text-decoration:none;padding:15px 22px;border-radius:4px}
.s2-template-sections .s2-node-image img,.s2-template-sections .s2-node-gallery img{display:block;max-width:100%;width:100%;height:auto;object-fit:cover}
.s2-template-sections .s2-node-container{display:flex;flex-direction:column;gap:20px}
.s2-template-sections .s2-node-divider{border:0;border-top:1px solid #ffffff55}
@media(max-width:600px){.s2-template-sections>.s2-node-section{padding:64px 22px;align-items:center;text-align:center}.s2-template-sections .s2-node-heading{font-size:clamp(30px,9vw,42px)}.s2-template-sections .s2-node-text{text-align:center;font-size:17px}.s2-template-sections .s2-node-button{align-self:center}}
</style>`;

/** Return the authored section nodes, rendered inside the active original view. */
export function syncTemplateSections(
  host: HTMLElement,
  page: PageData,
  urls: Record<string,string> = {},
): HTMLElement | null {
  const root = host.matches(".concept-12-root")
    ? host : host.querySelector<HTMLElement>(".concept-12-root");
  if (!root) return null;
  const views = [...root.querySelectorAll<HTMLElement>(".view")];
  const view = views.find(v=>v.classList.contains("is-current") && !v.hidden)
    || views.find(v=>!v.hidden && getComputedStyle(v).display !== "none");
  if (!view) return null;
  const existing = view.querySelector<HTMLElement>("[data-studio2-template-sections]");
  const roots = page.builder?.mode === "custom" ? [] : page.builder?.roots || [];
  if (!roots.length) {
    existing?.remove();
    return null;
  }
  let container = existing;
  if (!container) {
    container = view.ownerDocument.createElement("div");
    container.className = "s2-template-sections";
    container.dataset.studio2TemplateSections = "true";
  }
  const closing = view.querySelector<HTMLElement>(
    ".service-close,.studio-final,.work-final,.case-related,.case-lightbox,.end-section,#ending"
  );
  if (closing && closing.parentElement === container.parentElement)
    closing.before(container);
  else if (!container.isConnected)
    view.append(container);
  const html = renderNodes(roots, urls) + STYLE;
  if (lastMarkup.get(container) !== html) {
    container.innerHTML = html;
    lastMarkup.set(container, html);
  }
  return container;
}

/** Only the newly authored nodes belong to Studio's motion runtime. */
export function mountTemplateMotion(
  host: HTMLElement,
  page: PageData,
  enabled: boolean,
) {
  const container = host.querySelector<HTMLElement>("[data-studio2-template-sections]");
  return container ? mountNodeMotion(container,nodeMotions(page),enabled) : () => {};
}
