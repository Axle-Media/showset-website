# SHOWSET Studio 2.0 development handover

Date: 29 October 2026. Repository: https://github.com/Axle-Media/showset-website. Draft PR: https://github.com/Axle-Media/showset-website/pull/77. Issue #57 remains open.

**This is a stable local development milestone, not a complete or production-ready online editor.** No merge, deployment, rebase or force-push was performed. Continue on feature branches with reviewed PRs. Do not enable remote Studio by simply removing its development gate.

## A. Architecture and source map

Studio 2.0 is opt-in at `/studio/next/`; the classic `/studio/` remains the fallback. Its canvas iframe uses `/studio/next/preview/`. Production exports deliberately render both new routes unavailable with noindex, including on localhost. Runtime access also requires loopback. Neither check implements authentication.

Canonical `PageData`/`Globals` content remains intact. Optional versioned `PageData.builder` metadata adds either template target overrides or a nested custom tree. Existing cinematic pages use the actual `SiteLayout`/ConceptSite and existing Concept 12 bridge/runtime, not a recreated design. New custom pages use the same `CustomSite`/`composeCustom`/`renderNodes` path for editing and saved preview, with approved header/footer chrome. Browser edits do not modify source JSON or deployed HTML.

| Source | Responsibility |
|---|---|
| `app/studio/next/{page.tsx,preview/page.tsx}` | Production exclusion, route metadata, editor entry points |
| `components/studio2/Studio2.tsx` | Workspace orchestration, viewport/panels, selection, globals, media integration |
| `components/studio2/useWorkspace.ts` | Onboarding, autosave, revision expectations, history, undo/redo, conflicts |
| `components/studio2/Navigator.tsx` | Pages, Layers, Images, Add, Media, History and Site navigation |
| `components/studio2/{Inspector,ContextInspector}.tsx` | Node/template controls and shared/header/footer/section content |
| `components/studio2/{Canvas,Preview}.tsx` | Same-origin iframe protocol, safe selection, inline editing, interaction mode, annotations/metrics |
| `components/studio2/CustomSite.tsx` | Shared custom tree mount, styles and disposable generic motion |
| `lib/studio2/model.ts` | Schema, pure commands, adoption/validation, stable IDs and guards |
| `lib/studio2/registry.ts` | Eleven node kinds, supported controls and validated responsive CSS |
| `lib/studio2/bindings.ts` | Canonical template content paths, target selectors and overrides |
| `lib/studio2/{render,compose,motion}.ts` | Escaped semantic custom output, approved shell, scoped reversible motion |
| `lib/studio2/{storage,image-validation,selection}.ts` | IndexedDB/backup/media, image header limits, contextual selection type |
| `lib/concept-12/{bridge.ts,document.ts,runtime.js}` | Approved content binding, scoped document lifecycle and cinematic behaviour |
| `components/ConceptSite.tsx`, `app/studio-authored-overrides.css` | Existing renderer, preview transport suppression, explicit classic authored style fixes |
| `app/builder-components.css`, `components/studio2/studio2.css` | Custom output shared styling and editor-only UI |
| `content/`, `public/` | Existing seed content/assets; unchanged by this feature relative to base |

Uses the existing locked Next.js/React/TypeScript stack (tested installed Next.js 16.4.2), native IndexedDB, BroadcastChannel, Web Crypto, browser image decoding, and existing morphdom/linkedom renderer dependencies. No new database service or animation framework. Read `AGENTS.md` and installed Next docs before code/API changes. The custom motion utility has scoped cleanup, coalesced frame updates and live reduced-motion handling. Existing template motion stays owned by the approved runtime.

## B. Working functionality and coverage

