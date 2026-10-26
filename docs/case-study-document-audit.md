# Case study document audit and verification

Historical report for aa31bf6. The latest approved changes and results are in [the final audit](case-study-final-audit.md). The original eyebrow, gallery-heading and partner-heading requirements were superseded in the subsequent refinement briefs.

This branch corrects the incomplete case-study implementation from PR #19 against all four pages and ten embedded screenshots in Case-Study-Changes.docx. The audit began on current main, `23f7044bfe4a4a325850c26e9218b05bfe129268`, before edits. Both the deployed page and actual local Next.js app were inspected at 1440, 768 and 390 pixels. The document was rendered with Word to a four-page PDF and every page inspected.

The initial findings are in [the before audit](case-study-audit-before.md). The implementation preserves homepage copy, page order, photography and closing CTA. The only shared CSS change extends existing photo-swipe selectors to the case-study opening scenes. The case-study runtime controls its own reveals so the generic intersection observer cannot race its reverse-scroll state.

## Requirements A through Q

| Item | Implementation and code location | Verification |
|---|---|---|
| A Hero typography | `app/case-study.css:15` uses Poppins, approved heading weight/tracking, with an intentional 0.98 hero-leading exception. `lib/concept-12/case-motion.js:28` measures actual wrapped lines after fonts load and on resize. Continuation lines are teal, with off-white periods. | Hero screenshots at all three widths; computed metrics, line colours and absence of overflow checked in `qa/case-study-document.cjs`. |
| B Header overlay | `app/case-study.css:2` preserves transparent initial navigation over the full-screen image; scrolled and open-menu styles retain shared behaviour. | Opening top is y=0 and header background transparent at each width. Scrolled navigation visible in chapter screenshots; shared accessibility/navigation regressions run. |
| C Block swipe | `app/concept-12-refinements.css:225` extends the existing 750ms teal block/unmask treatment to case opening scenes. `case-motion.js:175` sequences both headings forward and backward, with no additional text rise/fade. | Computed animation name, 0.75s duration, teal bar, stationary glyph/copy transforms and reverse reset assertions. Reduced-motion and no-JS fallback tests. |
| D Hero indicator | PR19 already removed rendered markup/runtime. Removed all obsolete indicator CSS from `app/case-study.css`. | No indicator elements in DOM. |
| E Eyebrows | Removed obsolete chapter marker/progress CSS. Real chapter titles remain in `immersive-case.ts:30`. | No eyebrow/marker/progress elements; all three real headings present. |
| F Editorial consistency | Unified chapter/related headings with homepage tokens; fixed grid child minimum widths and measured wrap. `case-study.css:35–39,76`. | Actual computed heading and body metrics compared to homepage; every section screenshot reviewed. |
| G Approach layout | One `.case-chapter` grid and responsive rule for all acts, including supporting image pairs; removed Approach-specific override stack. | All acts have identical grid columns; Approach screenshots at every width. |
| H Independent gallery | `immersive-case.ts:44–53` keeps gallery immediately after pinned narrative. Removed window styling and dead Studio controls; legacy stored fields retained for compatibility only. | DOM sibling relationship and removed window asserted. |
| I Square framing | `case-study.css:51,102,110` uses 1.12 desktop, 1.07 tablet and 1 mobile aspect ratios. | Measured image dimensions at all widths. |
| J Decoration | No gallery labels, counter, external arrows or progress markup; obsolete CSS removed. Native overflow, pointer drag and keyboard navigation retained. | Mouse drag, horizontal wheel and native Chrome touch-emulated swipe pass; no accidental lightbox on drag. |
| K Lightbox | `case-motion.js:95–133` retains close/internal arrows, traps focus including attribution links, makes background inert and restores focus/scroll. Cleanup restores interaction during refreshes. | Click, next key, focus wrap, Escape, scroll/focus restoration tested at all widths. |
| L Window removal | No window component, parallax or related CSS. Removed editor controls that edited nothing. `bannerImage` remains an optional deprecated data field so old drafts are not destroyed. | DOM checks, source audit, Studio persistence confirms legacy stored data retained. |
| M Logos | `immersive-case.ts:55` retains placeholder SVG above name/role or own supplied logo/link. Partner heading reduced to understated homepage H3 scale. | Four logo/name pairs checked; Studio own-logo URL and link persist through draft/publish. |
| N Related projects | `case-study.css:71` caps desktop images at 270px with smaller responsive frames. Distinct descriptions come from each related page's actual content. | Screenshots, distinct-description assertions and internal navigation test. |
| O Disclaimer | Long disclaimer remains absent. Demonstration status and fictional partner roles retained in data; no invented completed-project claims added. Photo attribution moved out of template literals into optional image data, shown in lightbox. Old drafts inherit matching seed credit without changing their copy/order. | No disclaimer node; Studio demo flag preserved; reordered image keeps attribution. |
| P Global typography | Consolidated case CSS instead of appending overrides. Reuses display/body tokens, tracking, weight, heading/body scale and paragraph leading. Necessary heading `!important` rules are documented because the legacy global heading reset uses them; explicit Studio inline edits still win. | Computed homepage/case equality assertion, type/source/build checks. |
| Q Pattern | `case-study.css:33` places the approved `closing-pattern.svg` behind the sticky stage at 4.5% default opacity and a consistent 980px scale, across all acts. | Asset/opacity checked; Brief, Intention and Approach screenshots at all widths. |

