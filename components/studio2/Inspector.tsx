"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
export function DraftField({
  value,
  onCommit,
  multi = false,
  placeholder = "",
  numeric,
}: {
  value: string;
  onCommit: (v: string) => void;
  multi?: boolean;
  placeholder?: string;
  numeric?: { min: number; max: number; step: number };
}) {
  const [draft, setDraft] = useState(value);
  const cancel = useRef(false);
  // Apply Undo, Redo and history restores before the inspector repaints.
  useLayoutEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (draft === value) return;
    const leave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [draft, value]);
  const props = {
    value: draft,
    placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(e.target.value),
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (cancel.current) {
        cancel.current = false;
        return;
      }
      if (numeric && !(e.target as HTMLInputElement).checkValidity()) {
        (e.target as HTMLInputElement).reportValidity();
        setDraft(value);
        return;
      }
      if (draft !== value) onCommit(draft);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !multi) {
        e.preventDefault();
        (e.target as HTMLInputElement).blur();
      }
      if (e.key === "Escape") {
        cancel.current = true;
        setDraft(value);
        (e.target as HTMLInputElement).blur();
      }
    },
  };
  return multi ? (
    <textarea rows={4} {...props} />
  ) : (
    <input
      type={numeric ? "number" : "text"}
      required={!!numeric}
      min={numeric?.min}
      max={numeric?.max}
      step={numeric?.step}
      {...props}
    />
  );
}
import type {
  CanvasNode,
  Breakpoint,
  StyleValues,
  Pattern,
  Motion,
  TargetOverride,
} from "@/lib/studio2/model";
import { defaultPattern, defaultMotion } from "@/lib/studio2/model";
import { bindingContent, type Binding } from "@/lib/studio2/bindings";
import type { PageData } from "@/lib/types";
import {canReplaceNative} from "@/lib/studio2/native-rebuild";
import {mediaSource} from "@/lib/studio2/render";
import {focalFor} from "@/lib/studio2/image-focal";
import FocalControl from "./FocalControl";
export default function Inspector({
  page,
  node,
  binding,
  override,
  breakpoint,
  metrics,
  onProps,
  onStyle,
  onPattern,
  onMotion,
  onPage,
  onUpload,
  onGalleryUpload,
  onGalleryLibrary,
  onGalleryPosition,
  galleryUrls,
  onAction,
  onReset,
  imagePreview,
  imageName,
  onLibrary,
}: {
  page: PageData;
  node?: CanvasNode;
  binding?: Binding;
  override?: TargetOverride;
  breakpoint: Breakpoint;
  metrics: Record<string, string>;
  onProps: (key: string, value: unknown) => void;
  onStyle: (key: keyof StyleValues, value: string | number | undefined) => void;
  onPattern: (pattern: Pattern | undefined) => void;
  onMotion: (motion: Motion) => void;
  onPage: (key: string, value: string) => void;
  onUpload: (file: File) => void;
  onGalleryUpload: (index:number,file:File) => void;
  onGalleryLibrary: (index:number) => void;
  onGalleryPosition: (index:number,position:string) => void;
  galleryUrls: Record<string,string>;
  onAction: (action: string) => void;
  onReset: () => void;
  imagePreview?: string;
  imageName?: string;
  onLibrary?: () => void;
}) {
  const [tab, setTab] = useState("Content");
  useEffect(() => setTab("Content"), [node?.id, binding?.id]);
  const anchoredOriginal = !!node && page.builder?.mode==="template" &&
    Object.values(page.builder.nativeReplacementNodes||{}).includes(node.id);
  const styles = (node || override)?.styles?.[breakpoint] || {},
    pattern =
      (node || override)?.patterns?.[breakpoint] ||
      (breakpoint === "mobile"
        ? (node || override)?.patterns?.tablet
        : undefined) ||
      (breakpoint !== "desktop"
        ? (node || override)?.patterns?.desktop
        : undefined),
    kind = node?.kind || binding?.kind,
    motion = node?.motion || defaultMotion;
  const field = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    placeholder = "",
    multi = false,
  ) => (
    <label className="s2-field">
      {label}
      <DraftField
        key={(node?.id || binding?.id || page.slug) + label + breakpoint}
        value={value}
        onCommit={onChange}
        placeholder={placeholder}
        multi={multi}
      />
    </label>
  );
  const numeric = (
    label: string,
    value: number,
    onChange: (value: number) => void,
    min = 0,
    max = 2400,
    step = 1,
  ) => (
    <label className="s2-field">
      {label}
      <DraftField
        key={(node?.id || binding?.id || page.slug) + label + breakpoint}
        value={String(value)}
        onCommit={(v) => onChange(Number(v))}
        numeric={{ min, max, step }}
      />
    </label>
  );
  const select = (
    label: string,
    value: string,
    values: string[],
    onChange: (v: string) => void,
  ) => (
    <label className="s2-field">
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {values.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );
  const style = (label: string, key: keyof StyleValues, placeholder: string) =>
    field(
      label,
      String(styles[key] ?? ""),
      (v) => onStyle(key, v || undefined),
      metrics[key] ? "Inherited: " + metrics[key] : placeholder,
    );
  if (!node && !binding)
    return (
      <aside className="s2-inspector" aria-label="Page settings">
        <div className="s2-panel-title">
          <h2>Page settings</h2>
        </div>
        <p className="s2-hint">
          Select an element on the canvas, or manage this page here.
        </p>
        {field("Page name", page.title, (v) => onPage("title", v))}
        {page.builder?.mode === "custom" ? (
          field("Address after release", page.route, (v) => onPage("route", v))
        ) : (
          <p className="s2-hint">
            Current address: {page.route}. Template route changes and redirects
            are part of the site-coverage phase.
          </p>
        )}
        <p className="s2-hint">
          New addresses become public only through a configured release. Local
          preview has its own private address.
        </p>
        {field("Search title", page.seo.title, (v) => onPage("seoTitle", v))}
        {field(
          "Search description",
          page.seo.description,
          (v) => onPage("seoDescription", v),
          "",
          true,
        )}
        {page.builder?.mode === "custom" && (
          <button
            className="s2-secondary"
            onClick={() => onAction("duplicate-page")}
          >
            Duplicate page
          </button>
        )}
        {page.builder?.mode === "custom" && (
          <button
            className="s2-secondary"
            onClick={() => onAction("delete-page")}
          >
            Delete builder page
          </button>
        )}
        <a className="s2-classic" href="/studio/">
          Open classic Studio ↗
        </a>
      </aside>
    );
  return (
    <aside className="s2-inspector" aria-label="Element inspector">
      <div className="s2-panel-title">
        <div>
          <small>{binding ? "Approved template" : "Builder element"}</small>
          <h2>{node?.name || binding?.name}</h2>
        </div>
      </div>
      <nav className="s2-inspector-tabs">
        {[
          "Content",
          "Layout",
          "Typography",
          "Background",
          "Motion",
          "Responsive",
          "Accessibility",
        ]
          .filter(
            (t) =>
              t !== "Typography" ||
              ["heading", "text", "button"].includes(kind || ""),
          )
          .map((t) => (
            <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
      </nav>
      <fieldset disabled={!!node?.locked} className="s2-inspector-fields">
        <legend className="s2-sr-only">Element properties</legend>
        <div className="s2-scope">
          {breakpoint === "desktop" ? "Desktop base" : breakpoint + " override"}
          <button
            onClick={onReset}
            title="Reset this breakpoint to inherited values"
          >
            Reset
          </button>
        </div>
        {tab === "Content" && (
          <>
            {node &&
              field("Element name", node.name, (v) => onProps("name", v))}
            {["heading", "text", "button"].includes(kind || "") &&
              field(
                kind === "heading" ? "Headline" : "Text",
                node?.props.text ??
                  (binding ? bindingContent(page, binding) : ""),
                (v) => onProps("text", v),
                "",
                kind === "text",
              )}
            {node?.kind === "heading" && (
              <>
                {field("Accent phrase", node.props.accent || "", (v) =>
                  onProps("accent", v),
                )}
                {select(
                  "Heading level",
                  node.props.level || "h2",
                  ["h1", "h2", "h3"],
                  (v) => onProps("level", v),
                )}
              </>
            )}
            {kind === "button" &&
              field(
                "Link destination",
                node?.props.href || metrics.href || "",
                (v) => onProps("href", v),
                "/contact/",
              )}
            {kind === "image" && (
              <>
                {imagePreview && (
                  <img
                    className="s2-inspector-image"
                    src={imagePreview}
                    alt="Selected photograph preview"
                  />
                )}
                <h3>Change this image</h3>
                <p className="s2-hint">
                  Upload a replacement below, or choose an existing image from
                  your media library.
                </p>
                {onLibrary && (
                  <button className="s2-secondary" onClick={onLibrary}>
                    Choose from media library
                  </button>
                )}
                <label className="s2-upload">
                  Replace image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) onUpload(file);
                    }}
                  />
                </label>
                {imageName && (
                  <p className="s2-hint">
                    Current file: <strong>{imageName}</strong>
                  </p>
                )}
                <details>
                  <summary>Use an image URL instead</summary>
                  {field(
                    "Image address (optional)",
                    (
                      node?.props.src ||
                      (binding ? bindingContent(page, binding) : "")
                    ).startsWith("asset:")
                      ? ""
                      : node?.props.src ||
                          (binding ? bindingContent(page, binding) : ""),
                    (v) => onProps("src", v),
                    "https://… or /media/…",
                  )}
                </details>
                {node &&
                  field("Caption", node.props.caption || "", (v) =>
                    onProps("caption", v),
                  )}
                <p className="s2-hint">
                  PNG, JPEG or WebP. Original bytes are retained locally. Use
                  Layout to change fit and focal position.
                </p>
              </>
            )}
            {node?.kind === "video" && (
              <>
                {field(
                  "Actual video address",
                  node.props.src || "",
                  (v) => onProps("src", v),
                  "https://…/film.mp4",
                )}
                {field("Video description", node.props.alt || "", (v) =>
                  onProps("alt", v),
                )}
                <p className="s2-hint">
                  An empty video is not rendered. Use media you have permission
                  to publish.
                </p>
              </>
            )}
            {node && ["accordion", "gallery"].includes(node.kind) && (
              <>
                {(node.props.items || []).map((item, index) => (
                  <fieldset key={item.id}>
                    <legend>Item {index + 1}</legend>
                    {field("Title", item.title, (v) =>
                      onProps(
                        "items",
                        node.props.items!.map((x, i) =>
                          i === index ? { ...x, title: v } : x,
                        ),
                      ),
                    )}
                    {field(
                      node.kind === "gallery" ? "Image address" : "Body",
                      node.kind === "gallery" ? item.src || "" : item.body,
                      (v) =>
                        onProps(
                          "items",
                          node.props.items!.map((x, i) =>
                            i === index
                              ? {
                                  ...x,
                                  [node.kind === "gallery" ? "src" : "body"]: v,
                                }
                              : x,
                          ),
                        ),
                    )}
                    {node.kind === "gallery" && <>
                      {field("Image alt text", item.alt || "", (v) =>
                        onProps("items", node.props.items!.map((x,i)=>
                          i===index ? {...x,alt:v} : x
                        ))
                      )}
                      {field("Caption", item.body || "", (v) =>
                        onProps("items", node.props.items!.map((x,i)=>
                          i===index ? {...x,body:v} : x
                        ))
                      )}
                      <label className="s2-upload">
                        Upload gallery photograph
                        <input type="file" accept="image/png,image/jpeg,image/webp"
                          onChange={e=>{
                            const file=e.target.files?.[0];
                            e.target.value="";
                            if(file)onGalleryUpload(index,file);
                          }}/>
                      </label>
                      <button className="s2-secondary"
                        onClick={()=>onGalleryLibrary(index)}>
                        Choose photograph from media library
                      </button>
                      <FocalControl
                        src={mediaSource(item.src,galleryUrls)}
                        position={focalFor(item,breakpoint)}
                        fit="cover"
                        breakpoint={breakpoint}
                        onPosition={position=>onGalleryPosition(index,position)}
                      />
                    </>}
                    <button disabled={index===0} onClick={()=>{
                      const next=[...(node.props.items||[])];
                      [next[index-1],next[index]]=[next[index],next[index-1]];
                      onProps("items",next);
                    }}>Move item up</button>
                    <button disabled={index===(node.props.items||[]).length-1}
                      onClick={()=>{
                        const next=[...(node.props.items||[])];
                        [next[index+1],next[index]]=[next[index],next[index+1]];
                        onProps("items",next);
                      }}>Move item down</button>
                    <button
                      onClick={() =>
                        onProps(
                          "items",
                          node.props.items!.filter((_, i) => i !== index),
                        )
                      }
                    >
                      Remove item
                    </button>
                  </fieldset>
                ))}
                <button
                  className="s2-secondary"
                  onClick={() =>
                    onProps("items", [
                      ...(node.props.items || []),
                      {
                        id: crypto.randomUUID(),
                        title: "New item",
                        body: "",
                        src:
                          node.kind === "gallery"
                            ? "/media/planning.webp"
                            : undefined,
                        alt: "",
                      },
                    ])
                  }
                >
                  Add item
                </button>
              </>
            )}
          </>
        )}
        {tab === "Layout" && (
          <>
            {select(
              "Layout",
              styles.display || metrics.display || "block",
              ["block", "flex", "grid"],
              (v) => onStyle("display", v),
            )}
            {styles.display === "flex" && (
              <>
                {select(
                  "Direction",
                  styles.direction || metrics.direction || "column",
                  ["row", "column"],
                  (v) => onStyle("direction", v),
                )}
                {select(
                  "Align items",
                  styles.align || metrics.align || "start",
                  ["start", "center", "end", "stretch"],
                  (v) => onStyle("align", v),
                )}
                {select(
                  "Distribute",
                  styles.justify || metrics.justify || "start",
                  ["start", "center", "end", "space-between"],
                  (v) => onStyle("justify", v),
                )}
              </>
            )}
            {styles.display === "grid" &&
              numeric(
                "Columns",
                Number(styles.columns || 2),
                (v) => onStyle("columns", v),
                1,
                6,
              )}
            {style("Gap", "gap", "24px")}
            {style("Padding", "padding", "24px or 24px 40px")}
            {style("Margin", "margin", "0px")}
            {style("Width", "width", "100%")}
            {style("Maximum width", "maxWidth", "65ch")}
            {style("Height", "height", "auto")}
            {style("Minimum height", "minHeight", "0px")}
            {style("Corner radius", "radius", "0px")}
            {style("Border width", "borderWidth", "0px")}
            {style("Border colour", "borderColor", "#12BAAF")}
            {kind === "image" && (
              <>
                {imagePreview && (
                  <img
                    className="s2-inspector-image"
                    src={imagePreview}
                    alt="Selected photograph preview"
                  />
                )}
                <h3>Change this image</h3>
                <p className="s2-hint">
                  Upload a replacement below, or choose an existing image from
                  your media library.
                </p>
                {onLibrary && (
                  <button className="s2-secondary" onClick={onLibrary}>
                    Choose from media library
                  </button>
                )}
                <FocalControl
                  src={imagePreview||""}
                  position={String(styles.objectPosition ||
                    metrics.objectPosition || "50% 50%")}
                  fit={(styles.objectFit || metrics.objectFit)==="contain"
                    ? "contain":"cover"}
                  breakpoint={breakpoint}
                  onPosition={v=>onStyle("objectPosition",v)}
                  onFit={v=>onStyle("objectFit",v)}
                />
              </>
            )}
          </>
        )}
        {tab === "Typography" && (
          <>
            {select(
              "Font",
              styles.fontFamily ||
                metrics.fontFamily ||
                (kind === "text" ? "Manrope" : "Poppins"),
              ["Poppins", "Manrope"],
              (v) => onStyle("fontFamily", v),
            )}
            {style("Font size", "fontSize", "48px")}
            {numeric(
              "Weight",
              Number(styles.fontWeight || metrics.fontWeight || 650),
              (v) => onStyle("fontWeight", v),
              100,
              900,
              50,
            )}
            {numeric(
              "Line height",
              Number(styles.lineHeight || metrics.lineHeight || 1.08),
              (v) => onStyle("lineHeight", v),
              0.8,
              3,
              0.01,
            )}
            {style("Letter spacing", "letterSpacing", ".004em")}
            {style("Text colour", "color", "#FAF9FD")}
            {style("Accent colour", "accentColor", "#12BAAF")}
            {select(
              "Text alignment",
              styles.textAlign || metrics.textAlign || "left",
              ["left", "center", "right"],
              (v) => onStyle("textAlign", v),
            )}
            <div className="s2-presets">
              <button
                onClick={() => {
                  onStyle(
                    "fontSize",
                    breakpoint === "mobile" ? "36px" : "64px",
                  );
                  onStyle("lineHeight", 1.08);
                }}
              >
                Display
              </button>
              <button
                onClick={() => {
                  onStyle("fontSize", "17px");
                  onStyle("lineHeight", 1.5);
                }}
              >
                Body
              </button>
            </div>
          </>
        )}
        {tab === "Background" && (
          <>
            {style("Background colour or gradient", "background", "#0D2F49")}
            {numeric(
              "Element opacity",
              Number(styles.opacity ?? metrics.opacity ?? 1),
              (v) => onStyle("opacity", v),
              0,
              1,
              0.01,
            )}
            {!binding && (
              <>
                <button
                  className="s2-secondary"
                  onClick={() =>
                    onPattern({ ...defaultPattern, preset: "closing" })
                  }
                >
                  Restore approved closing CTA pattern
                </button>
                <label className="s2-checkbox">
                  <input
                    type="checkbox"
                    checked={!!pattern?.enabled}
                    onChange={(e) =>
                      onPattern({
                        ...defaultPattern,
                        ...pattern,
                        enabled: e.target.checked,
                      })
                    }
                  />
                  Approved S + dot pattern
                </label>
                {pattern?.preset === "closing" ? (
                  <>
                    <button
                      className="s2-secondary"
                      onClick={() =>
                        onPattern({ ...defaultPattern, preset: "custom" })
                      }
                    >
                      Use custom pattern controls
                    </button>
                    <p className="s2-hint">
                      Exact approved closing geometry, with its 800px and 600px
                      responsive treatments.
                    </p>
                  </>
                ) : (
                  pattern?.enabled && (
                    <>
                      {numeric(
                        "Pattern X (%)",
                        pattern.x,
                        (v) =>
                          onPattern({ ...pattern, preset: "custom", x: v }),
                        -200,
                        200,
                      )}
                      {numeric(
                        "Pattern Y (%)",
                        pattern.y,
                        (v) =>
                          onPattern({ ...pattern, preset: "custom", y: v }),
                        -200,
                        200,
                      )}
                      {numeric(
                        "Pattern width (px)",
                        pattern.size,
                        (v) =>
                          onPattern({ ...pattern, preset: "custom", size: v }),
                        50,
                        2400,
                      )}
                      {numeric(
                        "Pattern opacity",
                        pattern.opacity,
                        (v) =>
                          onPattern({
                            ...pattern,
                            preset: "custom",
                            opacity: v,
                          }),
                        0,
                        1,
                        0.01,
                      )}
                      {numeric(
                        "Pattern rotation",
                        pattern.rotation,
                        (v) =>
                          onPattern({
                            ...pattern,
                            preset: "custom",
                            rotation: v,
                          }),
                        -180,
                        180,
                      )}
                      {select(
                        "Pattern blend",
                        pattern.blend,
                        ["normal", "multiply", "screen"],
                        (v) =>
                          onPattern({
                            ...pattern,
                            preset: "custom",
                            blend: v as Pattern["blend"],
                          }),
                      )}
                      <label className="s2-checkbox">
                        <input
                          type="checkbox"
                          checked={pattern.repeat}
                          onChange={(e) =>
                            onPattern({
                              ...pattern,
                              preset: "custom",
                              repeat: e.target.checked,
                            })
                          }
                        />
                        Repeat pattern
                      </label>
                    </>
                  )
                )}
              </>
            )}
            {binding && (
              <p className="s2-hint">
                Template pattern geometry stays approved in this slice. Pattern
                placement is fully editable on builder sections.
              </p>
            )}
          </>
        )}
        {tab === "Motion" &&
          (node ? (
            <>
              {select(
                "Motion preset",
                motion.preset,
                ["none", "reveal", "fade", "slide", "scale", "parallax"],
                (v) =>
                  onMotion({
                    ...motion,
                    preset: v as Motion["preset"],
                    trigger: v === "parallax" ? "scroll" : motion.trigger,
                  }),
              )}
              {motion.preset !== "none" && (
                <>
                  {motion.preset === "parallax" ? (
                    <p className="s2-hint">
                      Parallax follows scroll in both directions.
                    </p>
                  ) : (
                    select(
                      "Trigger",
                      motion.trigger,
                      ["viewport", "scroll", "load"],
                      (v) =>
                        onMotion({
                          ...motion,
                          trigger: v as Motion["trigger"],
                        }),
                    )
                  )}
                  {motion.trigger !== "scroll" &&
                    motion.preset !== "parallax" && (
                      <>
                        {numeric(
                          "Duration (ms)",
                          motion.duration,
                          (v) => onMotion({ ...motion, duration: v }),
                          0,
                          5000,
                          50,
                        )}
                        {numeric(
                          "Delay (ms)",
                          motion.delay,
                          (v) => onMotion({ ...motion, delay: v }),
                          0,
                          3000,
                          50,
                        )}
                        {select(
                          "Easing",
                          motion.ease,
                          ["ease", "linear", "ease-in-out"],
                          (v) =>
                            onMotion({ ...motion, ease: v as Motion["ease"] }),
                        )}
                      </>
                    )}
                  {["slide", "parallax"].includes(motion.preset) &&
                    numeric(
                      "Distance (px)",
                      motion.distance,
                      (v) => onMotion({ ...motion, distance: v }),
                      0,
                      200,
                    )}
                  {motion.trigger !== "load" &&
                    numeric(
                      "Start progress",
                      motion.start,
                      (v) => onMotion({ ...motion, start: v }),
                      0,
                      0.9,
                      0.05,
                    )}
                  {(motion.trigger === "scroll" ||
                    motion.preset === "parallax") && (
                    <>
                      {numeric(
                        "End progress",
                        motion.end,
                        (v) => onMotion({ ...motion, end: v }),
                        0.1,
                        1,
                        0.05,
                      )}
                      <p className="s2-hint">
                        Scroll controls the progress directly. Timing applies to
                        load and viewport effects.
                      </p>
                    </>
                  )}
                  {motion.trigger !== "load" &&
                    motion.preset !== "parallax" && (
                      <label className="s2-checkbox">
                        <input
                          type="checkbox"
                          checked={motion.replay}
                          onChange={(e) =>
                            onMotion({ ...motion, replay: e.target.checked })
                          }
                        />
                        Replay on reverse entry
                      </label>
                    )}
                </>
              )}
              <p className="s2-hint">
                Switch to Interactive preview to test motion. Reduced-motion
                visitors always see readable content.
              </p>
            </>
          ) : (
            <p className="s2-hint">
              This element retains the approved cinematic engine. Editing its
              advanced timeline belongs to the template-coverage phase; there is
              no pretend override here.
            </p>
          ))}
        {tab === "Responsive" && (
          <>
            <h3>{breakpoint} styles</h3>
            <p className="s2-hint">
              Desktop is the base. Tablet applies at 1024px and below; mobile
              applies at 600px and below. Empty fields inherit the base.
            </p>
            {["heading", "text", "button"].includes(kind || "") &&
              style("Responsive font size", "fontSize", "Inherited")}
            {style("Responsive width", "width", "Inherited")}
            {style("Responsive padding", "padding", "Inherited")}
            {kind === "image" && <p className="s2-hint">
              Use the Layout tab's visual crop picker at this breakpoint.
              Other device sizes keep their independent focal positions.
            </p>}
            <button className="s2-secondary" onClick={onReset}>
              Reset {breakpoint} overrides
            </button>
          </>
        )}
        {tab === "Accessibility" && (
          <>
            {kind === "image" &&
              field(
                "Alternative text",
                node?.props.alt ?? override?.alt ?? metrics.alt ?? "",
                (v) => onProps("alt", v),
                "Describe the meaningful content",
              )}
            {node?.kind === "heading" &&
              select(
                "Semantic heading level",
                node.props.level || "h2",
                ["h1", "h2", "h3"],
                (v) => onProps("level", v),
              )}
            <p className="s2-hint">
              Use descriptive links, useful image descriptions and a logical
              heading order. Decorative images may have empty alt text.
            </p>
          </>
        )}
      </fieldset>
      {binding?.kind==="section" && (
        <div className="s2-element-actions" aria-label="Original section rebuilding">
          {(() => {
            const block=page.sections.find(x=>x.id===binding.sectionId);
            const supported=!!block&&canReplaceNative(page,block);
            const replaced=!!page.builder?.replacedNative?.includes(binding.sectionId);
            return supported ? <>
              <p className="s2-hint">
                Rebuild this standard-flow editorial section as fully editable
                elements. The original is preserved and can be restored.
                Cinematic scroll scenes remain protected.
              </p>
              {!replaced ? (
                <button onClick={()=>onAction("rebuild-native")}>
                  Rebuild as editable section
                </button>
              ):(
                <button onClick={()=>onAction("restore-native")}>
                  Restore original section
                </button>
              )}
            </> : <p className="s2-hint">
              The approved choreography of this section is protected.
              Edit its text, images and styles without breaking its motion.
            </p>;
          })()}
        </div>
      )}
      {node?.locked && (
        <p className="s2-hint">Unlock this element to edit its properties.</p>
      )}
      {node && (
        <div className="s2-element-actions">
          {node.kind==="section" && !anchoredOriginal && !node.locked && (
            <button className="s2-secondary"
              onClick={()=>onAction("save-section")}>
              Save to section library
            </button>
          )}
          {anchoredOriginal ? <p className="s2-hint">
            This rebuilt section stays at the original page position.
            Its inner elements can still be reordered.
          </p> : <>
            <button onClick={() => onAction("up")}>Move up</button>
            <button onClick={() => onAction("down")}>Move down</button>
          </>}
          <button onClick={() => onAction("duplicate")}>Duplicate</button>
          <button onClick={() => onAction("copy")}>Copy</button>
          <button onClick={() => onAction("paste")}>Paste</button>
          <button onClick={() => onAction("lock")}>
            {node.locked ? "Unlock" : "Lock"}
          </button>
          <button onClick={() => onAction("hide")}>
            {node.hidden ? "Show" : "Hide"}
          </button>
          <button onClick={() => onAction("delete")}>Delete</button>
        </div>
      )}
    </aside>
  );
}
