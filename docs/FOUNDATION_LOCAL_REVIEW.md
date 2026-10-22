# Local foundation review — 22 October 2026

## PR 1 recommendation

Ready for human review after fixing authored metadata being overwritten during hydration. The original animation equations, visual CSS and Studio persistence were unchanged in PR 1. Local dependency installation, TypeScript, source/assets, SEO, production export and browser checks pass. **Do not merge yet on the strength of a green hosted check: none exists.** The latest check on 850a067 reports that the job was not started because recent account payments failed or its spending limit must increase. This is an account restriction, not a failed runner step; the Ubuntu migration notice is informational. Owner merge approval is still required.

## Review stack

1. [PR 1](https://github.com/Axle-Media/showset-website/pull/1): SEO/local quality baseline.
2. [PR 8](https://github.com/Axle-Media/showset-website/pull/8), refs #2: route-specific initial HTML, readable no-JS exports, real links, Next pathname/history integration, queued Back during curtains and heading focus.
3. [PR 9](https://github.com/Axle-Media/showset-website/pull/9), refs #3: in-place Studio content updates, retained scene/focus/scroll state and bounded resource ownership. Contact select reconciliation, field caret and preview feedback are covered by a follow-up regression test.
4. [PR 11](https://github.com/Axle-Media/showset-website/pull/11), refs #4: keyboard disclosures/mobile focus and motion-off reading flow.
5. [Separate contrast proposal](ISSUE_4_CONTRAST_PROPOSAL.md), refs #4: navy ink only inside the original teal circle, brighter footer text. Colour approval is pending before any merge.

Each PR targets its preceding foundation branch. They are drafts for owner review, not independent approvals. Main remains at e59130f88f75df5d4d19714767d9d37828289593. No force-push, merge to main, hosting change, deployment or live WordPress/mail operation was performed.

## Executed local evidence

The actual Next.js static production application was served locally; no simplified fixture substituted for it. The approved original HTML and the approved refinement captures remained the design references. Source/build checks cover 12 pages and 66 sections. The browser suites cover:

| Suite | Passing assertions |
| --- | ---: |
| Direct routes, no-JS/JS, history and navigation | 117 |
| Authored title/description before/after hydration | 24 |
| Original motion/interactions and Studio draft/publish | 50 |
| Studio/scene lifecycle, focus/caret and form state | 16 |
| Approved refinement controls | 22 |
| Global Studio editing | 9 |
| Keyboard, responsive/reduced motion and emulated touch | 21 |
| Contrast and forward/reverse ink/circle alignment | 55 |

The route-first stage captured 348 scene states across six widths with zero recorded horizontal overflow, broken loaded images or runtime errors. Subsequent common static captures matched that stage to rounding-level pixel differences. Desktop/mobile motion recordings were captured from the actual app. Animation frames can differ with carousel/reveal timing; no claim of universal pixel equality is made.

The responsive gate checks all 12 routes at 320, 390, 768, 1024 and 1440 widths, plus short heights. The 720x450 case is a 200% layout-reflow proxy, not native browser zoom. Chrome-generated touch events test service navigation and case swipes. Axe's executed initial-route scans and expanded-dot/footer scans at 390/1440 reported no WCAG A/AA violations. Automated scans are bounded, not certification. A short 121-frame headless scroll sample found no long tasks or broken loaded assets; it is not a real-device benchmark.

Test commands are qa/concept12-{routes,seo,functional,lifecycle,refinements,global-editing,accessibility,contrast}.cjs. Set SHOWSET_PLAYWRIGHT_MODULE to an available Playwright install and SHOWSET_BASE_URL to the actual built app. Evidence JSON and contrast/reduced-motion screenshots are committed under docs/evidence. Larger motion recordings and capture matrices remain in the local workspace outputs/nextjs/foundations folder.

## Remaining acceptance

- Physical iPhone Safari and Android Chrome screenshots, motion, masks and touch testing: unavailable; owner confirmed no device session. Issue 4 is not fully complete.
- Native browser zoom testing remains outstanding; only the reflow proxy was executed.
- Contrast proposal needs visual approval before merging.
- GitHub account billing/spending restriction must be resolved for hosted checks to run. Stacked feature PRs also require owner review and the documented merge order.
- This work does not assert production form delivery or deploy any backend. Existing honest local preview form behaviour and Save Draft/Publish Preview remain covered.
