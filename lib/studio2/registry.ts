import type {
  Breakpoint,
  CanvasNode,
  StyleValues,
  TargetOverride,
} from "./model";
export const controlGroups = [
  "Content",
  "Layout",
  "Typography",
  "Background",
  "Motion",
  "Responsive",
  "Accessibility",
] as const;
export const registry = {
  section: {
    label: "Section",
    description: "A full-width chapter with its own background",
    container: true,
  },
  container: {
    label: "Container",
    description: "Arrange nested elements in rows, columns or a grid",
    container: true,
  },
  heading: {
    label: "Heading",
    description: "A semantic heading with a separate accent",
    container: false,
  },
  text: {
    label: "Text",
    description: "Readable editorial copy",
    container: false,
  },
  image: {
    label: "Image",
    description: "A photograph with alt text and responsive crop",
    container: false,
  },
  button: {
    label: "Button",
    description: "An accessible link and call to action",
    container: false,
  },
  divider: {
    label: "Divider",
    description: "A quiet visual rule",
    container: false,
  },
  spacer: {
    label: "Spacer",
    description: "Controlled breathing room",
    container: false,
  },
  accordion: {
    label: "Accordion",
    description: "Keyboard-native expandable content",
    container: false,
  },
  gallery: {
    label: "Gallery",
    description: "A responsive image collection",
    container: false,
  },
  video: {
    label: "Video",
    description: "Actual media with native accessible controls",
    container: false,
  },
} as const;
const dimension =
  /^(?:0|auto|none|(?:-?\d*\.?\d+)(?:px|%|em|rem|vw|vh|svh|ch)|clamp\([\d.]+(?:px|rem|vw),\s*[\d.]+(?:px|rem|vw),\s*[\d.]+(?:px|rem|vw)\))$/;
const hex = /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i;
function isColor(value: string): boolean {
  if (value === "transparent" || hex.test(value)) return true;
  const match = value.match(/^(rgb|rgba)\(([^()]*)\)$/i);
  if (!match) return false;
  const parts = match[2].split(",").map((x) => x.trim());
  if (parts.length !== (match[1].toLowerCase() === "rgba" ? 4 : 3))
    return false;
  return parts.every(
    (part, index) =>
      /^(?:\d*\.)?\d+%?$/.test(part) &&
      Number.parseFloat(part) >= 0 &&
      Number.parseFloat(part) <=
        (part.endsWith("%") ? 100 : index === 3 ? 1 : 255),
  );
}

