# Issue 3: stable Concept 12 and Studio lifecycle

Content/global edits now patch the original Concept 12 DOM in place with pinned morphdom 2.7.8. A fresh source-bound target also handles reverting edits to the original defaults. React continues to own only the host; the source animation engine owns its descendants. The engine mounts on route changes and refreshes its options on edits instead of resetting every scene.

Motion classes, live transforms, form values, open accordions and focused nodes are retained. Updated repeaters use delegated service/selection events. Carousel references refresh without accumulating clones; autoplay speed changes replace the single timer. Reveal observers disconnect before replacement and cleanup remains bounded. Default CSS, animation equations, route timings, content schema and storage keys are unchanged.

## Executed checks

- TypeScript, source/assets (12 pages / 66 sections), authored SEO and production static build pass.
- Existing functional suite: 50 assertions pass, including forward/reverse scroll scenes, services, carousel, navigation and Studio draft/publish/reload/shared geometry.
- Global editing suite: nine assertions pass, including typography, CTA height and pattern persistence.
- Route suite: 117 assertions pass.
- New `qa/concept12-lifecycle.cjs`: 13 assertions pass. Actual Studio controls plus its same-origin preview protocol exercise 16 content updates during an active story scene. Node identity, scroll position, active chapter, reveal, carousel position and keyboard focus persist. Timer/observer counts do not grow; clones remain six. OS motion preference changes retain scene identity.
- Actual built Next.js desktop/mobile motion recordings and screenshot comparisons are saved in the local foundation evidence folder. The captured common static frames match issue 2 to rounding-level pixel differences; this is not a claim that arbitrary animation frames are pixel-identical.

Stacked on issue 2 / PR 8. Physical iPhone Safari and Android Chrome checks remain unavailable. Hosted CI remains blocked before runner startup by the GitHub account billing/spending restriction. No merge, hosting or deployment action was performed.
