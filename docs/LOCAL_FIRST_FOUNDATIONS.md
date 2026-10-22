# SHOWSET local-first engineering plan

Status: the restored Concept 12 plus approved refinements on `main` is the visual baseline. There is **no staging deployment milestone**: development, QA and creative approval remain local until the owner authorises a production cutover to `showset.co.za`.

## Non-negotiable rules

- Original `reference/CONCEPT_12_APPROVED.html` and the current approved brand assets anchor visual decisions. No redesign, section reorder or motion removal without explicit approval.
- Work on one feature branch per issue; review via GitHub PR. Never force-push or write directly to `main`.
- Codex performs real local-browser and physical-device checks. GitHub CI provides automated type, content, and build checks. Neither replaces creative review.
- Save and export current browser-local Studio data before migrating schemas, ports, or localhost origins. A Git commit **cannot back up browser localStorage**.
- Do not deploy or change xneelo/WordPress/Google Workspace while local development continues.

## Foundation work, in order

### F0 — Protect baseline and get predictable automated checks
- Complete: main contains the restored Concept 12 and approved refinements.
- Proposed in this PR: CI checks TypeScript, existing source/asset validation, SEO content metadata and a production static export. CI has **no deployment steps**.
- Next: run the existing actual-browser Playwright regressions on each affected branch, capture comparison screenshots and review motion progress in both directions. Integrate Playwright into CI only after pinning a reproducible dependency and browser image.

### F1 — Correct route-first document output
- Every page must present the correct, indexable title, description, primary heading, and body content in the initial exported HTML, not only after client-side DOM mutation.
- Current shared 11-view HTML shell preserves Concept 12 transitions but places homepage-first markup in initial HTML. Correct route-first output while preserving the page curtain, browser back/forward, animations and Studio's shared renderer.
- Gate: inspect generated `out/<route>/index.html`, then test direct reload, internal navigation, accessibility tree and search-preview metadata for every page.

### F2 — Make React and motion lifecycle deterministic
- Audit `ConceptSite.tsx` DOM replacement, client effects, saved global edits and current route transitions.
- Avoid unnecessary full DOM remounts; preserve current scroll position, carousel focus, selected service and reveal completion as appropriate.
- Gate: hero, film, service, dot and carousel sequences remain pixel-close to approved Concept 12, including reverse scroll, route changes, resize and reduced motion. No hidden headings.

### F3 — Make Studio editing lossless
- Preserve Save Draft, Publish Preview, all existing localStorage keys, historic compatibility backups and existing content.
- Verify add/delete/reorder sections, preview motion, image/crop controls, responsive typography, undo, page metadata and reload for every supported page.
- Publish Preview is **browser-local** until authenticated hosting is configured. New routes cannot become publicly deployed without another static build.
- Gate: automated edit-save-reload-publish and manual editor parity review; downloadable backup/restore tested.

### F4 — Fix accessibility and responsive edge cases
- Address the already-documented contrast weaknesses in the teal-dot scene and small footer type, using an approved on-brand variant.
- Verify focus visibility and focus return in navigation/popovers, touch carousel, real device/browser behaviour and text at 200% zoom.
- Gate: actual iPhone Safari and Android Chrome review, keyboard and screen reader checks; no blocked tasks from animations.

### F5 — Prepare production capabilities, *without deploying*
- Finish content governance and media optimisation, HTML/metadata/OG/canonical policy, 404, sitemap and forms.
- Contact form currently **does not deliver mail**. Connect and test delivery at launch preparation, not by pretending preview submissions are sent.
- Backend/PHP/MySQL security and authenticated publish flow require a separate reviewed integration and real hosting tests before launch. Keep editor and administration routes private in production.
- Gate: security review, contact delivery, backup/restore, performance budget and a production-only deploy/rollback plan approved by the owner.

## Controlled creative upgrade after F0–F4

Concept 12.1 should extend the experience **without redesigning the approved homepage**. First candidate: a seamless existing case-study carousel → project detail transition, developed as one isolated interactive prototype on a feature branch. The owner must approve a real local browser recording and mobile experience before it is integrated. No separate parallel website projects.

## Repository commands

```sh
npm ci
npm run check
npm run lint:source
npm run check:seo
npm run build
```

The `qa/*.cjs` real-browser checks require Playwright and a running local application as described in `CONCEPT12_REFINEMENTS.md`. Only claimed as passed when executed and recorded in that environment.
