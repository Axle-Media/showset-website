# Case-study production release audit

## Candidate

The release continues PR #20 from `57bd4af`, including its gallery autoplay refinement. All three case studies now use the same cinematic template and motion runtime:

- `/work/atmosphere-is-everything/`
- `/work/made-to-be-remembered/`
- `/work/behind-every-moment/`

The approved Atmosphere story, its stored arrays, original project sections/modules, IDs and the other nine pages are unchanged. The identity and production records receive additive `caseExperience` configurations with unique concept copy, primary imagery, gallery IDs and clearly fictional partners. [Preservation results](../qa/evidence/case-study-release/content-preservation.json) compare the records against the starting commit.

## Shared architecture and Studio

`lib/concept-12/case-content.ts` supplies one non-destructive read model for server HTML, browser navigation and Studio. Missing story fields derive from that project's own legacy sections/modules. Explicit empty fields and arrays remain authoritative. Published legacy records no longer receive demonstration seed stories over their authored values. No stored media arrays or modules are removed.

Studio's **+ New case study** creates a `/work/` record with the shared model automatically. The renderer, route-key generation and runtime path catalogue support future projects without per-project code. Tests create a new project, edit its opening, three chapters and photographs, add gallery media/partners, save, reload, preview motion and publish locally. Legacy custom copy, sections and module identifiers survive editing and saving. Related cards select the next two other available studies in catalogue order and exclude the current project.

New static URLs and SEO still require exporting content and rebuilding the site. Vercel serves a static read-only frontend, not the retained PHP/MySQL backend. Its Studio screen remains safely unavailable until an authenticated backend is configured. Localhost Studio Draft/Publish Preview continues to work in the browser. `NEXT_PUBLIC_SHOWSET_BACKEND_ENABLED=true` can opt an explicitly configured Vercel backend proxy into the existing API path; no backend or credentials are provisioned by this release.

## Experience and resolved defects

All projects share the full-screen photographic opening, reversible horizontal second scene, one pinned 49/51 three-state story, infinite gallery/lightbox, balanced optional partners, related cards and exact shared homepage CTA. The right image panel is full-height and edge-to-edge. Desktop stays pinned for long descriptions, extending native scroll distance instead of stacking or shrinking text. Mobile/reduced motion retain readable flow. Eyebrows, typography, pattern and spacing inherit the approved system.

The gallery uses the services navy gradient and the existing 24px/s autoplay, Pause/Play control, hover/focus/touch/drag/wheel/lightbox pauses and reduced-motion suppression. A fractional travel accumulator fixes browsers rounding each slow scroll step to zero. Only overflowing multi-photo galleries loop/autoplay; a single image or a fully visible small set remains still. Clones are presentation-only. No arrows overlay individual photographs.

Full-page axe scans reproduced the old footer copyright/year contrast failure. Raising only its text opacity from .45 to .46 removes that violation; this is not the separately proposed broad contrast treatment. The existing live Vercel homepage also probed an unavailable PHP endpoint (403). Static Vercel deployments now skip that probe and remain explicitly read-only, while localhost previews and configured hosting retain their existing behaviour.

Six new AI-generated concept photographs are self-hosted as WebP under `public/media/cases/` (about 1.3 MB total). They are distinct between projects and explicitly credited as synthetic concept imagery, not photographs of completed client work. Original media remain intact. [Imagery review sheet](../qa/evidence/case-study-release/generated-concept-imagery.jpg).

## Validation

