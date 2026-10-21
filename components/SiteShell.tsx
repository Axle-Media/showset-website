"use client";
import React, { useState, useEffect, useRef, useId } from "react";
import { CuratedGallery, ProjectModules } from "./WorkExperience";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import type { PageData, Globals, Block, BlockItem } from "@/lib/types";
import { apiEndpoint, defaultPages } from "@/lib/data";
import { safeHref } from "@/lib/safe";
import { patternImage } from "@/lib/pattern";

type Props = {
  initialPage: PageData;
  initialGlobals: Globals;
  editor?: boolean;
  onSelect?: (id: string) => void;
  selectedId?: string;
};
const clamp = (n: number) => Math.min(1, Math.max(0, n));
function useReduced() {
  const [reduced, set] = useState(false);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => set(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);
  return reduced;
}
function useScene(
  ref: React.RefObject<HTMLElement | null>,
  enabled: boolean,
  update: (el: HTMLElement, p: number, rect: DOMRect) => void,
) {
  const fn = useRef(update);
  fn.current = update;
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let raf = 0;
    const frame = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      fn.current(el, clamp(-r.top / Math.max(1, r.height - innerHeight)), r);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule, { passive: true });
    schedule();
    return () => {
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
      cancelAnimationFrame(raf);
    };
  }, [ref, enabled]);
}
function Rich({ text }: { text?: string }) {
  return (
    <>
      {
        (text || "")
          .split(/(<br\s*\/?>|<\/?em>|<\/?span[^>]*>)/gi)
          .filter(Boolean)
          .reduce<{ nodes: React.ReactNode[]; em: boolean }>(
            (a, part, i) => {
              if (/^<br/i.test(part)) a.nodes.push(<br key={i} />);
              else if (/^<em>/i.test(part)) a.em = true;
              else if (/^<\/em>/i.test(part)) a.em = false;
              else if (!/^<\/?span/i.test(part))
                a.nodes.push(
                  a.em ? (
                    <em key={i}>
                      {part === "possibilities." ? (
                        <>
                          possibilities<span>.</span>
                        </>
                      ) : (
                        part
                      )}
                    </em>
                  ) : (
                    part
                  ),
                );
              return a;
            },
            { nodes: [], em: false },
          ).nodes
      }
    </>
  );
}
function Paragraph({ text, join = false }: { text: string; join?: boolean }) {
  return (
    <>
      {(join ? [text.replace(/\n+/g, " ")] : text.split(/\n\s*\n/))
        .filter(Boolean)
        .map((p, i) => (
          <p key={i}>
            <Rich text={p} />
          </p>
        ))}
    </>
  );
}
function Heading({
  s,
  as = "h2",
  className = "section-title block-heading",
  plain = false,
}: {
  s: Block;
  as?: "h1" | "h2" | "h3";
  className?: string;
  plain?: boolean;
}) {
  const H = as;
  return (
    <H className={`${className}${!s.reveal ? " is-revealed" : ""}`}>
      <span className={plain ? "plain-line" : "wipe-line"}>
        {plain ? s.headline : <span>{s.headline}</span>}
      </span>
      {s.accent && (
        <span
          className={plain ? "plain-line accent-text" : "wipe-line accent-line"}
        >
          {plain ? s.accent : <span>{s.accent}</span>}
        </span>
      )}
    </H>
  );
}
function Link({
  label,
  href,
  className = "solid-link",
}: {
  label?: string;
  href?: string;
  className?: string;
}) {
  return label ? (
    <a className={className} href={safeHref(href)}>
      {label} <span aria-hidden="true">↗</span>
    </a>
  ) : null;
}
function Brand({ g }: { g: Globals }) {
  return (
    <a className="brand" href="/" aria-label="SHOWSET home">
      <img
        className="approved-wordmark"
        src={g.brand.logo || "/brand/approved-wordmark.png"}
        width="481"
        height="125"
        alt={`${g.brand.wordmark}. ${g.brand.tagline}`}
      />
    </a>
  );
}
function Header({ g }: { g: Globals }) {
  const pathname = usePathname();
  const current = (href: string) =>
    pathname.replace(/\/$/, "") === href.replace(/\/$/, "")
      ? ("page" as const)
      : undefined;
  const [open, setOpen] = useState(false),
    [mobile, setMobile] = useState(false),
    [scrolled, setScrolled] = useState(false);
  const root = useRef<HTMLElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    toggle = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    const scroll = () => setScrolled(scrollY > 28);
    scroll();
    addEventListener("scroll", scroll, { passive: true });
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (mobile && e.key === "Tab") {
        const nodes = Array.from(
          document.querySelectorAll<HTMLElement>(
            ".site-header a,.site-header button,.mobile-panel a",
          ),
        ).filter((x) => x.getBoundingClientRect().width > 0);
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
      if (e.key === "Escape") {
        if (open) trigger.current?.focus();
        else if (mobile) toggle.current?.focus();
        setOpen(false);
        setMobile(false);
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    return () => {
      removeEventListener("scroll", scroll);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key);
    };
  }, [open, mobile]);
  useEffect(() => {
    document.body.classList.toggle("menu-open", mobile);
    return () => document.body.classList.remove("menu-open");
  }, [mobile]);
  const close = () => {
    setOpen(false);
    setMobile(false);
  };
  return (
    <>
      <header
        ref={root}
        className={`site-header ${scrolled ? "scrolled" : ""} ${mobile ? "menu-is-open" : ""}`}
      >
        <div className="header-inner">
          <Brand g={g} />
          <nav className="desktop-navigation" aria-label="Main navigation">
            <div className={`nav-dropdown ${open ? "is-open" : ""}`}>
              <button
                ref={trigger}
                className="nav-text dropdown-button"
                aria-expanded={open}
                aria-controls={id + "-services"}
                onClick={() => setOpen(!open)}
              >
                What we do{" "}
                <svg aria-hidden="true" viewBox="0 0 12 12">
                  <path d="m2.5 4.5 3.5 3.5 3.5-3.5" />
                </svg>
              </button>
              <div className="nav-panel" id={id + "-services"} inert={!open}>
                {g.header.services.map((x) => (
                  <a
                    key={x.href}
                    href={safeHref(x.href)}
                    aria-current={current(x.href)}
                    onClick={close}
                  >
                    {x.label}
                    <b>↗</b>
                  </a>
                ))}
              </div>
            </div>
            {g.header.links
              .filter((x) => x.label.toLowerCase() !== "what we do")
              .map((x) => (
                <a
                  key={x.href}
                  className="nav-text"
                  aria-current={current(x.href)}
                  href={safeHref(x.href)}
                  onClick={close}
                >
                  {x.label}
                </a>
              ))}
          </nav>
          <a className="header-cta" href={safeHref(g.header.buttonHref)}>
            {g.header.buttonLabel}
            <span className="round-icon" aria-hidden="true">
              ↗
            </span>
          </a>
          <button
            ref={toggle}
            className="mobile-toggle"
            aria-label={mobile ? "Close menu" : "Open menu"}
            aria-controls={id + "-mobile"}
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>
      <div
        id={id + "-mobile"}
        className={`mobile-panel ${mobile ? "open" : ""}`}
        aria-hidden={!mobile}
        inert={!mobile}
      >
        <nav aria-label="Mobile navigation">
          <a href="/" onClick={close}>
            Home
          </a>
          {[
            ...g.header.services,
            ...g.header.links.filter(
              (x) => x.label.toLowerCase() !== "what we do",
            ),
          ].map((x) => (
            <a
              key={x.href}
              href={safeHref(x.href)}
              aria-current={current(x.href)}
              onClick={close}
            >
              {x.label}
            </a>
          ))}
        </nav>
        <div className="mobile-signature">
          Big ideas. Every detail. Memorable experiences.
        </div>
      </div>
    </>
  );
}
function Footer({ g }: { g: Globals }) {
  return (
    <footer className="footer">
      <div className="footer-head">
        <div className="footer-identity">
          <Brand g={g} />
          <p>{g.footer.description}</p>
        </div>
        <div className="footer-links">
          <div>
            <span>DISCOVER</span>
            <a href="/">Home</a>
            {g.footer.links
              .filter((x) => x.label.toLowerCase() !== "what we do")
              .map((x) => (
                <a key={x.href} href={safeHref(x.href)}>
                  {x.label}
                </a>
              ))}
          </div>
          <div>
            <span>WHAT WE DO</span>
            {g.header.services.map((x) => (
              <a key={x.href} href={safeHref(x.href)}>
                {x.label}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {g.footer.copyright}
        </span>
        <span>Ideas shouldn’t sit still.</span>
        <a href="#main">Back to top ↗</a>
      </div>
    </footer>
  );
}
function Hero({
  s,
  motion,
  scale,
}: {
  s: Block;
  motion: boolean;
  scale: number;
}) {
  const root = useRef<HTMLElement>(null);
  useScene(root, motion, (el, p) => {
    const photo = el.querySelector<HTMLElement>(".hero-photo"),
      img = photo?.querySelector("img"),
      fore = el.querySelector<HTMLElement>(".hero-foreground"),
      second = el.querySelector<HTMLElement>(".hero-second");
    if (photo) {
      photo.style.inset = `${15 * (1 - p)}% ${7.6 * (1 - p)}% ${10 * (1 - p)}%`;
      photo.style.borderRadius = `${16 * (1 - p)}px`;
      photo.style.boxShadow = `0 ${Math.round(42 * (1 - p))}px ${Math.round(110 * (1 - p))}px rgba(0,0,0,.25)`;
    }
    if (img)
      img.style.transform = `translate3d(0,${-2.4 + p * 4}%,0) scale(${scale - p * 0.11})`;
    const fade = 1 - clamp((p - 0.22) / 0.26);
    if (fore) {
      fore.style.opacity = String(fade);
      fore.style.transform = `translate3d(0,${-45 * clamp(p / 0.6)}px,0)`;
      fore.inert = fade < 0.1;
    }
    if (second) {
      const enter = clamp((p - 0.55) / 0.2);
      second.style.opacity = String(enter);
      second.style.transform = `translate3d(0,${28 * (1 - enter)}px,0)`;
      second.inert = enter < 0.1;
      if (p > 0.54) second.querySelector("h2")?.classList.add("is-revealed");
    }
  });
  const second = s.items[0];
  const heroLines =
    s.headline === "Great ideas should move"
      ? ["Great ideas", "should move"]
      : s.headline.split("\n");
  return (
    <section
      className={`hero-track ${!motion ? "motion-static" : ""}`}
      ref={root}
    >
      <div
        className="hero-stage"
        onPointerMove={(e) => {
          if (e.pointerType === "mouse" && motion) {
            const r = e.currentTarget.getBoundingClientRect();
            e.currentTarget.style.setProperty(
              "--light-x",
              `${((e.clientX - r.left) / r.width) * 100}%`,
            );
            e.currentTarget.style.setProperty(
              "--light-y",
              `${((e.clientY - r.top) / r.height) * 100}%`,
            );
          }
        }}
      >
        <div className="hero-ambient" />
        <div className="hero-photo" aria-hidden="true">
          <img src={s.image} alt="" fetchPriority="high" />
          <div className="hero-photo-wash" />
          <div className="hero-photo-reflection" />
        </div>
        <div className="hero-foreground">
          <h1 className="hero-title">
            {[...heroLines, s.accent].filter(Boolean).map((line, i) => (
              <span className="line" key={i}>
                <span>
                  {line.endsWith(".") ? (
                    <>
                      {line.slice(0, -1)}
                      <span className="teal-dot">.</span>
                    </>
                  ) : (
                    line
                  )}
                </span>
              </span>
            ))}
          </h1>
          <Paragraph text={s.body} join />
          <div className="hero-links">
            <Link label={s.buttonLabel} href={s.buttonHref} />
            <Link
              label={s.secondaryLabel}
              href={s.secondaryHref}
              className="text-arrow-link"
            />
          </div>
        </div>
        {second && (
          <div className="hero-second">
            <h2 className="wipe-heading">
              <span className="wipe-line">
                <span>{second.title}</span>
              </span>
              <span className="wipe-line accent-line">
                <span>{second.accent}</span>
              </span>
            </h2>
            <p className="hero-second-copy">{second.description}</p>
          </div>
        )}
        <div className="hero-graphic" aria-hidden="true" />
      </div>
    </section>
  );
}
function Story({
  s,
  motion,
  parallax,
}: {
  s: Block;
  motion: boolean;
  parallax: number;
}) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  useScene(root, motion, (el, p) => {
    const idx = Math.min(s.items.length - 1, Math.floor(p * s.items.length));
    setActive(idx);
    const progress = el.querySelector<HTMLElement>(".film-progress-fill");
    if (progress) progress.style.transform = `scaleX(${p})`;
    const img = el.querySelectorAll("img")[idx];
    if (img) {
      const local = p * s.items.length - idx;
      img.style.transform = `translate3d(0,${(0.5 - local) * 2 * parallax}%,0) scale(${1.025 + local * 0.07 * parallax})`;
    }
  });
  return (
    <section
      className={`film-track ${!motion ? "motion-static" : ""}`}
      ref={root}
    >
      <div className="film-stage">
        <div className="film-images" aria-hidden="true">
          {s.items.map((x, i) => (
            <div
              className={`film-image ${i === active ? "is-on" : ""}`}
              key={x.id}
            >
              <img
                src={x.image}
                alt=""
                loading={i === active ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
        <div className="film-veil" />
        <a className="scene-skip" href="#services">
          Explore our disciplines ↘
        </a>
        <div className="film-gridline" />
        <div className="film-story-inner">
          <div className="film-steps">
            {s.items.map((x, i) => (
              <article
                key={x.id}
                className={`film-step ${i === active ? "is-on" : ""}`}
                inert={motion && i !== active}
              >
                <h2
                  key={motion ? String(i === active) : x.id}
                  className={`wipe-heading ${i === active || !motion ? "is-revealed" : ""}`}
                >
                  <span className="wipe-line">
                    <span>{x.title}</span>
                  </span>
                  <span className="wipe-line accent-line">
                    <span>{x.accent}</span>
                  </span>
                </h2>
                <p>{x.description}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="film-progress" aria-hidden="true">
          <span className="film-progress-fill" />
        </div>
      </div>
    </section>
  );
}
function Services({ s, motion }: { s: Block; motion: boolean }) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const hover = useRef<number | null>(null);
  useScene(root, motion, (_el, p) => {
    if (innerWidth > 800 && hover.current === null)
      setActive(Math.min(s.items.length - 1, Math.floor(p * s.items.length)));
  });
  return (
    <section
      className={`services-track ${!motion ? "motion-static" : ""}`}
      ref={root}
    >
      <div className="services-stage">
        <div className="services-left">
          <div className="services-stage-intro" id="services">
            <h2 className="services-panel-heading">
              <span>{s.headline}</span>
              <span className="accent-text">{s.accent}</span>
            </h2>
            <Paragraph text={s.body} join />
          </div>
          <div className="service-navigation">
            {s.items.map((x, i) => (
              <button
                type="button"
                key={x.id}
                aria-pressed={i === active}
                onClick={() => {
                  hover.current = i;
                  setActive(i);
                }}
                className={`discipline ${i === active ? "is-on" : ""}`}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") {
                    hover.current = i;
                    setActive(i);
                  }
                }}
                onPointerLeave={() => {}}
                onFocus={() => {
                  hover.current = i;
                  setActive(i);
                }}
                onBlur={() => {}}
                onTouchStart={() => setActive(i)}
              >
                <span className="discipline-name">{x.title}</span>
                <span className="discipline-arrow" aria-hidden="true">
                  {i === active ? "−" : "+"}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="services-right">
          {s.items.map((x, i) => (
            <div
              key={x.id}
              className={`service-visual ${i === active ? "is-on" : ""} ${i === 2 ? "service-digital" : ""}`}
              aria-hidden={i !== active}
            >
              {i === 2 &&
              x.image ===
                defaultPages.home.sections.find((x) => x.type === "services")
                  ?.items[2]?.image ? (
                <div className="digital-stage">
                  <div className="digital-screen">
                    <div className="digital-top">
                      <img src="/brand/approved-wordmark.png" width="145" height="38" alt="showset." />
                    </div>
                    <div className="digital-type">
                      THE NEXT
                      <br />
                      <em>
                        BIG THING<span className="teal-dot">.</span>
                      </em>
                    </div>
                    <div className="digital-bottom">
                      <span>Ideas with purpose.</span>
                    </div>
                  </div>
                </div>
              ) : (
                <img src={x.image} alt="" loading="lazy" />
              )}
            </div>
          ))}
          <div className="service-image-overlay" />
          <div className="service-image-information">
            <p>{s.items[active]?.description}</p>
            <Link
              label="Step inside this world"
              href={s.items[active]?.href}
              className="service-world-link"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
function Work({
  s,
  g,
  indexPage = false,
}: {
  s: Block;
  g: Globals;
  indexPage?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null),
    rail = useRef<HTMLDivElement>(null),
    pos = useRef(0),
    busy = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = useReduced();
  const [position, setPosition] = useState(0),
    [paused, setPaused] = useState(false);
  const count = s.items.length;
  const move = (next: number, animate = true) => {
    const r = rail.current,
      c = r?.firstElementChild as HTMLElement | null;
    if (!r || !c) return;
    const step =
      c.getBoundingClientRect().width +
      (parseFloat(getComputedStyle(r).columnGap) || 0);
    r.style.transition = animate
      ? "transform .95s cubic-bezier(.76,0,.24,1)"
      : "none";
    r.style.transform = `translate3d(${-next * step}px,0,0)`;
    pos.current = next;
    setPosition(next);
  };
  const advance = (delta: number) => {
    if (busy.current || count < 2) return;
    busy.current = true;
    if (delta < 0 && pos.current === 0) {
      move(count, false);
      requestAnimationFrame(() => requestAnimationFrame(() => move(count - 1)));
    } else move(pos.current + delta);
    timer.current = setTimeout(() => {
      if (pos.current >= count) move(0, false);
      busy.current = false;
    }, 1060);
  };
  const advanceRef = useRef(advance);
  advanceRef.current = advance;
  useEffect(() => {
    const resize = () => move(pos.current, false);
    addEventListener("resize", resize);
    return () => {
      removeEventListener("resize", resize);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [count]);
  useEffect(() => {
    if (!g.motion.enabled || reduced || paused || indexPage) return;
    const t = setInterval(
      () => {
        const el = root.current;
        if (
          !el ||
          document.hidden ||
          document.body.classList.contains("menu-open") ||
          el.matches(":hover") ||
          el.contains(document.activeElement)
        )
          return;
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight * 0.78 && r.bottom > innerHeight * 0.22)
          advanceRef.current(1);
      },
      Math.max(3, s.speed || g.motion.carouselSeconds) * 1000,
    );
    return () => clearInterval(t);
  }, [
    g.motion.enabled,
    reduced,
    paused,
    indexPage,
    s.speed,
    g.motion.carouselSeconds,
  ]);
  const [visibleCount, setVisibleCount] = useState(3);
  useEffect(() => {
    const update = () => {
      const el = root.current,
        c = rail.current?.firstElementChild as HTMLElement | null;
      if (el && c)
        setVisibleCount(Math.ceil(el.clientWidth / (c.offsetWidth + 18)));
    };
    update();
    addEventListener("resize", update);
    return () => removeEventListener("resize", update);
  }, [count]);
  if (indexPage) return <CuratedGallery items={s.items} />;
  return (
    <section className="portfolio-section section-gutter">
      <div className="portfolio-heading">
        <Heading s={s} />
        <div className="portfolio-intro">
          <Paragraph text={s.body} join />
        </div>
      </div>
      <div
        className="case-carousel"
        ref={root}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured creative explorations"
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            advance(e.key === "ArrowRight" ? 1 : -1);
          }
        }}
        onTouchStart={(e) =>
          (e.currentTarget.dataset.touch = String(e.touches[0]?.clientX))
        }
        onTouchEnd={(e) => {
          const dx =
            e.changedTouches[0].clientX - Number(e.currentTarget.dataset.touch);
          if (Math.abs(dx) > 42) advance(dx < 0 ? 1 : -1);
        }}
      >
        <div className="case-viewport">
          <div className="case-rail" ref={rail}>
            {[...s.items, ...s.items].map((x, i) => {
              const visible = i >= position && i < position + visibleCount;
              return (
                <a
                  className="case-slide"
                  key={i}
                  href={safeHref(x.href)}
                  tabIndex={visible ? 0 : -1}
                  aria-hidden={!visible}
                >
                  <div className="case-photo">
                    <img src={x.image} alt="" loading="lazy" />
                  </div>
                  <div className="case-story">
                    <h3>
                      {x.title.replace(/\.$/, "")}
                      <span className="teal-dot">.</span>
                    </h3>
                    <p>{x.description}</p>
                    <span className="case-slide-link">
                      Explore the study <b>↗</b>
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
        <div className="case-controls">
          <div className="case-progress" aria-hidden="true">
            <span
              className="case-progress-bar"
              style={{
                transform: `translateX(${(position % Math.max(count, 1)) * 100}%)`,
              }}
            />
          </div>
          <button
            className="carousel-pause"
            onClick={() => setPaused(!paused)}
            aria-pressed={paused}
          >
            {paused ? "Resume autoplay" : "Pause autoplay"}
          </button>
        </div>
      </div>
    </section>
  );
}
function Dot({ s, motion }: { s: Block; motion: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useScene(ref, motion, (el, p) => {
    const stage = el.querySelector<HTMLElement>(".dot-stage"),
      circle = el.querySelector<HTMLElement>(".dot-core"),
      words = el.querySelectorAll<HTMLElement>(".dot-words");
    if (!stage || !circle) return;
    const full = Math.hypot(stage.clientWidth / 2, stage.clientHeight / 2) + 4;
    stage.style.setProperty(
      "--dot-radius",
      `${10 + Math.pow(p, 1.5) * (full - 10)}px`,
    );
    words.forEach(
      (word) => (word.style.transform = `translate3d(0,${9 - p * 18}px,0)`),
    );
  });
  return (
    <section
      ref={ref}
      className={`dot-track ${!motion ? "motion-static" : ""}`}
    >
      <div className="dot-stage">
        <div className="dot-core" aria-hidden="true" />
        <div className="dot-words" aria-hidden="true">
          <h2>
            <Rich text={s.headline} />
          </h2>
          <p>{s.body}</p>
        </div>
        <div className="dot-ink" aria-hidden="true">
          <div className="dot-words">
            <h2>
              <Rich text={s.headline} />
            </h2>
            <p>{s.body}</p>
          </div>
        </div>
        <div className="sr-only">
          <h2>
            <Rich text={s.headline} />
          </h2>
          <p>{s.body}</p>
        </div>
      </div>
    </section>
  );
}
function Split({ s, home = false }: { s: Block; home?: boolean }) {
  return home ? (
    <section className="manifesto section-gutter" id="discover">
      <div className="manifesto-grid">
        <div>
          <Heading s={s} plain className="section-title plain-heading" />
        </div>
        <div className="manifesto-copy">
          <Paragraph text={s.body} join />
          <Link
            label={s.buttonLabel}
            href={s.buttonHref}
            className="understated-link"
          />
        </div>
      </div>
    </section>
  ) : (
    <section className="restored-split section-gutter">
      <Heading s={s} plain className="section-title plain-heading" />
      <Paragraph text={s.body} />
      <Link
        label={s.buttonLabel}
        href={s.buttonHref}
        className="understated-link"
      />
    </section>
  );
}
function CTA({ s }: { s: Block }) {
  return (
    <section className="end-section section-gutter" id="ending">
      <Heading s={s} plain className="section-title plain-heading" />
      <div className="end-bottom">
        <Paragraph text={s.body} join />
        <Link label={s.buttonLabel} href={s.buttonHref} className="end-link" />
      </div>
    </section>
  );
}
function PageHero({
  s,
  kind,
  motion,
}: {
  s: Block;
  kind: string;
  motion: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  useScene(root, motion, (el, _p, r) => {
    const img = el.querySelector("img");
    if (img)
      img.style.transform = `translate3d(0,${(clamp((innerHeight - r.top) / (innerHeight + r.height)) - 0.5) * -24}px,0) scale(1.065)`;
  });
  const service = [
      "events-experiences",
      "creative-design",
      "digital-marketing",
      "content-production",
    ].includes(kind),
    casePage =
      kind.includes("atmosphere") ||
      kind.includes("remembered") ||
      kind.includes("behind-every");
  const cls = casePage
    ? "case-detail-hero"
    : service
      ? "category-hero"
      : `simple-hero ${kind === "our-work" ? "work-hero" : "studio-hero"}`;
  return (
    <section className={cls} ref={root}>
      <div
        className={
          casePage ? "case-detail-photo" : service ? "category-bg" : "simple-bg"
        }
      >
        <img src={s.image} data-depth-image="" alt="" fetchPriority="high" />
      </div>
      <div
        className={
          casePage
            ? "case-detail-wash"
            : service
              ? "category-gradient"
              : "simple-shade"
        }
      />
      <div
        className={
          casePage
            ? "case-detail-header section-gutter"
            : service
              ? "category-inner"
              : "simple-hero-content"
        }
      >
        {casePage ? (
          <h1>
            {s.headline.replace(/\.$/, "")}
            <span className="teal-dot">.</span>
          </h1>
        ) : (
          <Heading s={s} as="h1" className="block-heading" />
        )}
        <Paragraph text={s.body} join />
        {service && <Link label={s.buttonLabel} href={s.buttonHref} />}
      </div>
    </section>
  );
}
function Items({ s, process = false }: { s: Block; process?: boolean }) {
  return (
    <div className={process ? "category-process" : "category-clusters"}>
      {process ? (
        <>
          <Heading s={s} plain className="soft-rise" />
          <Paragraph text={s.body} />
        </>
      ) : (
        <div className="category-clusters-title">
          <Heading s={s} plain className="soft-rise" />
          <Paragraph text={s.body} />
        </div>
      )}
      <div className={process ? "process-grid" : "cluster-grid"}>
        {s.items.map((x) => (
          <article key={x.id}>
            <h3>{x.title}</h3>
            <p>{x.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
function Accordion({ s }: { s: Block }) {
  return (
    <div className="category-capabilities">
      <div className="category-capabilities-head">
        <Heading s={s} plain className="soft-rise" />
        <Paragraph text={s.body} />
      </div>
      <div className="capabilities-list">
        {s.items.map((x) => (
          <details key={x.id}>
            <summary>
              {x.title}
              <span aria-hidden="true">+</span>
            </summary>
            <p>{x.description}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
function Visual({ s }: { s: Block }) {
  return (
    <section className="category-banner">
      <img src={s.image} alt="" loading="lazy" />
      <div className="category-banner-shade" />
      <div>
        <Heading s={s} className="block-heading" />
        <Link label={s.buttonLabel} href={s.buttonHref} />
      </div>
    </section>
  );
}
function ProjectSelect({
  items,
  value,
  onChange,
}: {
  items: BlockItem[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const close = (focus = false) => {
    setOpen(false);
    if (focus) trigger.current?.focus();
  };
  useEffect(() => {
    const outside = (e: Event) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
    };
  }, []);
  const focus = (i: number) =>
    requestAnimationFrame(() =>
      root.current
        ?.querySelectorAll<HTMLButtonElement>(".select-option")
        [i]?.focus(),
    );
  return (
    <div
      className={`custom-select js-select-ready ${open ? "is-open" : ""}`}
      ref={root}
      onKeyDown={(e) => {
        const options = Array.from(
            root.current?.querySelectorAll(".select-option") || [],
          ),
          i = options.indexOf(document.activeElement as Element);
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          close(true);
        } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
          e.preventDefault();
          setOpen(true);
          focus(
            e.key === "Home"
              ? 0
              : e.key === "End"
                ? items.length - 1
                : i < 0
                  ? Math.max(
                      0,
                      items.findIndex((x) => x.title === value),
                    )
                  : (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) %
                    items.length,
          );
        }
      }}
    >
      <select
        aria-hidden="true"
        className="native-select-fallback"
        id="contact-category"
        aria-label="What are we making?"
        name="category"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
      >
        <option value="">Choose the closest fit</option>
        {items.map((x) => (
          <option key={x.id}>{x.title}</option>
        ))}
      </select>
      <button
        ref={trigger}
        className="select-trigger"
        type="button"
        role="combobox"
        aria-label="What are we making?"
        aria-controls={id}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            setOpen(true);
            focus(
              Math.max(
                0,
                items.findIndex((x) => x.title === value),
              ),
            );
          }
        }}
      >
        <span className="select-value">
          {value || "Choose the closest fit"}
        </span>
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="m2.5 4.5 3.5 3.5 3.5-3.5" />
        </svg>
      </button>
      <div
        id={id}
        className="select-panel"
        role="listbox"
        aria-label="Project type"
        inert={!open}
      >
        {items.map((x) => (
          <button
            className="select-option"
            type="button"
            role="option"
            aria-selected={value === x.title}
            tabIndex={-1}
            key={x.id}
            onClick={() => {
              onChange(x.title);
              close(true);
            }}
          >
            {x.title}
          </button>
        ))}
      </div>
    </div>
  );
}

function Contact({ s }: { s: Block }) {
  const [status, setStatus] = useState("idle"),
    [category, setCategory] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (["localhost", "127.0.0.1"].includes(location.hostname)) {
      setStatus("preview");
      return;
    }
    setStatus("sending");
    const form = new FormData(e.currentTarget);
    form.set("category", category);
    try {
      const r = await fetch(`${apiEndpoint}?action=enquiry`, {
        method: "POST",
        body: form,
      });
      if (!r.ok) throw Error();
      const j = await r.json();
      setStatus(j.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }
  return (
    <section className="contact-view section-gutter">
      <div className="contact-shell">
        <div className="contact-left">
          <Heading s={s} as="h1" className="block-heading" />
          <Paragraph text={s.body} join />
          <div className="contact-orbit" aria-hidden="true">
            <span />
          </div>
        </div>
        <form className="contact-form" onSubmit={submit}>
          <h2 className="soft-rise">
            {s.formTitle || "Tell us the interesting bit."}
          </h2>
          <label htmlFor="contact-name">Your name</label>
          <input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            placeholder="What should we call you?"
          />
          <label htmlFor="contact-email">Email address</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="Somewhere we can get back to you"
          />
          <label htmlFor="contact-company">Company or organisation</label>
          <input
            id="contact-company"
            name="company"
            autoComplete="organization"
            placeholder="Optional, if there is one"
          />
          <label htmlFor="contact-category">What are we making?</label>
          <ProjectSelect
            items={s.items}
            value={category}
            onChange={setCategory}
          />
          <label htmlFor="contact-message">Tell us about it</label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={4}
            placeholder="The idea, the challenge, the deadline, the wonderfully complicated bits. Start anywhere."
          />
          <label htmlFor="contact-date">When is it happening?</label>
          <input
            id="contact-date"
            name="date"
            placeholder="Optional: a date, month or ‘we are still figuring it out’"
          />
          <label htmlFor="contact-budget">Rough budget</label>
          <input
            id="contact-budget"
            name="budget"
            placeholder="Optional, to help us suggest the right way forward"
          />
          <div className="ss-honeypot" aria-hidden="true">
            <input aria-label="Website" name="website" tabIndex={-1} />
          </div>
          <button
            className="solid-link"
            disabled={status === "sending"}
            type="submit"
          >
            {status === "sending"
              ? "Sending…"
              : s.buttonLabel || "Send the idea"}{" "}
            <span>↗</span>
          </button>
          <p className="form-note">{s.helperText}</p>
          <p className="form-result" role="status">
            {status === "preview"
              ? "That did not go through. This is a design preview, so no message has been sent."
              : status === "error"
                ? "That did not go through. Please try again or email us directly."
                : status === "sent"
                  ? "And so it begins. Your message is in."
                  : ""}
          </p>
        </form>
      </div>
    </section>
  );
}
function Wrap({
  s,
  editor,
  onSelect,
  selectedId,
  children,
}: {
  s: Block;
  editor?: boolean;
  onSelect?: (id: string) => void;
  selectedId?: string;
  children: React.ReactNode;
}) {
  const d = s.design || {};
  const style = {
    "--brand-pattern": s.pattern ? undefined : "none",
    "--block-heading": d.headingSize ? `${d.headingSize}px` : undefined,
    "--block-mobile-heading": d.mobileHeadingSize
      ? `${d.mobileHeadingSize}px`
      : undefined,
    "--block-body": d.bodySize ? `${d.bodySize}px` : undefined,
    "--block-radius": d.radius != null ? `${d.radius}px` : undefined,
    "--block-image-position": d.imagePosition,
    "--block-mobile-image-position": d.mobileImagePosition || d.imagePosition,
    "--block-top": d.spaceTop != null ? `${d.spaceTop}px` : undefined,
    "--block-bottom": d.spaceBottom != null ? `${d.spaceBottom}px` : undefined,
  } as React.CSSProperties;
  return (
    <div
      className={`ss-block-root ${editor ? "ss-editable-section" : ""} ${selectedId === s.id ? "selected" : ""}`}
      data-section={s.id}
      data-scene={d.motionPreset || "cinematic"}
      data-variation={d.variation || "editorial"}
      data-heading={d.headingSize != null || undefined}
      data-mobile-heading={d.mobileHeadingSize != null || undefined}
      data-body={d.bodySize != null || undefined}
      data-image={!!(d.imagePosition || d.mobileImagePosition) || undefined}
      data-radius={d.radius != null || undefined}
      data-top={d.spaceTop != null || undefined}
      data-bottom={d.spaceBottom != null || undefined}
      style={style}
      onClickCapture={
        editor
          ? (e) => {
              if ((e.target as HTMLElement).closest("a,button"))
                e.preventDefault();
              onSelect?.(s.id);
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
export function PageSections({
  page,
  g,
  catalog = defaultPages,
  editor,
  onSelect,
  selectedId,
}: {
  page: PageData;
  g: Globals;
  catalog?: Record<string, PageData>;
  editor?: boolean;
  onSelect?: (id: string) => void;
  selectedId?: string;
}) {
  const reduced = useReduced(),
    motion = g.motion.enabled && !reduced;
  const structured =
    page.sections.map((s) => s.id).join(",") ===
    defaultPages[page.slug]?.sections.map((s) => s.id).join(",");
  const home = page.slug === "home",
    service = [
      "events-experiences",
      "creative-design",
      "digital-marketing",
      "content-production",
    ].includes(page.slug);
  const wrap = (s: Block, content: React.ReactNode) => (
    <Wrap
      s={s}
      editor={editor}
      onSelect={onSelect}
      selectedId={selectedId}
      key={s.id}
    >
      {content}
    </Wrap>
  );
  if (page.slug === "our-studio" && structured) {
    const [hero, copy, values, rhythm, partnership, faq, final] =
      page.sections.filter((s) => s.id !== "concept12-studio-belief");
    const belief = page.sections.find(
      (s) => s.id === "concept12-studio-belief",
    );
    return (
      <>
        {hero &&
          wrap(
            hero,
            <PageHero
              s={hero}
              kind={page.slug}
              motion={motion && hero.design?.motionPreset !== "still"}
            />,
          )}
        <section className="studio-copy section-gutter">
          {copy &&
            wrap(
              copy,
              <>
                <h2 className="soft-rise">
                  {copy.headline}
                  <br />
                  <em>{copy.accent}</em>
                </h2>
                <Paragraph text={copy.body} join />
              </>,
            )}
          {values &&
            wrap(
              values,
              <>
                {values.headline && <Heading s={values} plain />}
                <div className="values">
                  {values.items.map((x, i) => (
                    <article key={x.id}>
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <h3>{x.title}</h3>
                      <p>{x.description}</p>
                    </article>
                  ))}
                </div>
              </>,
            )}
        </section>
        {belief &&
          wrap(
            belief,
            <section className="studio-belief section-gutter">
              <div>
                <h2 className="soft-rise">
                  {belief.headline}
                  <br />
                  <em>{belief.accent}</em>
                </h2>
              </div>
              <Paragraph text={belief.body} join />
            </section>,
          )}
        {rhythm &&
          wrap(
            rhythm,
            <section className="studio-rhythm section-gutter">
              <h2 className="soft-rise">
                {rhythm.headline} {rhythm.accent}
              </h2>
              <div className="rhythm-grid">
                {rhythm.items.map((x) => (
                  <article key={x.id}>
                    <h3>{x.title}</h3>
                    <p>{x.description}</p>
                  </article>
                ))}
              </div>
            </section>,
          )}
        {partnership &&
          wrap(
            partnership,
            <section className="studio-partnership section-gutter">
              <h2 className="soft-rise">
                {partnership.headline}
                <br />
                <em>{partnership.accent}</em>
              </h2>
              <div>
                <Paragraph text={partnership.body} join />
                <Link
                  label={partnership.buttonLabel}
                  href={partnership.buttonHref}
                  className="understated-link"
                />
              </div>
            </section>,
          )}
        {faq &&
          wrap(
            faq,
            <section className="studio-faq section-gutter">
              <div className="studio-faq-heading">
                <h2 className="soft-rise">
                  {faq.headline} {faq.accent}
                </h2>
                <Paragraph text={faq.body} join />
              </div>
              <div className="studio-faq-list">
                {faq.items.map((x) => (
                  <details key={x.id}>
                    <summary>
                      {x.title}
                      <span aria-hidden="true">+</span>
                    </summary>
                    <p>{x.description}</p>
                  </details>
                ))}
              </div>
            </section>,
          )}
        {final &&
          wrap(
            final,
            <section className="studio-final section-gutter">
              <div className="studio-final-inner">
                <h2 className="soft-rise">
                  {final.headline} {final.accent}
                </h2>
                <Paragraph text={final.body} join />
                <Link
                  label={final.buttonLabel}
                  href={final.buttonHref}
                  className="understated-link"
                />
              </div>
            </section>,
          )}
      </>
    );
  }
  if (page.slug === "our-work" && structured) {
    const [hero, intro, reel] = page.sections;
    return (
      <>
        {hero &&
          wrap(
            hero,
            <PageHero
              s={hero}
              kind={page.slug}
              motion={motion && hero.design?.motionPreset !== "still"}
            />,
          )}
        <section className="work-page-gallery section-gutter">
          {intro &&
            wrap(
              intro,
              <div className="work-editorial-note">
                <h2 className="soft-rise work-intro-title">
                  {intro.headline} {intro.accent}
                </h2>
                <Paragraph text={intro.body} join />
              </div>,
            )}
          {reel && wrap(reel, <Work s={reel} g={g} indexPage />)}
        </section>
      </>
    );
  }
  if (page.route.startsWith("/work/") && structured) {
    const [hero, intro, visual, final] = page.sections;
    return (
      <>
        {hero &&
          wrap(
            hero,
            <PageHero
              s={hero}
              kind={page.slug}
              motion={motion && hero.design?.motionPreset !== "still"}
            />,
          )}
        <section className="case-detail-body section-gutter">
          {intro &&
            wrap(
              intro,
              <div className="case-detail-introduction">
                <h2 className="soft-rise">
                  {intro.headline} {intro.accent}
                </h2>
                <Paragraph text={intro.body} join />
              </div>,
            )}
          {visual &&
            wrap(
              visual,
              <>
                <blockquote className="case-quote">
                  {visual.headline} {visual.accent}
                </blockquote>
                <div className="case-detail-visual">
                  <img
                    src={visual.image}
                    alt="Creative process imagery"
                    loading="lazy"
                  />
                </div>
              </>,
            )}
          {final &&
            wrap(
              final,
              <div className="case-detail-next">
                <Paragraph text={final.body} join />
                <Link
                  label={final.buttonLabel}
                  href={final.buttonHref}
                  className="understated-link"
                />
              </div>,
            )}
          <ProjectModules
            page={page}
            projects={
              catalog["our-work"]?.sections.find((x) => x.type === "work")
                ?.items || []
            }
          />
        </section>
      </>
    );
  }

  if (service && structured) {
    const first = page.sections[0],
      last = page.sections.find((s) => s.type === "visual");
    return (
      <>
        {first &&
          wrap(
            first,
            <PageHero
              s={first}
              kind={page.slug}
              motion={motion && first.design?.motionPreset !== "still"}
            />,
          )}
        <section className="category-detail section-gutter">
          {page.sections
            .filter(
              (s) => s !== first && s.type !== "visual" && s.type !== "cta",
            )
            .map((s, i) =>
              wrap(
                s,
                s.type === "split" ? (
                  <div
                    className={i === 0 ? "category-belief" : "category-feature"}
                  >
                    <h2 className="soft-rise">
                      {s.headline}
                      {s.accent && (
                        <>
                          <br />
                          {s.accent}
                        </>
                      )}
                    </h2>
                    <div
                      className={i === 0 ? "category-detail-bottom" : undefined}
                    >
                      <Paragraph text={s.body} join />
                    </div>
                  </div>
                ) : s.type === "items" ? (
                  <Items s={s} process={i > 2} />
                ) : (
                  <Accordion s={s} />
                ),
              ),
            )}
        </section>
        {last && wrap(last, <Visual s={last} />)}
        {page.sections
          .filter((x) => x.type === "cta")
          .map((s) =>
            wrap(
              s,
              <section className="category-more section-gutter">
                <h2 className="soft-rise">
                  {s.headline}
                  {s.accent}
                  <span className="teal-dot">.</span>
                </h2>
                <Paragraph text={s.body} />
                <div id="category-more-links">
                  {(s.items.length
                    ? s.items
                    : g.header.services
                        .filter((x) => x.href !== page.route)
                        .map((x) => ({
                          id: x.href,
                          title: x.label,
                          href: x.href,
                        }))
                  ).map((x) => (
                    <Link
                      key={x.id}
                      label={x.title}
                      href={x.href}
                      className="category-more-link"
                    />
                  ))}
                </div>
                <Link label={s.buttonLabel} href={s.buttonHref} />
              </section>,
            ),
          )}
      </>
    );
  }
  return (
    <>
      {page.sections.map((s) => {
        let c: React.ReactNode;
        switch (s.type) {
          case "hero":
            c = (
              <Hero
                s={s}
                motion={motion && s.design?.motionPreset !== "still"}
                scale={g.motion.heroScale}
              />
            );
            break;
          case "pagehero":
            c = (
              <PageHero
                s={s}
                kind={page.slug}
                motion={motion && s.design?.motionPreset !== "still"}
              />
            );
            break;
          case "split":
            c = <Split s={s} home={home} />;
            break;
          case "story":
            c = (
              <Story
                s={s}
                motion={motion && s.design?.motionPreset !== "still"}
                parallax={g.motion.storyParallax}
              />
            );
            break;
          case "services":
            c = (
              <Services
                s={s}
                motion={motion && s.design?.motionPreset !== "still"}
              />
            );
            break;
          case "work":
            c = <Work s={s} g={g} indexPage={page.slug === "our-work"} />;
            break;
          case "dot":
            c = (
              <Dot
                s={s}
                motion={motion && s.design?.motionPreset !== "still"}
              />
            );
            break;
          case "cta":
            c = <CTA s={s} />;
            break;
          case "items":
            c = (
              <section className="restored-split section-gutter">
                <Items s={s} />
              </section>
            );
            break;
          case "accordion":
            c = (
              <section className="restored-split section-gutter">
                <Accordion s={s} />
              </section>
            );
            break;
          case "visual":
            c = <Visual s={s} />;
            break;
          case "contact":
            c = <Contact s={s} />;
            break;
          default:
            c = null;
        }
        return wrap(s, c);
      })}
    </>
  );
}
export function SiteLayout({
  page,
  g,
  catalog = defaultPages,
  editor,
  onSelect,
  selectedId,
}: {
  page: PageData;
  g: Globals;
  catalog?: Record<string, PageData>;
  editor?: boolean;
  onSelect?: (id: string) => void;
  selectedId?: string;
}) {
  const router = useRouter(),
    root = useRef<HTMLDivElement>(null),
    reduced = useReduced();
  const [curtain, setCurtain] = useState<"enter" | "leave" | "">("");
  const navigating = useRef(false);
  const routeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const arriving =
      navigating.current ||
      sessionStorage.getItem("showset-route-curtain") === "1";
    sessionStorage.removeItem("showset-route-curtain");
    setCurtain(arriving ? "leave" : "");
    navigating.current = false;
    if (arriving || editor) window.scrollTo(0, 0);
    if (arriving) {
      const heading = root.current?.querySelector<HTMLElement>("h1");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    }
    return () => {
      if (routeTimer.current) clearTimeout(routeTimer.current);
    };
  }, [page.slug]);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const headings = el.querySelectorAll(".block-heading,.soft-rise");
    if (!g.motion.enabled || !g.motion.circleReveal || reduced) {
      headings.forEach((x) => x.classList.add("is-revealed", "is-inview"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-revealed", "is-inview");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.13, rootMargin: "0px 0px -8% 0px" },
    );
    headings.forEach((x) => io.observe(x));
    return () => io.disconnect();
  }, [page, g.motion.enabled, g.motion.circleReveal, reduced]);
  useEffect(() => {
    const sections = Array.from(
      root.current?.querySelectorAll<HTMLElement>("section") || [],
    ).filter(
      (el) =>
        !el.matches(
          ".hero-track,.film-track,.services-track,.dot-track,.category-hero,.simple-hero,.case-detail-hero",
        ),
    );
    const apply = () =>
      sections.forEach((el) => {
        el.style.removeProperty("padding-top");
        el.style.removeProperty("padding-bottom");
        const delta = g.theme.sectionSpace - 108;
        if (!delta) return;
        const css = getComputedStyle(el);
        if (!el.closest("[data-top]"))
          el.style.paddingTop = `${Math.max(0, parseFloat(css.paddingTop) + delta)}px`;
        if (!el.closest("[data-bottom]"))
          el.style.paddingBottom = `${Math.max(0, parseFloat(css.paddingBottom) + delta)}px`;
      });
    apply();
    addEventListener("resize", apply);
    return () => {
      removeEventListener("resize", apply);
      sections.forEach((el) => {
        el.style.removeProperty("padding-top");
        el.style.removeProperty("padding-bottom");
      });
    };
  }, [g.theme.sectionSpace, page]);
  useEffect(() => {
    const targets = Array.from(
      root.current?.querySelectorAll<HTMLElement>(
        ".hero-photo,.case-slide,.case-index-image,.contact-form,.nav-panel,.select-panel,.select-trigger",
      ) || [],
    );
    targets.forEach((el) => {
      el.style.removeProperty("border-radius");
      if (g.theme.radius !== 20 && !el.closest("[data-radius]"))
        el.style.borderRadius = `${Math.max(0, parseFloat(getComputedStyle(el).borderTopLeftRadius) + g.theme.radius - 20)}px`;
    });
    return () =>
      targets.forEach((el) => el.style.removeProperty("border-radius"));
  }, [g.theme.radius, page]);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const bar = root.current?.querySelector<HTMLElement>(
          ".reading-progress span",
        );
        if (bar)
          bar.style.transform = `scaleX(${clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight))})`;
      });
    };
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    update();
    return () => {
      removeEventListener("scroll", update);
      removeEventListener("resize", update);
      cancelAnimationFrame(raf);
    };
  }, [page]);
  const navigate = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      editor ||
      !g.motion.enabled ||
      reduced ||
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    )
      return;
    const a = (e.target as Element).closest<HTMLAnchorElement>("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname)
      return;
    e.preventDefault();
    if (navigating.current) return;
    navigating.current = true;
    sessionStorage.setItem("showset-route-curtain", "1");
    setCurtain("enter");
    routeTimer.current = setTimeout(() => {
      router.push(url.pathname + url.search + url.hash);
    }, 530);
  };
  const t = g.theme;
  const style = {
    "--navy": t.navy,
    "--deep": t.navyDark,
    "--navy2": t.blue,
    "--teal": t.teal,
    "--sand": t.sand,
    "--ice": t.white,
    "--display": `${t.fontHeading}, Arial, sans-serif`,
    "--body-font": `${t.fontBody}, Arial, sans-serif`,
    "--v12-head-tracking": t.headingTracking,
    "--v12-body-tracking": t.bodyTracking,
    "--v12-body-leading": t.bodyLeading === 1.49 ? undefined : t.bodyLeading,
    "--v12-head-leading": t.headingLeading,
    "--btn-height": `${t.buttonHeight}px`,
    "--section-space": `${t.sectionSpace}px`,
    "--pattern-opacity": t.patternOpacity,
    "--radius": `${t.radius}px`,
    "--brand-pattern": patternImage(t.patternOpacity),
  } as React.CSSProperties;
  return (
    <div
      className="ss-site"
      data-page={page.slug}
      ref={root}
      style={style}
      data-circle={g.motion.circleReveal ? "on" : "off"}
      data-motion={g.motion.enabled ? "on" : "off"}
      onClick={navigate}
    >
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="reading-progress" aria-hidden="true">
        <span />
      </div>
      <div className={`route-curtain ${curtain}`} aria-hidden="true">
        <div className="curtain-brand">
          <img
            src={g.brand.logo || "/brand/approved-wordmark.png"}
            width="481"
            height="125"
            alt=""
          />
        </div>
      </div>
      <Header g={g} />
      <main id="main" className="view is-current">
        <PageSections
          page={page}
          catalog={catalog}
          g={g}
          editor={editor}
          onSelect={onSelect}
          selectedId={selectedId}
        />
      </main>
      <Footer g={g} />
      <div className="sr-only" aria-live="polite">
        {page.title}
      </div>
    </div>
  );
}
export default function SiteShell({
  initialPage,
  initialGlobals,
  editor,
  onSelect,
  selectedId,
}: Props) {
  const [catalog, setCatalog] = useState(defaultPages);
  const [page, setPage] = useState(initialPage),
    [globals, setGlobals] = useState(initialGlobals);
  useEffect(() => {
    setPage(initialPage);
    setGlobals(initialGlobals);
  }, [initialPage, initialGlobals]);
  useEffect(() => {
    if (editor) return;
    if (["localhost", "127.0.0.1"].includes(location.hostname)) {
      try {
        const p = JSON.parse(
            localStorage.getItem("showset-preview-published-pages") || "null",
          ),
          g = JSON.parse(
            localStorage.getItem("showset-preview-published-globals") || "null",
          );
        if (p?.[initialPage.slug]?.sections) {
          setPage(p[initialPage.slug]);
          setCatalog(p);
        }
        if (g?.theme) setGlobals(g);
      } catch (e) {
        console.warn("Invalid local preview; defaults retained", e);
      }
      return;
    }
    const controller = new AbortController();
    fetch(
      `${apiEndpoint}?action=published&slug=${encodeURIComponent(initialPage.slug)}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.page?.sections) setPage(j.page);
        if (j?.globals?.theme) setGlobals(j.globals);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [editor, initialPage.slug]);
  return (
    <SiteLayout
      page={page}
      catalog={catalog}
      g={globals}
      editor={editor}
      onSelect={onSelect}
      selectedId={selectedId}
    />
  );
}
