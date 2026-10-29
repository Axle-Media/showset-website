import { validStyle } from "./registry";
import type { Globals, PageData } from "../types";
export const SCHEMA_VERSION = 2 as const;
export type Breakpoint = "desktop" | "tablet" | "mobile";
export type NodeKind =
  | "section"
  | "container"
  | "heading"
  | "text"
  | "image"
  | "button"
  | "divider"
  | "spacer"
  | "accordion"
  | "gallery"
  | "video";
export interface StyleValues {
  display?: "block" | "flex" | "grid";
  direction?: "row" | "column";
  columns?: number;
  gap?: string;
  padding?: string;
  margin?: string;
  width?: string;
  maxWidth?: string;
  minHeight?: string;
  height?: string;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "space-between";
  fontFamily?: "Poppins" | "Manrope";
  fontSize?: string;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: string;
  color?: string;
  accentColor?: string;
  textAlign?: "left" | "center" | "right";
  background?: string;
  radius?: string;
  borderWidth?: string;
  borderColor?: string;
  opacity?: number;
  objectFit?: "cover" | "contain";
  objectPosition?: string;
}
export interface Pattern {
  preset?: "custom" | "closing";
  enabled: boolean;
  x: number;
  y: number;
  size: number;
  opacity: number;
  rotation: number;
  repeat: boolean;
  blend: "normal" | "multiply" | "screen";
}
export interface Motion {
  preset: "none" | "reveal" | "fade" | "slide" | "scale" | "parallax";
  trigger: "viewport" | "scroll" | "load";
  duration: number;
  delay: number;
  distance: number;
  start: number;
  end: number;
  ease: "ease" | "linear" | "ease-in-out";
  replay: boolean;
}
export interface CanvasNode {
  id: string;
  kind: NodeKind;
  name: string;
  props: {
    text?: string;
    accent?: string;
    href?: string;
    src?: string;
    alt?: string;
    caption?: string;
    level?: "h1" | "h2" | "h3";
    items?: {
      id: string;
      title: string;
      body: string;
      src?: string;
      alt?: string;
    }[];
  };
  styles: Partial<Record<Breakpoint, StyleValues>>;
  patterns?: Partial<Record<Breakpoint, Pattern>>;
  motion?: Motion;
  children: CanvasNode[];
  hidden?: boolean;
  locked?: boolean;
}
export interface TargetOverride {
  styles: Partial<Record<Breakpoint, StyleValues>>;
  patterns?: Partial<Record<Breakpoint, Pattern>>;
  motion?: Motion;
  alt?: string;
}
export interface BuilderPage {
  schemaVersion: 2;
  mode: "custom" | "template";
  roots: CanvasNode[];
  overrides: Record<string, TargetOverride>;
}
export interface MediaAsset {
  id: string;
  name: string;
  type: string;
  size: number;
  width: number;
  height: number;
  alt: string;
  createdAt: string;
  tags: string[];
}
export interface Workspace {
  schemaVersion: 2;
  revision: number;
  pages: Record<string, PageData>;
  globals: Globals;
  media: MediaAsset[];
  updatedAt: string;
}
export interface Revision {
  id: string;
  label: string;
  at: string;
  workspace: Workspace;
}
export interface Backup {
  format: "showset-studio2-backup";
  version: 2;
  at: string;
  origin: string;
  records: Record<string, string | null>;
  workspace: Workspace | null;
  assets?: {
    id: string;
    type: string;
    base64: string;
  }[];
  checksum: string;
}
export const LOCAL_KEYS = {
  draft: "showset-studio2-draft",
  preview: "showset-studio2-preview",
} as const;
export const isLoopback = (host: string) =>
  host === "localhost" || host === "127.0.0.1" || host === "[::1]";
export const uid = (prefix = "node") => prefix + "-" + crypto.randomUUID();
export const defaultPattern: Pattern = {
  enabled: true,
  x: 100,
  y: 50,
  size: 900,
  opacity: 0.06,
  rotation: 0,
  repeat: false,
  blend: "normal",
};
export const defaultMotion: Motion = {
  preset: "none",
  trigger: "viewport",
  duration: 750,
  delay: 0,
  distance: 30,
  start: 0.15,
  end: 0.8,
  ease: "ease-in-out",
  replay: true,
};
export function builderFor(page: PageData): BuilderPage {
  return (
    page.builder || {
      schemaVersion: 2,
      mode: "template",
      roots: [],
      overrides: {},
    }
  );
}
export function findNode(
  nodes: CanvasNode[],
  id: string,
): CanvasNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
}
export const isContainer = (kind: NodeKind) =>
  kind === "section" || kind === "container";
