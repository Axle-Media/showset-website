/** Decorate only an existing final headline period; never rewrite prose or add punctuation. */
export function refineHeadingPeriods(host: HTMLElement) {
  host.querySelectorAll<HTMLElement>("h1,h2,h3").forEach((heading) => {
    // Idempotent across route binding, Studio edits and repeated mounts.
    heading.querySelectorAll(".headline-period").forEach((e) => e.replaceWith(document.createTextNode(e.textContent || "")));
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    let last: Text | null = null;
    while (walker.nextNode()) {
      const text = walker.currentNode as Text;
      if (text.textContent?.trim()) last = text;
    }
    if (!last || !/\.\s*$/.test(last.data)) return;
    const at = last.data.lastIndexOf("."), parent = last.parentElement!;
    // Ignore an existing punctuation accent when finding the final word's colour.
    let word = parent;
    while (word !== heading && !word.textContent?.replace(/[.\s]/g, ""))
      word = word.parentElement!;
    const colour = getComputedStyle(word).color;
    const channels = colour.match(/[\d.]+/g)?.map(Number) || [];
    const teal = channels.length >= 3 && channels[1] > channels[0] * 1.4 && channels[2] > channels[0] * 1.4;
    const period = document.createElement("span");
    period.className = "headline-period";
    const light = channels.length >= 3 && Math.min(...channels.slice(0, 3)) >= 210 && Math.max(...channels.slice(0, 3)) - Math.min(...channels.slice(0, 3)) <= 25;
    // Sand and custom colours keep their existing punctuation; the requested rule covers teal and off-white.
    period.dataset.periodTone = teal ? "light" : light ? "teal" : "inherit";
    period.textContent = ".";
    const tail = last.splitText(at);
    tail.deleteData(0, 1);
    tail.before(period);
  });
}
