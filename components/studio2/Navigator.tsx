"use client";
import type { CanvasNode, NodeKind } from "@/lib/studio2/model";
import { findNode, isContainer } from "@/lib/studio2/model";
import { mediaSource } from "@/lib/studio2/render";
import { registry } from "@/lib/studio2/registry";
import { SECTION_PRESETS,type SectionPresetId } from "@/lib/studio2/section-presets";
import { bindingContent, type Binding } from "@/lib/studio2/bindings";
import type { Workspace } from "@/lib/studio2/model";
export default function Navigator({
  workspace,
  slug,
  tab,
  query,
  selected,
  onPage,
  onTab,
  onQuery,
  onSelect,
  onAdd,
  onMove,
  onNew,
  onPreset,
  onReuse,
  onRemoveReusable,
  bindings,
  urls,
}: {
  workspace: Workspace;
  slug: string;
  tab: string;
  query: string;
  selected: string | null;
  onPage: (slug: string) => void;
  onTab: (tab: string) => void;
  onQuery: (query: string) => void;
  onSelect: (id: string) => void;
  onAdd: (kind: NodeKind) => void;
  onMove: (id: string, parent: string | null, index: number) => void;
  onNew: () => void;
  onPreset: (id:SectionPresetId) => void;
  onReuse: (id:string) => void;
  onRemoveReusable: (id:string) => void;
  bindings: Binding[];
  urls: Record<string, string>;
}) {
  const page = workspace.pages[slug];
  const pageImages = bindings
    .filter((b) => b.kind === "image")
    .map((b) => ({ id: b.id, name: b.name, src: bindingContent(page, b) }));
  const gather = (nodes: CanvasNode[]) => {
    for (const node of nodes) {
      if (node.kind === "image")
        pageImages.push({
          id: node.id,
          name: node.name,
          src: node.props.src || "",
        });
      gather(node.children);
    }
  };
  gather(page.builder?.roots || []);
  const matches = (node: CanvasNode): boolean =>
    (node.name + " " + (node.props.text || ""))
      .toLowerCase()
      .includes(query.toLowerCase()) || node.children.some(matches);
  const tree = (
    nodes: CanvasNode[],
    depth = 0,
    parent: string | null = null,
  ) => (
    <ul
      className="s2-tree-list"
      style={{ "--depth": depth } as React.CSSProperties}
    >
      {nodes.map((node, index) =>
        matches(node) ? (
          <li key={node.id}>
            <div
              className={
                "s2-layer " + (selected === node.id ? "is-selected" : "")
              }
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = e.dataTransfer.getData("application/x-showset-node");
                if (id)
                  onMove(
                    id,
                    isContainer(node.kind) ? node.id : parent,
                    isContainer(node.kind) ? node.children.length : index,
                  );
              }}
            >
              <button
                draggable={!node.locked}
                onDragStart={(e) =>
                  e.dataTransfer.setData("application/x-showset-node", node.id)
                }
                onClick={() => onSelect(node.id)}
                aria-label={"Select " + node.name}
              >
                <span aria-hidden="true">
                  {isContainer(node.kind) ? "▱" : "◇"}
                </span>
                {node.name}
                {node.hidden ? " · hidden" : ""}
                {node.locked ? " · locked" : ""}
              </button>
            </div>
            {node.children.length > 0 &&
              tree(node.children, depth + 1, node.id)}
          </li>
        ) : null,
      )}
    </ul>
  );
  return (
    <aside className="s2-navigator" aria-label="Workspace navigator">
      <nav className="s2-nav-tabs">
        {["Pages", "Layers", "Sections", "Images", "Add", "Media", "History", "Site"].map(
          (name) => (
            <button
              key={name}
              aria-pressed={tab === name}
              onClick={() => onTab(name)}
            >
              {name}
            </button>
          ),
        )}
      </nav>
      <div className="s2-panel-title">
        <h2>{tab}</h2>
        {tab === "Pages" && (
          <button onClick={onNew} className="s2-small-action">
            + New
          </button>
        )}
      </div>
      {tab !== "Site" && (
        <input
          className="s2-search"
          aria-label="Search navigator"
          placeholder={"Find " + tab.toLowerCase() + "…"}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
      )}
      {tab === "Images" && (
        <div className="s2-image-browser">
          <p className="s2-hint">
            Choose a photograph to open its replacement, crop and alt-text
            controls.
          </p>
          <div className="s2-page-images">
            {pageImages
              .filter((image) =>
                image.name.toLowerCase().includes(query.toLowerCase()),
              )
              .map((image) => (
                <button
                  key={image.id}
                  onClick={() => onSelect(image.id)}
                  aria-label={"Edit image: " + image.name}
                  aria-pressed={selected === image.id}
                >
                  {mediaSource(image.src, urls) && (
                    <img src={mediaSource(image.src, urls)} alt="" />
                  )}
                  <strong>{image.name}</strong>
                  <span>Change image ↗</span>
                </button>
              ))}
          </div>
          {pageImages.length === 0 ? (
            <p className="s2-hint">
              Click a photograph on the canvas to inspect its section, or use
              classic Studio for remaining template images.
            </p>
          ) : !pageImages.some((image) =>
              image.name.toLowerCase().includes(query.toLowerCase())
            ) ? (
            <p className="s2-hint" role="status">
              No images match your search.
            </p>
          ) : null}
        </div>
      )}
      {tab === "Pages" && (
        <ul className="s2-page-list">
          {Object.values(workspace.pages)
            .filter((p) =>
              (p.title + " " + p.route)
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .map((p) => (
              <li key={p.slug}>
                <button
                  aria-current={slug === p.slug ? "page" : undefined}
                  onClick={() => onPage(p.slug)}
                >
                  <span>{p.title}</span>
                  <small>
                    {p.route}
                    {p.builder?.mode === "custom" ? " · Builder page" : ""}
                  </small>
                </button>
              </li>
            ))}
        </ul>
      )}
      {tab === "Layers" &&
        (page.builder?.mode === "custom" ? (
          <>
            <p className="s2-hint">
              Drag onto a container to nest. Use the inspector to move up or
              down.
            </p>
            {tree(page.builder.roots)}
            {!page.builder.roots.length && (
              <div className="s2-empty">
                <h3>A blank canvas.</h3>
                <p>Add a section, then fill it with your ideas.</p>
                <button onClick={() => onAdd("section")}>Add a section</button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="s2-template-builder">
              <h3>Additional sections</h3>
              <p className="s2-hint">
                Build new sections before the closing CTA without changing
                approved scenes. Drag your added sections to rearrange them.
              </p>
              {tree(page.builder?.roots || [])}
              <button
                type="button"
                className="s2-secondary"
                onClick={() => onAdd("section")}
              >
                + Add editable section
              </button>
            </div>
            <p className="s2-hint">
              Approved page content is protected. Select an original section
              below to adjust its content, layout or background.
            </p>
            <ul className="s2-page-list">
              {bindings
                .filter((b) =>
                  b.name.toLowerCase().includes(query.toLowerCase()),
                )
                .map((b) => (
                  <li key={b.id}>
                    <button
                      aria-pressed={selected === b.id}
                      onClick={() => onSelect(b.id)}
                    >
                      {b.name}
                      <small>{b.kind}</small>
                    </button>
                  </li>
                ))}
            </ul>
            {!bindings.length && (
              <p className="s2-hint">
                This template’s element controls are scheduled for the next
                coverage phase. <a href="/studio/">Open classic Studio</a> to
                edit its existing fields.
              </p>
            )}
          </>
        ))}
      {tab === "Sections" && (
        <div className="s2-library">
          <h3>Ready-made layouts</h3>
          <p className="s2-hint">
            Add a responsive, editable chapter. Existing cinematic scenes
            and their approved order stay unchanged.
          </p>
          {SECTION_PRESETS.filter(item=>
            (item.name+" "+item.description).toLowerCase().includes(query.toLowerCase())
          ).map(item=>(
            <button key={item.id} onClick={()=>onPreset(item.id)}>
              <strong>{item.name}</strong>
              <span>{item.description}</span>
            </button>
          ))}
          <h3>Saved sections</h3>
          <p className="s2-hint">
            Saved sections are reusable templates. Inserting one makes an
            independent copy, so other pages do not change automatically.
          </p>
          {(workspace.sectionLibrary||[]).filter(item=>
            item.name.toLowerCase().includes(query.toLowerCase())
          ).map(item=>(
            <div className="s2-saved-section" key={item.id}>
              <strong>{item.name}</strong>
              <button onClick={()=>onReuse(item.id)}>Insert copy</button>
              <button className="s2-secondary" onClick={()=>{
                if(window.confirm("Delete this saved section template? Existing page sections stay unchanged."))
                  onRemoveReusable(item.id);
              }}>Remove template</button>
            </div>
          ))}
          {!(workspace.sectionLibrary||[]).length && (
            <p className="s2-hint">
              Select an editable section and choose Save to section library
              in the inspector.
            </p>
          )}
        </div>
      )}
      {tab === "Add" && (
        <div className="s2-library">
          {page.builder?.mode !== "custom" &&
            !isContainer(findNode(page.builder?.roots || [], selected || "")?.kind || "text") && (
            <p className="s2-hint">
              Add or select an editable section first to insert nested content.
            </p>
          )}
          {Object.entries(registry)
            .filter(([kind, v]) =>
              (page.builder?.mode === "custom" ||
                kind === "section" ||
                isContainer(findNode(page.builder?.roots || [], selected || "")?.kind || "text")) &&
              (v.label + " " + v.description)
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .map(([kind, item]) => (
              <button key={kind} onClick={() => onAdd(kind as NodeKind)}>
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </button>
            ))}
        </div>
      )}
    </aside>
  );
}