export function makeNode(kind: NodeKind): CanvasNode {
  const n: CanvasNode = {
    id: uid(),
    kind,
    name: kind.charAt(0).toUpperCase() + kind.slice(1),
    props: {},
    styles: {},
    children: [],
  };
  if (kind === "section")
    n.styles.desktop = {
      padding: "80px 6.3vw",
      background: "#0D2F49",
      minHeight: "260px",
    };
  if (kind === "container")
    n.styles.desktop = { display: "flex", direction: "column", gap: "24px" };
  if (kind === "heading") {
    n.props = {
      text: "Your next big idea.",
      accent: "Starts here.",
      level: "h2",
    };
    n.styles.desktop = {
      fontFamily: "Poppins",
      fontSize: "48px",
      fontWeight: 650,
      lineHeight: 1.08,
      letterSpacing: ".004em",
      color: "#FAF9FD",
      accentColor: "#12BAAF",
    };
    n.styles.mobile = { fontSize: "34px" };
  }
  if (kind === "text") {
    n.props.text = "We bring ideas and details together.";
    n.styles.desktop = {
      fontFamily: "Manrope",
      fontSize: "17px",
      lineHeight: 1.5,
      color: "#FAF9FD",
      maxWidth: "65ch",
    };
  }
  if (kind === "image") {
    n.props = { src: "/media/planning.webp", alt: "Hands planning an event" };
    n.styles.desktop = {
      width: "100%",
      height: "400px",
      objectFit: "cover",
      objectPosition: "50% 50%",
    };
  }
  if (kind === "button") n.props = { text: "Let’s talk", href: "/contact/" };
  if (kind === "spacer") n.styles.desktop = { height: "48px" };
  if (kind === "accordion")
    n.props.items = [
      {
        id: uid("item"),
        title: "What matters to your project?",
        body: "Add the information your visitors need.",
      },
    ];
  if (kind === "gallery")
    n.props.items = [
      {
        id: uid("image"),
        title: "",
        body: "",
        src: "/media/planning.webp",
        alt: "Planning details",
      },
    ];
  if (kind === "video") n.props = { src: "", alt: "", caption: "" };
  return n;
}
export function newCustomPage(title: string, route: string): PageData {
  return {
    slug: route.replace(/^\/|\/$/g, "").replace(/\//g, "-"),
    route,
    title,
    seo: { title, description: "" },
    sections: [],
    builder: { schemaVersion: 2, mode: "custom", roots: [], overrides: {} },
  };
}
export function changeNode(
  nodes: CanvasNode[],
  id: string,
  fn: (node: CanvasNode) => CanvasNode,
): CanvasNode[] {
  return nodes.map((n) =>
    n.id === id ? fn(n) : { ...n, children: changeNode(n.children, id, fn) },
  );
}
export function removeNode(nodes: CanvasNode[], id: string): CanvasNode[] {
  return nodes
    .filter((n) => n.id !== id || n.locked)
    .map((n) => ({ ...n, children: removeNode(n.children, id) }));
}
export function insertNode(
  nodes: CanvasNode[],
  node: CanvasNode,
  parent: string | null,
  index = Infinity,
): CanvasNode[] {
  if (parent) {
    const target = findNode(nodes, parent);
    if (!target || !isContainer(target.kind) || target.locked)
      throw Error("Choose an unlocked section or container.");
    return changeNode(nodes, parent, (n) => ({
      ...n,
      children: insertNode(n.children, node, null, index),
    }));
  }
  const next = [...nodes];
  next.splice(Math.min(index, next.length), 0, node);
  return next;
}
export function moveNode(
  nodes: CanvasNode[],
  id: string,
  parent: string | null,
  index: number,
): CanvasNode[] {
  const node = findNode(nodes, id);
  if (!node || node.locked) throw Error("This element is locked.");
  if (parent === id || (parent && findNode(node.children, parent)))
    throw Error("An element cannot contain itself.");
  const locate = (
    list: CanvasNode[],
    owner: string | null,
  ): { parent: string | null; index: number } | undefined => {
    const at = list.findIndex((n) => n.id === id);
    if (at >= 0) return { parent: owner, index: at };
    for (const candidate of list) {
      const found = locate(candidate.children, candidate.id);
      if (found) return found;
    }
  };
  const previous = locate(nodes, null);
  const adjusted =
    previous?.parent === parent && previous.index < index ? index - 1 : index;
  return insertNode(removeNode(nodes, id), node, parent, adjusted);
}
export function cloneNode(node: CanvasNode): CanvasNode {
  return {
    ...structuredClone(node),
    id: uid(),
    name: node.name + " copy",
    children: node.children.map(cloneNode),
  };
}
export function assertWorkspace(value: unknown): asserts value is Workspace {
  if (!value || typeof value !== "object") throw Error("Invalid workspace.");
  const w = value as Workspace;
  if (
    w.schemaVersion !== 2 ||
    !w.pages ||
    !w.globals?.theme ||
    !Array.isArray(w.media) ||
    !Number.isInteger(w.revision)
  )
    throw Error("Unsupported or incomplete workspace.");
  const encoded = JSON.stringify(w);
  if (encoded.length > 24 * 1024 * 1024)
    throw Error("Workspace exceeds 24 MB.");
  const record = (x: unknown): x is Record<string, unknown> =>
    !!x && typeof x === "object" && !Array.isArray(x);
  const checkTarget = (target: TargetOverride | CanvasNode) => {
    if (!record(target.styles)) throw Error("Invalid responsive styles.");
    for (const [point, styles] of Object.entries(target.styles)) {
      if (!["desktop", "tablet", "mobile"].includes(point))
        throw Error("Unsupported breakpoint.");
      if (styles === undefined) continue;
      if (!record(styles)) throw Error("Invalid style values.");
      for (const [key, value] of Object.entries(styles)) {
        if (value !== undefined && !validStyle(key as keyof StyleValues, value))
          throw Error("Unsupported style value: " + key);
      }
    }
    for (const [point, p] of Object.entries(target.patterns || {})) {
      if (p === undefined) continue;
      if (
        !["desktop", "tablet", "mobile"].includes(point) ||
        typeof p.enabled !== "boolean" ||
        typeof p.repeat !== "boolean" ||
        !["normal", "multiply", "screen"].includes(p.blend) ||
        ![p.x, p.y, p.size, p.opacity, p.rotation].every(Number.isFinite) ||
        p.x < -200 ||
        p.x > 200 ||
        p.y < -200 ||
        p.y > 200 ||
        p.size < 50 ||
        p.size > 2400 ||
        p.opacity < 0 ||
        p.opacity > 1 ||
        p.rotation < -180 ||
        p.rotation > 180 ||
        (p.preset !== undefined && !["custom", "closing"].includes(p.preset))
      )
        throw Error("Invalid pattern settings.");
    }
  };
  const mediaIds = new Set<string>();
  for (const asset of w.media) {
    if (
      !/^asset-[a-f0-9]{64}$/.test(asset.id) ||
      mediaIds.has(asset.id) ||
      !["image/png", "image/jpeg", "image/webp"].includes(asset.type) ||
      ![asset.width, asset.height, asset.size].every(Number.isFinite) ||
      asset.width < 1 ||
      asset.height < 1 ||
      asset.width > 8192 ||
      asset.height > 8192 ||
      asset.width * asset.height > 24000000 ||
      asset.size > 8 * 1024 * 1024
    )
      throw Error("Invalid original image metadata.");
    mediaIds.add(asset.id);
  }
  const mediaRef = (src: string | undefined) => {
    if (src?.startsWith("asset:") && !mediaIds.has(src.slice(6)))
      throw Error("An image reference is missing from the media library.");
  };
  const ids = new Set<string>();
  const scan = (nodes: CanvasNode[], depth: number) => {
    if (depth > 12) throw Error("Maximum nesting depth is 12.");
    if (!Array.isArray(nodes)) throw Error("Invalid component tree.");
    for (const n of nodes) {
      if (!/^[\w-]{1,100}$/.test(n.id) || ids.has(n.id))
        throw Error("Duplicate or invalid component identifier.");
      ids.add(n.id);
      if (
        ![
          "section",
          "container",
          "heading",
          "text",
          "image",
          "button",
          "divider",
          "spacer",
          "accordion",
          "gallery",
          "video",
        ].includes(n.kind)
      )
        throw Error("Unsupported component.");
      if (
        !n.props ||
        !n.styles ||
        !Array.isArray(n.children) ||
        typeof n.name !== "string"
      )
        throw Error("Invalid component data.");
      for (const [key, value] of Object.entries(n.props)) {
        if (key === "items") {
          if (
            !Array.isArray(value) ||
            value.length > 200 ||
            value.some(
              (item) =>
                !item ||
                typeof item.id !== "string" ||
                typeof item.title !== "string" ||
                typeof item.body !== "string" ||
                Object.values(item).some(
                  (v) => v !== undefined && typeof v !== "string",
                ),
            )
          )
            throw Error("Invalid repeated content.");
        } else if (value !== undefined && typeof value !== "string")
          throw Error("Invalid component content.");
      }
      checkTarget(n);
      mediaRef(n.props.src);
      for (const item of n.props.items || []) mediaRef(item.src);
      if (n.motion) {
        const m = n.motion;
        if (
          !["none", "reveal", "fade", "slide", "scale", "parallax"].includes(
            m.preset,
          ) ||
          !["load", "scroll", "viewport"].includes(m.trigger) ||
          !["ease", "linear", "ease-in-out"].includes(m.ease) ||
          ![m.duration, m.delay, m.distance, m.start, m.end].every(
            Number.isFinite,
          ) ||
          m.duration < 0 ||
          m.duration > 5000 ||
          m.delay < 0 ||
          m.delay > 3000 ||
          m.distance < 0 ||
          m.distance > 200 ||
          m.start < 0 ||
          m.end > 1 ||
          m.start >= m.end
        )
          throw Error("Invalid motion configuration.");
      }
      if (n.children.length && !isContainer(n.kind))
        throw Error("This component cannot contain children.");
      scan(n.children, depth + 1);
    }
  };
  const routes = new Set<string>();
  for (const p of Object.values(w.pages)) {
    if (!/^\/(?:[a-z0-9-]+\/)*$/.test(p.route) || routes.has(p.route))
      throw Error("Page routes must be unique directory-style URLs.");
    routes.add(p.route);
    if (!Array.isArray(p.sections) || typeof p.title !== "string")
      throw Error("Invalid page.");
    for (const section of p.sections) {
      mediaRef(section.image);
      for (const item of section.items || []) mediaRef(item.image);
    }
    // Existing case studies own their own media separately from Block sections.
    // Validate imported and restored references before a draft can be saved.
    if (p.caseExperience) {
      const story = p.caseExperience;
      mediaRef(story.openingImage);
      mediaRef(story.secondImage);
      mediaRef(story.bannerImage);
      for (const key of ["brief", "intention", "approach"] as const) {
        mediaRef(story[key]?.image);
        for (const image of story[key]?.images || []) mediaRef(image);
      }
      for (const photo of story.gallery || []) mediaRef(photo.src);
      for (const partner of story.partners || []) mediaRef(partner.logo);
    }
    for (const module of p.projectModules || []) {
      mediaRef(module.src);
      mediaRef(module.after);
    }
    if (p.builder) {
      if (p.builder.schemaVersion !== 2)
        throw Error("Unsupported page version.");
      if (
        !["custom", "template"].includes(p.builder.mode) ||
        !record(p.builder.overrides)
      )
        throw Error("Invalid page builder mode.");
      for (const [id, override] of Object.entries(p.builder.overrides)) {
        if (!/^[\w-]{1,100}$/.test(id))
          throw Error("Invalid binding identifier.");
        checkTarget(override);
      }
      scan(p.builder.roots, 0);
    }
  }
  if (ids.size > 2500 || Object.keys(w.pages).length > 200)
    throw Error("Workspace exceeds the safe editing limit.");
  const reject = (x: unknown) => {
    if (!x || typeof x !== "object") return;
    for (const [k, v] of Object.entries(x)) {
      if (["__proto__", "prototype", "constructor"].includes(k))
        throw Error("Unsafe property in imported data.");
      reject(v);
    }
  };
  reject(w);
}

/** Pure, additive adoption. Never reconciles authored values or writes legacy storage. */
export function adoptLegacy(
  defaultPages: Record<string, PageData>,
  defaultGlobals: Globals,
  pages: unknown,
  globals: unknown,
): Workspace {
  const record = (x: unknown): x is Record<string, unknown> =>
    !!x && typeof x === "object" && !Array.isArray(x);
  if (
    (pages !== null && !record(pages)) ||
    (globals !== null && !record(globals))
  )
    throw Error(
      "Legacy data is not a valid record. Export the original records before repair.",
    );
  const fill = (base: unknown, saved: unknown): unknown => {
    if (saved === undefined) return structuredClone(base);
    if (!record(base) || !record(saved)) return structuredClone(saved);
    const result: Record<string, unknown> = { ...saved };
    for (const [key, value] of Object.entries(base))
      result[key] = fill(value, saved[key]);
    return result;
  };
  const workspace: Workspace = {
    schemaVersion: 2,
    revision: 0,
    pages: fill(defaultPages, pages || {}) as Record<string, PageData>,
    globals: fill(defaultGlobals, globals || {}) as Globals,
    media: [],
    updatedAt: new Date().toISOString(),
  };
  assertWorkspace(workspace);
  return workspace;
}