- Responsive visual workbench: 320/390/768/1024/1440/1920 captures, desktop/tablet/mobile overrides, inherited/reset values, fit canvas and small-screen panels.
- Homepage opening bindings: section, headline/accent, paragraph, hero photograph and two CTAs. Plain-text inline editing, validated typography/spacing/colour and responsive overrides are supported on registered targets.
- Additional homepage story/service photograph bindings follow canonical item.image fields. Images sidebar/shortcut, canvas Edit image handles and background-photo hit testing expose upload/library controls. Filenames and thumbnails replace opaque asset IDs. Hero and scene replacement/save/reload have actual regression coverage.
- Shared logo replacement, header menu/CTA content, footer contact/social content and supported section content via ContextInspector. Unknown fields survive object updates. These contextual forms are not universal fine-grained template bindings.
- Editing intercepts clicks, auxiliary clicks, native activation, keyboard activation and submissions rather than navigating. Registered elements open their inspector; other surfaces open contextual/unsupported guidance. Interactive preview explicitly restores website navigation and menus. Forms remain transport-suppressed in previews.
- Eleven custom node kinds: section, container, heading/accent, text, image, link button, divider, spacer, native accordion, gallery and video. New local pages/routes; nested tree creation, drag/drop, keyboard reorder, duplicate/copy/paste, lock/hide/delete. Structural operations primarily apply to the custom tree, not arbitrary approved cinematic sections.
- Image uploads/library, alt text, fit/object position and independent breakpoint crop on supported image nodes/targets. PNG/JPEG/WebP only: under 8MB, maximum 24MP, maximum dimension 8192. Executable SVG/HTML rejected; immutable original bytes retained.
- Layout, typography, background/pattern and responsive controls, including the exact approved closing CTA pattern preset. Six generic motion choices including None; reversible scroll and live reduced-motion fallback. Template cinematic timing is not a generic motion timeline editor.
- Autosave/manual Save draft, separate saved local preview, reload, 50-step undo/redo, immutable saved history, verified snapshot import/export, stale-tab conflict detection and backup-before-recovery.

See [operator guide](studio-builder-operator.md), [ADR](studio-builder-architecture.md), [audit](studio-builder-audit.md), [phase evidence](studio-builder-phase1.md), and `docs/studio-builder/{coverage,rendered-surfaces,assets}.json`. The original inventory has 12 routes, 52 sections and 693 rendered surface instances. Its original seven-target count predates the image/context follow-up; it is an audit snapshot, not a current 100% coverage claim.

## C. Outstanding work and priorities

Phase 2 priorities:
1. Expand explicit canonical bindings across all existing routes. Existing case-study images/galleries, service/inner-page imagery, related cards and linked collections do not yet have complete new-editor image coverage. Keep source ownership clear: linked-case thumbnails must edit case data, not invent disconnected overrides.
2. Complete field/section/form/menu/repeater/global coverage with real persistence/render tests. Unsupported surfaces currently show guidance/classic fallback. Do not expose a control that the renderer ignores. Re-audit coverage after each batch.
3. Full existing-template structural editing, reusable synced templates, structured rich text marks/links, expanded media metadata/optimisation and gallery/video authoring UX. Current custom types do not imply mature controls for every nested gallery item or every public cinematic scene.
4. Canvas resize/snapping/context menus and advanced cinematic timeline authoring remain missing. Do not replace approved animation markup to simplify editing.
5. Resolve public expectation/token discrepancies with visual approval; integrate current main's mobile work separately. Physical Safari iPhone/Android, broader browser/assistive-technology certification and comprehensive performance/security review remain unperformed.

Phase 3: authenticated shared persistence, server permissions, protected previews, review/approval, real build-backed publish and rollback. No online owner roles, release backend or shared media exists today. Phase 1 saves a browser snapshot only. No remaining in-progress source patch is intentionally left behind.

Technical debt: selector-based template bindings must track approved DOM changes; the iframe's mutation annotation pass must remain scoped/disposable and avoid self-triggered loops. Imported snapshots omit the full revision log. Orphan immutable media can remain after a later draft-save failure. No pruning/migration should destroy originals. There is no browser-eviction-proof durability; private off-device backups are essential.

## D. Data preservation and recovery

IndexedDB database `showset-studio2`, version 1:
- `documents`: `draft` working workspace and `preview` separately saved snapshot.
- `revisions`: saved workspace history, committed with draft atomically.
- `media`: content-addressed immutable original blobs/metadata; workspace references use `asset:` IDs, blob URLs are temporary presentation values.
- `backups`: verified retained recovery snapshots.

On first use, legacy `showset-demo-pages` / `showset-demo-globals` are adopted additively; authored values, empty arrays and unknown extensions survive. Exact raw `showset-*` localStorage strings are captured before conversion; Studio 2 never overwrites those classic keys. Initial editing requires verified backup/download. SHA-256 checksums/schema/image validation guard import/export. A snapshot contains current workspace, original media bytes and raw legacy recovery records, **not the entire v2 revision log**.

