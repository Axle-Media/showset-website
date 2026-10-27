# Service motion and design-system refinement

Refinement of PR #37 on `feat/cinematic-service-pages`. Baseline: `7189899`. No service inventory, routes, page copy, homepage/case design or content models were replaced.

## Before and after

| Area | Before | Refined behaviour |
|---|---|---|
| Photo headings | Simple spans, with a generic hero-wrapper fade/rise. | Events and Production photographic openings, all photographic closings and the pinned Events scene headings use the existing `block-heading` / `wipe-line` system and the exact `showsetPhotoBlockSwipe` / `showsetPhotoTextUnmask` keyframes. No text translation or opacity animation. |
| Editorial headings | Static outside the signature story. | The established circular type reveal introduces selected section headings. Creative/Digital openings remain editorial because their headings are beside a photograph or over graphics. Production story copy is also beside, rather than over, its photographs. |
| Hierarchy | Repeated labels before almost every section. | Two contextual section eyebrows per page. Generic introduction/group/process/expertise labels are removed; functional categories, numbers, search labels and concept-study disclosures remain. |
| Events | Short photo crossfades and a largely static diagram. | Smoothed photographic blends, restrained scale/depth, progressively drawn planning lines and assembling process rules. Scene text swipes replay on forward/reverse entry. |
| Creative | A continuous linear proof spread and large static process numbers. | An eased proof unfolding with an entry/release hold; process details reuse the editable proof imagery with restrained image masks and assembling rules. |
| Digital | Selection changed mainly the background. | Scroll and native button selection coordinate path drawing, heading emphasis and direction indicators. Mouse, Space and touch all operate the same controls. |
| Production | A translating rail with a generic progress line. | Restrained photographic scale changes, explicit active-frame state and a progress indicator tied to frame position. The process continues that sequence through assembling rules. |
| Related work | Conventional static image and copy. | A scroll-driven image mask/depth treatment, with equivalent hover/focus emphasis and unchanged real case links. |
| Closings | Four similar photographic banners. | Shared photo swipes and restrained photographic depth, with a right-aligned Creative composition, inset Digital frame and film-like Production framing. Events retains its immersive invitation. |
| Studio | Rebinding could restart or clear visual state. | Service-owned attributes, progress properties and reveal classes survive same-DOM reconciliation. Refresh disposes listeners while retaining the visual state; ordinary edits preserve the actual CSS animation start time. |

