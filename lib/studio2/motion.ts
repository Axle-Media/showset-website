import type { Motion } from "./model";
/** Only builder nodes opt into this owner; cinematic templates retain their runtime. */
export function mountNodeMotion(
  host: HTMLElement,
  motions: Record<string, Motion>,
  enabled: boolean,
) {
  let frame = 0,
    disposed = false;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const nodes = [
    ...host.querySelectorAll<HTMLElement>("[data-builder-motion]"),
  ];
  const baseOpacity = new Map<HTMLElement, number>();
  for (const element of nodes) {
    element.style.transition = "none";
    element.style.removeProperty("opacity");
    baseOpacity.set(element, Number(getComputedStyle(element).opacity));
  }
  const documentTop = (element: HTMLElement) => {
    let top = 0,
      target: HTMLElement | null = element;
    while (target) {
      top += target.offsetTop;
      target = target.offsetParent as HTMLElement | null;
    }
    return top;
  };
  const update = () => {
    frame = 0;
    if (disposed) return;
    // Read untransformed geometry first: transforms must not feed back into scroll progress.
    const positions = nodes.map((el) => ({
      el,
      top: documentTop(el) - scrollY,
      height: el.offsetHeight,
      motion: motions[el.dataset.builderMotion || ""],
    }));
    for (const { el, top, height, motion: m } of positions) {
      if (!m || !enabled || preference.matches || m.preset === "none") {
        for (const key of ["transform", "clip-path", "opacity", "transition"])
          el.style.removeProperty(key);
        continue;
      }
      const start = innerHeight * (1 - m.start),
        end = innerHeight * (1 - m.end);
      const p = Math.max(
        0,
        Math.min(1, (start - top) / Math.max(1, start - end)),
      );
      const visible = top < start && top + height > 0;
      let progress =
        m.trigger === "load" ? 1 : m.trigger === "scroll" ? p : visible ? 1 : 0;
      if (!m.replay && el.dataset.builderSeen === "true") progress = 1;
      if (progress === 1) el.dataset.builderSeen = "true";
      el.style.transition =
        m.trigger === "scroll"
          ? "none"
          : `opacity ${m.duration}ms ${m.ease} ${m.delay}ms,transform ${m.duration}ms ${m.ease} ${m.delay}ms,clip-path ${m.duration}ms ${m.ease} ${m.delay}ms`;
      if (m.preset === "fade")
        el.style.setProperty(
          "opacity",
          String(progress * (baseOpacity.get(el) ?? 1)),
          "important",
        );
      if (m.preset === "slide")
        el.style.transform = `translateY(${(1 - progress) * m.distance}px)`;
      if (m.preset === "scale")
        el.style.transform = `scale(${0.9 + progress * 0.1})`;
      if (m.preset === "parallax")
        el.style.transform = `translateY(${(p - 0.5) * m.distance}px)`;
      if (m.preset === "reveal")
        el.style.clipPath = `inset(0 ${(1 - progress) * 100}% 0 0)`;
    }
  };
  const schedule = () => {
    if (!frame && !disposed) frame = requestAnimationFrame(update);
  };
  // Establish a start frame for load-triggered effects before their first transition.
  if (enabled && !preference.matches)
    for (const el of nodes) {
      const m = motions[el.dataset.builderMotion || ""];
      if (!m || m.trigger === "scroll" || el.dataset.builderSeen === "true")
        continue;
      el.style.transition = "none";
      if (m.preset === "fade")
        el.style.setProperty("opacity", "0", "important");
      if (m.preset === "slide")
        el.style.transform = `translateY(${m.distance}px)`;
      if (m.preset === "scale") el.style.transform = "scale(.9)";
      if (m.preset === "reveal") el.style.clipPath = "inset(0 100% 0 0)";
    }
  void host.offsetHeight;
  schedule();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  preference.addEventListener("change", schedule);
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    preference.removeEventListener("change", schedule);
  };
}
