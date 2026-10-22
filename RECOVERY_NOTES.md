> Historical verification/implementation notes. Superseded by CONCEPT12_RESTORATION.md and the current browser evidence.

# SHOWSET Recovery v0.2 (targeted corrections)

## What is fixed
- Studio **Publish preview** now saves a local-browser published snapshot, separate from draft state. The public localhost site reads this after refresh. Changes are never sent to live hosting.
- Source-only title markup is cleaned in the Studio layer list.
- Explicit white headline colour and teal accent; circle-clip reveals replace leftover dark/rectangular appearance where the new React components use them.
- Shared editorial tracking and paragraph line-height rules retained.

## Still to port from Concept 12 before claiming parity
- Exact cinematic hero scroll timeline and pinned composition.
- Original three-act transitions, timing, and visual layers.
- Full circular wipe choreography in every applicable section.
- Exact case-study carousel motion, playback and pointer interactions.
- Dot expansion timing/masking and section handoff.
- Per-page animations and carefully tuned mobile variants.

This patch is **not** a faithful Concept 12 restoration. Use `SHOWSET_Motion_Concept_12.html` as the visual/interaction acceptance reference. Compare recorded 1440px and 390px screenshots/video at equivalent scroll positions before launch.

## Why local publish differs from production
- No PHP/MySQL backend is running on localhost by default. Publish preview stays in the browser localStorage.
- Cross-device and public publishing require running and testing the PHP API with database credentials.
- For a static site, new routes and SEO changes require rebuilding the exported HTML.


## v0.3 fix for missing hero headline (21 October 2026)
The screenshot showed the hero paragraph and buttons but no heading. Root cause found in the source: a circular reveal clips every heading to zero while waiting for an IntersectionObserver. A `Wrap` function was created afresh inside each PageSections render, remounting the heading and discarding the observer-applied `is-visible` class after state hydration.

Corrections:
- The hero H1 is never clipped and uses a subtle non-hiding entrance.
- SectionWrap has stable React identity, preventing unnecessary remounts.
- The reveal observer reinitialises when the active page or editor mode changes.
- Circular reveals default to visible; only observed off-screen headings are temporarily clipped.

This is a targeted rendering fix. It does not claim to restore missing Concept 12 motion.
