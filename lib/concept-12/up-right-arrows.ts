/** Lucide ArrowUpRight, rendered as SVG instead of an OS-dependent emoji.
 * The approved markup and Studio edit engine contain legacy ↗ text nodes.
 * Convert those nodes without modifying their surrounding link/button elements.
 */
const SVG_NS = "http://www.w3.org/2000/svg";
const GLYPH = "↗";
const EXCLUDED = new Set(["SCRIPT", "STYLE", "TEXTAREA", "SVG"]);

function createArrow(document: Document): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "showset-arrow-up-right");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "3");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", "M7 7h10v10 M7 17 17 7");
  svg.appendChild(path);
  return svg;
}

/** Used for both static route HTML and live Studio/browser updates. */
export function replaceUpRightArrows(root: Node): void {
  const textNodes: Text[] = [];
  function visit(node: Node): void {
    if (node.nodeType === 3) {
      if (node.nodeValue?.includes(GLYPH)) textNodes.push(node as Text);
      return;
    }
    if (node.nodeType === 1 && EXCLUDED.has((node as Element).tagName.toUpperCase())) return;
    for (const child of Array.from(node.childNodes)) visit(child);
  }
  visit(root);
  const document = root.ownerDocument ?? (root as Document);
  for (const node of textNodes) {
    if (!node.parentNode) continue;
    const parts = (node.nodeValue ?? "").split(GLYPH);
    const fragment = document.createDocumentFragment();
    parts.forEach((part, index) => {
      if (part) fragment.appendChild(document.createTextNode(part));
      if (index !== parts.length - 1) fragment.appendChild(createArrow(document));
    });
    node.parentNode.replaceChild(fragment, node);
  }
}

/** Cover arrows created later by dynamic route content and the Studio editor. */
export function watchUpRightArrows(host: HTMLElement): () => void {
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "characterData") {
        replaceUpRightArrows(record.target);
      } else {
        for (const node of Array.from(record.addedNodes)) replaceUpRightArrows(node);
      }
    }
  });
  observer.observe(host, { childList: true, characterData: true, subtree: true });
  return () => observer.disconnect();
}
