# SHOWSET case study final audit

This report supersedes the earlier PR20 document audit. Work continued on `fix/case-study-document-audit`, safely fast-forwarded from `aa31bf6` to the existing refinement `845b100`, before adding final fixes. No reset, replacement project, main merge or production deployment was performed. The existing preview ZIP and prior local-work stash remain untouched.

## Result

**749 functional, visual and foundation assertions pass** across 17 suites. The case-study functionality and visual acceptance checks pass on the actual Next.js application. Source validation, TypeScript, SEO validation and production export pass. All existing foundation/browser suites now pass after correcting superseded copy assertions, inactive-route selectors, finite-carousel assumptions and a replay assertion that sampled before the second line's approved delay.

**This is not an unconditional production accessibility sign-off.** An additional full-page axe scan reports the existing shared footer copyright at 4.47:1 against a 4.5:1 minimum. Its nested year has the same issue. The previously unapproved global contrast treatment has not been folded into this branch.

## Acceptance evidence

| Requirement | Result | Implementation and verification |
|---|---|---|
| Hero descenders and tight typography | PASS | `app/case-study.css:15–25` contains the mask's paint area without inflating line pitch. A flow-root prevents negative mask margins collapsing into extra line spacing. Three editable titles, both opening scenes and four widths are raster-compared against unclipped text. Real line-box pitch is checked against 1.045 leading. |
| Teal/white block swipes | PASS | First bar teal, continuation bars off-white, stationary glyphs, 750ms shared keyframes. Covered-frame raster tests verify no glyph ink escapes the blocks at 1440/1024/768/390/320. End-state raster comparisons allow only 2/255 compositor quantisation; covered-phase comparisons allow 4/255. These tolerances do not mask the high-contrast descender clipping caught during this audit. |
| Header from initial load | PASS | `components/ConceptSite.tsx:202` emits the route marker in the server-rendered host. Existing case-specific transparent-header styling applies immediately. All three case routes tested without JS at five widths; top geometry remains stable after hydration and direct refresh. Homepage navigation styles are unchanged. |
| Brief, Intention, Approach labels | PASS | The existing 845b100 eyebrows are retained inside each chapter copy group, so they transition with the act. |
| Expanded body copy | PASS | The upstream expanded demonstration copy is preserved in data, including the explicit fictional-concept context. This commit does not change homepage or case-study prose. |
| Four-photo collages | PASS | Retains the art-directed four-image, two-column/six-track collage and four editable Studio image fields. All acts use the same layout. Photos, radii, gaps and responsive cropping inspected. |
| Stationary pinned narrative | PASS | `case-motion.js:updateFlow` selects pinning by content fit, width and height. Desktop acts remain stationary; one act owns keyboard interaction. Reverse scrolling passes. Mobile, <=690px heights and oversized editable copy use readable flow instead of clipping content. Fit is measured against stable pinned insets to avoid a resize-feedback loop. |
| Subtle homepage pattern | PASS | Same approved baked-opacity tile, 440px scale, repeat and centre/top position as the homepage's 'The thinking behind the thing.' section. Matching gradient colours, no extra opacity multiplication. Computed pattern metrics compared, all act screenshots inspected. |
| Infinite carousel | PASS | `lib/concept-12/case-gallery.js` uses one accessible original set plus non-focusable aria-hidden presentation copies. Native scroll coordinates wrap invisibly across one full period, with captured mouse origins adjusted to preserve movement. No autoplay or new external controls. Three full cycles each way pass for mouse, wheel and native touch emulation, plus immediate reversal, fast boundary crossing, resizing and geometry continuity. |
| Stable photo identity and varying lengths | PASS | Logical IDs are independent of clone position; newly added Studio photos get a UUID. Fixtures cover 0,1,2,3,6,9 photos. Empty galleries hide; one image or a fully visible small set does not loop. No duplicate accessible photos. |
| Full-screen image viewer | PASS | First/last wrap, close/internal arrows, arrow keys, Escape, focus containment including credit links, background inertness, scroll locking/restoration and drag-click suppression pass. Per-photo attribution remains in data. |
| Adaptive companies 0–12 | PASS | `immersive-case.ts:partnerPositions` calculates balanced rows on a 24-column canvas at each breakpoint. Zero hides the section; one is centred and capped; partial rows are centred with consistent card sizes. Desktop 5=3+2, 7=4+3, 9=3+3+3, 10=4+3+3, 11=4+4+3, 12=4+4+4. Every count tested at 1440/768/390/320, including logo proportions and row centres. |
| Section spacing | PASS | Shared case spacing tokens now match the actual approved closing CTA's computed top/bottom padding, including mobile values. This replaces the former mismatched 170px gallery top padding. |
| Related projects | PASS | Compact images, distinct project summaries, actual links, hover behaviour and SVG route transition preserved; navigation and direct route tests pass. |
| Homepage closing CTA | PASS | Exact cloned homepage content and styling retained. Homepage drawing-board section, photography, page ordering and original markup/content files are unchanged from 845b100. |
| Mobile/reduced motion | PASS locally | Five widths plus a 1440x650 short desktop reviewed. Flow layouts stay readable. Fresh reduced-motion, live preference changes and no-JS reading flow pass. Physical devices remain unverified. |
| Studio editing | PASS | Company add/delete/reorder, four-photo editing, title/body edits, gallery order, draft reload and published preview all pass in isolated browser contexts. Repeated edits keep two active ResizeObservers and bounded clones; switching between projects cleans up resources. Existing user storage was not accessed or cleared. |
| Full-page contrast | FAIL, pre-existing | Axe targets `.footer-bottom > span:nth-child(1)` and `#year`, 4.47:1. No case-content violations were reported. Needs a separately approved footer contrast adjustment. |