The earlier screenshots remain available in [baseline commit 7189899](https://github.com/Axle-Media/showset-website/tree/71898991f7f3c0f0bede51b2add2626cc773004c/docs/service-page-redesign/screenshots).

## Design-system compliance

Computed styles were inspected at 1920, 1440, 1024, 768, 390 and 320px on all four pages:

- Paragraphs are 17px and use `--v12-body-tracking` and `--v12-body-leading`.
- Buttons/CTA labels and desktop navigation retain 14px text.
- All headings use the existing display font, `--refine-heading-weight`, `--v12-head-tracking` and `--refine-heading-leading`.
- Existing heading scales, content gutters and deliberate layout gaps are retained. Paragraph spacing uses the existing `--v12-para-gap`.
- Photo swipes retain the approved teal/sand block treatment, 0.75-second keyframes and line delays. Editorial headings use the existing 1.1-second reveal. No new animation library or replacement keyframe system was introduced.
- Mask padding follows the case-study approach, with additional vertical room for the larger service display sizes. This protects loaded Poppins glyphs and punctuation while leaving heading leading unchanged.

Every heading is readable with reduced motion, a still preset, Studio layout mode or JavaScript disabled. Narrow/short viewports and long edited story content retain normal-flow reading. There is no wheel interception, automatic service carousel, video placeholder or new external asset.

## Visual and motion evidence

| Service | Desktop opening | Mobile opening | Process | Expertise | Closing | Native forward/reverse recording |
|---|---|---|---|---|---|---|
| Events | [1440](screenshots/events-experiences-1440-hero.png) | [390](screenshots/events-experiences-390-hero.png) | [Desktop](screenshots/events-experiences-1440-process.png) | [Mobile](screenshots/events-experiences-390-expertise.png) | [Desktop](screenshots/events-experiences-1440-closing.png) | [WebM](videos/events-experiences.webm) |
| Creative | [1440](screenshots/creative-design-1440-hero.png) | [390](screenshots/creative-design-390-hero.png) | [Desktop](screenshots/creative-design-1440-process.png) | [Mobile](screenshots/creative-design-390-expertise.png) | [Desktop](screenshots/creative-design-1440-closing.png) | [WebM](videos/creative-design.webm) |
| Digital | [1440](screenshots/digital-marketing-1440-hero.png) | [390](screenshots/digital-marketing-390-hero.png) | [Desktop](screenshots/digital-marketing-1440-process.png) | [Mobile](screenshots/digital-marketing-390-expertise.png) | [Desktop](screenshots/digital-marketing-1440-closing.png) | [WebM](videos/digital-marketing.webm) |
| Production | [1440](screenshots/content-production-1440-hero.png) | [390](screenshots/content-production-390-hero.png) | [Desktop](screenshots/content-production-1440-process.png) | [Mobile](screenshots/content-production-390-expertise.png) | [Desktop](screenshots/content-production-1440-closing.png) | [WebM](videos/content-production.webm) |

The full six-width set contains 216 screenshots: opening, editorial introduction, three story states, process, expertise, related work and closing for every page/width. It is generated by `qa/service-motion-design.cjs`, archived by the quality workflow and included in the local handoff ZIP. Recordings use real native mouse-wheel input in both directions, followed by process/closing views; section jumps between those recorded segments are deliberate test navigation. They are not animated HTML fixtures.

## Automated results

- TypeScript, source/content, SEO and the optimised Next.js static build pass.
- Existing service acceptance: **415** passing assertions.
- New six-width computed-motion suite: **440** passing assertions. It samples initial masks, moving rectangular overlays and final readable type, with no glyph translation/fade. It also checks global type metrics, two-eyebrow hierarchy, actual forward/reverse signatures, masks, process progress, keyboard/touch, loaded-font glyph bounds, overflow, no-JS/reduced-motion output and console errors.
- Targeted extended motion suite: **100** passing assertions, including actual forward/reverse Events scene swipes and pin release.
- Independent pin release/re-entry at 1920/1440/1024: **24** passes. Native-wheel recordings: **8** forward/reverse endpoint checks pass.
- Studio editing/persistence/publishing: **33** passes. Lifecycle: **25** passes, including animation start-time continuity, focus/scroll/node preservation, bounded resources, live OS motion changes and short landscape.
- Restored shared photo-swipe coverage: **36** passes, explicitly including both photographic service heroes and all four photo closings.
- Existing homepage, featured projects, carousel playback, case storytelling/gallery/editing, typography, editorial columns, global controls, route-first HTML and instant route top/back/forward suites pass. The combined recorded evidence contains **2,139** passing assertions.
- Eight axe WCAG A/AA scans (four services at 1440/390) report zero violations. Mobile touch scrolling and expertise/channel interaction checks pass.

See [machine-readable evidence](evidence/). CI runs the new motion suite and the restored shared photo-swipe suite in addition to the existing checks. The full default motion suite also includes the additional pin-release and Events replay assertions exercised in the targeted run.

One interrupted local run recorded connection refusals from the earlier static test server. It was rerun against the same Next.js export through a reliable local server; the complete final run has zero console/runtime errors. Initial glyph-bound failures led to larger mask padding. The opening-fit test now measures real text-node bounds rather than counting protective mask padding as text overflow; the separate padded-mask and document-overflow checks remain strict. No application checks were removed to obtain passing results.

## Preservation and remaining review

All authored content and the 31-entry expertise inventory remain unchanged. The shared renderer, additive older-draft model, route URLs and local Save Draft/Publish Preview remain in place. The global reveal observer excludes service-owned headings so each reveal has one owner; homepage and case behaviour otherwise remains unchanged. DOM-patch preservation is limited to service descendants.

Physical iOS Safari/Android Chrome checks remain unavailable. Visual approval of the refinements is still required. PR #37 remains open; no merge, hosting change or intentional production deployment is part of this task. The existing untracked ZIP and prior stash are untouched.
