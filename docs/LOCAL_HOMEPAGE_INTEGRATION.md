# Local foundation + homepage integration

This branch combines foundation PRs 1, 8, 9 and 11 (451377b) with PR 10 (efc11db). Main and the original feature branches are preserved. PR 12's colour treatment is excluded and remains subject to owner approval. No remote branch push, merge to main or deployment is part of this integration task.

## Semantic resolutions

- Retained route-first static HTML, authored SEO, Next/native history integration, curtain queue/focus and the stable in-place Studio renderer.
- Kept PR 10's hero visibility thresholds and zero dot radius before entry/reverse. One hero-access function controls pointer, inert and aria-hidden state; motion-off and per-scene still modes expose both scenes instead of returning with hidden controls.
- Preserved runtime-owned hero access attributes during Studio patches. Repeated hero CTA edits bind in both scenes, including updates while the expanded scene is active.
- Removed independent translate from motion-off reading flow. No-JavaScript exports receive the same source second-scene copy and real links in a noscript fallback, avoiding visible but inert content.
- Matched both hero scenes to the actual responsive hero font size/tracking. Browser tests found PR 10's second heading at 74px versus 67px. Short-height screenshot review also found heading content behind the mobile fixed header; compact landscape sizing/centering now has explicit bounds checks.
- Retained PR 10's editorial link placement, services typography/gaps, two-line desktop dot copy, closing alignment and new footer. The old mobile-gap assertion (32px) was superseded by PR 10's requested 28px; the test now checks that requirement while preserving desktop expectations.
- Footer fields support intentional blanks and partial legacy contact objects. Prior default snapshots are recognised without replacing custom content or IDs. Raw draft/published storage is retained under showset-homepage-integration-recovery before compatibility changes; loading does not overwrite draft/published records. Tests use isolated browser fixtures, exported before migration. Existing user browser profiles were not opened or modified by the tests.

## Evidence and review

The foundation baseline was built and tested before layering the homepage. Baseline and combined screenshots and desktop/mobile forward/reverse motion recordings come from the actual locally built Next.js application. Six widths (320/390/768/1024/1440/1920) and 390x320 / 1024x440 landscape heights are covered. Existing source photographs are unchanged.

The integration-specific suite additionally checks reduced-motion keyboard/accessible-tree access, forward/reverse hero controls, matching hero typography and header/viewport bounds, repeated CTA binding, editing during motion, footer blank values/newlines, Save Draft/Publish Preview/reload, and raw-storage recovery/custom-copy preservation.

Run npm ci, npm run check, npm run lint:source, npm run check:seo and npm run build. Serve the actual out directory locally and run the existing qa/concept12 suites (contrast only on its optional review branch), qa/homepage-feedback.cjs and qa/integration-homepage.cjs. Set SHOWSET_PLAYWRIGHT_MODULE and SHOWSET_BASE_URL for the local environment. Final executed results and screenshots are in the local workspace outputs/nextjs/integration folder.

Physical iPhone Safari/Android Chrome sessions are still unavailable. Hosted Actions remains unverified because the documented account billing/spending block prevents runner startup. The new hello@showset.co.za address is retained from PR 10, but inbox existence/delivery is not asserted. Colour approval and owner approval of the actual local preview are still required before any merge.

## Final executed local results

- Foundation baseline: 259 applicable assertions pass before PR 10 is applied.
- Combined integration: 325 assertions pass (259 foundation + 25 homepage + 41 integration-specific), including first-load/no-JS/JS routes, history, full motion and Studio editing/publishing.
- The combined development server also passes all 41 integration-specific checks under React development mode.
- Baseline and combined each have 98 actual-browser screenshots with zero recorded horizontal overflows, broken loaded images or page errors. Forward/reverse desktop and mobile recordings are retained for both versions.
- Optional contrast branch: 55 contrast + eight Studio mask + 25 homepage assertions pass. Its mask defaults/reset/scroll/edit/reduced-motion alignment are tested separately. This does not approve its colours or claim the optional branch completed physical-device QA.
- Clean npm ci reports zero vulnerabilities; TypeScript, source/assets, authored SEO and production build pass.

Local source merge: 06ea46d (parents 451377b and efc11db). Optional review variant: cdcaa36 on integration/concept12-homepage-contrast-review. The current preview branch is integration/concept12-foundations-homepage and contains no contrast layer. The original PR 12 branch remains at 015db05 and main remains at e59130f.

Local review gallery: http://127.0.0.1:3005/integration/index.html. Actual development homepage / Studio: http://127.0.0.1:3001/ and /studio/. Nothing was pushed, merged into main or deployed during this task.
