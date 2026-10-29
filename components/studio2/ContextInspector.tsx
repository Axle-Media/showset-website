"use client";
import type { Globals, Block, PageData } from "@/lib/types";
import type { CanvasInspection } from "@/lib/studio2/selection";
import { DraftField } from "./Inspector";
import { templateBindings, bindingContent } from "@/lib/studio2/bindings";
import { mediaSource } from "@/lib/studio2/render";
export default function ContextInspector({
  selection,
  page,
  globals,
  urls,
  onGlobals,
  onSection,
  onUpload,
  onSelectImage,
}: {
  selection: CanvasInspection;
  page: PageData;
  globals: Globals;
  urls: Record<string, string>;
  onGlobals: (fn: (g: Globals) => Globals) => void;
  onSection: (fn: (s: Block) => Block) => void;
  onUpload: (file: File, itemIndex?: number) => void;
  onSelectImage: (id: string) => void;
}) {
  const section = page.sections.find((s) => s.id === selection.sectionId);
  const homeStory = page.slug === "home" && section?.type === "story";
  const collection = page.slug === "our-work" && section?.type === "work";
  const hasPrimary =
    !!section &&
    ((page.slug === "home" &&
      ["hero", "split", "cta"].includes(section.type)) ||
      (page.slug === "contact" && section.type === "contact") ||
      ([
        "events-experiences",
        "creative-design",
        "digital-marketing",
        "content-production",
      ].includes(page.slug) &&
        ["pagehero", "visual"].includes(section.type)) ||
      section.type === "cta");

  const field = (
    label: string,
    value: string,
    commit: (value: string) => void,
    multi = false,
  ) => (
    <label className="s2-field" key={label}>
      {label}
      <DraftField
        key={selection.area + (selection.sectionId || "") + label}
        value={value}
        onCommit={commit}
        multi={multi}
      />
    </label>
  );
  const image = (label: string, src: string, itemIndex?: number) => (
    <div className="s2-context-image">
      <img
        src={mediaSource(src, urls) || selection.src || ""}
        alt="Selected image preview"
      />
      <label className="s2-upload">
        Replace {label}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onUpload(file, itemIndex);
          }}
        />
      </label>
      {field("Image address — " + label, src, (v) =>
        selection.area === "header"
          ? onGlobals((g) => ({ ...g, brand: { ...g.brand, logo: v } }))
          : onSection((s) =>
              itemIndex === undefined
                ? { ...s, image: v }
                : {
                    ...s,
                    items: s.items.map((item, i) =>
                      i === itemIndex ? { ...item, image: v } : item,
                    ),
                  },
            ),
      )}
    </div>
  );
  return (
    <aside className="s2-inspector" aria-label="Selected content editor">
      <div className="s2-panel-title">
        <h2>{selection.name}</h2>
      </div>
      <p className="s2-hint">
        Editing mode: links, buttons and forms stay inactive. Use Interactive
        preview to test them.
      </p>
      {selection.area === "header" ? (
        <>
          <p className="s2-scope">Shared header · applies to every page</p>
          <details open={!!selection.image}>
            <summary>Logo / image</summary>
            {image(
              "logo",
              globals.brand.logo || "/brand/approved-wordmark.png",
            )}
          </details>
          <details open={!selection.image}>
            <summary>Navigation and buttons</summary>
            {field("Header button text", globals.header.buttonLabel, (v) =>
              onGlobals((g) => ({
                ...g,
                header: { ...g.header, buttonLabel: v },
              })),
            )}
            {field(
              "Header button destination",
              globals.header.buttonHref,
              (v) =>
                onGlobals((g) => ({
                  ...g,
                  header: { ...g.header, buttonHref: v },
                })),
            )}
            {(["services", "links"] as const).map((group) =>
              globals.header[group].map((link, index) => (
                <fieldset key={group + index}>
                  <legend>{link.label || "Navigation link"}</legend>
                  {field("Link text", link.label, (v) =>
                    onGlobals((g) => ({
                      ...g,
                      header: {
                        ...g.header,
                        [group]: g.header[group].map((item, i) =>
                          i === index ? { ...item, label: v } : item,
                        ),
                      },
                    })),
                  )}
                  {field("Link destination", link.href, (v) =>
                    onGlobals((g) => ({
                      ...g,
                      header: {
                        ...g.header,
                        [group]: g.header[group].map((item, i) =>
                          i === index ? { ...item, href: v } : item,
                        ),
                      },
                    })),
                  )}
                </fieldset>
              )),
            )}
          </details>
        </>
      ) : selection.area === "footer" ? (
        <>
          <p className="s2-scope">Shared footer · applies to every page</p>
          {field(
            "Footer description",
            globals.footer.description,
            (v) =>
              onGlobals((g) => ({
                ...g,
                footer: { ...g.footer, description: v },
              })),
            true,
          )}
          {field("Email address", globals.footer.contact?.email || "", (v) =>
            onGlobals((g) => ({
              ...g,
              footer: {
                ...g.footer,
                contact: {
                  ...{ email: "", phone: "", location: "" },
                  ...g.footer.contact,
                  email: v,
                },
              },
            })),
          )}
          {field("Phone number", globals.footer.contact?.phone || "", (v) =>
            onGlobals((g) => ({
              ...g,
              footer: {
                ...g.footer,
                contact: {
                  ...{ email: "", phone: "", location: "" },
                  ...g.footer.contact,
                  phone: v,
                },
              },
            })),
          )}
          {(["facebook", "instagram", "linkedin"] as const).map((network) =>
            field(
              network + " destination",
              globals.footer.socials?.[network] || "",
              (v) =>
                onGlobals((g) => ({
                  ...g,
                  footer: {
                    ...g.footer,
                    socials: {
                      ...{ facebook: "", instagram: "", linkedin: "" },
                      ...g.footer.socials,
                      [network]: v,
                    },
                  },
                })),
            ),
          )}
        </>
      ) : section ? (
        <>
          <p className="s2-scope">{section.type} section</p>
          <details open={!selection.image}>
            <summary>Content and buttons</summary>
            {!homeStory && !collection && (
              <>
                {" "}
                {field("Section headline", section.headline, (v) =>
                  onSection((s) => ({ ...s, headline: v })),
                )}
                {field("Section accent", section.accent, (v) =>
                  onSection((s) => ({ ...s, accent: v })),
                )}
                {field(
                  "Section body",
                  section.body,
                  (v) => onSection((s) => ({ ...s, body: v })),
                  true,
                )}
              </>
            )}
            {homeStory &&
              section.items.map((item, index) => (
                <fieldset key={item.id}>
                  <legend>Story scene {index + 1}</legend>
                  {field(
                    "Scene " + (index + 1) + " headline",
                    item.title,
                    (v) =>
                      onSection((s) => ({
                        ...s,
                        items: s.items.map((x, i) =>
                          i === index ? { ...x, title: v } : x,
                        ),
                      })),
                  )}
                  {field(
                    "Scene " + (index + 1) + " accent",
                    item.accent || "",
                    (v) =>
                      onSection((s) => ({
                        ...s,
                        items: s.items.map((x, i) =>
                          i === index ? { ...x, accent: v } : x,
                        ),
                      })),
                  )}
                  {field(
                    "Scene " + (index + 1) + " body",
                    item.description,
                    (v) =>
                      onSection((s) => ({
                        ...s,
                        items: s.items.map((x, i) =>
                          i === index ? { ...x, description: v } : x,
                        ),
                      })),
                    true,
                  )}
                </fieldset>
              ))}
            {collection && (
              <p className="s2-hint">
                Portfolio cards use the linked case studies. Case collection
                editing remains available in classic Studio.
              </p>
            )}
            {hasPrimary && section.buttonLabel && (
              <>
                {field("Button text", section.buttonLabel, (v) =>
                  onSection((s) => ({ ...s, buttonLabel: v })),
                )}
                {section.type !== "contact" &&
                  field("Button destination", section.buttonHref, (v) =>
                    onSection((s) => ({ ...s, buttonHref: v })),
                  )}
              </>
            )}
          </details>
          {selection.image && (
            <details open>
              <summary>Section images</summary>
              {templateBindings(page)
                .filter((b) => b.kind === "image" && b.sectionId === section.id)
                .map((b) => (
                  <button
                    className="s2-secondary"
                    key={b.id}
                    onClick={() => onSelectImage(b.id)}
                  >
                    Edit {b.name}
                  </button>
                ))}
              <p className="s2-hint">
                Images belong to this section’s existing template. Changes use
                the same content fields as classic Studio.
              </p>
            </details>
          )}
        </>
      ) : (
        <>
          <p>
            This part is not editable here yet. It stays inactive while you are
            editing.
          </p>
          <p className="s2-hint">
            Use Layers for available controls, or classic Studio for the
            remaining template fields.
          </p>
          <a className="s2-classic" href="/studio/">
            Open classic Studio ↗
          </a>
        </>
      )}
    </aside>
  );
}
