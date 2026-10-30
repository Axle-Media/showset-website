import replacements from "./image-replacements.json";

const bySource = new Map(replacements.map(photo => [photo.src, photo]));
const cardPlacements: Record<string, number[]> = {
  home: [5, 6, 7], work: [32, 33, 34],
  "case-events": [46, 47], "case-identity": [56, 57], "case-production": [66, 67],
};

/** Enhance authored local media in both SSR and client navigation. Custom Studio
 * URLs remain authoritative; only known library files receive these derivatives. */
export function applyReplacementMedia(host: HTMLElement, route: string) {
  host.querySelectorAll<HTMLImageElement>('img').forEach(image => {
    // The lightbox changes src as the visitor navigates. A fixed srcset would
    // otherwise keep displaying its first photograph after next/previous.
    if (image.closest('.case-lightbox')) return;
    const previousPicture = image.parentElement;
    if (previousPicture?.hasAttribute('data-showset-picture'))
      previousPicture.replaceWith(image);
    let photo = bySource.get(image.getAttribute('src') || '');
    if (!photo) {
      if (image.hasAttribute('data-image-placement')) {
        for (const attribute of ['srcset', 'sizes', 'width', 'height', 'data-image-placement'])
          image.removeAttribute(attribute);
      }
      return;
    }
    const card = image.closest('[data-case-slide],.work-portfolio-card,.case-related-card');
    if (card) {
      const crop = replacements.find(candidate =>
        cardPlacements[route]?.includes(candidate.placement) && candidate.source === photo!.source);
      if (crop) photo = crop;
    }
    image.setAttribute('src', photo.src);
    image.setAttribute('srcset', photo.variants.map(v => `${v.src} ${v.width}w`).join(', '));
    image.setAttribute('sizes', card ? '(max-width: 767px) 90vw, 50vw' : '100vw');
    image.setAttribute('width', String(photo.width));
    image.setAttribute('height', String(photo.height));
    // Gallery captions and chapter descriptions are explicit Studio fields.
    if (!image.closest('.case-gallery-item,.case-chapter-photo,.case-story-image'))
      image.setAttribute('alt', photo.alt);
    image.setAttribute('data-image-placement', String(photo.placement));
    if (photo.mobile) {
      let picture = image.parentElement;
      if (picture?.tagName !== 'PICTURE') {
        picture = host.ownerDocument.createElement('picture');
        picture.style.display = 'contents';
        picture.setAttribute('data-showset-picture', '');
        image.replaceWith(picture);
        picture.appendChild(image);
      }
      let source = picture.querySelector('source');
      if (!source) {
        source = host.ownerDocument.createElement('source');
        picture.insertBefore(source, image);
      }
      source.setAttribute('media', '(max-width: 767px)');
      source.setAttribute('srcset', photo.mobile);
      source.setAttribute('type', 'image/webp');
    }
  });
}
