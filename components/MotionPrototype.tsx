"use client";
import React, { useEffect, useRef, useState } from "react";
import type { Block, Globals, PageData } from "@/lib/types";
import { safeHref } from "@/lib/safe";
import ExperienceThree from "./ExperienceThree";

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const phase = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
function Text({ value }: { value?: string }) {
  return (
    <>
      {
        (value || "")
          .split(/(<br\s*\/?>|<\/?em>|<\/?span[^>]*>)/gi)
          .filter(Boolean)
          .reduce<{ nodes: React.ReactNode[]; em: boolean }>(
            (a, x, i) => {
              if (/^<br/i.test(x)) a.nodes.push(<br key={i} />);
              else if (/^<em>/i.test(x)) a.em = true;
              else if (/^<\/em>/i.test(x)) a.em = false;
              else if (!/^<\/?span/i.test(x))
                a.nodes.push(a.em ? <em key={i}>{x}</em> : x);
              return a;
            },
            { nodes: [], em: false },
          ).nodes
      }
    </>
  );
}
function Copy({ value }: { value?: string }) {
  return (
    <>
      {(value || "")
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((x, i) => (
          <p key={i}>
            <Text value={x} />
          </p>
        ))}
    </>
  );
}
function Actions({ s }: { s: Block }) {
  return (
    <div className="mp-actions">
      {[
        [s.buttonLabel, s.buttonHref],
        [s.secondaryLabel, s.secondaryHref],
      ]
        .filter((x) => x[0])
        .map(([label, href]) => (
          <a key={label} href={safeHref(href)} className="mp-action">
            <span>{label}</span>
            <span aria-hidden="true">↗</span>
          </a>
        ))}
    </div>
  );
}

