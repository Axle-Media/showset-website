# Corrected pinned case-study split

This is the current PR #20 storytelling acceptance report. It supersedes the inset-card layout and desktop content-fit fallback described in [the earlier refinement](case-study-storytelling.md). Work continues in the existing `fix/case-study-document-audit` checkout from `01f5d45`; no project replacement or history rewrite.

## Corrected behaviour

There is one scroll container and one sticky, viewport-height stage. Brief, Intention and Approach replace one another within that stage. The photograph is one persistent viewport with layered, decoded image states. The desktop image panel has square corners, no inset, no max-width cap and no decorative frame. It touches the top, bottom and right viewport edges. Chapters have no desktop borders or stacked layout.

The actual homepage services section was inspected in local Chrome before implementation. At 1440x900 its image panel measures x=705.59375, y=0, width=734.390625, height=900. The corrected case-study panel measures x=705.609375, y=0, width=734.390625, height=900. This matches the homepage's 49/51 split within subpixel grid rounding. The photograph retains identical geometry in every chapter and both scroll directions. The left gutter and shared heading/body tokens remain consistent with the homepage.

## Native scroll and long descriptions

Desktop no longer becomes stacked because of copy length or a short window. At widths over 800px, the three-state stage remains pinned. Standard copy stays stationary. When a chapter is taller than the available reading window, native page scrolling moves that chapter's copy through the left reading area while the image and split remain fixed. No nested scrollbar, wheel capture, scroll lock, body-font reduction or content truncation is introduced.

The base narrative is 360svh. Its duration grows by four times the greatest measured text overflow, leaving enough native scroll distance for each chapter to be read completely. Copy reading occurs during the fully visible chapter dwell windows: Brief 0–.27, Intention .36–.61, Approach .70–1. Photo blends occupy .27–.36 and .61–.70; the two-phase text handoff changes active chapter at .315 and .655. The first chapter is present on entry and the final chapter remains present until stage release into the immediately following gallery. Reverse scroll reverses both reading and transitions.

Typography, font loading, resize and Studio remounts recalculate the fit and duration. The copy starts at or below the reading area's top; its final line reaches the bottom before the next handoff. This is tested at 50, 100, 150, 250 and 500 words. Multi-paragraph content is retained in full.

At <=800px, reduced motion, disabled motion/Studio static preview, or without JavaScript, the reading-order adaptation remains available. Desktop reduced motion intentionally presents all chapters in normal flow. Mobile uses one inline photograph after each chapter's text. The 13px desktop / 12px mobile turquoise eyebrows remain grouped with their headings.

## Studio and scope

The existing three independent primary-image fields and image descriptions remain in Studio. Read-time mapping still uses the first valid legacy image only when the primary field is unset. All legacy arrays and media remain intact. Save Draft, reload and Publish Preview use isolated test contexts; the user's browser data is not cleared or replaced.

Only story markup, story CSS, story runtime and related test expectations change. The opening, horizontal hero, photographic swipes, gallery implementation, lightbox, credits, related projects, homepage and closing CTA are unchanged. The existing untracked preview ZIP and prior local-work stash are preserved.

## Verification and evidence

TypeScript, source checks (12 pages / 66 sections), SEO checks and the actual Next.js production export pass. Browser suites exercise the real export served locally, with screenshots from that application.

**565 assertions pass across all 12 selected browser suites.**

[Suite results](../qa/evidence/case-study-pinned-split/suite-results.json) record final exit codes and assertion counts. The story suite covers actual homepage-panel comparison, invariant image geometry, all three states forward/reverse, native wheel direction changes, first/last boundaries, release into the gallery, copy-length fixtures, mobile, no-JS, reduced motion, delayed decoding and retained media. Existing Studio, gallery, lifecycle, accessibility, navigation, route and swipe regressions also run.

- [Homepage reference / previous card / corrected split](../qa/evidence/case-study-pinned-split/reference-before-after.jpg)
- [1440px: all three states at the same viewport position](../qa/evidence/case-study-pinned-split/chapters-1440.jpg)
- [1024px split](../qa/evidence/case-study-pinned-split/chapters-1024.jpg)
- [768px adaptation](../qa/evidence/case-study-pinned-split/chapters-768.jpg)
- [390px](../qa/evidence/case-study-pinned-split/chapters-390.jpg) / [320px](../qa/evidence/case-study-pinned-split/chapters-320.jpg)
- [Intermediate transition frames](../qa/evidence/case-study-pinned-split/crossfades-1440.jpg)
- [250 words: beginning/end with stationary image, plus mobile](../qa/evidence/case-study-pinned-split/long-copy.jpg)
- [Short desktop windows retain pinning](../qa/evidence/case-study-pinned-split/short-screen.jpg)

Local review: http://localhost:3001/work/atmosphere-is-everything/ and http://localhost:3001/studio/.

Branch preview: https://showset-website-git-fix-case-study-document-audit-showset.vercel.app/work/atmosphere-is-everything/ . Preview access may require Vercel authentication; the local screenshots do not claim authenticated deployed-browser verification.

Physical iPhone/Android testing remains unavailable. The previously reported shared-footer contrast issue remains separate from this layout correction. No main merge, production deployment or hosting changes. PR #20 requires review and visual approval before merging.
