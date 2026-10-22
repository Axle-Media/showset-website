# Concept 12 exact restoration

The definitive frontend source is `reference/CONCEPT_12_APPROVED.html`, identical to the supplied `SHOWSET_Motion_Concept_12.html`. SHOWSET 2.0, 3.0 and the cancelled motion prototype are not design authorities.

## Recovery and scope

- Cancelled work is recoverable at `e621bc6`, branch `archive/cancelled-motion-prototype`.
- SHOWSET 3.0 remains at `1a59de3`, branch `experience/showset-3`.
- Restoration branch: `restore/concept-12-exact`.
- No reset/clean, push, deployment, live WordPress changes, backend changes or hosting configuration changes were used.

## Source-based implementation

`app/concept-12.css`, `lib/concept-12/markup.json` and `lib/concept-12/source-runtime.js` are extracted from the original. Eight embedded image/SVG assets are externalized without changing their bytes; hashes and source SHA-256 are recorded in `lib/concept-12/assets.json`. The six existing WebP photographs are byte-identical to the original embedded photographs.

`components/ConceptSite.tsx` is the shared public/Studio host. `lib/concept-12/runtime.js` retains the original animation equations, masks, CSS timings, breakpoints, DOM structure, section order and carousel. Its integration adapter owns listeners, observers, animation frames, timeouts and intervals and disposes them before a React data remount. Known hash routes become existing Next.js paths, using the original curtain and route state machine. The enhanced project selector hides its native fallback from assistive technology and schedules keyboard focus after its original popover becomes visible.

The original Poppins and Manrope families/weights are delivered from the existing local font files. The original viewport-fit setting is restored. Default output receives no editor design overrides.

Extraction can be reproduced with `python scripts/extract-concept-12.py`, followed by `python scripts/port-concept-12.py`. Python is not needed to run or build the application. Generated source is committed.

## Studio and saved data

All four existing draft/published-preview storage keys are retained. The original components receive text, image, repeater, link, typography, spacing, crop and motion edits through `lib/concept-12/bridge.ts`. Save Draft, Publish Preview, responsive iframes, API contracts, media upload integration and page metadata controls remain in place. Existing optional project module data remains supported without adding any modules to the default design.

Earlier structured defaults are archived in `lib/concept-12/legacy/`. Only values demonstrably equal to known historical defaults reconcile to the approved source. Custom values, added fields, IDs and modules are preserved. Before reconciliation, all four raw browser records are saved once under `showset-concept12-recovery`. Loading does not overwrite those four original keys. Explicit Save Draft/Publish Preview retain the existing `showset-studio-recovery` snapshots too. The local backup utility exports the restoration snapshot as well.

Default image fields were aligned to the original banner/work images, and the digital service retains its original native digital composition. The cancelled layout-variation controls were removed; their saved data is retained for recovery. The former `/services/` index data remains preserved as a compatibility entry that renders the original homepage composition, rather than the cancelled index design. The eleven original page designs are the parity acceptance set.

## Local verification

TypeScript, configured source lint and the production static build pass. Browser evidence is in the task's `outputs/nextjs/concept-12-exact/` directory, with a review player, paired PNGs, recordings and machine-readable results. This is the actual compiled Next.js application, not a standalone HTML approximation.

The evidence records six widths (320, 390, 768, 1024, 1440, 1920), all eleven original page states, scroll phases/reverse states, native touch input, form controls, route transitions and isolated-browser Studio persistence tests. Static comparisons use matching loaded font files, foreground pages and completed CSS animation states. Unmodified animation timing is shown separately in the recordings. No tests write into the user's normal browser profile.

Review the evidence report for measured differences and limitations. Automated checks do not constitute the user's visual approval. Stop at the restoration approval checkpoint; do not begin enhancements or further creative work.
