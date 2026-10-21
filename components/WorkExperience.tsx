"use client";
import { useState } from "react";
import type { BlockItem, PageData } from "@/lib/types";
import { safeHref } from "@/lib/safe";

export function CuratedGallery({ items }: { items: BlockItem[] }) {
  const [category, setCategory] = useState("All");
  const categories = [
    "All",
    ...new Set(items.map((x) => x.category).filter((x): x is string => !!x)),
  ];
  const visible = items.filter(
    (x) => category === "All" || x.category === category,
  );
  return (
    <div className="curated-work">
      <div
        className="work-filters"
        role="group"
        aria-label="Filter creative explorations"
      >
        {categories.map((x) => (
          <button
            key={x}
            type="button"
            aria-pressed={category === x}
            onClick={() => setCategory(x)}
          >
            {x}
          </button>
        ))}
      </div>
      <p className="sr-only" role="status">
        {visible.length} creative explorations shown
      </p>
      <div className="case-index curated-grid">
        {visible.map((x) => (
          <a className="case-index-item" href={safeHref(x.href)} key={x.id}>
            <div className="case-index-image">
              <img src={x.image} alt="" loading="lazy" />
            </div>
            <div className="case-index-info">
              <div>
                <p className="project-category">{x.category}</p>
                <h2>
                  {x.title}
                  <span className="teal-dot">.</span>
                </h2>
              </div>
              <p>{x.description}</p>
              <span aria-hidden="true">↗</span>
            </div>
          </a>
        ))}
      </div>
      {!visible.length && <p>More work will be added here.</p>}
    </div>
  );
}
function Comparison({
  before,
  after,
  alt,
}: {
  before: string;
  after: string;
  alt: string;
}) {
  const [value, setValue] = useState(50);
  return (
    <div className="project-comparison">
      <div className="comparison-images">
        <img src={before} alt={alt + " before"} />
        <img
          src={after}
          alt={alt + " after"}
          style={{ clipPath: `inset(0 0 0 ${value}%)` }}
        />
        <span
          className="comparison-divider"
          style={{ left: value + "%" }}
          aria-hidden="true"
        />
      </div>
      <label>
        Concept to completion
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        />
      </label>
    </div>
  );
}
export function ProjectModules({
  page,
  projects,
}: {
  page: PageData;
  projects: BlockItem[];
}) {
  const related = projects.filter((x) => x.href !== page.route);
  return (
    <>
      <div className="project-modules">
        {page.projectModules?.map((m) => (
          <section className="project-module" key={m.id}>
            <h2>{m.title}</h2>
            {m.body && <p>{m.body}</p>}
            {m.kind === "image" && m.src && (
              <img src={m.src} alt={m.alt || m.title} loading="lazy" />
            )}
            {m.kind === "video" && m.src && (
              <video
                src={m.src}
                controls
                preload="none"
                playsInline
                aria-label={m.alt || m.title}
              >
                {m.captions && (
                  <track
                    kind="captions"
                    src={m.captions}
                    srcLang="en"
                    label="English"
                    default
                  />
                )}
              </video>
            )}
            {m.kind === "comparison" && m.src && m.after && (
              <Comparison
                before={m.src}
                after={m.after}
                alt={m.alt || m.title}
              />
            )}
          </section>
        ))}
      </div>
      <nav className="related-work" aria-label="Related creative explorations">
        <h2>
          Keep exploring<span className="teal-dot">.</span>
        </h2>
        <div>
          {related.map((x) => (
            <a key={x.id} href={safeHref(x.href)}>
              <img src={x.image} alt="" loading="lazy" />
              <span>
                {x.title}
                <b aria-hidden="true">↗</b>
              </span>
            </a>
          ))}
        </div>
      </nav>
    </>
  );
}
