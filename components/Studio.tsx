"use client";
import React, { useEffect, useState, useCallback, useId } from "react";
import {
  defaultGlobals,
  defaultPages,
  newBlock,
  pageList,
  apiEndpoint,
} from "@/lib/data";
import type {
  PageData,
  Block,
  BlockItem,
  BlockType,
  Globals,
  ThemeTokens,
} from "@/lib/types";
import StudioCanvas from "./StudioCanvas";
import {compatiblePages,compatibleGlobals} from '@/lib/concept-12/compat';
import "./studio.css";
const blocks: BlockType[] = [
  "hero",
  "pagehero",
  "split",
  "story",
  "services",
  "work",
  "dot",
  "cta",
  "visual",
  "items",
  "accordion",
  "contact",
];
const labelType = (s: string) =>
  s.replace("pagehero", "page hero").replace(/^./, (x) => x.toUpperCase());
const normal = (v: unknown) => (typeof v === "object" && v !== null ? v : {});
const initialPages = structuredClone(defaultPages) as Record<string, PageData>;
const initialGlobals = structuredClone(defaultGlobals) as Globals;
export default function Studio() {
  const [mode, setMode] = useState<
    "checking" | "login" | "ready" | "demo" | "unavailable"
  >("checking");
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [pages, setPages] = useState<Record<string, PageData>>(initialPages);
  const [globals, setGlobals] = useState<Globals>(initialGlobals);
  const [slug, setSlug] = useState("home");
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<"content" | "design" | "motion" | "pages">(
    "content",
  );
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">(
    "desktop",
  );
  const [previewMotion, setPreviewMotion] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [undo, setUndo] = useState<PageData[]>([]);
  const page = pages[slug] || initialPages.home;
  const section = page.sections.find((s) => s.id === selected);
  const isDemo = mode === "demo";
  useEffect(() => {
    if (["localhost", "127.0.0.1"].includes(location.hostname)) {
      setMode("demo");
      try {
        const p = localStorage.getItem("showset-demo-pages"),
          g = localStorage.getItem("showset-demo-globals");
        if (p) setPages({ ...initialPages, ...compatiblePages(JSON.parse(p)) });
        if (g) setGlobals(compatibleGlobals(JSON.parse(g)));
      } catch {}
      return;
    }
    (async () => {
      try {
        const r = await fetch(`${apiEndpoint}?action=session`, {
          credentials: "same-origin",
        });
        if (!r.ok) throw Error();
        const x = await r.json();
        setCsrfToken(x.csrf || "");
        setMode(x.authenticated ? "ready" : "login");
      } catch {
        setMode("unavailable");
      }
    })();
  }, []);
  const load = useCallback(
    async (key: string) => {
      setSlug(key);
      setSelected(null);
      setUndo([]);
      if (mode !== "ready") return;
      try {
        const r = await fetch(
          `${apiEndpoint}?action=draft&slug=${encodeURIComponent(key)}`,
          { credentials: "same-origin" },
        );
        if (!r.ok) return;
        const d = await r.json();
        if (d.page?.sections) setPages((prev) => ({ ...prev, [key]: d.page }));
        if (d.globals?.theme) setGlobals(d.globals);
      } catch {}
    },
    [mode],
  );
  const updatePage = (fn: (p: PageData) => PageData) => {
    setPages((prev) => {
      const old = prev[slug];
      if (!old) return prev;
      setUndo((hist) => [...hist.slice(-14), structuredClone(old)]);
      return { ...prev, [slug]: fn(structuredClone(old)) };
    });
  };
  const patch = (key: keyof Block, value: unknown) => {
    if (!selected) return;
    updatePage((p) => ({
      ...p,
      sections: p.sections.map((s) =>
        s.id === selected ? { ...s, [key]: value } : s,
      ),
    }));
  };
  const patchDesign = (key: string, value: unknown) => {
    if (!selected) return;
    const next = {
      ...(section?.design || {}),
      [key]: value === null ? undefined : value,
    };
    patch("design", next);
  };
  const patchItem = (idx: number, key: keyof BlockItem, value: string) => {
    if (!selected || !section) return;
    const items = [...section.items];
    items[idx] = { ...items[idx], [key]: value };
    patch("items", items);
  };
  const patchGlobals = (
    section: "theme" | "motion" | "brand" | "footer",
    key: string,
    value: unknown,
  ) =>
    setGlobals((g) => ({ ...g, [section]: { ...g[section], [key]: value } }));
  const addBlock = (type: BlockType) => {
    const s = newBlock(type);
    updatePage((p) => ({ ...p, sections: [...p.sections, s] }));
    setSelected(s.id);
    setTab("content");
  };
  const moveBlock = (from: string, to: string) => {
    updatePage((p) => {
      const a = [...p.sections],
        i = a.findIndex((x) => x.id === from),
        j = a.findIndex((x) => x.id === to);
      if (i < 0 || j < 0 || i === j) return p;
      a.splice(j, 0, ...a.splice(i, 1));
      return { ...p, sections: a };
    });
  };
  const createPage = () => {
    const name = prompt("New page title");
    if (!name) return;
    const key = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!key || pages[key]) {
      setNotice("Choose a unique page name.");
      return;
    }
    const fresh: PageData = {
      slug: key,
      route: `/${key}/`,
      title: name,
      sections: [newBlock("pagehero"), newBlock("cta")],
      seo: { title: name + " | SHOWSET", description: "" },
    };
    setPages((p) => ({ ...p, [key]: fresh }));
    setSlug(key);
    setSelected(null);
    setTab("pages");
    setNotice(
      "Page draft created. New static URLs require a site rebuild before launch.",
    );
  };
  const removeBlock = () => {
    if (!selected || !confirm("Delete this section?")) return;
    updatePage((p) => ({
      ...p,
      sections: p.sections.filter((s) => s.id !== selected),
    }));
    setSelected(null);
  };
  const duplicate = () => {
    if (!section) return;
    const copy = structuredClone(section);
    copy.id = `section-${Math.random().toString(36).slice(2, 9)}`;
    updatePage((p) => ({
      ...p,
      sections: [
        ...p.sections.slice(
          0,
          p.sections.findIndex((s) => s.id === selected) + 1,
        ),
        copy,
        ...p.sections.slice(p.sections.findIndex((s) => s.id === selected) + 1),
      ],
    }));
    setSelected(copy.id);
  };
  async function command(action: "save" | "publish") {
    setBusy(true);
    setNotice("");
    try {
      if (mode === "demo") {
        const backup = {
          at: new Date().toISOString(),
          draftPages: localStorage.getItem("showset-demo-pages"),
          draftGlobals: localStorage.getItem("showset-demo-globals"),
          publishedPages: localStorage.getItem(
            "showset-preview-published-pages",
          ),
          publishedGlobals: localStorage.getItem(
            "showset-preview-published-globals",
          ),
        };
        localStorage.setItem("showset-studio-recovery", JSON.stringify(backup));
        localStorage.setItem("showset-demo-pages", JSON.stringify(pages));
        localStorage.setItem("showset-demo-globals", JSON.stringify(globals));
        if (action === "publish") {
          localStorage.setItem(
            "showset-preview-published-pages",
            JSON.stringify(pages),
          );
          localStorage.setItem(
            "showset-preview-published-globals",
            JSON.stringify(globals),
          );
          setNotice(
            "Published to LOCAL BROWSER PREVIEW only. Open View site in this browser and refresh. This does NOT publish to showset.co.za.",
          );
        } else {
          setNotice(
            "Draft saved to this browser. Publish to local preview to see it on the local website.",
          );
        }
        return;
      }
      const r = await fetch(`${apiEndpoint}?action=${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "same-origin",
        body: JSON.stringify({ slug, page, globals }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw Error(j.error || "Unable to save");
      setNotice(
        action === "save"
          ? "Draft saved."
          : "Published. The public site can load the updated data; regenerate static pages for SEO and new routes.",
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setBusy(false);
    }
  }
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch(`${apiEndpoint}?action=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });
      if (!r.ok) throw Error("Incorrect login or server error.");
      const result = await r.json();
      setCsrfToken(result.csrf || "");
      setMode("ready");
      setLoginPass("");
      try {
        const dr = await fetch(`${apiEndpoint}?action=draft&slug=home`, {
          credentials: "same-origin",
        });
        if (dr.ok) {
          const d = await dr.json();
          if (d.page?.sections) setPages((p) => ({ ...p, home: d.page }));
          if (d.globals?.theme) setGlobals(d.globals);
        }
      } catch {}
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File, cb: (u: string) => void) {
    if (mode === "demo") {
      setNotice(
        "For media uploads, connect the PHP backend. You can enter an image URL below.",
      );
      return;
    }
    const data = new FormData();
    data.append("file", file);
    setBusy(true);
    try {
      const r = await fetch(`${apiEndpoint}?action=upload`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "X-CSRF-Token": csrfToken },
        body: data,
      });
      const j = await r.json();
      if (!r.ok) throw Error(j.error || "Upload failed");
      cb(j.url);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (mode === "checking")
    return <div className="studio-login">Checking SHOWSET Studio...</div>;
  if (mode === "unavailable")
    return (
      <div className="studio-login">
        <div className="studio-login-card">
          <h1>
            showset<span>.</span> Studio
          </h1>
          <p>
            Studio publishing is not connected yet. Deploy the bundled PHP
            backend to the same domain and configure its database and
            administrator credentials.
          </p>
          <p>
            To explore the editor locally, run the Next.js development server.
            Local demo changes are stored in your browser only.
          </p>
          <a href="/">Return to website</a>
        </div>
      </div>
    );
  if (mode === "login")
    return (
      <div className="studio-login">
        <form className="studio-login-card" onSubmit={login}>
          <h1>
            showset<span>.</span> Studio
          </h1>
          <p>Private website editor</p>
          <label>
            Username
            <input
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button disabled={busy}>Sign in →</button>
          {notice && <small role="alert">{notice}</small>}
        </form>
      </div>
    );
  return (
    <div className="studio-app">
      <header className="studio-toolbar">
        <div className="studio-brand">
          <img
            src={globals.brand.logo || "/brand/approved-wordmark.png"}
            width="124"
            height="32"
            alt="showset."
          />
          <small>STUDIO</small>
        </div>
        <div className="studio-toolbar-center">
          <select
            value={slug}
            onChange={(e) => load(e.target.value)}
            aria-label="Edit page"
          >
            {Object.values(pages).map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.title}
              </option>
            ))}
          </select>
          <div className="studio-devices">
            {(["desktop", "tablet", "mobile"] as const).map((x) => (
              <button
                type="button"
                key={x}
                className={device === x ? "active" : ""}
                onClick={() => setDevice(x)}
              >
                {x}
              </button>
            ))}
          </div>
        </div>
        <div className="studio-toolbar-actions">
          <button type="button" onClick={() => setPreviewMotion((v) => !v)}>
            {previewMotion ? "Edit layout" : "Preview motion"}
          </button>
          {isDemo && <span className="studio-demo">LOCAL PREVIEW</span>}
          <a href={page.route} target="_blank" rel="noreferrer">
            View site ↗
          </a>
          <button type="button" disabled={busy} onClick={() => command("save")}>
            Save draft
          </button>
          <button
            className="studio-publish"
            type="button"
            disabled={busy}
            onClick={() => command("publish")}
          >
            {isDemo ? "Publish preview ↗" : "Publish ↗"}
          </button>
        </div>
      </header>
      {notice && (
        <div className="studio-notice" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
      <div className="studio-columns">
        <aside className="studio-left">
          <div className="studio-pane-title">
            Page structure{" "}
            <button
              title="Undo"
              disabled={!undo.length}
              onClick={() => {
                const prev = undo[undo.length - 1];
                setPages((p) => ({ ...p, [slug]: prev }));
                setUndo((h) => h.slice(0, -1));
              }}
            >
              ↶
            </button>
          </div>
          <div className="studio-block-list">
            {page.sections.map((b, i) => (
              <button
                className={`studio-layer ${selected === b.id ? "selected" : ""}`}
                key={b.id}
                draggable
                onDragStart={() => setDragId(b.id)}
                onDragEnd={() => setDragId(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragId) moveBlock(dragId, b.id);
                  setDragId(null);
                }}
                onClick={() => {
                  setSelected(b.id);
                  setTab("content");
                }}
              >
                <span className="studio-grip">⠿</span>
                <span className="studio-layer-count">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="studio-layer-name">
                  {(b.headline || labelType(b.type))
                    .replace(/<[^>]*>/g, " ")
                    .replace(/\s+/g, " ")
                    .trim()}
                  <small>{labelType(b.type)}</small>
                </span>
              </button>
            ))}
          </div>
          <div className="studio-add">
            <div className="studio-pane-title">Add section</div>
            <div className="studio-block-buttons">
              {blocks.map((b) => (
                <button key={b} onClick={() => addBlock(b)}>
                  + {labelType(b)}
                </button>
              ))}
            </div>
          </div>
        </aside>
        <div className="studio-stage">
          <StudioCanvas
            catalog={pages}
            page={page}
            globals={globals}
            device={device}
            previewMotion={previewMotion}
            selected={selected}
            onSelect={setSelected}
            onNavigate={(route) => {
              const next = Object.values(pages).find((p) => p.route === route);
              if (next) load(next.slug);
            }}
          />
        </div>
        <aside className="studio-right">
          <div className="studio-inspector-tabs">
            {(["content", "design", "motion", "pages"] as const).map((t) => (
              <button
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="studio-inspector-body">
            {tab === "content" && (
              <>
                {section ? (
                  <>
                    <div className="studio-pane-title">
                      {labelType(section.type)} settings
                    </div>
                    <TextField
                      label="Headline"
                      value={section.headline}
                      onChange={(v) => patch("headline", v)}
                    />
                    <TextField
                      label="Accent line"
                      value={section.accent}
                      onChange={(v) => patch("accent", v)}
                    />
                    <TextField
                      label="Body text"
                      value={section.body}
                      multiline
                      onChange={(v) => patch("body", v)}
                    />
                    <TextField
                      label="Image URL"
                      value={section.image}
                      onChange={(v) => patch("image", v)}
                    />
                    <label className="studio-field">
                      Upload image
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) upload(f, (u) => patch("image", u));
                        }}
                      />
                    </label>
                    <TextField
                      label="Button label"
                      value={section.buttonLabel}
                      onChange={(v) => patch("buttonLabel", v)}
                    />
                    <TextField
                      label="Button destination"
                      value={section.buttonHref}
                      onChange={(v) => patch("buttonHref", v)}
                    />
                    <TextField
                      label="Secondary button"
                      value={section.secondaryLabel}
                      onChange={(v) => patch("secondaryLabel", v)}
                    />
                    <TextField
                      label="Secondary link"
                      value={section.secondaryHref}
                      onChange={(v) => patch("secondaryHref", v)}
                    />
                    {section.type === "contact" && (
                      <>
                        <TextField
                          label="Form heading"
                          value={section.formTitle}
                          onChange={(v) => patch("formTitle", v)}
                        />
                        <TextField
                          label="Form helper text"
                          value={section.helperText}
                          multiline
                          onChange={(v) => patch("helperText", v)}
                        />
                      </>
                    )}
                    <label className="studio-check">
                      <input
                        type="checkbox"
                        checked={section.pattern}
                        onChange={(e) => patch("pattern", e.target.checked)}
                      />{" "}
                      Subtle background pattern
                    </label>
                    <label className="studio-check">
                      <input
                        type="checkbox"
                        checked={section.reveal}
                        onChange={(e) => patch("reveal", e.target.checked)}
                      />{" "}
                      Circular heading reveal
                    </label>
                    <label className="studio-field">
                      Carousel speed (seconds)
                      <input
                        type="number"
                        min="3"
                        max="30"
                        value={section.speed}
                        onChange={(e) => patch("speed", Number(e.target.value))}
                      />
                    </label>
                    <div className="studio-pane-title">
                      Items{" "}
                      <button
                        onClick={() =>
                          patch("items", [
                            ...section.items,
                            {
                              id: `item-${Date.now()}`,
                              title: "New item",
                              description: "",
                              image: "/media/planning.webp",
                              href: "#",
                            },
                          ])
                        }
                      >
                        + Add
                      </button>
                    </div>
                    {section.items.map((item, i) => (
                      <div className="studio-item" key={item.id}>
                        <strong>
                          Item {i + 1}{" "}
                          <button
                            onClick={() =>
                              patch(
                                "items",
                                section.items.filter((_, j) => j !== i),
                              )
                            }
                          >
                            Remove
                          </button>
                        </strong>
                        <TextField
                          label="Title"
                          value={item.title}
                          onChange={(v) => patchItem(i, "title", v)}
                        />
                        <TextField
                          label="Accent"
                          value={item.accent || ""}
                          onChange={(v) => patchItem(i, "accent", v)}
                        />
                        <TextField
                          label="Description"
                          value={item.description}
                          multiline
                          onChange={(v) => patchItem(i, "description", v)}
                        />
                        <TextField
                          label="Image"
                          value={item.image || ""}
                          onChange={(v) => patchItem(i, "image", v)}
                        />
                        <TextField
                          label="Category"
                          value={item.category || ""}
                          onChange={(v) => patchItem(i, "category", v)}
                        />
                        <TextField
                          label="Link"
                          value={item.href || ""}
                          onChange={(v) => patchItem(i, "href", v)}
                        />
                      </div>
                    ))}
                    <div className="studio-section-actions">
                      <button onClick={duplicate}>Duplicate section</button>
                      <button className="danger" onClick={removeBlock}>
                        Delete section
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>
                      Select a section in the canvas or left sidebar to edit its
                      content.
                    </p>
                    <h3>Global brand</h3>
                    <TextField
                      label="Approved logo asset URL"
                      value={
                        globals.brand.logo || "/brand/approved-wordmark.png"
                      }
                      onChange={(v) => patchGlobals("brand", "logo", v)}
                    />
                    <p className="studio-hint">
                      Use approved SHOWSET artwork. The wordmark is protected
                      from typesetting changes.
                    </p>
                    <TextField
                      label="Tagline"
                      value={globals.brand.tagline}
                      onChange={(v) => patchGlobals("brand", "tagline", v)}
                    />
                    <h3>Footer</h3>
                    <TextField
                      label="Footer description"
                      value={globals.footer.description}
                      multiline
                      onChange={(v) => patchGlobals("footer", "description", v)}
                    />
                    <TextField
                      label="Footer sign-off"
                      value={globals.footer.signoff || defaultGlobals.footer.signoff || ""}
                      onChange={(v) => patchGlobals("footer", "signoff", v)}
                    />
                    {(["email", "phone", "location"] as const).map((key) => (
                      <TextField
                        key={key}
                        label={"Footer contact " + key}
                        value={
                          globals.footer.contact?.[key] ||
                          defaultGlobals.footer.contact?.[key] ||
                          ""
                        }
                        onChange={(v) =>
                          setGlobals((g) => ({
                            ...g,
                            footer: {
                              ...g.footer,
                              contact: {
                                email: g.footer.contact?.email ?? defaultGlobals.footer.contact?.email ?? "",
                                phone: g.footer.contact?.phone ?? defaultGlobals.footer.contact?.phone ?? "",
                                location: g.footer.contact?.location ?? defaultGlobals.footer.contact?.location ?? "",
                                [key]: v,
                              },
                            },
                          }))
                        }
                      />
                    ))}
                  </>
                )}
              </>
            )}
            {tab === "design" && (
              <>
                <div className="studio-pane-title">Global design system</div>
                {(
                  ["navy", "navyDark", "blue", "teal", "sand", "white"] as const
                ).map((k) => (
                  <label key={k} className="studio-color-field">
                    {k}
                    <span>
                      <input
                        type="color"
                        value={globals.theme[k]}
                        onChange={(e) =>
                          patchGlobals("theme", k, e.target.value)
                        }
                      />
                      <input
                        value={globals.theme[k]}
                        onChange={(e) =>
                          patchGlobals("theme", k, e.target.value)
                        }
                      />
                    </span>
                  </label>
                ))}
                <TextField
                  label="Heading font"
                  value={globals.theme.fontHeading}
                  onChange={(v) => patchGlobals("theme", "fontHeading", v)}
                />
                <TextField
                  label="Body font"
                  value={globals.theme.fontBody}
                  onChange={(v) => patchGlobals("theme", "fontBody", v)}
                />
                <TextField
                  label="Heading tracking"
                  value={globals.theme.headingTracking}
                  onChange={(v) => patchGlobals("theme", "headingTracking", v)}
                />
                <TextField
                  label="Body tracking"
                  value={globals.theme.bodyTracking}
                  onChange={(v) => patchGlobals("theme", "bodyTracking", v)}
                />
                {(
                  [
                    "headingLeading",
                    "bodyLeading",
                    "sectionSpace",
                    "radius",
                    "buttonHeight",
                    "patternOpacity",
                  ] as const
                ).map((k) => (
                  <label className="studio-field" key={k}>
                    {k}
                    <input
                      type="number"
                      min="0"
                      max={
                        k === "sectionSpace"
                          ? 250
                          : k === "patternOpacity"
                            ? 1
                            : 100
                      }
                      step={
                        k.includes("Leading") || k === "patternOpacity"
                          ? 0.01
                          : 1
                      }
                      value={globals.theme[k]}
                      onChange={(e) =>
                        patchGlobals("theme", k, Number(e.target.value))
                      }
                    />
                  </label>
                ))}
                {section && (
                  <>
                    <div className="studio-pane-title">Selected section</div>
                    {(
                      [
                        "spaceTop",
                        "spaceBottom",
                        "headingSize",
                        "mobileHeadingSize",
                        "bodySize",
                        "radius",
                      ] as const
                    ).map((k) => (
                      <label className="studio-field" key={k}>
                        {k}
                        <input
                          type="number"
                          min="0"
                          max="300"
                          placeholder="Use global"
                          value={section.design?.[k] ?? ""}
                          onChange={(e) =>
                            patchDesign(
                              k,
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                            )
                          }
                        />
                      </label>
                    ))}
                    <TextField
                      label="Mobile image position"
                      value={section.design?.mobileImagePosition || ""}
                      onChange={(v) => patchDesign("mobileImagePosition", v)}
                    />
                    <TextField
                      label="Image position (e.g. 45% 50%)"
                      value={section.design?.imagePosition || ""}
                      onChange={(v) => patchDesign("imagePosition", v)}
                    />
                  </>
                )}
                <p className="studio-hint">
                  These tokens apply to every page. Responsive layouts are
                  governed by the shared component stylesheet.
                </p>
              </>
            )}
            {tab === "motion" && (
              <>
                <div className="studio-pane-title">Global motion</div>
                {section && (
                  <label className="studio-field">
                    Scene preset
                    <select
                      value={section.design?.motionPreset || "cinematic"}
                      onChange={(e) =>
                        patchDesign("motionPreset", e.target.value)
                      }
                    >
                      <option value="cinematic">Cinematic</option>
                      <option value="short">Short</option>
                      <option value="still">Still / readable</option>
                    </select>
                  </label>
                )}
                {(["enabled", "circleReveal"] as const).map((k) => (
                  <label className="studio-check" key={k}>
                    <input
                      type="checkbox"
                      checked={globals.motion[k]}
                      onChange={(e) =>
                        patchGlobals("motion", k, e.target.checked)
                      }
                    />
                    {k}
                  </label>
                ))}
                {(
                  ["heroScale", "storyParallax", "carouselSeconds"] as const
                ).map((k) => (
                  <label className="studio-field" key={k}>
                    {k}
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step=".1"
                      value={globals.motion[k]}
                      onChange={(e) =>
                        patchGlobals("motion", k, Number(e.target.value))
                      }
                    />
                  </label>
                ))}
                <p className="studio-hint">
                  Advanced motion choreography is implemented in React. These
                  controls cover the existing motion components.
                </p>
              </>
            )}
            {tab === "pages" && (
              <>
                {page.route.startsWith("/work/") && (
                  <>
                    <div className="studio-pane-title">
                      Project storytelling
                    </div>
                    <button
                      onClick={() =>
                        updatePage((p) => ({
                          ...p,
                          projectModules: [
                            ...(p.projectModules || []),
                            {
                              id: `module-${Date.now()}`,
                              kind: "text",
                              title: "Our approach",
                              body: "",
                            },
                          ],
                        }))
                      }
                    >
                      + Add module
                    </button>
                    {page.projectModules?.map((m, i) => (
                      <div className="studio-item" key={m.id}>
                        <label className="studio-field">
                          Module type
                          <select
                            value={m.kind}
                            onChange={(e) =>
                              updatePage((p) => ({
                                ...p,
                                projectModules: p.projectModules?.map((x, j) =>
                                  j === i
                                    ? {
                                        ...x,
                                        kind: e.target.value as typeof m.kind,
                                      }
                                    : x,
                                ),
                              }))
                            }
                          >
                            {["text", "image", "video", "comparison"].map(
                              (k) => (
                                <option key={k}>{k}</option>
                              ),
                            )}
                          </select>
                        </label>
                        {(
                          [
                            "title",
                            "body",
                            "src",
                            "after",
                            "alt",
                            "captions",
                          ] as const
                        ).map((k) => (
                          <TextField
                            key={k}
                            label={
                              k === "src"
                                ? "Media URL"
                                : k === "after"
                                  ? "Comparison after URL"
                                  : k
                            }
                            value={m[k] || ""}
                            multiline={k === "body"}
                            onChange={(v) =>
                              updatePage((p) => ({
                                ...p,
                                projectModules: p.projectModules?.map((x, j) =>
                                  j === i ? { ...x, [k]: v } : x,
                                ),
                              }))
                            }
                          />
                        ))}
                        <button
                          disabled={i === 0}
                          onClick={() =>
                            updatePage((p) => {
                              const modules = [...(p.projectModules || [])];
                              [modules[i - 1], modules[i]] = [
                                modules[i],
                                modules[i - 1],
                              ];
                              return { ...p, projectModules: modules };
                            })
                          }
                        >
                          Move up
                        </button>
                        <button
                          onClick={() =>
                            updatePage((p) => ({
                              ...p,
                              projectModules: p.projectModules?.filter(
                                (_, j) => i !== j,
                              ),
                            }))
                          }
                        >
                          Remove module
                        </button>
                      </div>
                    ))}
                  </>
                )}
                <div className="studio-pane-title">Page metadata</div>
                <TextField
                  label="Page title"
                  value={page.title}
                  onChange={(v) => updatePage((p) => ({ ...p, title: v }))}
                />
                <TextField
                  label="SEO title"
                  value={page.seo.title}
                  onChange={(v) =>
                    updatePage((p) => ({ ...p, seo: { ...p.seo, title: v } }))
                  }
                />
                <TextField
                  label="SEO description"
                  multiline
                  value={page.seo.description}
                  onChange={(v) =>
                    updatePage((p) => ({
                      ...p,
                      seo: { ...p.seo, description: v },
                    }))
                  }
                />
                <p className="studio-hint">
                  Publishing changes page content immediately through the API,
                  but SEO metadata must be included in a fresh static build for
                  crawlers. Adding new routes also requires rebuilding.
                </p>
                <div className="studio-pane-title">
                  Global header and footer
                </div>
                <TextField
                  label="Header button"
                  value={globals.header.buttonLabel}
                  onChange={(v) =>
                    setGlobals((g) => ({
                      ...g,
                      header: { ...g.header, buttonLabel: v },
                    }))
                  }
                />
                <TextField
                  label="Header link"
                  value={globals.header.buttonHref}
                  onChange={(v) =>
                    setGlobals((g) => ({
                      ...g,
                      header: { ...g.header, buttonHref: v },
                    }))
                  }
                />
                <TextField
                  label="Footer description"
                  value={globals.footer.description}
                  multiline
                  onChange={(v) =>
                    setGlobals((g) => ({
                      ...g,
                      footer: { ...g.footer, description: v },
                    }))
                  }
                />
                <TextField
                  label="Footer copyright"
                  value={globals.footer.copyright}
                  onChange={(v) =>
                    setGlobals((g) => ({
                      ...g,
                      footer: { ...g.footer, copyright: v },
                    }))
                  }
                />
                {(["links", "services"] as const).map((k) => (
                  <div key={k} className="studio-item">
                    <div className="studio-pane-title">
                      {k === "links" ? "Menu links" : "Service dropdown"}{" "}
                      <button
                        onClick={() =>
                          setGlobals((g) => ({
                            ...g,
                            header: {
                              ...g.header,
                              [k]: [
                                ...g.header[k],
                                { label: "New link", href: "/" },
                              ],
                            },
                          }))
                        }
                      >
                        + Add
                      </button>
                    </div>
                    {globals.header[k].map((x, i) => (
                      <div key={i}>
                        <TextField
                          label="Label"
                          value={x.label}
                          onChange={(v) =>
                            setGlobals((g) => ({
                              ...g,
                              header: {
                                ...g.header,
                                [k]: g.header[k].map((l, j) =>
                                  j === i ? { ...l, label: v } : l,
                                ),
                              },
                            }))
                          }
                        />
                        <TextField
                          label="Destination"
                          value={x.href}
                          onChange={(v) =>
                            setGlobals((g) => ({
                              ...g,
                              header: {
                                ...g.header,
                                [k]: g.header[k].map((l, j) =>
                                  j === i ? { ...l, href: v } : l,
                                ),
                              },
                            }))
                          }
                        />
                        <button
                          className="studio-mini-remove"
                          onClick={() =>
                            setGlobals((g) => ({
                              ...g,
                              header: {
                                ...g.header,
                                [k]: g.header[k].filter((_, j) => j !== i),
                              },
                            }))
                          }
                        >
                          Remove link
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="studio-item">
                  <div className="studio-pane-title">
                    Footer links{" "}
                    <button
                      onClick={() =>
                        setGlobals((g) => ({
                          ...g,
                          footer: {
                            ...g.footer,
                            links: [
                              ...g.footer.links,
                              { label: "New link", href: "/" },
                            ],
                          },
                        }))
                      }
                    >
                      + Add
                    </button>
                  </div>
                  {globals.footer.links.map((link, i) => (
                    <div key={i}>
                      <TextField
                        label="Footer label"
                        value={link.label}
                        onChange={(v) =>
                          setGlobals((g) => ({
                            ...g,
                            footer: {
                              ...g.footer,
                              links: g.footer.links.map((l, j) =>
                                j === i ? { ...l, label: v } : l,
                              ),
                            },
                          }))
                        }
                      />
                      <TextField
                        label="Footer URL"
                        value={link.href}
                        onChange={(v) =>
                          setGlobals((g) => ({
                            ...g,
                            footer: {
                              ...g.footer,
                              links: g.footer.links.map((l, j) =>
                                j === i ? { ...l, href: v } : l,
                              ),
                            },
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="studio-pane-title">
                  Existing pages{" "}
                  <button type="button" onClick={createPage}>
                    + New
                  </button>
                </div>
                {Object.values(pages).map((p) => (
                  <button
                    className="studio-page-link"
                    key={p.slug}
                    onClick={() => load(p.slug)}
                  >
                    {p.title}
                  </button>
                ))}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
function TextField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (x: string) => void;
  multiline?: boolean;
}) {
  const fieldId=useId();
  return (
    <label className="studio-field" htmlFor={fieldId}>
      <span id={`${fieldId}-label`}>{label}</span>
      {multiline ? (
        <textarea
          id={fieldId}
          aria-labelledby={`${fieldId}-label`}
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input id={fieldId} aria-labelledby={`${fieldId}-label`} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}
