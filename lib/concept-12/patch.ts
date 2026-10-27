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
  const selections=Array.from(host.querySelectorAll("select"),element=>({element,value:element.value}));
  // The homepage's circular gallery owns two transient sets of clones.
  // Remove those before morphdom reconciles authored cards, then let the
  // running carousel rebuild fresh clones during engine.refresh().
  host.querySelectorAll("#case-rail > .case-gallery-clone").forEach(node=>node.remove());
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
    morphdom(host,target,{
      childrenOnly:true,
      onBeforeElUpdated(from,to) {
        if(from.closest('[data-service-experience]')) {
          ['data-service-ready','data-service-motion','data-service-pinned','data-service-phase','data-channel-active','data-frame-active','data-process-active'].forEach(name=>{
            if(from.hasAttribute(name))to.setAttribute(name,from.getAttribute(name)!);
          });
          if(from instanceof HTMLElement&&to instanceof HTMLElement) {
            Array.from(from.style).filter(name=>/^--(service|proof|process|channel|plan)-/.test(name)).forEach(name=>{
              if(!to.style.getPropertyValue(name))to.style.setProperty(name,from.style.getPropertyValue(name));
            });
          }
        }
        motionClasses.forEach(name=>to.classList.toggle(name,from.classList.contains(name)));
        if(from instanceof HTMLElement && to instanceof HTMLElement) {
          motionStyles.forEach(name=>{
            if(from.style.getPropertyValue(name) && !to.style.getPropertyValue(name))
              to.style.setProperty(name,from.style.getPropertyValue(name),from.style.getPropertyPriority(name));
          });
        }
        if(["mobile-panel","hero-foreground","hero-second"].includes(from.id)) {to.toggleAttribute("inert",from.hasAttribute("inert"));to.setAttribute("aria-hidden",from.getAttribute("aria-hidden") || "true")}
        if(from.id==="form-result") to.textContent=from.textContent;
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
    // Reconcile option nodes first, then restore the visitor selection.
    selections.forEach(({element,value})=>{if(element.isConnected)element.value=value});
    // Globals are CSS variables on the host, which morphdom deliberately does not own.
    host.style.cssText=target.style.cssText;
    host.style.removeProperty("display");
  } finally { target.remove(); }
}


