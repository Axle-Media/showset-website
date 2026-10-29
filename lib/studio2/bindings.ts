import type { PageData } from "../types";
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
}
export function templateBindings(page: PageData): Binding[] {
  if (page.slug !== "home") return [];
  const hero = page.sections.find((s) => s.type === "hero");
  if (!hero) return [];
  const bindings: Binding[] = [
    {
      id: "home-hero",
      name: "Opening scene",
      kind: "section",
      selector: "#hero-track",
      sectionId: hero.id,
      content: false,
    },
    {
      id: "home-hero-title",
      name: "Hero headline",
      kind: "heading",
      selector: ".hero-title",
      sectionId: hero.id,
      field: "headline",
      content: true,
    },
    {
      id: "home-hero-accent",
      name: "Hero accent",
      kind: "heading",
      selector: ".hero-title .hero-accent-phrase>span",
      sectionId: hero.id,
      field: "accent",
      content: true,
    },
    {
      id: "home-hero-copy",
      name: "Hero paragraph",
      kind: "text",
      selector: "#hero-foreground>p",
      sectionId: hero.id,
      field: "body",
      content: true,
    },
    {
      id: "home-hero-image",
      name: "Hero photograph",
      kind: "image",
      selector: "#hero-photo>img",
      sectionId: hero.id,
      field: "image",
      content: true,
    },
    {
      id: "home-hero-button",
      name: "Primary action",
      kind: "button",
      selector: ".hero-links .solid-link",
      sectionId: hero.id,
      field: "buttonLabel",
      content: true,
    },
    {
      id: "home-hero-secondary",
      name: "Secondary action",
      kind: "button",
      selector: ".hero-links .text-arrow-link",
      sectionId: hero.id,
      field: "secondaryLabel",
      secondary: true,
      content: true,
    },
  ];
  for (const section of page.sections) {
    if (!["story", "services"].includes(section.type)) continue;
    section.items.forEach((item, index) => {
      if (!item.image) return;
      bindings.push({
        id: "home-" + section.type + "-image-" + index,
        name:
          (section.type === "story"
            ? "Story scene " + (index + 1)
            : item.title || "Service " + (index + 1)) + " photograph",
        kind: "image",
        selector:
          section.type === "story"
            ? '[data-film-image="' + index + '"] img'
            : '[data-service-visual="' + index + '"] img',
        sectionId: section.id,
        field: "image",
        itemIndex: index,
        content: true,
      });
    });
  }
  return bindings;
}
export function bindingContent(page: PageData, binding: Binding): string {
  const section = page.sections.find((s) => s.id === binding.sectionId);
  if (binding.itemIndex !== undefined)
    return String(section?.items[binding.itemIndex]?.image || "");
  return binding.field
    ? String(
        (section as unknown as Record<string, unknown>)?.[binding.field] ?? "",
      )
    : "";
}
export function updateBinding(
  page: PageData,
  binding: Binding,
  text: string,
): PageData {
  return {
    ...page,
    sections: page.sections.map((s) =>
      s.id === binding.sectionId
        ? binding.itemIndex === undefined
          ? { ...s, [binding.field!]: text }
          : {
              ...s,
              items: s.items.map((item, index) =>
                index === binding.itemIndex ? { ...item, image: text } : item,
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
    const target = host.querySelector<HTMLElement>(binding.selector);
    if (!target) continue;
    target.dataset.builderNode = binding.id;
    if (binding.kind === "image") {
      const src = bindingContent(page, binding);
      if (src.startsWith("asset:"))
        (target as HTMLImageElement).src = urls[src.slice(6)] || "";
      if (override?.alt !== undefined)
        (target as HTMLImageElement).alt = override.alt;
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