Use the same browser profile and origin (`http://localhost:3001`); changing port or localhost to 127.0.0.1 yields separate storage. Never clear localStorage/IndexedDB or seed over an existing workspace. Keep downloads private and outside Git. Do not attempt to synchronize classic and v2 drafts by overwriting either store.

Recovery: Site -> Download verified backup; retain privately off-device. Import validates fully, backs up current workspace and adds originals before saving a new draft revision. History restores as a new revision. Conflicts compare expected revision atomically: download unsaved work or Back up and load latest; never bypass the revision check. Malformed historical data offers original recovery export instead of default reset. Before any future schema migration, retain verified raw/versioned backups, test round trips and upgrade additively; preserve IDs, raw originals and unknown fields. Back up the browser profile if complete revision-log retention is needed; no full-log portable exporter is implemented.

All browser QA used isolated contexts. Owner drafts/media/backups were never cleared or overwritten. The unrelated untracked `showset-preview.zip` is preserved locally and deliberately excluded from Git.

## E. Run and verify locally

Existing project: `C:\Users\james\showset-website`. Do not create another replacement project. Use lockfile dependencies (`npm ci` only when needed); scripts require no Studio credentials or service environment variables.

```powershell
npm run dev -- -p 3001
# http://localhost:3001/studio/next/  -- editor
# http://localhost:3001/studio/next/preview/ -- saved local preview
# http://localhost:3001/studio/ -- classic fallback
npm run check
npm run lint:source
npm run check:seo
npm run build
```

Install Playwright as isolated tooling or resolve an existing installation. Browser scripts accept `SHOWSET_PLAYWRIGHT_MODULE`, `SHOWSET_PLAYWRIGHT_CHANNEL` (chrome locally; chromium CI), `SHOWSET_BASE_URL` and `SHOWSET_QA_OUTPUT`. These are test paths/URLs, not secrets. Set a common output directory for the entire sequence: recovery and motion consume the builder's portable backup fixture. Never commit that raw backup. Do not run tests against the owner's persistent browser profile.

```powershell
$env:SHOWSET_BASE_URL='http://localhost:3001'
$env:SHOWSET_QA_OUTPUT='<private evidence directory outside Git>'
$env:SHOWSET_PLAYWRIGHT_CHANNEL='chrome'
node qa/studio2-model.cjs
node qa/studio2-builder.cjs
node qa/studio2-selection.cjs
node qa/studio2-recovery.cjs
node qa/studio2-motion.cjs
node qa/studio2-touch.cjs
node qa/concept12-lifecycle.cjs
node qa/service-lifecycle.cjs
# Serve built out/ on loopback :3004 with a static directory server:
$env:SHOWSET_PRODUCTION_URL='http://127.0.0.1:3004'
node qa/studio2-production.cjs
```

Final milestone rerun: TypeScript, source/case assets (12 pages/52 sections), SEO, production export (19 generated entries), all six Studio suites, Concept12 lifecycle and static production test passed. Studio browser tests cover backup, responsive typography/crop, nested creation/drag, image replacement/save/reload, media import, two-tab conflicts, undo/redo, lock, reduced motion, forward/reverse motion and touch interactions. Production test verifies 12 direct public routes with SEO/H1 and no JavaScript, plus unavailable/noindex new Studio. The final service lifecycle suite also passed: repeated edits retain nodes/focus/scroll, resource counts stay bounded, reduced-motion releases pins, and short landscape uses readable flow. Test invocations initially aimed at an unused default port/fixture directory were rerun against the configured server/common fixture directory; these were environment setup errors, not weakened assertions.

Committed evidence: `docs/studio-builder/evidence/phase1/` (screenshots/videos/DOM comparison) and `image-selection/` (image picker/replacement/inert navigation). Final local evidence is outside Git at `Documents/Codex/2026-10-21/codex-review-handoff-showset-studio-wordpress/work/studio2-handover-qa`. Earlier public comparison sampled 90 states on each baseline/feature; timed motion frames differ (peak approximately 1.08% pixels above threshold), and one 320px classic before-frame caught loading. Do not claim exact frame identity or physical-device testing. Final content/public asset diff against feature base is empty.

## F. Secure online development and eventual deployment

