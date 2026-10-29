import type { PageData } from "../types";
import { caseExperienceFor } from "../concept-12/case-content";
import { primaryChapterImage } from "../concept-12/chapter-image";
import { serviceKind } from "../concept-12/service-content";

import type { TargetOverride } from "./model";
import { responsiveCss, targetSelector } from "./registry";
export interface Binding {
  id: string;
  name: string;
  kind: "section" | "heading" | "text" | "image" | "button";
  selector: string;
  sectionId: string;
  field?: string;
  itemIndex?: number;
  secondary?: boolean;
  content: boolean;
  /** Real owner of an existing case-story image, not a disconnected override. */
  caseField?: "openingImage" | "secondImage" | "openingTitle" | "openingBody" | "secondTitle" | "secondBody";
  chapter?: "brief" | "intention" | "approach";
  chapterTextField?: "heading" | "body";
  itemField?: "title" | "description";
  galleryIndex?: number;
}
/** Bind to real approved template content, without changing its composition.
 * Never offer an image control for a decorative graphic or for a linked card
 * whose photography is owned by a different case-study page.
 */
export function templateBindings(page: PageData): Binding[] {
  const bindings: Binding[] = [];
  const section = (type: string) => page.sections.find((s) => s.type === type);
  const image = (
    id: string,
    name: string,
    selector: string,
    sectionId: string,
    itemIndex?: number,
  ) => bindings.push({
    id, name, selector, sectionId, itemIndex, field: "image",
    kind: "image", content: true,
  });
  const sectionStyle = (id: string, name: string, selector: string,
    sectionId: string) => bindings.push({
    id,name,selector,sectionId,kind:"section" as const,content:false,
  });
  const content = (
    id: string, name: string, kind: "heading" | "text" | "button",
    selector: string, sectionId: string, field: string,
    itemIndex?: number, itemField?: "title" | "description",
  ) => bindings.push({id,name,kind,selector,sectionId,field,itemIndex,
    itemField,content:true});
  const sectionContent = (
    prefix: string, target: import("../types").Block | undefined,
    selector: string, bodySelector?: string,
  ) => {
    if (!target) return;
    content(prefix + "-heading", "Section heading", "heading", selector,
      target.id, "headline");
    if (target.accent)
      content(prefix + "-accent", "Section accent phrase", "heading",
        selector + " .accent-line", target.id, "accent");
    if (bodySelector && target.body)
      content(prefix + "-body", "Section paragraph", "text", bodySelector,
        target.id, "body");
  };
  const stageCopy = (
    prefix: string, target: import("../types").Block | undefined,
    titleSelector: (i:number)=>string,
    bodySelector: (i:number)=>string,
  ) => target?.items.forEach((item,i)=>{
    content(prefix + "-title-" + i, "Stage " + (i+1) + ": heading",
      "heading",titleSelector(i),target.id,"items",i,"title");
    if (item.description)
      content(prefix + "-copy-" + i, "Stage " + (i+1) + ": paragraph",
        "text",bodySelector(i),target.id,"items",i,"description");
  });
  if (page.slug === "home") {
    const hero = section("hero");
    if (!hero) return bindings;
    bindings.push(
      { id: "home-hero", name: "Opening scene", kind: "section", selector: "#hero-track", sectionId: hero.id, content: false },
      { id: "home-hero-title", name: "Hero headline", kind: "heading", selector: ".hero-title", sectionId: hero.id, field: "headline", content: true },
      { id: "home-hero-accent", name: "Hero accent", kind: "heading", selector: ".hero-title .hero-accent-phrase>span", sectionId: hero.id, field: "accent", content: true },
      { id: "home-hero-copy", name: "Hero paragraph", kind: "text", selector: "#hero-foreground>p", sectionId: hero.id, field: "body", content: true },
      { id: "home-hero-button", name: "Primary action", kind: "button", selector: ".hero-links .solid-link", sectionId: hero.id, field: "buttonLabel", content: true },
      { id: "home-hero-secondary", name: "Secondary action", kind: "button", selector: ".hero-links .text-arrow-link", sectionId: hero.id, field: "secondaryLabel", secondary: true, content: true },
    );
    image("home-hero-image", "Hero photograph", "#hero-photo>img", hero.id);
    for (const s of page.sections) {
      if (!["story", "services"].includes(s.type)) continue;
      s.items.forEach((item, i) => {
        if (!item.image) return;
        image("home-" + s.type + "-image-" + i,
          (s.type === "story" ? "Story scene " + (i + 1) : item.title || "Service " + (i + 1)) + " photograph",
          s.type === "story" ? '[data-film-image="' + i + '"] img' : '[data-service-visual="' + i + '"] img',
          s.id, i);
      });
    }
    return bindings;
  }

  const service = serviceKind(page);
  if (service) {
    const hero = section("pagehero");
    // Digital's approved hero is an abstract art composition, not a photo.
    if (hero?.image && service !== "digital")
      image("service-hero-photo", "Hero photograph",
        ".service-hero-art img", hero.id);
    const story = page.sections.find((s) => s.id === "service-story") || section("story");
    story?.items.forEach((item, i) => {
      if (!item.image) return;
      const selector = service === "events"
        ? '.service-event-triptych-image:nth-child(' + (i + 1) + ') img'
        : service === "creative"
          ? '[data-creative-artboard="' + i + '"] .service-creative-artboard-image img'
          : '[data-production-frame="' + i + '"] img';
      image("service-story-photo-" + i, "Stage " + (i + 1) + ": " + item.title,
        selector, story.id, i);
    });
    sectionContent("service-opening", hero,
      ".service-hero #category-title", ".service-hero-copy p");
    const intro = page.sections.find((s)=>s.id==="section-2");
    sectionContent("service-intro",intro,
      ".service-intro .service-heading",
      ".service-intro .service-editorial-row > div:last-child p");
    sectionContent("service-story",story,
      ".service-story > header .service-heading",
      ".service-story > header > p");
    stageCopy("service-stage",story,
      (i)=>service==="events"
        ? '[data-service-scene="' + i + '"] h3'
        : service==="creative"
          ? '[data-creative-artboard="' + i + '"] .service-creative-artboard-copy h3'
          : '[data-production-step="' + i + '"] h3',
      (i)=>service==="events"
        ? '[data-service-scene="' + i + '"] p'
        : service==="creative"
          ? '[data-creative-artboard="' + i + '"] .service-creative-artboard-copy p'
          : '[data-production-step="' + i + '"] p',
    );
    const expertise = section("accordion");
    sectionContent("service-expertise", expertise,
      ".service-expertise .service-editorial-row .service-heading",
      ".service-expertise .service-editorial-row > div:last-child p");
    for (const [name,target] of [
      ["Opening",hero],["Introduction",intro],["Story",story],
      ["Expertise",expertise],["Closing",page.sections.find(s=>s.type==="visual")],
    ] as const) {
      if(target) sectionStyle("service-section-"+target.id,
        name+" section",'[data-service-section="'+target.id+'"]',target.id);
    }
    expertise?.items.forEach((item,i)=>{
      // A displayed capability retains its original item ID through grouping.
      content("service-capability-" + i,"Capability: " + item.title,
        "text",'[data-capability-id="' + item.id + '"] .service-capability-name',
        expertise.id,"items",i,"title");
    });
    return bindings;
  }

  if (page.route === "/our-studio/") {
    const hero = section("pagehero");
    if (hero?.image) image("studio-hero-photo", "Studio hero photograph",
      ".studio-hero .studio-hero-photo img", hero.id);
    const journey = page.sections.find((s) => s.id === "section-3");
    journey?.items.forEach((item, i) => {
      if (item.image) image("studio-process-photo-" + i,
        "Studio chapter " + (i + 1) + " photograph",
        '[data-studio-shot="' + i + '"] img', journey.id, i);
    });
    for (const [name,id,selector] of [
      ["Opening","section-1",".studio-hero"],
      ["Manifesto","section-2",".studio-manifesto"],
      ["Process","section-3",".studio-exploration"],
      ["Partnership","section-5",".studio-outlook"],
      ["Closing","section-7",".studio-final"],
    ] as const) {
      if(page.sections.some(s=>s.id===id))
        sectionStyle("studio-section-"+id,name+" section",selector,id);
    }
    sectionContent("studio-hero",hero,
      ".studio-hero-scene-first h1", ".studio-hero-scene-first > p");
    sectionContent("studio-manifesto",page.sections.find(s=>s.id==="section-2"),
      ".studio-manifesto h2", ".studio-manifesto-body p");
    sectionContent("studio-exploration",journey,
      ".studio-exploration .studio-exploration-intro h2",
      ".studio-exploration .studio-exploration-intro p");
    stageCopy("studio-stage",journey,
      (i)=>'.studio-storyboard-chapter:nth-child(' + (i+1) + ') h3',
      (i)=>'.studio-storyboard-chapter:nth-child(' + (i+1) + ') p');
    sectionContent("studio-outlook",page.sections.find(s=>s.id==="section-5"),
      ".studio-outlook h2", ".studio-partnership-body p");
    sectionContent("studio-final",page.sections.find(s=>s.id==="section-7"),
      ".studio-final h2", ".studio-final-copy p");
    return bindings;
  }
  if (page.route === "/our-work/") {
    const hero = section("pagehero");
    if (hero?.image) image("work-hero-photo", "Our Work hero photograph",
      ".work-hero .simple-bg img", hero.id);
    for(const [name,id,selector] of [
      ["Opening","section-1",".work-hero"],
      ["Introduction","section-2",".work-page-intro"],
      ["Portfolio","section-3",".work-page-gallery"],
      ["Closing","work-closing",".work-final"],
    ] as const) {
      if(page.sections.some(s=>s.id===id))
        sectionStyle("work-section-"+id,name+" section",selector,id);
    }
    sectionContent("work-hero",hero, ".work-hero h1",
      ".work-hero .simple-hero-content > p");
    sectionContent("work-intro",page.sections.find(s=>s.id==="section-2"),
      ".work-intro-title", ".work-intro-copy p");
    sectionContent("work-final",section("cta"),".work-final h2",
      ".work-final-copy p");
    // Portfolio thumbnails belong to their linked case-study records.
    return bindings;
  }
  if (page.route === "/contact/") {
    // The approved Contact composition currently has no photograph.
    // Do not create a dead replacement control for its unused seed field.
    const contact = section("contact");
    if(contact) sectionStyle("contact-section","Contact section",
      ".contact-view",contact.id);
    sectionContent("contact-opening",contact,
      ".contact-left h1", ".contact-intro > p");
    if(contact) content("contact-submit","Form submit label","button",
      ".contact-submit",contact.id,"buttonLabel");
    return bindings;
  }
  if (page.route.startsWith("/work/")) {
    const caseStory = caseExperienceFor(page);
    const sectionId = page.sections[0]?.id || "section-1";
    const caseImage = (
      id: string, name: string, selector: string,
      details: Pick<Binding, "caseField" | "chapter" | "galleryIndex">,
    ) => bindings.push({
      id, name, selector, sectionId, kind: "image", content: true,
      ...details,
    });
    if (caseStory.openingImage)
      caseImage("case-opening-photo", "Opening photograph",
        ".case-opening-first > img", {caseField:"openingImage"});
    if (caseStory.secondImage)
      caseImage("case-second-photo", "Second opening photograph",
        ".case-opening-second > img", {caseField:"secondImage"});
    (["brief", "intention", "approach"] as const).forEach((key, i) => {
      if (!primaryChapterImage(caseStory[key])) return;
      caseImage("case-chapter-" + key + "-photo",
        key[0].toUpperCase() + key.slice(1) + " chapter photograph",
        '[data-case-chapter="' + i + '"] .case-chapter-photo img, [data-case-story-image="' + i + '"] img',
        {chapter:key});
    });
    // The renderer skips invalid or empty gallery items. Keep both the displayed
    // index for the selector and the original index for durable data updates.
    let displayed = 0;
    caseStory.gallery.forEach((item, i) => {
      if (!item.src || (!item.src.startsWith("asset:") &&
          !item.src.startsWith("/") && !item.src.startsWith("https://"))) return;
      caseImage("case-gallery-photo-" + i, "Gallery photograph " + (displayed + 1),
        '[data-case-image="' + displayed + '"] img', {galleryIndex:i});
      displayed++;
    });
    sectionStyle("case-opening-section","Opening sequence",
      ".case-scroll-opening",sectionId);
    sectionStyle("case-narrative-section","Story sequence",
      ".case-scroll-narrative",sectionId);
    // Narrative copy lives in CaseExperience and must not be overwritten by
    // obsolete Block section fields when editing the immersive template.
    const caseText = (id:string,name:string,kind:"heading"|"text",
      selector:string,caseField:NonNullable<Binding["caseField"]>) =>
      bindings.push({id,name,kind,selector,sectionId,caseField,content:true});
    caseText("case-opening-heading","Opening headline","heading",
      ".case-opening-first .case-scene-copy h1","openingTitle");
    caseText("case-opening-copy","Opening paragraph","text",
      ".case-opening-first .case-scene-copy p","openingBody");
    caseText("case-second-heading","Second scene headline","heading",
      ".case-opening-second .case-scene-copy h2","secondTitle");
    caseText("case-second-copy","Second scene paragraph","text",
      ".case-opening-second .case-scene-copy p","secondBody");
    (["brief","intention","approach"] as const).forEach((key,i)=>{
      for(const [field,kind,selector] of [
        ["heading","heading",'[data-case-chapter="' + i + '"] .case-chapter-copy h2'],
        ["body","text",'[data-case-chapter="' + i + '"] .case-body-copy p']
      ] as const)
        bindings.push({
          id:"case-"+key+"-"+field,
          name:key[0].toUpperCase()+key.slice(1)+" "+field,
          kind,selector,sectionId,chapter:key,chapterTextField:field,
          content:true,
        });
    });
    return bindings;
  }
  return bindings;
}
export function bindingContent(page: PageData, binding: Binding): string {
  if (binding.caseField || binding.chapter || binding.galleryIndex !== undefined) {
    const story = caseExperienceFor(page);
    if (binding.caseField) return story[binding.caseField] || "";
    if (binding.chapter) return binding.chapterTextField
      ? story[binding.chapter]?.[binding.chapterTextField] || ""
      : primaryChapterImage(story[binding.chapter]);
    if (binding.galleryIndex !== undefined)
      return story.gallery[binding.galleryIndex]?.src || "";
  }
  const section = page.sections.find((s) => s.id === binding.sectionId);
  if (binding.itemIndex !== undefined)
    return String(section?.items[binding.itemIndex]?.[binding.itemField || "image"] || "");
  return binding.field
    ? String((section as unknown as Record<string, unknown>)?.[binding.field] ?? "")
    : "";
}
export function updateBinding(
  page: PageData,
  binding: Binding,
  value: string,
): PageData {
  if (binding.caseField || binding.chapter || binding.galleryIndex !== undefined) {
    const story = caseExperienceFor(page);
    if (binding.caseField) {
      return {...page, caseExperience:{...story, [binding.caseField]:value}};
    }
    if (binding.chapter) {
      return {...page, caseExperience:{...story,
        [binding.chapter]:{...story[binding.chapter],
          [binding.chapterTextField || "image"]:value}}};
    }
    if (binding.galleryIndex !== undefined) {
      return {...page, caseExperience:{...story,
        gallery:story.gallery.map((item,i)=>
          i === binding.galleryIndex ? {...item,src:value} : item)}};
    }
  }
  if (!binding.field) return page;
  return {
    ...page,
    sections: page.sections.map((s) =>
      s.id === binding.sectionId
        ? binding.itemIndex === undefined
          ? { ...s, [binding.field!]: value }
          : {
              ...s,
              items: s.items.map((item, index) =>
                index === binding.itemIndex ? { ...item, [binding.itemField || "image"]: value } : item,
              ),
            }
        : s,
    ),
  };
}
export function applyTemplateOverrides(
  host: HTMLElement,
  page: PageData,
  annotate = false,
  urls: Record<string, string> = {},
): void {
  host.querySelectorAll("[data-studio2-style]").forEach((el) => el.remove());
  const bindings = templateBindings(page);
  let css = "";
  for (const binding of bindings) {
    const override = page.builder?.overrides[binding.id];
    if (!annotate && !override) continue;
    const targets = [...host.querySelectorAll<HTMLElement>(binding.selector)];
    if (!targets.length) continue;
    for (const target of targets) {
      target.dataset.builderNode = binding.id;
      if (binding.kind === "image") {
        const src = bindingContent(page, binding);
        if (src.startsWith("asset:"))
          (target as HTMLImageElement).src = urls[src.slice(6)] || "";
        if (override?.alt !== undefined)
          (target as HTMLImageElement).alt = override.alt;
      }
    }
    if (override) {
      css += responsiveCss(binding.id, override);
      if (binding.field === "accent")
        for (const point of ["desktop", "tablet", "mobile"] as const) {
          if (override.styles[point]?.accentColor) {
            const selector =
              targetSelector(binding.id) + "{color:var(--s2-accent)!important}";
            css +=
              point === "desktop"
                ? selector
                : (point === "tablet"
                    ? "@media(max-width:1024px){"
                    : "@media(max-width:600px){") +
                  selector +
                  "}";
          }
        }
      for (const target of targets) {
        for (const styles of Object.values(override.styles)) {
          for (const key of [
            "fontSize",
            "fontWeight",
            "lineHeight",
            "letterSpacing",
            "color",
          ] as const) {
            if (styles?.[key] !== undefined)
              target.style.removeProperty(
                {
                  fontSize: "font-size",
                  fontWeight: "font-weight",
                  lineHeight: "line-height",
                  letterSpacing: "letter-spacing",
                  color: "color",
                }[key],
              );
          }
        }
      }
    }
  }
  if (css) {
    const style = host.ownerDocument.createElement("style");
    style.dataset.studio2Style = "true";
    style.textContent = css;
    host.append(style);
  }
}
export function updateOverride(
  page: PageData,
  id: string,
  fn: (value: TargetOverride) => TargetOverride,
): PageData {
  const builder = page.builder || {
    schemaVersion: 2 as const,
    mode: "template" as const,
    roots: [],
    overrides: {},
  };
  return {
    ...page,
    builder: {
      ...builder,
      overrides: {
        ...builder.overrides,
        [id]: fn(builder.overrides[id] || { styles: {} }),
      },
    },
  };
}