## Visual evidence

All screenshots come from the real running Next.js application and exported production build, not an HTML fixture.

- Section sheets: [1440](../qa/evidence/case-study-final/sections-1440.jpg), [1024](../qa/evidence/case-study-final/sections-1024.jpg), [768](../qa/evidence/case-study-final/sections-768.jpg), [390](../qa/evidence/case-study-final/sections-390.jpg), [320](../qa/evidence/case-study-final/sections-320.jpg).
- [All company counts 1–12](../qa/evidence/case-study-final/partners-1-through-12.jpg). Zero is asserted as an absent section in the machine-readable checks. Full-size examples include counts 1,5,7,12 at desktop/mobile/narrow mobile in the same folder.
- [Before hero at 845b100](../qa/evidence/case-study-final/before-845b100-hero.jpg) and [final hero](../qa/evidence/case-study-final/after-hero.jpg).
- [Short-height complete Brief](../qa/evidence/case-study-final/short-brief-full.jpg), [Intention](../qa/evidence/case-study-final/short-intention-full.jpg), [Approach](../qa/evidence/case-study-final/short-approach-full.jpg).
- Loop boundaries: [mouse](../qa/evidence/case-study-final/boundary-mouse.jpg), [wheel](../qa/evidence/case-study-final/boundary-wheel.jpg), [touch emulation](../qa/evidence/case-study-final/boundary-touch.jpg).
- [Covered swipe phase](../qa/evidence/case-study-final/swipe-covered-1440.jpg).
- [Suite results](../qa/evidence/case-study-final/suite-results.json), [variant checks](../qa/evidence/case-study-final/variant-checks.json), [loop distances/geometry](../qa/evidence/case-study-final/infinite-checks.json), [axe findings](../qa/evidence/case-study-final/axe-findings.json).

## Reproduction

Dependencies and lockfile were unchanged; npm ci was not required. Run `npm run check`, `npm run lint:source`, `npm run check:seo`, `npm run build`. Browser suites take `SHOWSET_BASE_URL` and `SHOWSET_PLAYWRIGHT_MODULE` and run with isolated contexts:

```
node qa/case-study-final.cjs
node qa/case-study-infinite.cjs
node qa/case-study-document.cjs
node qa/case-study-swipe-paint.cjs
node qa/case-study-studio.cjs
node qa/case-study-final-studio.cjs
```

The evidence summary also records the existing route, SEO, functional, lifecycle, global-editing, accessibility, responsive-refinement, homepage-feedback, integration and photo-heading suites. The final absolute-position paint correction was rebuilt and its covered-phase raster tests rerun against that production build; it does not change layout, timing or input logic.

## Remaining limits

- Four-photo collage and expanded-copy acceptance uses the supplied primary demonstration data; other projects remain driven by their own authored content rather than receiving invented photographs.
- Physical iPhone Safari and Android Chrome were unavailable; native Chrome touch emulation is documented separately.
- Vercel previews require authentication in the available browser. Build/check status is verified separately from deployed-browser parity.
- Authenticated PHP uploads, real production publishing, live mail delivery and hosting changes were not exercised.
- Additional screenshots said to have been posted in another ChatGPT conversation were not attached to this handoff. References actually inspected were the four-page Word document, current approved homepage, existing local/PR evidence and all latest branch refinements.
- The shared footer contrast finding remains open for visual approval. Do not interpret passing functional tests as full WCAG certification or automatic merge approval.
