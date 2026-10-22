import morphdom from "morphdom";
import markup from "./markup.json";
import services from "./data.json";
import cases from "./caseStudies.json";
import { bindConcept } from "./bridge";
import { populateCategory, populateCaseStudy, selectCurrentView } from "./route-content";

// These belong to the running engine, not to the editable content model.
const motionClasses = ["is-on","is-active","is-revealed","is-inview","is-open","open","scrolled","menu-is-open","enter","leave","js-select-ready","selected"];
const motionStyles = ["transform","opacity","clip-path","pointer-events","transition","--dot-radius","--light-x","--light-y"];
/** Patch content in place; never replace the host or restart its animation engine. */
export function patchConcept(host: HTMLElement, key: string, context: Parameters<typeof bindConcept>[2]) {
  const target=host.ownerDocument.createElement("div");
  target.className=host.className;
  target.innerHTML=markup;
  target.style.display="none";
  host.ownerDocument.body.append(target);
  try {
    if(key in services) populateCategory(target,key,services);
    if(key in cases) populateCaseStudy(target,key,cases);
    bindConcept(target,"home",context);
    if(key!=="home") bindConcept(target,key,context);
    selectCurrentView(target,key);
    // Match the source engine's seamless loop, without accumulating more clones.
    const rail=target.querySelector("#case-rail");
    target.querySelectorAll("[data-case-slide]").forEach(slide=>{
      const clone=slide.cloneNode(true) as HTMLElement;
      clone.removeAttribute("data-case-slide");
      clone.setAttribute("aria-hidden","true");
      clone.tabIndex=-1;
      rail?.append(clone);
    });
    morphdom(host,target,{
      childrenOnly:true,
      onBeforeElUpdated(from,to) {
        motionClasses.forEach(name=>to.classList.toggle(name,from.classList.contains(name)));
        if(from instanceof HTMLElement && to instanceof HTMLElement) {
          motionStyles.forEach(name=>{
            if(from.style.getPropertyValue(name) && !to.style.getPropertyValue(name))
              to.style.setProperty(name,from.style.getPropertyValue(name),from.style.getPropertyPriority(name));
          });
        }
        if(from.id==="mobile-panel") {to.toggleAttribute("inert",from.hasAttribute("inert"));to.setAttribute("aria-hidden",from.getAttribute("aria-hidden") || "true")}
        if(from.matches("details")) to.toggleAttribute("open",from.hasAttribute("open"));
        ["aria-expanded","aria-selected"].forEach(name=>{
          if(from.hasAttribute(name)) to.setAttribute(name,from.getAttribute(name)!);
        });
        if(from instanceof HTMLInputElement && to instanceof HTMLInputElement) {
          to.value=from.value; to.checked=from.checked;
        }
        if(from instanceof HTMLTextAreaElement && to instanceof HTMLTextAreaElement) to.value=from.value;
        if(from instanceof HTMLSelectElement && to instanceof HTMLSelectElement) to.value=from.value;
        return !from.isEqualNode(to);
      },
    });
    // Globals are CSS variables on the host, which morphdom deliberately does not own.
    host.style.cssText=target.style.cssText;
    host.style.removeProperty("display");
  } finally { target.remove(); }
}
