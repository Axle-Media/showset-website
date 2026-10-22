# Concept 12 UI refinements

This branch applies the UI refinement brief and the six screenshots in Changes.docx to the restored Concept 12 implementation. The restored baseline is commit e9310d5 on restore/concept-12-exact. The original reference HTML remains unchanged.

## Scope

- Approved SHOWSET artwork replaces the recreated header and footer wordmarks, with intrinsic dimensions and accessible alternative text. Studio replacement logo fields remain supported.
- Equal outer grid columns centre desktop navigation in the viewport independently of the logo and CTA widths.
- A shared primary CTA rule matches the homepage action, including header and contact submit actions. Secondary links retain their original treatments.
- Hero copy is vertically centred using CSS translate independently of its original scroll transform. Original entrance animation elements and delays remain intact.
- Headings use the existing hero weight, a tighter leading scale and natural responsive wrapping. Story chapter headings have the hero scale, without changing pinned scene timing.
- A shared typography utility decorates existing final heading periods according to the final word colour. It does not add punctuation to headings or edit paragraph punctuation. It runs after route and Studio content binding.
- More space separates the service introduction from its existing category navigation.
- The closing section uses cropped approved S and dot artwork at six percent opacity, a simpler backdrop and a closer text and link grouping.
- Footer link groups move towards the page centre and stack cleanly on mobile.

## Preservation

The original runtime animation equations, scroll transition durations, scroll tracks, service interaction, carousel logic and contact preview behaviour are unchanged. Contact dropdown opening visibility is immediate so keyboard focus can enter reliably; its opacity and movement transition remains intact. The public website and Studio continue to use the same ConceptSite and bindConcept implementation. Local storage data and Save Draft and Publish Preview behaviour are retained.

The extraction and port scripts recreate the original restoration baseline. Do not run them over this refinement branch without reviewing the resulting diff: the shared markup now intentionally contains approved logo artwork and spoken whitespace between hero lines.

## Review workflow

The private GitHub repository uses main as the restored Concept 12 baseline. Development belongs on refinement branches and is reviewed through pull requests. Do not merge experimental changes into the baseline without explicit approval. No deployment workflow is configured by this work. No live WordPress website is modified.

## Verification evidence

Browser screenshots and machine-readable verification results are retained in the local Codex workspace under outputs/nextjs/concept-12-refinements. The review report records final results and any remaining limitations. Real iOS Safari and Android Chrome hardware are not available in this desktop environment; Chromium touch emulation is recorded separately from physical-device testing.

## Repeatable browser checks

The qa directory contains the functional, refinement and global editing checks used against the actual application. They use an isolated Playwright browser context and do not touch the normal browser profile. Supply Playwright using the normal Node module resolution or the SHOWSET_PLAYWRIGHT_MODULE environment variable. Chrome must be installed. Set SHOWSET_BASE_URL if the application is not served at http://127.0.0.1:3002.

Run node qa/concept12-functional.cjs, node qa/concept12-refinements.cjs and node qa/concept12-global-editing.cjs from the project directory. Results are written to ignored qa-results. The static export can be served locally after npm run build. No production service is needed.

Global heading leading and tracking now use explicit inline priority so saved Studio choices override the shared design defaults. Inspector defaults match the refined 1.08 heading leading and 43px CTA height. Historical default values reconcile through the existing lossless compatibility adapter; raw browser records are backed up before reconciliation.

Final heading periods remain inline even inside the service heading’s block-level line wrappers. Sand-coloured headings keep their existing punctuation treatment; the requested contrasting rule applies to teal and off-white final words. The closing pattern retains the approved SVG geometry with an opaque off-white fill and a single six percent compositing layer, avoiding multiplication by the source asset’s baked opacity.
