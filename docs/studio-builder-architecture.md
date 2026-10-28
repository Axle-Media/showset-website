# ADR: Studio 2.0, shared rendering and controlled releases

Status: implementation decision for review with Phase 1; no hosting/deployment authorisation. Baseline `6ebdf13`.

## Decisions

1. Keep the approved Concept 12 DOM/runtime as the template renderer. Introduce a versioned component tree for genuinely new/freeform content; never convert approved cinematic scenes into generic cards. A typed binding registry describes existing template targets and their canonical content paths. A control is shown only when a working binding/renderer supports it.
2. Keep legacy PageData/Globals as canonical content. Add optional `builder` metadata containing schema version, custom roots or explicit bound-target overrides. Default records emit no override CSS/DOM. Existing page IDs, sections, case metadata and arbitrary legacy extensions survive round trips.
3. Provide an opt-in `/studio/next/` workspace and same-renderer iframe/preview. Keep `/studio/` intact as a rollback path. The new workspace is loopback-only until real server authentication is configured. Static remote output displays an unavailable state; browser-only role flags never grant server permission.
4. Use native IndexedDB transactions for local working drafts, immutable revisions, media blobs and verified raw backups. Compare expected revision atomically; stale tabs get a conflict instead of overwriting another tab. BroadcastChannel is an update notification, not a lock/security boundary. This is explicitly local durability, not multi-owner shared storage.
5. Capture exact raw `showset-*` strings and verify SHA-256 before any conversion. Export a downloadable backup and retain an immutable local copy; no legacy key is overwritten by Studio 2.0. Import validates size/schema/URLs/units and is transactional. Old editor and backup files provide rollback. Actual owner data is converted only after this workflow succeeds in that owner's browser.
6. Use one shared component renderer for blank/custom pages in Studio and rendered preview, and the real SiteLayout for approved templates. Target styles are serialised from an allowlist, with desktop/tablet/mobile inheritance and explicit reset. No arbitrary CSS/JS/HTML execution. Supported inline text marks become structured safe content, not executable markup.
7. Reuse existing motion owners for cinematic templates. Generic nodes use a single scoped, disposable motion utility with reversible scroll progress and reduced-motion fallback. No second animation library or idle frame loop. Uploaded media is decoded and validated; executable SVG/HTML is rejected. Original immutable bytes and metadata remain recoverable.

## Target schema

```
StudioWorkspace { schemaVersion, revision, pages: Record<slug, PageData>, globals, media }
PageData.builder? { schemaVersion, mode: template | custom, roots: CanvasNode[], overrides }
CanvasNode { id, kind, name, props, styles: { desktop, tablet, mobile }, pattern?, motion?, children, hidden?, locked? }
TemplateBinding { key, selector, property/path mappings, allowed controls, semantic role }
Revision { id, parentRevision, timestamp, label, workspace }
RawBackup { format, version, origin, timestamp, records: Record<key, rawString|null>, sha256 }
```

Stable IDs drive selection, reorder, copy/duplicate, undo and media references. Pure commands validate cycles, child compatibility, depth/size bounds and route uniqueness. Content fields and global/synced instances have distinct scopes. The registry owns controls and supported values; inspectors are not a growing set of one-off Studio.tsx fields.

## Storage/publishing boundary

Next.js static export produces HTML per route at build time. Updating browser storage or PHP JSON cannot create a deployed route or regenerate metadata. [Next.js static-export documentation](https://nextjs.org/docs/app/guides/static-exports).

Phase 3 uses a versioned authenticated HTTP contract independent of hosting: session/roles, draft compare-and-swap, revisions, immutable media, protected preview, submit/approve/release/rollback. A local control-plane adapter can use a durable transactional database for actual two-owner tests. Production adapters require an approved same-origin reverse proxy/server and operator configuration. Existing xneelo PHP/MySQL can implement that contract after hardening; Vercel cannot execute the PHP files.

A release is an immutable approved content/media snapshot plus source commit and checksum. A builder consumes that snapshot using the same Next.js source to generate real static routes/SEO; an adapter promotes only a validated artifact. Deployment credentials stay server-side. No deployment adapter is enabled by default. A local release can be tested on loopback without pretending it is live production. External build/deploy, secrets, DNS and hosting changes require a separate owner approval gate.

## Security and recovery

Role checks occur server-side, never from localStorage. Use strict session handling, full Origin verification, CSRF tokens, request/content limits, least-privilege media endpoints and audit trails. [OWASP CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html). IndexedDB commit success is checked before UI reports saved; aborted/quota/conflict states retain unsaved work. [Transaction reference](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction).

Rollback is additive: switch to classic Studio, retain original keys, restore a verified workspace revision or import a backup into a new revision. Never automatically reset/clean browser data. Public default rendering has a screenshot/DOM/animation regression gate; media, storage or migration failure must not replace owner data with defaults.

## Tradeoffs and gates

Opt-in review allows a complete vertical slice without exposing unfinished controls or destabilising the approved site. Phase 1 does not claim 100% template coverage or live release. Advanced timeline editing, all globals/forms and authenticated multi-owner release follow in tractable PRs. Review the actual workspace, data model and working renderer first; report the exact remaining coverage and make no false publish or security claims.
