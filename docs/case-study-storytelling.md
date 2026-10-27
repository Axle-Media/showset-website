# Case-study interactive storytelling refinement

> Historical report at 01f5d45. The [corrected pinned split](case-study-pinned-split.md) supersedes its inset image card and desktop content-fit fallback. Desktop now retains the pinned sequence for long copy and short windows.

This update continues PR #20 on `fix/case-study-document-audit` from `9763abd`. It supersedes the four-photo collage acceptance in the [previous audit](case-study-final-audit.md); that report and its evidence remain historical records.

## Result

Brief, Intention and Approach now share one stationary desktop photograph frame. Each chapter has one editable primary photograph and optional description. The desktop frame uses equal columns, a substantial cover crop and 6px corners. All chapter text starts at one measured vertical position. Eyebrows are turquoise, uppercase, 13px desktop / 12px mobile, with 650 weight and .06em tracking.

The homepage services implementation (`app/concept-12.css`, `.service-visual`) uses an opacity transition of .85 seconds plus image scale. This story reuses its restrained layered-opacity approach in one fixed frame. Normal chapter transitions are scroll-scrubbed, synchronized with a two-phase text handoff and directly reversible. The outgoing copy fades before the incoming copy appears, avoiding superimposed headlines and paragraphs. They deliberately add no independent photo zoom or text movement. Opaque lower layers prevent dark dips. Incoming images are decoded before the chapter changes; a delayed decode completes with an 850ms eased catch-up crossfade rather than an abrupt replacement. Listeners, pending animation frames and chapter accessibility state are disposed on route/Studio refresh.

At widths <=800px, heights <=690px, reduced motion, or whenever the longest copy cannot fit, chapters use natural document flow. Mobile puts the text before its single photograph. Desktop long-copy fallback keeps a top-aligned two-column layout. There is no fixed text height, nested reading scrollbar or truncation. Without JavaScript, all chapters and their photographs are present in server HTML.

## Studio and retained content

`lib/concept-12/chapter-image.ts` performs read-time mapping: when `image` is unset, the first safe nonempty legacy `images` entry supplies the primary photograph. `image` and `imageAlt` are optional additions to the existing model. An explicitly empty primary field stays empty. Existing chapter arrays, files and authored copy are retained unchanged; saving a new primary field does not rewrite or delete those arrays. No content JSON or demonstration imagery was added to the template.

Studio uses the same renderer and styles. Its static preview shows each chapter in reading order. Save Draft, reload and Publish Preview are tested in isolated browser storage; the user's existing browser data is untouched.

## Verification

TypeScript, source validation (12 pages / 66 sections), SEO validation (12 pages) and the Next.js production export pass. Browser suites run against the actual production export, not a substitute fixture.

- Storytelling: five widths (1440, 1024, 768, 390, 320), all three chapters, forward/reverse transitions, invariant physical frame identity/geometry, synchronized chapter/photo state, no text transforms, correct media and no horizontal overflow.
- Content fixtures: 30, 120, 250 and 500 words at desktop, tablet and mobile; multiple paragraphs remain readable. Overlong copy selects natural flow.
- Progressive enhancement: no-JS, reduced motion, delayed decode, short landscape heights, live reduced-motion switching and native Chrome touch emulation.
- Studio: single primary field per chapter, edited source/description in preview, saved/reloaded primary values, published preview and all original arrays retained.
- Existing regression coverage: case-study sections and Studio, infinite gallery, lifecycle, accessibility, functional navigation, all routes and approved photographic headline swipes.

**524 assertions pass across 12 browser suites.** The initial final-run touch-gallery test stopped after its distance target but before its separately required third observed boundary reset. Its loop now continues until both criteria are met; the targeted rerun passes without gallery-source changes. The initial results are retained in `initial-suite-results.json`.

Final counts and suite exit statuses are recorded in [suite-results.json](../qa/evidence/case-study-storytelling/suite-results.json). [Story assertions](../qa/evidence/case-study-storytelling/checks.json), [fallback assertions](../qa/evidence/case-study-storytelling/fallbacks.json) and [Studio persistence](../qa/evidence/case-study-storytelling/case-study-story-studio.json) provide individual results.

## Visual review evidence

Actual browser captures were inspected for all desktop chapters, tablet/mobile flow, crossfade intermediate frames and 250-word content. The 1440px frame measures x=756, y=190, width=593.28125, height=558 in every pinned chapter; the text starts at y=239. The equivalent 1024px frame is also invariant.

- [1440px chapters](../qa/evidence/case-study-storytelling/chapters-1440.jpg)
- [1024px chapters](../qa/evidence/case-study-storytelling/chapters-1024.jpg)
- [768px reading flow](../qa/evidence/case-study-storytelling/chapters-768.jpg)
- [390px reading flow](../qa/evidence/case-study-storytelling/chapters-390.jpg)
- [320px reading flow](../qa/evidence/case-study-storytelling/chapters-320.jpg)
- [Intermediate crossfades](../qa/evidence/case-study-storytelling/crossfades-1440.jpg)
- [250-word examples](../qa/evidence/case-study-storytelling/long-copy.jpg)
- [Short-screen fallbacks](../qa/evidence/case-study-storytelling/short-screen.jpg)
- [Previous collage baseline](../qa/evidence/case-study-final/sections-1440.jpg)

Element screenshots may include the fixed site header where it overlaps the captured scroll position; the longer examples remain naturally scrollable. The sheets are review artifacts, not a claim of physical-device verification.

## Scope and remaining limits

The horizontal opening, approved swipe headings, independent infinite gallery, lightbox, companies, related projects, closing CTA, homepage, content JSON and shared design tokens are unchanged by this refinement. Existing regression coverage verifies their continued operation.

The previously reported shared footer copyright/year contrast of 4.47:1 remains a separate unapproved treatment. Physical iPhone Safari and Android Chrome were unavailable; mobile checks use Chrome touch emulation. Vercel preview access requires authentication, so local production-export browser verification is the reproducible visual evidence. Local Draft/Publish Preview does not establish an authenticated production backend.

No main merge, production deployment, hosting change or browser-storage reset. Review and visual approval are required before merging PR #20.

Local review: http://localhost:3001/work/atmosphere-is-everything/ and http://localhost:3001/studio/.