Future Vercel staging requires a new explicitly approved architecture, not this static local editor with gates removed. Vercel cannot run existing PHP adapters. Use server-validated sessions, explicit owner/admin permissions on every read/write/release endpoint, Origin/CSRF protection, request limits, audit trails and private draft/media access. Credentials belong in server secrets only. Local browser flags are never authorization. Isolate staging from production and enforce noindex plus access protection.

Implement a hosting-independent versioned API with transactional shared documents/revisions, expected-revision CAS, immutable original media in persistent object storage, validation, migrations and recoverable backups. Browser IndexedDB can remain a cache/offline workspace, not the authoritative multi-owner database. Test two real owners, role changes, expired sessions, conflicts and recovery before sharing.

Draft -> protected preview -> submit/review/approve -> immutable release snapshot (content/media hashes plus source SHA) -> checked static Next build -> validated artifact -> atomic promotion. A publish must generate real routes/metadata; browser storage saves do not publish. Keep prior releases and support audited artifact rollback. Deployment credentials and execution remain server-side. Existing classic publishing/preview paths need explicit compatibility tests before any backend transition.

For xneelo, preserve the static export contract/trailing-slash routes and provide an approved authenticated API/backend (hardened PHP/MySQL or another supported service). Use portable schema/media manifests and release artifacts independent of Vercel, verified target directories, least-privilege deploy credentials, staging verification and rollback. No hosting, DNS, credential or production changes are authorized by this handover.

## G. GitHub and integration status

Branch: `feat/studio-2-foundation`; PR #77 is **OPEN / DRAFT**. Implementation tip: `cd38092b8aa20826f77f7e3cd30b1aae4e2bb0d8`. The final documentation commit is the branch tip containing this handover; obtain its exact SHA with `git rev-parse HEAD` or PR headRefOid (a commit cannot contain its own hash). The final report and PR body pin that exact documentation-inclusive SHA.

Relevant commits:
- `bcbc1a4`: audit, inventory and foundation architecture.
- `2f4bf5b`: first complete local editing slice.
- `c2f76aa`: recovery/motion hardening, classic authored-style compatibility and evidence.
- `233acab`: wait for actual iframe resize/render in tests, without weakening assertions.
- `cd38092`: image discoverability/canonical photo bindings and editing-mode selection.

Use `git diff --name-status 3ea5f7d..HEAD` for the complete changed-file inventory; the architecture table maps principal source changes. Tests/config/docs/evidence are included. No required source changes remain uncommitted; unrelated local ZIP remains untouched.

Explicitly fetched main at handover: `70b61c2e6ecf57151146871669ffa5ff1de145bf`; common base `3ea5f7d895b40bebb874a45842cb30b779b9fd4e`. Before documentation, branch was 5 unique commits ahead / main 31 unique commits ahead. Main-only changes touch `app/responsive-mobile-tablet.css`, `lib/concept-12/runtime.js`, `qa/mobile-tablet-audit.cjs`, including mobile hero/contact, service accent and timeline refinements (PRs #76/#78/#79/#80). Runtime is an overlapping path: preserve this branch's suppressSubmissions/cleanup/Studio editing work and main's latest mobile motion changes. No actual merge was attempted, so conflict resolution is **not verified**. Do not mistake the older source baseline for latest-main visual parity.

CI on implementation `cd38092`: dedicated Studio job SUCCESS; broader quality job FAILURE in run https://github.com/Axle-Media/showset-website/actions/runs/40876604422 . Inspect its merge-ref/checkout SHA before attribution: PR CI may test main integration while local tests here cover the feature tip. New mobile timeline assertions fail despite logs showing none/centred states; investigate test geometry/computed-style assumptions on the merged ref rather than deleting checks. Earlier documented public discrepancies also remain: site-typography inactive/small copy, editorial-columns 17px expectation versus approved 15px, related-card 14px versus approved 17px, service-experience hero tiers/heights, service-motion-design 1.49 versus approved 1.65 leading. These are not presented as green or automatically dismissed as harmless. Full prior production sweep: 17/23 pass, then the genuine classic style regression was fixed and service-Studio passed; five documented expectation groups remained. Final handover does not rerun or claim all broad public suites pass.

Next developer should first review this branch and recordings, integrate latest main on a separate reviewed branch, rerun all gates on the combined code, and obtain visual approval before extending Phase 2. Do not merge PR #77 or deploy without the owner's explicit approval.

