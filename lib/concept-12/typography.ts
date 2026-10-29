/** Decorate every existing headline period, including first-line punctuation.
 * Structural colour roles work during SSR and avoid hidden-route computed styles.
 * Preserve authored words, question marks and line breaks. */
export function refineHeadingPeriods(host: HTMLElement) {
  const doc = host.ownerDocument;
  host.querySelectorAll<HTMLElement>('h1,h2,h3').forEach(heading => {
    heading.querySelectorAll('.headline-period').forEach(e => e.replaceWith(doc.createTextNode(e.textContent || '')));
    const visit = (node: Node) => {
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType !== 3) { visit(child); return; }
        const value = child.textContent || '';
        if (!value.includes('.')) return;
        const parent = child.parentElement!;
        const accent = parent.closest('.accent-text,.accent-line,.hero-accent-phrase,.service-accent,.case-heading-accent');
        const pieces = value.split('.');
        const fragment = doc.createDocumentFragment();
        pieces.forEach((piece, i) => {
          fragment.append(doc.createTextNode(piece));
          if (i < pieces.length - 1) {
            const period = doc.createElement('span');
            period.className = 'headline-period';
            period.dataset.periodTone = accent ? 'light' : 'teal';
            period.textContent = '.';
            fragment.append(period);
          }
        });
        child.parentNode!.replaceChild(fragment, child);
      });
    };
    visit(heading);
  });
}
