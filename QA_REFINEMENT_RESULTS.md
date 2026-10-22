# Concept 12 refinement review

The requested UI refinements are implemented in the existing Next.js project on `refine/concept-12-ui`, based on restored baseline `e9310d5`. The work is ready for visual approval. It has not been merged into the baseline or deployed.

Website: http://127.0.0.1:3002/  
Studio: http://127.0.0.1:3002/studio/  
Private repository: https://github.com/jamesgldnhs/showset-website

## Visual changes

Approved header and footer artwork; viewport-centred desktop navigation; one shared 43px primary CTA treatment; vertically balanced hero with two desktop lines where practical; consistent hero-weight headings with 1.08 leading; larger story/process chapter headings; contrasting final periods for teal/off-white heading lines; more service-selector breathing room; approved cropped brand artwork at six percent opacity in the closing section; footer links closer to the page centre.

The hero words, paragraph copy, photographs, section order, story acts, pinned tracks, circle reveals, expanding dot, service selection, horizontal carousel and page transitions are retained. The only runtime change is contact dropdown keyboard focus sequencing; opening visibility is immediate while its original opacity and movement transitions remain.

## Verification

Actual production build rendered in Chrome through Playwright, with isolated browser storage. The original Concept 12 HTML remains unchanged. Before images come from the restored Next.js baseline; after images come from the built refined Next.js application.

| Check group | Passed |
| --- | --- |
| functional | 50 / 50 |
| editor-controls | 28 / 28 |
| touch-short | 10 / 10 |
| additional-interactions | 10 / 10 |
| refinement-controls | 22 / 22 |
| global-editing | 9 / 9 |

- 348 scene screenshots across 11 original page states at 320, 390, 768, 1024, 1440 and 1920px, plus process detail screenshots.
- No runtime errors, broken images, failed fonts or horizontal overflow recorded in the screenshot matrix. Short 450px heights and native Chromium touch swipes also checked.
- Desktop nav centre error no greater than 0.008px. Label edits preserve centring. Primary CTA computed metrics match across all six widths.
- Existing final headline periods are decorated; teal final lines receive off-white periods and off-white final lines receive teal periods. Sand/custom colours retain their punctuation colour. Paragraph punctuation is unchanged.
- 48 paired forward/reverse motion states retain the same active chapters, transition durations and geometry equations. Changed document heights introduce scroll rounding: dot radius differences below 1px, type translation below 0.05px, progress below 0.001. These are recorded rather than described as exact screenshot parity.
- Save Draft, Publish Preview, custom content, repeaters, responsive fonts, logo, typography leading/tracking, pattern opacity and CTA height tested. Raw historical browser records remain backed up; loading does not overwrite saved keys.
- All 11 linked public routes return successfully; the existing /services/ alias also loads.
- TypeScript, source validation (12 pages / 66 sections), runtime syntax and production build pass.

## Screenshots

[Desktop before and after](qa/evidence/comparison-1440.jpg) · [Mobile before and after](qa/evidence/comparison-390.jpg)  
[Closing before](qa/evidence/closing-before.png) · [Closing after](qa/evidence/closing-after.png)

## Remaining limitations

| Severity | Finding and reproduction | Status |
| --- | --- | --- |
| P2 | Original ivory/sand text on the teal dot scene fails WCAG AA contrast; footer text also has a marginal contrast finding. Run the accessibility scan or inspect the dot scene at full expansion. | Existing palette treatment retained; accessibility compliance is not claimed. |
| P2 | GitHub returned HTTP 403 when enabling private main branch protection: account plan requires Pro. | Repository remains private. Development stays separate and unmerged; server-enforced protection is unavailable on the current plan. |
| P3 | Physical iOS Safari and Android Chrome devices are not connected. | Chromium responsive and touch tests pass; physical-device verification remains outstanding. |
| P3 | The original contact form is a design preview and deliberately does not send mail. | Validation and honest non-delivery feedback pass; no SMTP delivery claim. |

## Git and privacy

The existing history and working files were preserved. Credential-pattern scanning covered all reachable Git blobs and current source; no recognized exposures were found. The example API configuration contains placeholders, and local configuration, environment files, dependencies, build outputs, database dumps, temporary backups and QA run outputs are excluded. Source schema and configuration examples remain tracked intentionally. No automated deployment was enabled and showset.co.za was not modified.

Default remote branch `main` contains the restored baseline. The refinement branch is intended for pull request review and explicit approval before merging. Cancelled experiments remain recoverable in local branches and the preserved history.
