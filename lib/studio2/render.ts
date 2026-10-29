import type { CanvasNode } from "./model";
import type { Globals, PageData } from "../types";
import { responsiveCss } from "./registry";
import { safeHref } from "../safe";
export const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (s) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        s
      ]!,
  );
export function mediaSource(
  src: string | undefined,
  urls: Record<string, string> = {},
): string {
  if (src?.startsWith("asset:")) return urls[src.slice(6)] || "";
  const safe = safeHref(src);
  return safe === "#"
    ? ""
    : safe.startsWith("/") || safe.startsWith("https://")
      ? safe
      : "";
}
export function renderNodes(
  nodes: CanvasNode[],
  urls: Record<string, string> = {},
): string {
  let css = "";
  const render = (node: CanvasNode): string => {
    if (node.hidden) return "";
    css += responsiveCss(node.id, node);
    const id = escapeHtml(node.id),
      p = node.props,
      attrs =
        ' data-builder-node="' +
        id +
        '" class="s2-node s2-node-' +
        node.kind +
        '"' +
        (node.motion
          ? ' data-builder-motion="' +
            id +
            '" data-builder-motion-config="' +
            escapeHtml(JSON.stringify(node.motion)) +
            '"'
          : "");
    const text = escapeHtml(p.text).replace(/\n/g, "<br>");
    const image = (src: string | undefined, alt: string | undefined) => {
      const url = mediaSource(src, urls);
      return url
        ? '<img src="' +
            escapeHtml(url) +
            '" alt="' +
            escapeHtml(alt) +
            '" decoding="async" loading="lazy">'
        : "";
    };
    if (node.kind === "section" || node.kind === "container")
      return (
        "<" +
        (node.kind === "section" ? "section" : "div") +
        attrs +
        ">" +
        node.children.map(render).join("") +
        "</" +
        (node.kind === "section" ? "section" : "div") +
        ">"
      );
    if (node.kind === "heading") {
      const tag = ["h1", "h2", "h3"].includes(p.level || "") ? p.level : "h2";
      return (
        "<" +
        tag +
        attrs +
        ">" +
        text +
        (p.accent
          ? '<span class="s2-accent">' + escapeHtml(p.accent) + "</span>"
          : "") +
        "</" +
        tag +
        ">"
      );
    }
    if (node.kind === "text") return "<p" + attrs + ">" + text + "</p>";
    if (node.kind === "image")
      return (
        "<figure" +
        attrs +
        ">" +
        image(p.src, p.alt) +
        (p.caption
          ? "<figcaption>" + escapeHtml(p.caption) + "</figcaption>"
          : "") +
        "</figure>"
      );
    if (node.kind === "button")
      return (
        "<a" +
        attrs +
        ' href="' +
        escapeHtml(safeHref(p.href)) +
        '">' +
        text +
        '<span aria-hidden="true">↗</span></a>'
      );
    if (node.kind === "divider") return "<hr" + attrs + ">";
    if (node.kind === "spacer")
      return "<div" + attrs + ' aria-hidden="true"></div>';
    if (node.kind === "accordion")
      return (
        "<div" +
        attrs +
        ">" +
        (p.items || [])
          .map(
            (item) =>
              "<details><summary>" +
              escapeHtml(item.title) +
              "</summary><p>" +
              escapeHtml(item.body) +
              "</p></details>",
          )
          .join("") +
        "</div>"
      );
    if (node.kind === "gallery")
      return (
        "<div" +
        attrs +
        ">" +
        (p.items || [])
          .map(
            (item) =>
              "<figure>" +
              image(item.src, item.alt) +
              (item.body
                ? "<figcaption>" + escapeHtml(item.body) + "</figcaption>"
                : "") +
              "</figure>",
          )
          .join("") +
        "</div>"
      );
    if (node.kind === "video") {
      const src = mediaSource(p.src, urls);
      return src
        ? "<figure" +
            attrs +
            '><video src="' +
            escapeHtml(src) +
            '" controls preload="metadata" aria-label="' +
            escapeHtml(p.alt || "Video") +
            '"></video>' +
            escapeHtml(p.caption) +
            "</figure>"
        : "";
    }
    return "";
  };
  const html = nodes.map(render).join("");
  return html + "<style data-studio2-style>" + css + "</style>";
}
export function walkNodes(nodes: CanvasNode[], fn: (node: CanvasNode) => void) {
  nodes.forEach((node) => {
    fn(node);
    walkNodes(node.children, fn);
  });
}
export const nodeMotions = (page: PageData) => {
  const out: Record<string, NonNullable<CanvasNode["motion"]>> = {};
  walkNodes(page.builder?.roots || [], (n) => {
    if (n.motion) out[n.id] = n.motion;
  });
  return out;
};
export function globalVars(g: Globals) {
  return `--navy:${g.theme.navy};--deep:${g.theme.navyDark};--navy2:${g.theme.blue};--teal:${g.theme.teal};--ice:${g.theme.white};--sand:${g.theme.sand};`;
}
