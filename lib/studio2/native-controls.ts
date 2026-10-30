import type { Motion, Pattern, Breakpoint } from "./model";
import { targetSelector } from "./registry";

/**
 * These are ordinary editorial sections. Never apply decorative layers or new
 * transform animations to a pinned track, cinematic scene, or closing CTA.
 */
const editorial = new Set([
  "home-section-section-2", "home-section-section-5",
  "service-section-section-2", "service-section-section-6",
  "studio-section-section-2", "studio-section-section-5",
  "work-section-section-2", "work-section-section-3",
]);
export function canDecorateNative(id: string): boolean {
  return editorial.has(id);
}
export function permittedNativeMotion(motion: Motion): boolean {
  return ["none", "fade", "slide", "scale"].includes(motion.preset) &&
    motion.trigger === "load" &&
    Number.isFinite(motion.duration) && motion.duration >= 0 && motion.duration <= 2500 &&
    Number.isFinite(motion.delay) && motion.delay >= 0 && motion.delay <= 1500 &&
    Number.isFinite(motion.distance) && motion.distance >= 0 && motion.distance <= 70 &&
    ["ease", "linear", "ease-in-out"].includes(motion.ease) &&
    Number.isFinite(motion.start) && motion.start >= 0 && motion.start < 1 &&
    Number.isFinite(motion.end) && motion.end > motion.start && motion.end <= 1 &&
    typeof motion.replay === "boolean";
}
const query = (point: Breakpoint, rule: string) =>
  point === "desktop" ? rule :
    "@media(max-width:" + (point === "tablet" ? "1024" : "600") + "px){" + rule + "}";
export function nativeDecorationCss(
  id: string,
  patterns: Partial<Record<Breakpoint, Pattern>> | undefined,
  motion: Motion | undefined,
): string {
  if (!canDecorateNative(id)) return "";
  const selector = targetSelector(id);
  const overlay = selector + ' > [data-studio2-native-pattern="' + id + '"]';
  let css = "";
  if (patterns && Object.values(patterns).some(p => p?.enabled)) {
    css += selector + "{position:relative;isolation:isolate}" +
      selector + " > :not([data-studio2-native-pattern]){position:relative;z-index:1}" +
      overlay + '{position:absolute;inset:0;display:block;z-index:0;pointer-events:none;' +
      'background-image:url("/media/studio-cta-pattern.svg");background-repeat:no-repeat}';
    for (const point of ["desktop", "tablet", "mobile"] as Breakpoint[]) {
      const p = patterns[point];
      if (!p) continue;
      css += query(point, overlay + "{background-position:" +
        p.x + "% " + p.y + "%;background-size:" + p.size +
        "px auto;background-repeat:" + (p.repeat ? "repeat" : "no-repeat") +
        ";opacity:" + (p.enabled ? p.opacity : 0) +
        ";transform:rotate(" + p.rotation + "deg);mix-blend-mode:" + p.blend + "}");
    }
  }
  if (motion && motion.preset !== "none" && permittedNativeMotion(motion)) {
    const intro = motion.preset === "slide" ? "translateY(" + motion.distance + "px)" :
      motion.preset === "scale" ? "scale(.975)" : "none";
    const name = "s2-native-" + id.replace(/[^a-z0-9_-]/gi, "");
    css += "@keyframes " + name + "{from{opacity:0;transform:" + intro +
      "}to{opacity:1;transform:none}}" +
      selector + " > :not([data-studio2-native-pattern]){animation:" + name +
      " " + motion.duration + "ms " + motion.ease + " " +
      motion.delay + "ms both}" +
      "@media(prefers-reduced-motion:reduce){" + selector +
      " > :not([data-studio2-native-pattern]){animation:none!important}}";
  }
  return css;
}
