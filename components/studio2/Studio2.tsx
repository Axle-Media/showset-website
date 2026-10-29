"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PageData } from "@/lib/types";
import {
  builderFor,
  findNode,
  makeNode,
  insertNode,
  changeNode,
  removeNode,
  moveNode,
  cloneNode,
  duplicateNode,
  newCustomPage,
  isContainer,
  type CanvasNode,
  type NodeKind,
  type Breakpoint,
  type StyleValues,
  type Pattern,
  type Motion,
} from "@/lib/studio2/model";
import {
  templateBindings,
  updateBinding,
  updateOverride,
} from "@/lib/studio2/bindings";
import { validStyle } from "@/lib/studio2/registry";
import {
  mediaUrls,
  storeMedia,
  verifyBackup,
  importMedia,
} from "@/lib/studio2/storage";
import { useWorkspace } from "./useWorkspace";
import Canvas from "./Canvas";
import Navigator from "./Navigator";
import Inspector from "./Inspector";
import ContextInspector from "./ContextInspector";
import type { CanvasInspection } from "@/lib/studio2/selection";
import { bindingContent } from "@/lib/studio2/bindings";
import { mediaSource } from "@/lib/studio2/render";
import "./studio2.css";
export default function Studio2() {
  const editor = useWorkspace(),
    [slug, setSlug] = useState("home"),
    [selected, setSelected] = useState<string | null>(null),
    [tab, setTab] = useState("Layers"),
    [query, setQuery] = useState(""),
    [width, setWidth] = useState(1440),
    [zoom, setZoom] = useState<number | null>(null),
    [interactive, setInteractive] = useState(false),
    [metrics, setMetrics] = useState<Record<string, string>>({}),
    [urls, setUrls] = useState<Record<string, string>>({}),
    [dialog, setDialog] = useState(false),
    [title, setTitle] = useState(""),
    [route, setRoute] = useState(""),
    [clipboard, setClipboard] = useState<CanvasNode | null>(null),
    [panel, setPanel] = useState("Canvas"),
    [selectionSerial, setSelectionSerial] = useState(0),
    [inspection, setInspection] = useState<CanvasInspection | null>(null);
  const importInput = useRef<HTMLInputElement>(null),
    dialogRef = useRef<HTMLDialogElement>(null);
  // Start on the visitor's actual editing breakpoint. Previously a phone
  // opened a 1440px desktop canvas shrunk to an unreadable 25% preview.
  // Only choose the initial mode: later user-selected widths are respected.
  useEffect(() => {
    const viewport = window.innerWidth;
    if (viewport <= 600) setWidth(Math.min(430, Math.max(320, viewport)));
    else if (viewport <= 1024) setWidth(768);
  }, []);
  const workspace = editor.workspace,
    page = workspace?.pages[slug],
    node =
      page && selected
        ? findNode(page.builder?.roots || [], selected)
        : undefined,
    bindings = page ? templateBindings(page) : [],
    binding = bindings.find((b) => b.id === selected),
    breakpoint: Breakpoint =
      width <= 600 ? "mobile" : width <= 1024 ? "tablet" : "desktop",
    override = selected ? page?.builder?.overrides[selected] : undefined;
  useEffect(() => {
    if (workspace && !workspace.pages[slug]) {
      setSlug(workspace.pages.home ? "home" : Object.keys(workspace.pages)[0]);
      setSelected(null);
    }
  }, [workspace?.pages, slug]);
  const frameState = useMemo(
    () => (workspace ? { workspace, slug, selected, interactive, urls } : null),
    [workspace, slug, selected, interactive, urls],
  );
  useEffect(() => {
    if (!workspace) return;
    let disposed = false,
      current: Record<string, string> = {};
    mediaUrls(workspace.media)
      .then((value) => {
        if (disposed) {
          // The previous canvas can unmount before IndexedDB finishes loading.
          // Revoke late-arriving object URLs instead of leaking each original.
          Object.values(value).forEach((url) => {
            if (url) URL.revokeObjectURL(url);
          });
          return;
        }
        current = value;
        setUrls(value);
      })
      .catch((error) => {
        if (!disposed) editor.setError("Unable to load media previews: " + (error as Error).message);
      });
    return () => {
      disposed = true;
      Object.values(current).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [workspace?.media.map((a) => a.id).join(",")]);
  useEffect(() => {
    if (dialog) {
      dialogRef.current?.showModal();
    } else dialogRef.current?.close();
  }, [dialog]);
  const choosePage = (value: string) => {
    setInspection(null);
    setSlug(value);
    setSelected(null);
    setMetrics({});
    setTab("Layers");
  };
  const updatePage = (fn: (p: PageData) => PageData, label = "Edit page") =>
    editor.edit(
      (w) => ({ ...w, pages: { ...w.pages, [slug]: fn(w.pages[slug]) } }),
      label,
    );
  const choose = (id: string, fromImageBrowser = false) => {
    setInspection(null);
    setSelectionSerial((n) => n + 1);
    setSelected(id);
    // Keep the photo browser available while replacing several images in a
    // row. Canvas and layer selection still switch back to the Layers view.
    if (!fromImageBrowser) setTab("Layers");
    setMetrics({});
    if (innerWidth <= 800) setPanel("Inspector");
  };
  const patchProps = (key: string, value: unknown) => {
    if (!selected || node?.locked) return;
    updatePage(
      (p) => {
        if (binding) {
          if (key === "alt")
            return updateOverride(p, binding.id, (o) => ({
              ...o,
              alt: String(value),
            }));
          if (key === "href")
            return {
              ...p,
              sections: p.sections.map((s) =>
                s.id === binding.sectionId
                  ? {
                      ...s,
                      [binding.secondary ? "secondaryHref" : "buttonHref"]:
                        String(value),
                    }
                  : s,
              ),
            };
          return updateBinding(p, binding, String(value));
        }
        const builder = builderFor(p);
        return {
          ...p,
          builder: {
            ...builder,
            roots: changeNode(builder.roots, selected, (n) =>
              key === "name"
                ? { ...n, name: String(value) }
                : { ...n, props: { ...n.props, [key]: value } },
            ),
          },
        };
      },
      "Edit " + (binding?.name || node?.name || "content"),
    );
  };
  const patchStyle = (
    key: keyof StyleValues,
    value: string | number | undefined,
  ) => {
    if (!selected || node?.locked) return;
    if (value !== undefined && !validStyle(key, value)) {
      editor.setError(
        ["color", "accentColor", "borderColor", "background"].includes(key)
          ? "Use a valid hex colour, RGB/RGBA, or a two-colour linear-gradient."
          : "Use a valid value with units, such as 24px, 50%, 1.5rem or .01em.",
      );
      return;
    }
    updatePage((p) => {
      const apply = <
        T extends {
          styles: Partial<Record<Breakpoint, StyleValues>>;
        },
      >(
        o: T,
      ): T => ({
        ...o,
        styles: {
          ...o.styles,
          [breakpoint]: { ...o.styles[breakpoint], [key]: value },
        },
      });
      if (binding) return updateOverride(p, selected, apply);
      const builder = builderFor(p);
      return {
        ...p,
        builder: {
          ...builder,
          roots: changeNode(builder.roots, selected, apply),
        },
      };
    }, "Style " + key);
  };
  const patchPattern = (pattern: Pattern | undefined) => {
    if (!selected || !node || node.locked) return;
    updatePage((p) => {
      const builder = builderFor(p);
      return {
        ...p,
        builder: {
          ...builder,
          roots: changeNode(builder.roots, selected, (n) => ({
            ...n,
            patterns: { ...n.patterns, [breakpoint]: pattern },
          })),
        },
      };
    }, "Edit background pattern");
  };
  const patchMotion = (motion: Motion) => {
    if (!selected || !node || node.locked) return;
    updatePage((p) => {
      const builder = builderFor(p);
      return {
        ...p,
        builder: {
          ...builder,
          roots: changeNode(builder.roots, selected, (n) => ({ ...n, motion })),
        },
      };
    }, "Edit motion");
  };
  const add = (kind: NodeKind) => {
    if (!page) return;
    const template = page.builder?.mode !== "custom";
    const parent = node && isContainer(node.kind) ? node.id : null;
    if (template && kind !== "section" && !parent) {
      editor.setError(
        "Add an editable section first, then select it before adding images, text or other elements.",
      );
      setTab("Layers");
      return;
    }
    const next = makeNode(kind);
    // Approved templates are protected. All new owner sections are additive
    // roots; custom content can be nested only inside those owner-created roots.
    if (template && kind === "section") {
      next.name = "Editable section";
      next.children = [makeNode("heading"), makeNode("text")];
    }
    updatePage(
      (p) => ({
        ...p,
        builder: {
          ...builderFor(p),
          roots: insertNode(
            builderFor(p).roots, next,
            template && kind === "section" ? null : parent,
          ),
        },
      }),
      "Add " + kind,
    );
    setInspection(null);
    setSelected(next.id);
    setTab("Layers");
  };
  const move = (id: string, parent: string | null, index: number) =>
    updatePage(
      (p) => ({
        ...p,
        builder: {
          ...builderFor(p),
          roots: moveNode(builderFor(p).roots, id, parent, index),
        },
      }),
      "Move element",
    );
  const action = (name: string) => {
    if (!page) return;
    if (name === "duplicate-page") {
      if (page.builder?.mode !== "custom") return;
      const copy = structuredClone(page),
        base = page.slug + "-copy";
      let key = base;
      let n = 2;
      while (workspace!.pages[key]) key = base + "-" + n++;
      copy.slug = key;
      copy.route = "/" + key + "/";
      copy.title += " copy";
      if (copy.builder?.roots.length) {
        copy.builder.roots = copy.builder.roots.map(cloneNode);
      }
      editor.edit(
        (w) => ({ ...w, pages: { ...w.pages, [key]: copy } }),
        "Duplicate page",
      );
      choosePage(key);
      return;
    }
    if (name === "delete-page") {
      if (page.builder?.mode !== "custom") return;
      editor.edit((w) => {
        const pages = { ...w.pages };
        delete pages[slug];
        return { ...w, pages };
      }, "Delete builder page");
      choosePage("home");
      return;
    }
    if (!node) return;
    if (name === "copy") {
      setClipboard(structuredClone(node));
      return;
    }
    if (name === "paste" && clipboard) {
      const copy = cloneNode(clipboard);
      updatePage(
        (p) => ({
          ...p,
          builder: {
            ...builderFor(p),
            roots: insertNode(
              builderFor(p).roots,
              copy,
              isContainer(node.kind) ? node.id : null,
            ),
          },
        }),
        "Paste element",
      );
      setSelected(copy.id);
      return;
    }
    if (name === "duplicate") {
      const result = duplicateNode(builderFor(page).roots, node.id);
      updatePage(
        (p) => ({
          ...p,
          builder: { ...builderFor(p), roots: result.roots },
        }),
        "Duplicate element",
      );
      setSelected(result.selectedId);
      return;
    }
    if (name === "delete") {
      updatePage(
        (p) => ({
          ...p,
          builder: {
            ...builderFor(p),
            roots: removeNode(builderFor(p).roots, node.id),
          },
        }),
        "Delete element",
      );
      setSelected(null);
      return;
    }
    if (name === "up" || name === "down") {
      const scan = (nodes: CanvasNode[]): CanvasNode[] => {
        const index = nodes.findIndex((n) => n.id === node.id);
        if (index >= 0) {
          const next = [...nodes],
            at = index + (name === "up" ? -1 : 1);
          if (at < 0 || at >= next.length) return next;
          [next[index], next[at]] = [next[at], next[index]];
          return next;
        }
        return nodes.map((n) => ({ ...n, children: scan(n.children) }));
      };
      updatePage(
        (p) => ({
          ...p,
          builder: { ...builderFor(p), roots: scan(builderFor(p).roots) },
        }),
        "Reorder element",
      );
      return;
    }
    updatePage(
      (p) => ({
        ...p,
        builder: {
          ...builderFor(p),
          roots: changeNode(builderFor(p).roots, node.id, (n) =>
            name === "lock"
              ? { ...n, locked: !n.locked }
              : { ...n, hidden: !n.hidden },
          ),
        },
      }),
      name === "lock" ? "Change lock" : "Change visibility",
    );
  };
  const upload = async (file: File) => {
    try {
      const asset = await storeMedia(file);
      editor.edit((w) => {
        const media = w.media.some((a) => a.id === asset.id)
          ? w.media
          : [...w.media, asset];
        const p = w.pages[slug];
        let next = p;
        if (selected && (binding?.kind === "image" || node?.kind === "image")) {
          if (binding) next = updateBinding(p, binding, "asset:" + asset.id);
          else
            next = {
              ...p,
              builder: {
                ...builderFor(p),
                roots: changeNode(builderFor(p).roots, selected, (n) => ({
                  ...n,
                  props: {
                    ...n.props,
                    src: "asset:" + asset.id,
                    alt: n.props.alt || asset.name.replace(/\.[^.]+$/, ""),
                  },
                })),
              },
            };
        }
        return { ...w, media, pages: { ...w.pages, [slug]: next } };
      }, "Upload original image");
    } catch (e) {
      editor.setError((e as Error).message);
    }
  };
  const reset = () => {
    if (!selected) return;
    updatePage((p) => {
      const clear = <
        T extends {
          styles: Partial<Record<Breakpoint, StyleValues>>;
          patterns?: Partial<Record<Breakpoint, Pattern>>;
        },
      >(
        o: T,
      ): T => ({
        ...o,
        styles: { ...o.styles, [breakpoint]: undefined },
        patterns: { ...o.patterns, [breakpoint]: undefined },
      });
      if (binding) return updateOverride(p, selected, clear);
      return {
        ...p,
        builder: {
          ...builderFor(p),
          roots: changeNode(builderFor(p).roots, selected, clear),
        },
      };
    }, "Reset breakpoint");
  };
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      // Save is available even while someone is editing a text or URL field.
      // Undo/Delete still defer to native input editing behaviour.
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        // Commit the focused draft first, then save the updated workspace.
        if ((event.target as HTMLElement).matches("input,textarea")) {
          (event.target as HTMLElement).blur();
          queueMicrotask(() => void editor.save());
        } else {
          void editor.save();
        }
        return;
      }
      if (
        (event.target as HTMLElement).matches(
          "input,textarea,select,[contenteditable=true]",
        )
      )
        return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        editor.step(event.shiftKey ? "redo" : "undo");
      }
      if (event.key === "Escape") {
        setSelected(null);
        setInteractive(false);
      }
      if (event.key === "Delete" && node && !node.locked) {
        event.preventDefault();
        action("delete");
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  if (editor.local === false)
    return (
      <main className="studio2 s2-unavailable">
        <img src="/brand/approved-wordmark.png" alt="SHOWSET" />
        <h1>Private editing workspace.</h1>
        <p>
          Studio 2.0 is local-only until authenticated hosting and permissions
          are configured.
        </p>
        <a href="/">Return to website</a>
      </main>
    );
  if (!workspace || !editor.ready)
    return (
      <main className="studio2 s2-welcome">
        <img src="/brand/approved-wordmark.png" alt="SHOWSET" />
        <p className="s2-eyebrow">Studio 2.0 · Local workspace</p>
        <h1>
          Your ideas.
          <br />
          <em>Every detail.</em>
        </h1>
        <p>
          A working canvas for the website you’ve approved. Before editing,
          we’ll preserve your exact local drafts and recovery records in a
          checksum-verified backup.
        </p>
        <p className="s2-hint">
          Classic Studio and its saved data stay in place. This does not publish
          online.
        </p>
        {editor.error && <p role="alert">{editor.error}</p>}
        {workspace ? (
          <button className="s2-primary" onClick={() => void editor.start()}>
            Back up and start editing ↗
          </button>
        ) : (
          <p>Loading local data…</p>
        )}
        {editor.error && (
          <button onClick={() => void editor.backupRaw()}>
            Export original recovery records
          </button>
        )}
        <a href="/studio/">Return to classic Studio</a>
      </main>
    );
  if (!page || !frameState) return null;
  return (
    <main className={"studio2 s2-workbench s2-panel-" + panel.toLowerCase()}>
      <header className="s2-topbar">
        <a href="/studio/" aria-label="Classic Studio">
          <img src="/brand/approved-wordmark.png" alt="SHOWSET" />
          <span>STUDIO 2.0</span>
        </a>
        <div className="s2-page-heading">
          <small>Local draft · revision {editor.revision}</small>
          <h1>{page.title}</h1>
        </div>
        <div className="s2-top-actions">
          <button
            onClick={() => editor.step("undo")}
            disabled={!editor.canUndo}
            title="Undo · Ctrl Z"
          >
            Undo
          </button>
          <button
            onClick={() => editor.step("redo")}
            disabled={!editor.canRedo}
            title="Redo · Ctrl Shift Z"
          >
            Redo
          </button>
          <button onClick={() => void editor.save()}>Save draft</button>
          <button className="s2-primary" onClick={() => void editor.preview()}>
            Save local preview ↗
          </button>
        </div>
      </header>
      <div className="s2-viewbar">
        <div className="s2-view-options">
          {[1440, 768, 390].map((size, index) => (
            <button
              key={size}
              aria-pressed={width === size}
              onClick={() => setWidth(size)}
            >
              {["Desktop", "Tablet", "Mobile"][index]}
            </button>
          ))}
          <label>
            Width{" "}
            <input
              aria-label="Canvas viewport width"
              type="number"
              min={280}
              max={2400}
              value={width}
              onChange={(e) =>
                setWidth(Math.max(280, Math.min(2400, Number(e.target.value))))
              }
            />
          </label>
          <select
            aria-label="Canvas zoom"
            value={zoom || "fit"}
            onChange={(e) =>
              setZoom(e.target.value === "fit" ? null : Number(e.target.value))
            }
          >
            <option value="fit">Fit</option>
            {[0.5, 0.75, 1, 1.25].map((v) => (
              <option key={v} value={v}>
                {v * 100}%
              </option>
            ))}
          </select>
          <button
            aria-pressed={interactive}
            onClick={() => setInteractive((v) => !v)}
          >
            {interactive ? "Return to editing" : "Interactive preview"}
          </button>
        </div>
        <div className="s2-save-state" role="status">
          <span>
            {interactive ? "Preview · links active" : "Editing · clicks select"}
          </span>
          {editor.status}
          <a
            href={"/studio/next/preview/?page=" + encodeURIComponent(slug)}
            target="_blank"
            rel="noreferrer"
          >
            Open saved preview ↗
          </a>
        </div>
      </div>
      {editor.error && (
        <div className="s2-notice" role="alert">
          {editor.error}
          <button
            onClick={() => editor.setError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
      {editor.conflict && (
        <div className="s2-notice" role="alert">
          A newer draft exists. Your changes have not overwritten it.
          <button onClick={() => void editor.backup()}>
            Download my changes
          </button>
          <button onClick={() => void editor.loadConflict()}>
            Back up and load latest
          </button>
        </div>
      )}
      <nav className="s2-mobile-panels" aria-label="Workspace panels">
        {["Layers", "Canvas", "Inspector"].map((name) => (
          <button
            key={name}
            aria-pressed={panel === name}
            onClick={() => setPanel(name)}
          >
            {name}
          </button>
        ))}
      </nav>
      <div className="s2-workspace">
        <div className="s2-left-wrap">
          <Navigator
            workspace={workspace}
            slug={slug}
            tab={tab}
            query={query}
            selected={selected}
            onPage={choosePage}
            onTab={(v) => {
              setTab(v);
              setQuery("");
            }}
            onQuery={setQuery}
            onSelect={(id) => choose(id, tab === "Images")}
            onAdd={add}
            onMove={move}
            onNew={() => setDialog(true)}
            bindings={bindings}
            urls={urls}
          />
          {tab === "History" && (
            <div className="s2-aux">
              <p className="s2-hint">
                Restoring creates a new draft revision. Current data remains
                recoverable.
              </p>
              {editor.history
                .filter((r) =>
                  r.label.toLowerCase().includes(query.toLowerCase()),
                )
                .map((rev) => (
                  <button key={rev.id} onClick={() => editor.restore(rev)}>
                    <strong>
                      Revision {rev.id} · {rev.label}
                    </strong>
                    <small>{new Date(rev.at).toLocaleString()}</small>
                  </button>
                ))}
            </div>
          )}
          {tab === "Media" && (
            <div className="s2-aux">
              <label className="s2-upload">
                Add images
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) void upload(file);
                  }}
                />
              </label>
              {workspace.media
                .filter((a) =>
                  a.name.toLowerCase().includes(query.toLowerCase()),
                )
                .map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => {
                      if (binding?.kind === "image" || node?.kind === "image")
                        patchProps("src", "asset:" + asset.id);
                    }}
                  >
                    <img
                      src={urls[asset.id] || ""}
                      alt={asset.alt || asset.name}
                    />
                    <strong>{asset.name}</strong>
                    <small>
                      {asset.width} × {asset.height} · original retained
                    </small>
                  </button>
                ))}
            </div>
          )}
          {tab === "Site" && (
            <div className="s2-aux">
              <h3>Recovery and ownership</h3>
              <button onClick={() => void editor.backup()}>
                Download verified backup
              </button>
              <button onClick={() => importInput.current?.click()}>
                Import workspace backup
              </button>
              <input
                ref={importInput}
                type="file"
                accept="application/json"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    if (file.size > 64 * 1024 * 1024)
                      throw Error("Backup is larger than 64 MB.");
                    const backup = await verifyBackup(
                      JSON.parse(await file.text()),
                    );
                    if (!backup.workspace)
                      throw Error(
                        "This backup contains raw recovery records only. Classic records have not been overwritten.",
                      );
                    if (!(await editor.backup())) return;
                    await importMedia(backup);
                    editor.edit(
                      () => backup.workspace!,
                      "Import verified workspace",
                    );
                  } catch (error) {
                    editor.setError((error as Error).message);
                  }
                  e.target.value = "";
                }}
              />
              <p className="s2-hint">
                Local saves and previews stay on this browser origin. Shared
                roles and authenticated release are later phases. No production
                publishing is enabled.
              </p>
              <a href="/studio/">Classic Studio ↗</a>
            </div>
          )}
        </div>
        <section className="s2-centre" aria-label="Website editing canvas">
          <div className="s2-breadcrumb">
            <button
              className="s2-image-shortcut"
              onClick={() => {
                setTab("Images");
                setQuery("");
                if (innerWidth <= 800) setPanel("Layers");
              }}
            >
              Images · change a photograph
            </button>
            <button onClick={() => setSelected(null)}>{page.title}</button>
            {selected && (
              <>
                <span>/</span>
                <strong>{node?.name || binding?.name || selected}</strong>
              </>
            )}
          </div>
          <Canvas
            state={frameState}
            width={width}
            height={width <= 600 ? 844 : 900}
            zoom={zoom}
            onSelect={choose}
            onInspect={(value) => {
              setInspection(value);
              setSelected(null);
              setMetrics({});
              if (innerWidth <= 800) setPanel("Inspector");
            }}
            onMetrics={setMetrics}
            onInline={(id, text, cancel) => {
              if (cancel) return;
              const targetBinding = templateBindings(page).find(
                (b) => b.id === id,
              );
              if (targetBinding)
                updatePage(
                  (p) => updateBinding(p, targetBinding, text),
                  "Inline text edit",
                );
              else
                updatePage(
                  (p) => ({
                    ...p,
                    builder: {
                      ...builderFor(p),
                      roots: changeNode(builderFor(p).roots, id, (n) => ({
                        ...n,
                        props: { ...n.props, text },
                      })),
                    },
                  }),
                  "Inline text edit",
                );
            }}
            onNavigate={(target) => {
              const next = Object.values(workspace.pages).find(
                (p) => p.route === target,
              );
              if (next) choosePage(next.slug);
            }}
          />
        </section>
        {inspection ? (
          <ContextInspector
            selection={inspection}
            page={page}
            globals={workspace.globals}
            urls={urls}
            onSelectImage={choose}
            onGlobals={(fn) =>
              editor.edit(
                (w) => ({ ...w, globals: fn(w.globals) }),
                "Edit shared " + inspection.area,
              )
            }
            onSection={(fn) =>
              updatePage(
                (p) => ({
                  ...p,
                  sections: p.sections.map((s) =>
                    s.id === inspection.sectionId ? fn(s) : s,
                  ),
                }),
                "Edit section content",
              )
            }
            onUpload={async (file) => {
              try {
                const asset = await storeMedia(file);
                editor.edit(
                  (w) => ({
                    ...w,
                    media: w.media.some((a) => a.id === asset.id)
                      ? w.media
                      : [...w.media, asset],
                    globals: {
                      ...w.globals,
                      brand: { ...w.globals.brand, logo: "asset:" + asset.id },
                    },
                  }),
                  "Replace shared logo",
                );
              } catch (e) {
                editor.setError((e as Error).message);
              }
            }}
          />
        ) : (
          <Inspector
            key={String(selected) + selectionSerial}
            page={page}
            node={node}
            binding={binding}
            override={override}
            breakpoint={breakpoint}
            metrics={metrics}
            onProps={patchProps}
            onStyle={patchStyle}
            onPattern={patchPattern}
            onMotion={patchMotion}
            onPage={(key, value) =>
              updatePage(
                (p) =>
                  key === "seoTitle"
                    ? { ...p, seo: { ...p.seo, title: value } }
                    : key === "seoDescription"
                      ? { ...p, seo: { ...p.seo, description: value } }
                      : { ...p, [key]: value },
                "Edit page settings",
              )
            }
            onUpload={(file) => void upload(file)}
            onAction={action}
            onReset={reset}
            imageName={
              workspace.media.find(
                (a) =>
                  "asset:" + a.id ===
                  (node?.props.src ||
                    (binding ? bindingContent(page, binding) : "")),
              )?.name
            }
            imagePreview={mediaSource(
              node?.props.src || (binding ? bindingContent(page, binding) : ""),
              urls,
            )}
            onLibrary={() => {
              setTab("Media");
              setQuery("");
              if (innerWidth <= 800) setPanel("Layers");
            }}
          />
        )}
      </div>
      <dialog
        ref={dialogRef}
        className="s2-dialog"
        onCancel={() => setDialog(false)}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const next = newCustomPage(title, route);
            if (workspace.pages[next.slug]) {
              editor.setError("A page already uses this address.");
              return;
            }
            const created = editor.edit(
              (w) => ({ ...w, pages: { ...w.pages, [next.slug]: next } }),
              "Create builder page",
            );
            if (created) {
              choosePage(next.slug);
              setDialog(false);
              setTitle("");
              setRoute("");
            }
          }}
        >
          <p className="s2-eyebrow">A blank canvas</p>
          <h2>Create a builder page.</h2>
          <label className="s2-field">
            Page name
            <input
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (
                  !route ||
                  route ===
                    "/" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "/"
                )
                  setRoute(
                    "/" +
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, "") +
                      "/",
                  );
              }}
              autoFocus
            />
          </label>
          <label className="s2-field">
            Address after release
            <input
              required
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              pattern="/(?:[a-z0-9-]+/)+"
            />
          </label>
          <p className="s2-hint">
            This creates a local draft, not a live website address.
          </p>
          <div>
            <button type="button" onClick={() => setDialog(false)}>
              Cancel
            </button>
            <button className="s2-primary" type="submit">
              Create page
            </button>
          </div>
        </form>
      </dialog>
    </main>
  );
}