The template remains reusable across all three case-study routes. Studio adds an editable second-scene title and per-image credit fields. Headings use actual content; the Academy Awards example and attribution stay in demonstration data. The homepage's drawing-board section and complete closing CTA are preserved. Short landscape viewports use readable chapter flow rather than clipping a pinned screen; normal-height desktop/tablet/mobile remain pinned.

## Visual evidence

The [mid-swipe frame](../qa/evidence/case-study-oct26/swipe-midpoint.jpg) shows the rectangular reveal in progress. The screenshot sheets show all nine requested sections at each width. Screenshots are from the running Next.js application, not a fixture.

- [1440 desktop sections](../qa/evidence/case-study-oct26/after-1440.jpg)
- [768 tablet sections](../qa/evidence/case-study-oct26/after-768.jpg)
- [390 mobile sections](../qa/evidence/case-study-oct26/after-390.jpg)
- Before/after: [hero](../qa/evidence/case-study-oct26/compare-hero.jpg), [Intention](../qa/evidence/case-study-oct26/compare-intention.jpg), [gallery](../qa/evidence/case-study-oct26/compare-gallery.jpg), [partners](../qa/evidence/case-study-oct26/compare-partners.jpg), [related projects](../qa/evidence/case-study-oct26/compare-related.jpg).

## Validation

Dependencies were already installed and the lockfile is unchanged; npm ci was unnecessary. TypeScript, source checks (12 pages, 66 sections, zero errors), SEO metadata validation (12 pages) and the production export build pass.

Run the browser suites against a locally served actual Next.js build with `SHOWSET_BASE_URL` and an installed Playwright package supplied through `SHOWSET_PLAYWRIGHT_MODULE`:

```
node qa/case-study-document.cjs
node qa/case-study-studio.cjs
node qa/case-study-touch.cjs
```

Final production-browser results: **86/86 document checks, 12/12 Studio checks and 2/2 touch/trackpad checks pass (100 total)**. Machine-readable results are in [the evidence summary](../qa/evidence/case-study-oct26/results.json).

These cover desktop/tablet/mobile screenshots, forward/reverse scenes, responsive typography, reduced motion (including changing the preference while on the page), no-JS reading flow, mouse drag, native touch emulation, trackpad-style wheel scrolling, lightbox keys/focus/scroll, internal routes, direct refresh, images, overflow and isolated Studio draft/published-preview persistence. Test browser contexts are isolated; the user's existing browser data is never cleared or overwritten.

Existing suite results on this branch: SEO 24 cases, lifecycle 16, global editing 9 and accessibility 21 all pass. Functional passes 49 assertions with one old homepage text assertion failing; homepage feedback passes 45 with one old exact-text assertion failing; integration homepage passes 40 with one old legacy-default migration assertion failing. The route suite stops on its first old homepage title comparison; the photo-heading suite passes eight then stops on an ambiguous selector that matches the visible Studio heading and hidden Work heading. These suites have not been rewritten to conceal failures. The new case-study tests independently cover direct routes, photo swipes and the preserved homepage CTA.

## Not verified

Physical iPhone Safari and Android Chrome were not available; Chrome viewport/touch emulation does not establish physical-device parity. External image hosting availability may change; the retained reference image loaded during local testing. Authenticated PHP/backend uploads and live production publishing were not exercised. No main merge, production deployment or hosting changes are part of this PR. Review the preview visually before approval.
