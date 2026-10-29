import type { PageData } from "../types";
import { renderNodes } from "./render";
import { activeNativeReplacements, syncNativeReplacementVisibility } from "./native-rebuild";

/**
 * Owner-created sections remain in the safe append-only area before the
 * closing CTA. Rebuilt editorial sections instead occupy the original
 * section's position, without moving or destroying its approved source DOM.
 * Pinned/cinematic source sections are never eligible for rebuilding.
 */
const lastMarkup = new WeakMap<HTMLElement,string>();
export function applyTemplateExtensions(
  host: HTMLElement,
  page: PageData,
  urls: Record<string, string> = {},
): HTMLElement | null {
  const existing=host.querySelector<HTMLElement>(
    '[data-studio2-template-extensions="true"]');
  const previousAnchors=[...host.querySelectorAll<HTMLElement>(
    "[data-studio2-native-extension]")];
  if(page.builder?.mode!=="template"){
    existing?.remove();
    previousAnchors.forEach(node=>node.remove());
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
  if(!view){
    existing?.remove();
    previousAnchors.forEach(node=>node.remove());
    return null;
  }

  const builder=page.builder;
  const active=activeNativeReplacements(page);
  const replacements=new Set([
    ...Object.values(builder.nativeReplacementNodes||{}),
    ...active.map(item=>item.node.id),
  ]);
  const appended=builder.roots.filter(root=>!replacements.has(root.id));
  const keep=new Set<string>();
  const nativeContainers:HTMLElement[]=[];

  // Match on DOM dataset values rather than interpolating imported IDs into
  // a CSS selector. A replacement is mounted immediately before its native
  // anchor; that anchor remains in place for fully reversible restoration.
  for(const {sourceId,node} of active){
    const original=[...view.querySelectorAll<HTMLElement>(
      "[data-service-section],[data-section]")].find(element=>
      (element.dataset.serviceSection||element.dataset.section)===sourceId);
    if(!original)continue;
    let wrapper=previousAnchors.find(element=>
      element.dataset.studio2NativeExtension===sourceId);
    if(!wrapper)wrapper=host.ownerDocument.createElement("div");
    wrapper.className="s2-template-extensions s2-tree s2-native-extension";
    wrapper.dataset.studio2NativeExtension=sourceId;
    wrapper.setAttribute("aria-label","Editable replacement section");
    const markup=renderNodes([node],urls);
    if(lastMarkup.get(wrapper)!==markup){
      wrapper.innerHTML=markup;
      lastMarkup.set(wrapper,markup);
    }
    // Repeated calls preserve the wrapper and its interactive descendants.
    if(wrapper.nextElementSibling!==original ||
       wrapper.parentElement!==original.parentElement)
      original.before(wrapper);
    keep.add(sourceId);
    nativeContainers.push(wrapper);
  }
  for(const wrapper of previousAnchors){
    if(!keep.has(wrapper.dataset.studio2NativeExtension||""))
      wrapper.remove();
  }
  // Native visibility is scoped to active, non-hidden replacement roots.
  // An invalid/missing replacement is never allowed to leave an empty page.
  syncNativeReplacementVisibility(host,page);

  if(!appended.some(root=>!root.hidden)){
    existing?.remove();
    return nativeContainers[0]||null;
  }

  const closing = page.route === "/"
    ? view.querySelector<HTMLElement>("#ending")
    : page.route.startsWith("/work/")
      ? view.querySelector<HTMLElement>(".case-related")
      : view.querySelector<HTMLElement>(
        ".service-close, .studio-final, .work-final, .end-section",
      );
  const container=existing&&view.contains(existing)
    ? existing : host.ownerDocument.createElement("div");
  if(existing&&existing!==container)existing.remove();
  container.className="s2-template-extensions s2-tree";
  container.dataset.studio2TemplateExtensions="true";
  container.setAttribute("aria-label","Additional SHOWSET sections");
  const markup=renderNodes(appended,urls);
  if(lastMarkup.get(container)!==markup){
    container.innerHTML=markup;
    lastMarkup.set(container,markup);
  }
  if(closing){
    if(container.nextElementSibling!==closing ||
       container.parentElement!==closing.parentElement)
      closing.before(container);
  }else{
    const destination=page.route.startsWith("/work/")
      ? (view.querySelector(".case-experience")||view)
      : (view.querySelector(".service-experience")||view);
    if(container.parentElement!==destination)destination.append(container);
  }
  return container;
}
