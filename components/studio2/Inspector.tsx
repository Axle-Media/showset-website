"use client";
import { useEffect, useState } from "react";
function DraftField({
  value,
  onCommit,
  multi = false,
  placeholder = "",
}: {
  value: string;
  onCommit: (v: string) => void;
  multi?: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const props = {
    value: draft,
    placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(e.target.value),
    onBlur: () => {
      if (draft !== value) onCommit(draft);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !multi) {
        e.preventDefault();
        (e.target as HTMLInputElement).blur();
      }
      if (e.key === "Escape") {
        setDraft(value);
        (e.target as HTMLInputElement).blur();
      }
    },
  };
  return multi ? <textarea rows={4} {...props} /> : <input {...props} />;
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
  onAction,
  onReset,
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
  onAction: (action: string) => void;
  onReset: () => void;
}) {
  const [tab, setTab] = useState("Content");
  useEffect(() => setTab("Content"), [node?.id, binding?.id]);
  const styles = (node || override)?.styles?.[breakpoint] || {},
    pattern = (node || override)?.patterns?.[breakpoint],
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
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
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
        {field("Address after release", page.route, (v) => onPage("route", v))}
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
        <button
          className="s2-secondary"
          onClick={() => onAction("duplicate-page")}
        >
          Duplicate page
        </button>
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
                <label className="s2-upload">
                  Replace image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      if (e.target.files?.[0]) onUpload(e.target.files[0]);
                    }}
                  />
                </label>
                {field(
                  "Image address (optional)",
                  node?.props.src ||
                    (binding ? bindingContent(page, binding) : ""),
                  (v) => onProps("src", v),
                  "/media/planning.webp",
                )}
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
                    {node.kind === "gallery" &&
                      field("Image alt text", item.alt || "", (v) =>
                        onProps(
                          "items",
                          node.props.items!.map((x, i) =>
                            i === index ? { ...x, alt: v } : x,
                          ),
                        ),
                      )}
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
              styles.display || "block",
              ["block", "flex", "grid"],
              (v) => onStyle("display", v),
            )}
            {styles.display === "flex" && (
              <>
                {select(
                  "Direction",
                  styles.direction || "column",
                  ["row", "column"],
                  (v) => onStyle("direction", v),
                )}
                {select(
                  "Align items",
                  styles.align || "start",
                  ["start", "center", "end", "stretch"],
                  (v) => onStyle("align", v),
                )}
                {select(
                  "Distribute",
                  styles.justify || "start",
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
                {select(
                  "Image fit",
                  styles.objectFit || "cover",
                  ["cover", "contain"],
                  (v) => onStyle("objectFit", v),
                )}
                {style("Focal position", "objectPosition", "50% 50%")}
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
              styles.textAlign || "left",
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
              Number(styles.opacity ?? 1),
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
                  <p className="s2-hint">
                    Exact approved closing geometry, with its 800px and 600px
                    responsive treatments.
                  </p>
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
                (v) => onMotion({ ...motion, preset: v as Motion["preset"] }),
              )}
              {select(
                "Trigger",
                motion.trigger,
                ["viewport", "scroll", "load"],
                (v) => onMotion({ ...motion, trigger: v as Motion["trigger"] }),
              )}
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
              {numeric(
                "Distance (px)",
                motion.distance,
                (v) => onMotion({ ...motion, distance: v }),
                0,
                200,
              )}
              {numeric(
                "Start progress",
                motion.start,
                (v) => onMotion({ ...motion, start: v }),
                0,
                0.9,
                0.05,
              )}
              {numeric(
                "End progress",
                motion.end,
                (v) => onMotion({ ...motion, end: v }),
                0.1,
                1,
                0.05,
              )}
              {select(
                "Easing",
                motion.ease,
                ["ease", "linear", "ease-in-out"],
                (v) => onMotion({ ...motion, ease: v as Motion["ease"] }),
              )}
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
            {style("Responsive font size", "fontSize", "Inherited")}
            {style("Responsive width", "width", "Inherited")}
            {style("Responsive padding", "padding", "Inherited")}
            {kind === "image" &&
              style("Responsive crop", "objectPosition", "50% 50%")}
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
      {node?.locked && (
        <p className="s2-hint">Unlock this element to edit its properties.</p>
      )}
      {node && (
        <div className="s2-element-actions">
          <button onClick={() => onAction("up")}>Move up</button>
          <button onClick={() => onAction("down")}>Move down</button>
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
