"use client";
import ExperienceThree from "./ExperienceThree";
import React, { useState, useEffect, useRef, useId } from "react";
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
        <figure className="x3-contact-visual">
          <img src={s.image || "/media/planning.webp"} alt="" loading="lazy" />
        </figure>
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
  const reduced = useReduced();
  return (
    <ExperienceThree
      page={page}
      g={g}
      catalog={catalog}
      motion={g.motion.enabled && !reduced}
      select={editor ? onSelect : undefined}
      wrap={(s, node) => (
        <Wrap
          key={s.id}
          s={s}
          editor={editor}
          onSelect={onSelect}
          selectedId={selectedId}
        >
          {node}
        </Wrap>
      )}
      contact={(s) => <Contact s={s} />}
    />
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
          ".hero-track,.film-track,.services-track,.dot-track,.category-hero,.simple-hero,.case-detail-hero,[data-pinned]",
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
    root.current?.style.setProperty("--route-x", `${e.clientX}px`);
    root.current?.style.setProperty("--route-y", `${e.clientY}px`);
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
      data-experience="3"
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
          setCatalog({ ...defaultPages, ...p });
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