const fields: Record<keyof StyleValues, string> = {
  display: "display",
  direction: "flex-direction",
  columns: "grid-template-columns",
  gap: "gap",
  padding: "padding",
  margin: "margin",
  width: "width",
  maxWidth: "max-width",
  minHeight: "min-height",
  height: "height",
  align: "align-items",
  justify: "justify-content",
  fontFamily: "font-family",
  fontSize: "font-size",
  fontWeight: "font-weight",
  lineHeight: "line-height",
  letterSpacing: "letter-spacing",
  color: "color",
  accentColor: "--s2-accent",
  textAlign: "text-align",
  background: "background",
  radius: "border-radius",
  borderWidth: "border-width",
  borderColor: "border-color",
  opacity: "opacity",
  objectFit: "object-fit",
  objectPosition: "object-position",
};
export function validStyle(key: keyof StyleValues, value: unknown): boolean {
  if (!(key in fields)) return false;
  const s = String(value);
  if (s.length > 180 || /[;{}<>\\]/.test(s)) return false;
  if (["color", "accentColor", "borderColor"].includes(key)) return isColor(s);
  if (key === "background") {
    const gradient = s.match(
      /^linear-gradient\((\d+(?:\.\d+)?)deg,\s*(#[\da-f]+),\s*(#[\da-f]+)\)$/i,
    );
    return (
      isColor(s) ||
      (!!gradient &&
        Number.isFinite(Number(gradient[1])) &&
        hex.test(gradient[2]) &&
        hex.test(gradient[3]))
    );
  }
  if (
    ["columns", "fontWeight", "lineHeight", "opacity"].includes(key) &&
    typeof value !== "number"
  )
    return false;
  if (key === "columns")
    return (
      Number.isInteger(Number(value)) &&
      Number(value) >= 1 &&
      Number(value) <= 6
    );
  if (key === "fontWeight") return Number(value) >= 100 && Number(value) <= 900;
  if (key === "lineHeight") return Number(value) >= 0.8 && Number(value) <= 3;
  if (key === "opacity") return Number(value) >= 0 && Number(value) <= 1;
  if (key === "fontFamily") return ["Poppins", "Manrope"].includes(s);
  const enums: Partial<Record<keyof StyleValues, string[]>> = {
    display: ["block", "flex", "grid"],
    direction: ["row", "column"],
    align: ["start", "center", "end", "stretch"],
    justify: ["start", "center", "end", "space-between"],
    textAlign: ["left", "center", "right"],
    objectFit: ["cover", "contain"],
  };
  if (enums[key]) return enums[key]!.includes(s);
  if (key === "objectPosition")
    return (
      /^\d{1,3}% \d{1,3}%$/.test(s) &&
      s.split(" ").every((x) => parseFloat(x) <= 100)
    );
  const parts = s.split(/\s+(?![^()]*\))/);
  if (parts.length > (["padding", "margin", "radius"].includes(key) ? 4 : 1))
    return false;
  if (
    parts.some(
      (x) =>
        (x === "none" && key !== "maxWidth") ||
        (x === "auto" && !["margin", "width", "height"].includes(key)) ||
        (x.startsWith("-") && !["margin", "letterSpacing"].includes(key)),
    )
  )
    return false;
  return parts.every((x) => dimension.test(x));
}
export function styleText(styles: StyleValues = {}): string {
  return (Object.entries(styles) as [keyof StyleValues, unknown][])
    .filter(([k, v]) => k in fields && validStyle(k, v))
    .map(
      ([k, v]) =>
        `${fields[k]}:${k === "columns" ? `repeat(${v},minmax(0,1fr))` : v}!important${k === "borderWidth" ? ";border-style:solid!important" : ""}`,
    )
    .join(";");
}
export const targetSelector = (id: string) =>
  '.concept-12-root #main [data-builder-node][data-builder-node="' +
  id.replace(/[^\w-]/g, "") +
  '"]';
export function responsiveCss(
  id: string,
  override: Pick<CanvasNode, "styles" | "patterns"> | TargetOverride,
): string {
  const selector = targetSelector(id);
  let css = "";
  for (const breakpoint of ["desktop", "tablet", "mobile"] as Breakpoint[]) {
    let rule = styleText(override.styles[breakpoint]);
    const pattern = override.patterns?.[breakpoint];
    if (pattern?.preset === "closing") {
      const prefix =
        breakpoint === "desktop"
          ? ""
          : breakpoint === "tablet"
            ? "@media(max-width:1024px){"
            : "@media(max-width:600px){";
      css +=
        prefix +
        selector +
        "{position:relative;isolation:isolate}" +
        selector +
        '::before{content:""!important;position:absolute;inset:0 0 auto;height:clamp(420px,37vw,565px);pointer-events:none;z-index:0;background-image:url("/media/studio-cta-pattern.svg")!important;background-size:clamp(660px,66vw,1100px) auto!important;background-position:right -210px center!important;background-repeat:no-repeat!important;opacity:' +
        (pattern.enabled ? ".42" : "0") +
        "!important;transform:none!important;mix-blend-mode:normal!important}" +
        selector +
        ">*{z-index:1}" +
        (breakpoint === "desktop" ? "" : "}");
      css +=
        "@media(max-width:800px) and (min-width:601px){" +
        selector +
        "::before{background-size:750px auto!important;background-position:calc(100% + 285px) center!important;opacity:" +
        (pattern.enabled ? ".32" : "0") +
        "!important}}@media(max-width:600px){" +
        selector +
        "::before{background-size:590px auto!important;background-position:calc(100% + 280px) center!important;opacity:" +
        (pattern.enabled ? ".24" : "0") +
        "!important}}";
    } else if (pattern) {
      const p = {
        ...pattern,
        x: Math.max(-200, Math.min(200, pattern.x)),
        y: Math.max(-200, Math.min(200, pattern.y)),
        size: Math.max(50, Math.min(2400, pattern.size)),
        opacity: Math.max(0, Math.min(1, pattern.opacity)),
        rotation: Math.max(-180, Math.min(180, pattern.rotation)),
      };
      rule += ";position:relative;isolation:isolate";
      css +=
        (breakpoint === "desktop"
          ? ""
          : breakpoint === "tablet"
            ? "@media(max-width:1024px){"
            : "@media(max-width:600px){") +
        selector +
        '::before{content:""!important;position:absolute;inset:0;pointer-events:none;z-index:0;background-image:url("/media/studio-cta-pattern.svg")!important;background-size:' +
        p.size +
        "px auto!important;background-position:" +
        p.x +
        "% " +
        p.y +
        "%!important;background-repeat:" +
        (p.repeat ? "repeat" : "no-repeat") +
        "!important;opacity:" +
        (p.enabled ? p.opacity : 0) +
        "!important;transform:rotate(" +
        p.rotation +
        "deg);mix-blend-mode:" +
        (["normal", "multiply", "screen"].includes(p.blend)
          ? p.blend
          : "normal") +
        "}" +
        selector +
        ">*{z-index:1}" +
        (breakpoint === "desktop" ? "" : "}");
    }
    if (rule)
      css +=
        (breakpoint === "desktop"
          ? ""
          : breakpoint === "tablet"
            ? "@media(max-width:1024px){"
            : "@media(max-width:600px){") +
        selector +
        "{" +
        rule +
        "}" +
        selector +
        " .s2-accent," +
        selector +
        " .hero-accent-phrase>span{ color:var(--s2-accent,#12BAAF)!important}" +
        (breakpoint === "desktop" ? "" : "}");
  }
  return css;
}
