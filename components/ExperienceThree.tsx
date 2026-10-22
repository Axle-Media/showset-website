"use client";
import React, { useEffect, useRef, useState } from "react";
import type { Block, BlockItem, Globals, PageData } from "@/lib/types";
import { safeHref } from "@/lib/safe";
import { ProjectModules } from "./WorkExperience";
type Wrap = (s: Block, node: React.ReactNode) => React.ReactNode;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
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
function Title({ s, h1 = false }: { s: Block; h1?: boolean }) {
  if (!s.headline && !s.accent) return null;
  const Tag = h1 ? "h1" : "h2";
  return (
    <Tag className="x3-title">
      <Text value={s.headline} />
      {s.accent && (
        <>
          <br />
          <em>
            <Text value={s.accent} />
          </em>
        </>
      )}
    </Tag>
  );
}
function Action({
  label,
  href,
  secondary = false,
}: {
  label?: string;
  href?: string;
  secondary?: boolean;
}) {
  return label ? (
    <a
      className={`x3-action ${secondary ? "x3-action-quiet" : ""}`}
      href={safeHref(href)}
    >
      <span>{label}</span>
      <span aria-hidden="true">↗</span>
    </a>
  ) : null;
}
function Actions({ s }: { s: Block }) {
  return (
    <div className="x3-actions">
      <Action label={s.buttonLabel} href={s.buttonHref} />
      <Action label={s.secondaryLabel} href={s.secondaryHref} secondary />
    </div>
  );
}
function useProgress(
  ref: React.RefObject<HTMLElement | null>,
  enabled: boolean,
  update: (p: number) => void,
) {
  const latest = useRef(update);
  latest.current = update;
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const e = ref.current;
      if (!e) return;
      const r = e.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      latest.current(clamp(-r.top / Math.max(1, r.height - innerHeight)));
    };
    const request = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    addEventListener("scroll", request, { passive: true });
    addEventListener("resize", request);
    request();
    return () => {
      removeEventListener("scroll", request);
      removeEventListener("resize", request);
      cancelAnimationFrame(raf);
    };
  }, [enabled, ref]);
}
function Journey({
  hero,
  story,
  g,
  wrap,
  motion,
  select,
}: {
  select?: (id: string) => void;
  hero: Block;
  story?: Block;
  g: Globals;
  wrap: Wrap;
  motion: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0),
    [choice, setChoice] = useState<number | null>(null);
  const active =
    choice ??
    Math.min(
      (story?.items.length || 1) - 1,
      Math.max(
        0,
        Math.floor(((progress - 0.25) / 0.75) * (story?.items.length || 1)),
      ),
    );
  const [mobile, setMobile] = useState(false);
  const [shortScreen, setShortScreen] = useState(false);
  useEffect(() => {
    const q = matchMedia("(max-width:800px)");
    const sync = () => setMobile(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    const q = matchMedia("(max-height:650px)");
    const sync = () => setShortScreen(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);
  const enabled =
    motion &&
    !shortScreen &&
    !!story &&
    hero.design?.motionPreset !== "still" &&
    story.design?.motionPreset !== "still";
  useProgress(root, enabled, setProgress);
  const photo =
    active === 0 ? hero.image : story?.items[active]?.image || hero.image;
  return (
    <section
      ref={root}
      className={`x3-journey ${enabled ? "" : "x3-journey-static"}`}
      data-pinned
      style={
        {
          "--journey-progress": progress,
          "--journey-length":
            hero.design?.motionPreset === "short" ? "175svh" : "235svh",
          "--journey-scale":
            1 +
            progress *
              Math.max(0, g.motion.heroScale - 1) *
              g.motion.storyParallax,
          "--x3-focal": hero.design?.imagePosition,
          "--x3-mobile-focal": hero.design?.mobileImagePosition,
        } as React.CSSProperties
      }
    >
      <div className="x3-journey-stage">
        <div className="x3-journey-pattern" aria-hidden="true" />
        <div
          className="x3-journey-photo"
          onClick={select ? () => select(hero.id) : undefined}
          style={
            hero.design?.radius != null
              ? { borderRadius: hero.design.radius }
              : undefined
          }
        >
          {[
            ...new Set([
              hero.image,
              ...(story?.items.map((x) => x.image) || []),
            ]),
          ]
            .filter(Boolean)
            .map((src) => (
              <img
                key={src}
                src={src}
                className={src === photo ? "is-active" : ""}
                alt=""
                fetchPriority={src === hero.image ? "high" : undefined}
                loading={src === hero.image ? "eager" : "lazy"}
              />
            ))}
          <div className="x3-photo-corner" aria-hidden="true">
            ↗
          </div>
        </div>
        {wrap(
          hero,
          <div
            className="x3-opening"
            inert={enabled && !mobile && progress > 0.3}
          >
            <div className="x3-opening-title">
              <h1>
                {hero.headline === "Great ideas should move" ? (
                  <>
                    Great ideas
                    <br />
                    should move
                    <br />
                    <em>
                      {hero.accent.endsWith(".") ? (
                        <>
                          {hero.accent.slice(0, -1)}
                          <span>.</span>
                        </>
                      ) : (
                        hero.accent
                      )}
                    </em>
                  </>
                ) : (
                  <>
                    <Text value={hero.headline} />
                    <br />
                    <em>
                      <Text value={hero.accent} />
                    </em>
                  </>
                )}
              </h1>
            </div>
            <div className="x3-opening-copy">
              <Copy value={hero.body} />
              <Actions s={hero} />
            </div>
            <a
              className="x3-journey-cue"
              href={story ? "#idea-taking-shape" : "#services"}
              onClick={(event) => {
                if (story && enabled && !mobile && root.current) {
                  event.preventDefault();
                  const element = root.current;
                  scrollTo({
                    top:
                      scrollY +
                      element.getBoundingClientRect().top +
                      (element.offsetHeight - innerHeight) * 0.44,
                    behavior: "smooth",
                  });
                }
              }}
            >
              <span>Ideas become experiences</span>
              <span aria-hidden="true">↓</span>
            </a>
          </div>,
        )}
        {story &&
          wrap(
            story,
            <div
              className="x3-journey-narrative"
              inert={enabled && !mobile && progress < 0.24}
              id="idea-taking-shape"
            >
              <Title s={story} />
              <Copy value={story.body} />
              <div className="x3-journey-intro">
                <Text value={hero.items[0]?.title} />
                {hero.items[0]?.accent && (
                  <>
                    {" "}
                    <em>{hero.items[0].accent}</em>
                  </>
                )}
                <Copy value={hero.items[0]?.description} />
              </div>
              <div
                className="x3-act-navigation"
                role="group"
                aria-label="Explore how an idea takes shape"
              >
                {story.items.map((x, i) => (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() => setChoice(i)}
                    aria-pressed={active === i}
                  >
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      {x.title} {x.accent}
                    </span>
                  </button>
                ))}
              </div>
              <div className="x3-act-copy" aria-live="polite">
                <h2>
                  <Text value={story.items[active]?.title} />
                  <br />
                  <em>
                    <Text value={story.items[active]?.accent} />
                  </em>
                </h2>
                <Copy value={story.items[active]?.description} />
              </div>
              <div className="x3-static-acts">
                {story.items.map((x) => (
                  <article key={x.id}>
                    <h2>
                      {x.title}
                      <br />
                      <em>{x.accent}</em>
                    </h2>
                    <Copy value={x.description} />
                  </article>
                ))}
              </div>
              <Actions s={story} />
            </div>,
          )}
      </div>
    </section>
  );
}
function Essay({ s, index = 0 }: { s: Block; index?: number }) {
  return (
    <section className={`x3-essay x3-essay-${index % 3}`}>
      <div className="x3-essay-mark" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
        <span>.</span>
      </div>
      <Title s={s} />
      <div className="x3-essay-copy">
        <Copy value={s.body} />
        <Actions s={s} />
      </div>
      {s.image &&
        (s.design?.variation === "photographic" ||
          (!s.design?.variation && index % 3 === 0)) && (
          <figure className="x3-essay-image">
            <img src={s.image} alt="" loading="lazy" />
          </figure>
        )}
    </section>
  );
}
function ServiceNavigator({
  s,
  catalog,
}: {
  s: Block;
  catalog: Record<string, PageData>;
}) {
  const [active, setActive] = useState(0);
  const current = s.items[active] || s.items[0];
  const service = Object.values(catalog).find((p) => p.route === current?.href);
  const capabilities =
    service?.sections.find((x) => x.type === "accordion")?.items.slice(0, 3) ||
    [];
  return (
    <section className="x3-service-section" id="services">
      <div className="x3-service-intro">
        <Title s={s} />
        <Copy value={s.body} />
      </div>
      <div className="x3-service-composition">
        <div className="x3-service-stage">
          {s.items.map((x, i) => (
            <img
              key={x.id}
              src={x.image}
              alt=""
              className={i === active ? "is-active" : ""}
              loading={i === active ? "eager" : "lazy"}
            />
          ))}
          <span className="x3-stage-number" aria-hidden="true">
            0{active + 1}
            <span>.</span>
          </span>
          <div className="x3-service-caption" aria-live="polite">
            <p>{current?.description}</p>
            <Action label="Explore this discipline" href={current?.href} />
          </div>
        </div>
        <div className="x3-service-index">
          <div role="group" aria-label="Choose a discipline">
            {s.items.map((x, i) => (
              <button
                type="button"
                key={x.id}
                aria-pressed={active === i}
                onClick={() => setActive(i)}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") setActive(i);
                }}
                onFocus={() => setActive(i)}
              >
                <span>{x.title}</span>
                <span aria-hidden="true">{active === i ? "−" : "+"}</span>
              </button>
            ))}
          </div>
          <div className="x3-service-capabilities" aria-live="polite">
            <p>We bring it together.</p>
            <ul>
              {capabilities.map((x) => (
                <li key={x.id}>{x.title}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
function WorkGallery({ s }: { s: Block }) {
  const [category, setCategory] = useState("All"),
    [selected, setSelected] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const categories = [
      "All",
      ...new Set(
        s.items.map((x) => x.category).filter((x): x is string => !!x),
      ),
    ],
    items = s.items.filter(
      (x) => category === "All" || x.category === category,
    ),
    index = Math.min(selected, items.length - 1),
    current = items[index];
  const move = (delta: number) =>
    setSelected((x) => (x + delta + items.length) % items.length);
  return (
    <section className="x3-work" id="portfolio-section">
      <div className="x3-work-heading">
        <Title s={s} />
        <div>
          <Copy value={s.body} />
          <Actions s={s} />
        </div>
      </div>
      <div
        className="x3-filter"
        role="group"
        aria-label="Filter creative explorations"
      >
        {categories.map((x) => (
          <button
            type="button"
            key={x}
            aria-pressed={category === x}
            onClick={() => {
              setCategory(x);
              setSelected(0);
            }}
          >
            {x}
          </button>
        ))}
      </div>
      {current && (
        <div className="x3-work-composition">
          <div className="x3-work-feature">
            <div
              className="x3-work-window"
              role="region"
              aria-label="Selected creative exploration"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  move(e.key === "ArrowRight" ? 1 : -1);
                }
              }}
              onDragStart={(e) => e.preventDefault()}
              onClickCapture={(e) => {
                if (dragged.current) {
                  e.preventDefault();
                  e.stopPropagation();
                  dragged.current = false;
                }
              }}
              onPointerDown={(e) => {
                dragged.current = false;
                start.current = { x: e.clientX, y: e.clientY };
              }}
              onPointerUp={(e) => {
                if (
                  start.current &&
                  Math.abs(e.clientX - start.current.x) > 60 &&
                  Math.abs(e.clientY - start.current.y) < 70
                ) {
                  dragged.current = true;
                  move(e.clientX < start.current.x ? 1 : -1);
                }
                start.current = null;
              }}
            >
              <a href={safeHref(current.href)} key={current.id}>
                <img
                  src={current.image}
                  alt={current.title}
                  loading="lazy"
                  draggable={false}
                />
              </a>
              <div className="x3-gallery-controls">
                <button
                  type="button"
                  aria-label="Previous exploration"
                  onClick={() => move(-1)}
                >
                  ←
                </button>
                <span aria-live="polite">
                  {String(index + 1).padStart(2, "0")} /{" "}
                  {String(items.length).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  aria-label="Next exploration"
                  onClick={() => move(1)}
                >
                  →
                </button>
              </div>
            </div>
            <div className="x3-feature-caption">
              <div>
                <p>{current.category}</p>
                <h3>
                  <a href={safeHref(current.href)}>
                    {current.title}
                    <span>.</span>
                  </a>
                </h3>
              </div>
              <div>
                <Copy value={current.description} />
                <Action
                  label="Explore the thinking"
                  href={current.href}
                  secondary
                />
              </div>
            </div>
          </div>
          <div
            className="x3-supporting-work"
            role="group"
            aria-label="Select an exploration"
          >
            {items.map((x, i) => (
              <button
                type="button"
                key={x.id}
                aria-pressed={index === i}
                onClick={() => setSelected(i)}
              >
                <img src={x.image} alt="" loading="lazy" />
                <span>
                  {x.title}
                  <b aria-hidden="true">↗</b>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
function BrandPassage({ s }: { s: Block }) {
  return (
    <section className="x3-brand-passage">
      <div className="x3-brand-route" aria-hidden="true">
        <span />
        <i />
        <span />
      </div>
      <div className="x3-brand-statement">
        <h2>
          <Text value={s.headline} />
        </h2>
        <Copy value={s.body} />
        <Actions s={s} />
      </div>
      <a
        className="x3-period-link"
        href={safeHref(s.buttonHref || "#ending")}
        aria-label={s.buttonLabel || "Continue to the next idea"}
      >
        <span aria-hidden="true">↗</span>
      </a>
    </section>
  );
}
function Closing({ s }: { s: Block }) {
  return (
    <section className="x3-closing" id="ending">
      <div className="x3-closing-prefix">
        <span>Our next experience</span>
        <span>Starts with a conversation.</span>
      </div>
      <div className="x3-closing-composition">
        <Title s={s} />
        <a className="x3-conversation" href={safeHref(s.buttonHref)}>
          <span>{s.buttonLabel || "Start a project"}</span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>
      <div className="x3-closing-copy">
        <Copy value={s.body} />
        <Action label={s.secondaryLabel} href={s.secondaryHref} secondary />
        {s.items.length > 0 && (
          <div className="x3-next-links">
            {s.items.map((x) => (
              <a href={safeHref(x.href)} key={x.id}>
                {x.title}
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
function PageOpening({ s, page }: { s: Block; page: PageData }) {
  return (
    <section className={`x3-page-opening x3-page-${page.slug}`}>
      <div className="x3-page-heading">
        <a className="x3-back" href="/">
          SHOWSET <span aria-hidden="true">↗</span>
        </a>
        <Title s={s} h1 />
        <div className="x3-page-description">
          <Copy value={s.body} />
          <Actions s={s} />
        </div>
      </div>
      <figure className="x3-page-photo">
        <img src={s.image} alt="" fetchPriority="high" />
        <figcaption>
          <span>
            {page.route.startsWith("/work/")
              ? "A creative exploration"
              : page.slug === "our-studio"
                ? "Our thinking. Our hands. Our people."
                : "Ideas become experiences."}
          </span>
          <span aria-hidden="true">↗</span>
        </figcaption>
      </figure>
    </section>
  );
}
function EditorialItems({ s }: { s: Block }) {
  const [active, setActive] = useState(0);
  return (
    <section className="x3-capability-essay">
      <div className="x3-capability-heading">
        <Title s={s} />
        <Copy value={s.body} />
        <Actions s={s} />
      </div>
      <div className="x3-capability-list">
        {s.items.map((x, i) => (
          <article key={x.id} className={i === active ? "is-active" : ""}>
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-expanded={active === i}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              <h3>{x.title}</h3>
              <b aria-hidden="true">{i === active ? "−" : "+"}</b>
            </button>
            <div className="x3-capability-body">
              <Copy value={x.description} />
              {x.image && <img src={x.image} alt="" loading="lazy" />}
              {x.href && <Action label="Explore" href={x.href} secondary />}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
function Questions({ s }: { s: Block }) {
  return (
    <section className="x3-questions">
      <div>
        <Title s={s} />
        <Copy value={s.body} />
        <Actions s={s} />
      </div>
      <div>
        {s.items.map((x) => (
          <details key={x.id}>
            <summary>
              {x.title}
              <span aria-hidden="true">+</span>
            </summary>
            <Copy value={x.description} />
            {x.href && <Action label="Explore" href={x.href} secondary />}
          </details>
        ))}
      </div>
    </section>
  );
}
function PhotographicEssay({ s }: { s: Block }) {
  return (
    <section className="x3-photo-essay">
      <figure>
        <img src={s.image} alt="" loading="lazy" />
      </figure>
      <div>
        <Title s={s} />
        <Copy value={s.body} />
        <Actions s={s} />
      </div>
    </section>
  );
}
export default function ExperienceThree({
  page,
  g,
  catalog,
  wrap,
  contact,
  motion,
  select,
}: {
  select?: (id: string) => void;
  page: PageData;
  g: Globals;
  catalog: Record<string, PageData>;
  wrap: Wrap;
  contact: (s: Block) => React.ReactNode;
  motion: boolean;
}) {
  const sections = page.sections;
  return (
    <div className="x3-pages" data-route={page.slug}>
      {sections.map((s, i) => {
        if (s.type === "story" && sections[i - 1]?.type === "hero") return null;
        const next = sections[i + 1];
        let node: React.ReactNode;
        switch (s.type) {
          case "hero":
            return (
              <Journey
                key={s.id}
                hero={s}
                story={next?.type === "story" ? next : undefined}
                g={g}
                wrap={wrap}
                motion={motion}
                select={select}
              />
            );
          case "story":
            node = (
              <section className="x3-process-sequence">
                {s.items.map((x, i) => (
                  <article key={x.id}>
                    <figure>
                      <img src={x.image} alt="" loading="lazy" />
                    </figure>
                    <div>
                      <span className="x3-process-number">0{i + 1}</span>
                      <h2>
                        {x.title}
                        <br />
                        <em>{x.accent}</em>
                      </h2>
                      <Copy value={x.description} />
                    </div>
                  </article>
                ))}
              </section>
            );
            break;
          case "pagehero":
            node = <PageOpening s={s} page={page} />;
            break;
          case "split":
            node = <Essay s={s} index={i} />;
            break;
          case "services":
            node = <ServiceNavigator s={s} catalog={catalog} />;
            break;
          case "work":
            node = <WorkGallery s={s} />;
            break;
          case "dot":
            node = <BrandPassage s={s} />;
            break;
          case "cta":
            node = <Closing s={s} />;
            break;
          case "items":
            node = <EditorialItems s={s} />;
            break;
          case "accordion":
            node = <Questions s={s} />;
            break;
          case "visual":
            node = <PhotographicEssay s={s} />;
            break;
          case "contact":
            node = contact(s);
            break;
        }
        return wrap(s, node);
      })}
      {page.route.startsWith("/work/") && (
        <div className="x3-project-modules">
          <ProjectModules
            page={page}
            projects={
              catalog["our-work"]?.sections.find((x) => x.type === "work")
                ?.items || []
            }
          />
        </div>
      )}
    </div>
  );
}