- `npm run check`: pass.
- `npm run lint:source`: pass, including 12 pages / 66 sections and validation of all three complete stories and their local assets.
- `npm run check:seo`: pass for all 12 pages.
- `npm run build`: pass, 16 generated routes. The build emits a public `release.json` containing only the source commit SHA for deployment verification.
- **978 assertions pass across 16 browser suites.** [Final candidate results](../qa/evidence/case-study-release/candidate-results.json).
- **Six full-page WCAG 2/2.1 A/AA scans, zero violations:** three studies at 1440 and 390. [Axe results](../qa/evidence/case-study-release/axe.json).
- Five-width matrix for every project: 1440/1024/768/390/320. Forward/reverse story, photo synchronization, full-height frame geometry, autoplay/Pause/Play/hover, lightbox wrapping/Escape, related links, reduced motion, loaded media and overflow.
- Content-fit fixtures include 50/100/150/250/500 words. Existing acceptance covers galleries of 0/1/2/3/6/9 images and company counts 0–12, including balanced incomplete rows.
- Studio editing, legacy preservation, new-case creation and local publishing pass. A virtual Vercel origin runs the real export to verify static public routes, the unavailable Studio state, no PHP probes and no console/runtime errors.
- Existing lifecycle, accessibility, navigation, routes and photographic swipe/glyph-paint regressions pass. Two initial readiness timeouts in the local test environment are retained in the initial-result records; the unchanged suites pass on rerun. An inactive-chapter test and an unavailable-screen selector were corrected to inspect the actual active UI. Genuine checks were retained.

The export was checked for PHP, SQL, ZIP, environment and key files: none are included. No user browser storage, local ZIP, stash or hosting credentials were modified. Physical iPhone Safari/Android Chrome remain unavailable; touch coverage is browser emulation, not a physical-device claim.

## Visual evidence

Each sheet shows opening, second scene, Brief, Intention, Approach, gallery, companies, related projects and closing CTA in that order.

| Project | Desktop | Small desktop | Tablet | Mobile | Narrow mobile |
|---|---|---|---|---|---|
| Atmosphere | [1440](../qa/evidence/case-study-release/atmosphere-is-everything-1440.jpg) | [1024](../qa/evidence/case-study-release/atmosphere-is-everything-1024.jpg) | [768](../qa/evidence/case-study-release/atmosphere-is-everything-768.jpg) | [390](../qa/evidence/case-study-release/atmosphere-is-everything-390.jpg) | [320](../qa/evidence/case-study-release/atmosphere-is-everything-320.jpg) |
| Identity | [1440](../qa/evidence/case-study-release/made-to-be-remembered-1440.jpg) | [1024](../qa/evidence/case-study-release/made-to-be-remembered-1024.jpg) | [768](../qa/evidence/case-study-release/made-to-be-remembered-768.jpg) | [390](../qa/evidence/case-study-release/made-to-be-remembered-390.jpg) | [320](../qa/evidence/case-study-release/made-to-be-remembered-320.jpg) |
| Production | [1440](../qa/evidence/case-study-release/behind-every-moment-1440.jpg) | [1024](../qa/evidence/case-study-release/behind-every-moment-1024.jpg) | [768](../qa/evidence/case-study-release/behind-every-moment-768.jpg) | [390](../qa/evidence/case-study-release/behind-every-moment-390.jpg) | [320](../qa/evidence/case-study-release/behind-every-moment-320.jpg) |

The previous [pinned split comparison](case-study-pinned-split.md) records the exact homepage-services geometry and long-copy screenshots. Current project-specific sheets have also been inspected for consistency.

## Merge and production verification

The user's finalisation brief explicitly authorises merging PR #20 after validation, and production deployment only to https://showset-website.vercel.app/. The merge must use the verified head SHA and normal repository checks. The Vercel production Ready status, merged SHA, `/release.json` match and read-only browser results are recorded in the final PR delivery update after deployment, rather than asserted in advance here.

`qa/production-smoke.cjs` verifies the commit marker, all three production routes and refreshes, forward/reverse stories, autoplay and Pause, native touch, lightbox, related cards, shared CTA, homepage, static Studio state and console/runtime errors. It writes no forms, published data or user storage. No deployment to showset.co.za, xneelo or WordPress is authorised or performed.

## Production marker adapter correction

PR #20 merged as `979dbc0f6602a7f028d5677100047026dd801ae4`, and Vercel reported the deployment successful. Live HTML and the new project assets were confirmed. The post-build `out/release.json` file was omitted by Vercel's framework adapter, so it is replaced by a force-static App Router GET route. This preserves the read-only payload and makes the marker part of Next.js's own output manifest. The follow-up changes no page content, design, media, Studio or motion. Final live verification is recorded in the PR delivery update.