/** One native scroll listener, one frame per event batch, and symmetric teardown. */
function useScene(
  ref: React.RefObject<HTMLElement | null>,
  enabled: boolean,
  draw: (p: number, w: number, h: number) => void,
) {
  const latest = useRef(draw);
  latest.current = draw;
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const paint = () => {
      frame = 0;
      const e = ref.current;
      if (!e) return;
      const r = e.getBoundingClientRect();
      latest.current(
        clamp(-r.top / Math.max(1, r.height - innerHeight)),
        innerWidth,
        innerHeight,
      );
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const resize = new ResizeObserver(request);
    if (ref.current) resize.observe(ref.current);
    addEventListener("scroll", request, { passive: true });
    addEventListener("resize", request);
    request();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      removeEventListener("scroll", request);
      removeEventListener("resize", request);
    };
  }, [enabled, ref]);
}
function useTallScreen() {
  const [tall, setTall] = useState(false);
  useEffect(() => {
    const q = matchMedia("(min-height:651px)");
    const sync = () => setTall(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);
  return tall;
}
type Wrap = (s: Block, node: React.ReactNode) => React.ReactNode;
function Opening({
  hero,
  story,
  motion,
  g,
  wrap,
  select,
}: {
  hero: Block;
  story?: Block;
  motion: boolean;
  g: Globals;
  wrap: Wrap;
  select?: (id: string) => void;
}) {
  const root = useRef<HTMLElement>(null),
    photo = useRef<HTMLDivElement>(null),
    title = useRef<HTMLDivElement>(null),
    acts = useRef<HTMLDivElement>(null);
  const enabled =
    useTallScreen() &&
    motion &&
    hero.design?.motionPreset !== "still" &&
    story?.design?.motionPreset !== "still";
  const items = story?.items || [];
  useScene(root, enabled, (p, w, h) => {
    const mobile = w < 801,
      expansion = phase(p, 0.02, 0.32),
      ease = expansion * expansion * (3 - 2 * expansion);
    const x = mobile ? 0.07 : 0.52,
      y = mobile ? (h < 800 ? 0.68 : 0.56) : 0.48,
      pw = mobile ? 0.86 : 0.42,
      ph = mobile ? (h < 800 ? 0.25 : 0.35) : 0.44;
    if (photo.current) {
      photo.current.style.transform = `translate3d(${x * w * (1 - ease)}px,${y * h * (1 - ease)}px,0)`;
      photo.current.style.width = `${w * (pw + (1 - pw) * ease)}px`;
      photo.current.style.height = `${h * (ph + (1 - ph) * ease)}px`;
      photo.current.style.setProperty(
        "--shade",
        String(0.12 + 0.48 * phase(p, 0.22, 0.38)),
      );
      const images =
        photo.current.querySelectorAll<HTMLElement>(".mp-photo-layer");
      images.forEach((e, i) => {
        const reveal =
          i === 0 ? 1 : phase(p, 0.36 + (i - 1) * 0.27, 0.51 + (i - 1) * 0.27);
        e.style.clipPath = `inset(0 ${100 * (1 - reveal)}% 0 0)`;
        const zoom = clamp(g.motion.heroScale - 1);
        e.style.transform = `scale(${1 + zoom * (i === 0 ? ease : 1 - reveal)})`;
      });
    }
    if (title.current) {
      title.current.style.opacity = String(1 - phase(p, 0.08, 0.25));
      title.current.style.transform = `translate3d(0,${-90 * phase(p, 0.02, 0.3)}px,0)`;
      title.current.inert = p > 0.25;
    }
    if (acts.current) {
      const active = Math.min(
        items.length - 1,
        Math.max(0, Math.floor((p - 0.33) / 0.27)),
      );
      acts.current.querySelectorAll<HTMLElement>(".mp-act").forEach((e, i) => {
        const visible = p >= 0.29 && i === active;
        e.style.opacity = visible ? "1" : "0";
        e.style.transform = `translate3d(0,${visible ? 0 : 24 * Math.max(0, Math.min(2, g.motion.storyParallax))}px,0)`;
        e.style.visibility = visible ? "visible" : "hidden";
      });
      acts.current.style.setProperty(
        "--story-progress",
        String(phase(p, 0.29, 1)),
      );
      acts.current.style.setProperty("--story-visible", p >= 0.29 ? "1" : "0");
    }
    root.current?.setAttribute("data-progress", p.toFixed(3));
  });
  const images = items.length
    ? items.map((x, i) => (i === 0 ? hero.image || x.image : x.image))
    : [hero.image];
  return wrap(
    hero,
    <section
      ref={root}
      className={`mp-opening ${enabled ? "is-animated" : "is-static"}`}
      style={
        {
          "--mp-length":
            hero.design?.motionPreset === "short" ? "215svh" : "300svh",
        } as React.CSSProperties
      }
    >
      <div className="mp-opening-stage">
        <div className="mp-opening-title" ref={title}>
          <span className="mp-eyebrow">SHOWSET / Ideas into experiences</span>
          <h1>
            <Text value={hero.headline} />
            <br />
            <em>
              <Text value={hero.accent} />
            </em>
          </h1>
          <div className="mp-opening-foot">
            <div>
              <Copy value={hero.body} />
              <Actions s={hero} />
            </div>
            <a
              className="mp-scroll"
              href="#motion-story"
              onClick={(e) => {
                if (enabled && root.current) {
                  e.preventDefault();
                  scrollTo({
                    top:
                      scrollY +
                      root.current.getBoundingClientRect().top +
                      (root.current.offsetHeight - innerHeight) * 0.36,
                    behavior: "smooth",
                  });
                }
              }}
            >
              Follow the idea <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
        <div className="mp-opening-photo" ref={photo} aria-hidden="true">
          {images.map((src, i) => (
            <img
              key={`${i}-${src}`}
              className="mp-photo-layer"
              src={src}
              alt=""
              fetchPriority={i === 0 ? "high" : "auto"}
              loading={i === 0 ? "eager" : "lazy"}
            />
          ))}
          <div className="mp-photo-shade" />
        </div>
        {story && (
          <div
            className="mp-story"
            id="motion-story"
            ref={acts}
            data-story-section={story.id}
            style={
              {
                "--story-heading": story.design?.headingSize
                  ? `${story.design.headingSize}px`
                  : undefined,
                "--story-mobile-heading": story.design?.mobileHeadingSize
                  ? `${story.design.mobileHeadingSize}px`
                  : undefined,
                "--block-body": story.design?.bodySize
                  ? `${story.design.bodySize}px`
                  : undefined,
              } as React.CSSProperties
            }
            onClick={() => select?.(story.id)}
          >
            {items.map((x, i) => (
              <article
                className="mp-act"
                aria-hidden={enabled || undefined}
                key={x.id}
              >
                {!enabled && <img src={x.image} alt="" loading="lazy" />}
                <div>
                  <span className="mp-eyebrow">
                    0{i + 1} / 0{items.length}
                  </span>
                  <h2>
                    <Text value={x.title} />
                    <br />
                    <em>
                      <Text value={x.accent} />
                    </em>
                  </h2>
                  <Copy value={x.description} />
                </div>
              </article>
            ))}
            {enabled && (
              <div className="sr-only">
                {items.map((x) => (
                  <div key={x.id}>
                    <h2>
                      {x.title} {x.accent}
                    </h2>
                    <Copy value={x.description} />
                  </div>
                ))}
              </div>
            )}
            <div className="mp-story-line" aria-hidden="true">
              <i />
            </div>
          </div>
        )}
      </div>
    </section>,
  );
}
function Signature({ s, motion }: { s: Block; motion: boolean }) {
  const root = useRef<HTMLElement>(null),
    reveal = useRef<HTMLDivElement>(null);
  const enabled =
    useTallScreen() && motion && s.design?.motionPreset !== "still";
  useScene(root, enabled, (p, w, h) => {
    const r = 16 + Math.hypot(w, h) * 0.6 * phase(p, 0.04, 0.94);
    if (reveal.current)
      reveal.current.style.clipPath = `circle(${r}px at 50% 50%)`;
    root.current?.setAttribute("data-progress", p.toFixed(3));
  });
  const content = (
    <>
      <span className="mp-eyebrow">The SHOWSET signature</span>
      <h2>
        <Text value={s.headline} />
      </h2>
      <Copy value={s.body} />
      <Actions s={s} />
    </>
  );
  return (
    <section
      className={`mp-signature ${enabled ? "is-animated" : "is-static"}`}
      ref={root}
    >
      <div className="mp-signature-stage">
        <div className="mp-signature-copy">{content}</div>
        <div
          className="mp-signature-reveal"
          ref={reveal}
          aria-hidden="true"
          inert
        >
          <div className="mp-signature-copy">{content}</div>
        </div>
      </div>
    </section>
  );
}
function Services({ s, motion }: { s: Block; motion: boolean }) {
  const [active, setActive] = useState(0),
    buttons = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    setActive((i) => Math.min(i, Math.max(0, s.items.length - 1)));
  }, [s.items.length]);
  const x = s.items[active];
  return (
    <section id="services" className={`mp-services ${motion ? "" : "mp-no-motion"}`}>
      <header>
        <span className="mp-eyebrow">One team. Every part of the picture.</span>
        <h2>
          <Text value={s.headline} />
          <br />
          <em>
            <Text value={s.accent} />
          </em>
        </h2>
        <Copy value={s.body} />
      </header>
      <div className="mp-services-grid">
        <div
          className="mp-service-tabs"
          role="tablist"
          aria-label="Our disciplines"
          aria-orientation="vertical"
        >
          {s.items.map((item, i) => (
            <button
              key={item.id}
              ref={(e) => {
                buttons.current[i] = e;
              }}
              role="tab"
              id={`mp-service-tab-${i}`}
              aria-selected={i === active}
              aria-controls={`mp-service-panel-${i}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              onFocus={() => setActive(i)}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") setActive(i);
              }}
              onKeyDown={(e) => {
                let n = i;
                if (["ArrowDown", "ArrowRight"].includes(e.key))
                  n = (i + 1) % s.items.length;
                else if (["ArrowUp", "ArrowLeft"].includes(e.key))
                  n = (i - 1 + s.items.length) % s.items.length;
                else if (e.key === "Home") n = 0;
                else if (e.key === "End") n = s.items.length - 1;
                else return;
                e.preventDefault();
                setActive(n);
                buttons.current[n]?.focus();
              }}
            >
              <span>0{i + 1}</span>
              <span>{item.title}</span>
              <i aria-hidden="true">↗</i>
            </button>
          ))}
        </div>
        <div className="mp-service-environment">
          {s.items.map((item, i) => (
            <div
              key={item.id}
              role="tabpanel"
              id={`mp-service-panel-${i}`}
              aria-labelledby={`mp-service-tab-${i}`}
              className={`mp-service-panel ${i === active ? "is-active" : ""}`}
              hidden={i !== active}
            >
              <div className="mp-service-photo">
                <img src={item.image} alt="" loading="lazy" />
              </div>
              <div className="mp-service-caption">
                <span className="mp-eyebrow">
                  0{i + 1} / 0{s.items.length}
                </span>
                <Copy value={item.description} />
                {item.href && (
                  <a className="mp-action" href={safeHref(item.href)}>
                    Explore the discipline <span aria-hidden="true">↗</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {!x && <Copy value={s.body} />}
    </section>
  );
}
function Gallery({ s }: { s: Block }) {
  const track = useRef<HTMLDivElement>(null);
  const move = (direction: number) => {
    const e = track.current;
    if (e)
      e.scrollBy({
        left:
          direction *
            (e.firstElementChild?.getBoundingClientRect().width ||
              e.clientWidth) +
          direction * 24,
        behavior: matchMedia("(prefers-reduced-motion:reduce)").matches
          ? "instant"
          : "smooth",
      });
  };
  return (
    <section className="mp-work">
      <header>
        <div>
          <span className="mp-eyebrow">Work worth exploring</span>
          <h2>
            <Text value={s.headline} />
            <br />
            <em>
              <Text value={s.accent} />
            </em>
          </h2>
          <Copy value={s.body} />
        </div>
        <div className="mp-gallery-controls">
          <button aria-label="Previous project" onClick={() => move(-1)}>
            ←
          </button>
          <button aria-label="Next project" onClick={() => move(1)}>
            →
          </button>
        </div>
      </header>
      <div
        className="mp-gallery"
        ref={track}
        role="region"
        aria-label="Project gallery"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            move(e.key === "ArrowRight" ? 1 : -1);
          }
        }}
      >
        {s.items.map((x, i) => (
          <a className="mp-project" key={x.id} href={safeHref(x.href)}>
            <figure>
              <img src={x.image} alt="" loading="lazy" />
              <span className="mp-project-cue" aria-hidden="true">
                Explore ↗
              </span>
            </figure>
            <div>
              <span className="mp-eyebrow">
                0{i + 1} / {x.category || "Creative exploration"}
              </span>
              <h3>{x.title}</h3>
              <Copy value={x.description} />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
export default function MotionPrototype({
  page,
  g,
  catalog,
  wrap,
  contact,
  motion,
  select,
}: {
  page: PageData;
  g: Globals;
  catalog: Record<string, PageData>;
  wrap: Wrap;
  contact: (s: Block) => React.ReactNode;
  motion: boolean;
  select?: (id: string) => void;
}) {
  const hero = page.sections.find((x) => x.type === "hero"),
    story = page.sections.find((x) => x.type === "story"),
    dot = page.sections.find((x) => x.type === "dot"),
    services = page.sections.find((x) => x.type === "services"),
    work = page.sections.find((x) => x.type === "work");
  const composed = new Set([
    hero?.id,
    hero ? story?.id : undefined,
    dot?.id,
    services?.id,
    work?.id,
  ]);
  const remaining = page.sections.filter((x) => !composed.has(x.id));
  const tail = (sections: Block[]) => (
    <ExperienceThree
      page={{ ...page, sections }}
      g={g}
      catalog={catalog}
      wrap={wrap}
      contact={contact}
      motion={motion}
      select={select}
    />
  );
  return (
    <div
      className={`mp-home ${motion ? "" : "mp-no-motion"}`}
      data-prototype="motion"
    >
      {hero && (
        <Opening
          hero={hero}
          story={story}
          motion={motion}
          g={g}
          wrap={wrap}
          select={select}
        />
      )}
      {tail(remaining.filter((x) => x.type === "split"))}
      {dot &&
        wrap(
          dot,
          <Signature s={dot} motion={motion && g.motion.circleReveal} />,
        )}
      {services && wrap(services, <Services s={services} motion={motion} />)}
      {work && wrap(work, <Gallery s={work} />)}
      {tail(remaining.filter((x) => x.type !== "split"))}
    </div>
  );
}
