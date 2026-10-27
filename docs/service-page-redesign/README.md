# SHOWSET service pages: design and verification

Branch: `feat/cinematic-service-pages`, based on main `8989ea1d3acd51413b60a98f30c7be65beb6556f`.

## Four connected, distinct experiences

| Page | Opening and signature interaction | Desktop | Mobile | Signature |
|---|---|---|---|---|
| Events & Experiences | A photographic stage opening; native scroll progresses through concept, environment and atmosphere with synchronised copy and a drawn planning diagram. Reverse scroll restores the preceding scene. | [Opening](screenshots/events-experiences-1440-hero.png) | [Opening](screenshots/events-experiences-390-hero.png) | [Scene](screenshots/events-experiences-1440-story-0.5.png) |
| Creative & Design | A tilted identity proof beside expressive type; three photographic applications unfold from a layered composition into a spread. Supporting copy stays stationary. | [Opening](screenshots/creative-design-1440-hero.png) | [Opening](screenshots/creative-design-390-hero.png) | [Proofs](screenshots/creative-design-1440-story-0.5.png) |
| Digital & Marketing | A brand arrow and editorial channel labels; a connected composition follows website, campaign and content. Native buttons allow deliberate keyboard/touch selection. No invented devices or performance dashboards. | [Opening](screenshots/digital-marketing-1440-hero.png) | [Opening](screenshots/digital-marketing-390-hero.png) | [Channels](screenshots/digital-marketing-1440-story-0.5.png) |
| Content & Production | A tightly cropped photographic opening; a contact sequence moves between planning, production and the final frame, with a restrained progress line. No unavailable video placeholders. | [Opening](screenshots/content-production-1440-hero.png) | [Opening](screenshots/content-production-390-hero.png) | [Sequence](screenshots/content-production-1440-story-0.5.png) |

Each page includes its own process treatment, a searchable expertise index, related concept study, cross-service links and photographic contact invitation. All 31 original expertise entries remain, including their IDs and wording. Existing group/process items are also retained. Related work is explicitly labelled as a creative concept study.

Mobile has individual opening compositions and inline story content. Pinning is disabled at 800px and below, on short landscape screens, for long edited copy, with reduced motion, or with the Studio still preset. Essential content is also present in static HTML without JavaScript. There is no wheel interception or automatically moving service carousel.

## Architecture and Studio

`service-content.ts` provides route metadata and an additive read model for older drafts. Existing authored fields are retained; missing story/work sections are derived without writing storage. The first edit materialises the additive blocks in that page's draft.

`service-experience.ts` renders the same escaped HTML for Next.js SSR/static export, client route transitions and Studio. Stable section IDs replace positional legacy category bindings. Four compositions share content primitives rather than four duplicated applications. New sections use the existing Block/BlockItem data model and standard Studio controls.

`service-motion.js` owns its scroll/resize listeners, one coalesced update frame, expertise filtering and channel selection. Route changes, Studio refreshes and disposal release the previous instance. Content-fit checks fall back to normal flow when edited copy cannot safely fit a pinned viewport. No dependencies or external assets were added.

Studio tests cover editing story headings, descriptions, categories, images, typography, spacing and still motion, Save Draft, reload and Publish Preview on all four routes. Legacy drafts retain their own headings and capability IDs. Repeated edits preserve DOM identity, search value, focus and scroll offset; listener/observer counts remain bounded. Tests use isolated browser contexts and do not alter the user's Chrome storage.

## Validation

- TypeScript, source/content, SEO and optimised Next.js static build pass. Twelve authored routes and 74 sections validate.
- `qa/service-experience.cjs`: 415 assertions pass across 1920, 1440, 1024, 768, 390 and 320px. Includes actual rendered screenshots, forward/reverse progress, scene/channel interactions, keyboard expertise controls, link destinations, overflow, image loading, reduced motion, no-JS output and 250-word edited stories.
- `qa/service-studio.cjs`: 33 assertions pass for all four editors and legacy draft compatibility.
- `qa/service-lifecycle.cjs`: repeated editing, resource cleanup, live OS motion preference changes and short landscape checks pass.
- Existing regression suites pass: header navigation alignment (76), typography (86), editorial columns (262), instant route top/back/forward (61), homepage/Our Work carousel (35), carousel playback (32), case descriptions (196), route-first HTML/navigation (117), global editing (9), photo heading swipe (24), case storytelling (147), case infinite-gallery mouse/wheel/touch checks and case Studio (13).
- Axe WCAG A/AA checks report zero violations on all four services at 1440/390. The audit led to stronger Creative process-number contrast. Native Chromium touch swipes scroll each mobile page without pinning or overflow.
- Browser and JSON evidence is included in [evidence](evidence/). CI now runs the three new service suites and archives their output/screenshots alongside existing acceptance checks.

The initial concurrent regression run hit browser timeouts; the affected suites were rerun independently and passed. Old assertions for the replaced category hero were moved to retained case photo headings; route navigation tests now use an explicit desktop viewport matching the approved navigation breakpoint. No application behaviour was weakened to satisfy old tests.

## Preservation and review limits

Non-service page data, homepage/case markup and their styles are unchanged. Actual homepage and case openings were compared with the live baseline, and their animation, carousel, route and editing suites passed. Global header/footer, navigation spacing, 14px controls, 17px body, instant route top and SVG curtain remain intact.

All photographs were already approved local assets. No fake client results, testimonials, video media or new capabilities were added. No production merge, hosting change or intentional production deployment was performed. The pre-existing untracked `showset-preview.zip` and prior Git stash remain untouched.

Physical iOS Safari/Android Chrome and visual approval remain outstanding because no device session is available. Chromium touch emulation is recorded separately from physical-device testing. These four new art directions are proposed for review in this PR; they have not been represented as visually approved.

## Local review

Use the running development server at `http://localhost:3001/` and append `events-experiences/`, `creative-design/`, `digital-marketing/` or `content-production/`. Studio is `http://localhost:3001/studio/`. If the browser has an older published preview, the browser intentionally continues to show that authored data; use an incognito window to see repository defaults without erasing drafts.
