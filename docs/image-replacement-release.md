# Website image replacement

The 67 numbered placements in the supplied SHOWSET visual replacement plan now use the generated image library. The image-only content changes preserve existing copy, approved brand artwork, patterns, code-built Digital illustrations, route structure and motion.

## Media and mapping

- 55 distinct generated scenes supply 67 placement-specific base WebP files.
- `public/media/showset/` contains 227 sRGB WebP files, including smaller width variants and 26 mobile/narrow crops. Native resolution is retained; files are not upscaled to imply additional detail.
- `lib/concept-12/image-replacements.json` records every placement, page, source scene, actual dimensions, accessible description and responsive derivatives.
- Project cards and related-project links retain their corresponding project hero subject, using the intended placement crop. A custom case hero still controls its linked cards automatically.
- These are generated illustrative people, events, artwork and interfaces, not documentary evidence of actual staff or completed client work. The existing concept-study status and copy remain intact.

## Rendering and Studio

Untouched canonical images now bind as well as custom editor values. The shared SSR/client binding adds responsive width sources and art-directed mobile crops. The lightbox retains full photographs and changes correctly on next/previous. User-authored chapter descriptions and gallery captions/credits remain editable.

The old Academy Awards arrival photo is replaced by placement 41; its photographer/license metadata is removed from that replacement. Explicit user-authored credits continue to follow reordered gallery images.

`legacy/pre-image-replacement-pages.json` preserves the previous canonical content. The existing recovery-preserving compatibility adapter upgrades proven saved defaults while retaining custom image URLs and edits.

## Verification

Passed locally against the production static export:

- TypeScript, source/case-study asset checks, SEO checks and Next.js production build.
- All 67 placements at 1440px and 390px, including successful decoding, mobile source selection, no horizontal overflow, gallery next/previous and saved-default/custom-image behavior (`qa/image-replacements.cjs`).
- Homepage/Our Work carousel, project hero synchronization, custom heroes and future-project behavior (`qa/home-work-carousel.cjs`).
- Studio page photo readiness, expansion/reversal, responsive layout, reduced motion and no-JavaScript fallback (`qa/studio-scroll-hero.cjs`).
- Case-study Studio editing, captions, custom credits, saving and preview publishing (`qa/case-study-studio.cjs`).

`qa/service-studio.cjs` passes content/image editing, saving, preview publishing, custom edits and legacy preservation. Its four “Section styling and motion editable” assertions fail identically on the unchanged main branch, reproduced with a separate baseline build. Those existing styling failures are outside this image replacement and are not reported as passing.

Screenshots and detailed local acceptance results are written to ignored `qa-results/`. The quality workflow also runs the 67-placement browser acceptance test and retains its report/screenshots.

## Release

This feature branch targets main through the repository's normal pull-request review. Production deployment remains the existing Vercel flow after an approved merge. No WordPress, xneelo, production credentials, logos or hosting configuration were changed.
