# SHOWSET Next.js and Studio

SHOWSET Concept 12 website and its local content editor. The restored Concept 12 implementation and approved UI refinements share the same components, styles and motion system.

Shared repository: https://github.com/Axle-Media/showset-website

## Local development

```sh
npm ci
npm run dev -- -p 3001
```

Open http://localhost:3001/ and http://localhost:3001/studio/. Use the same browser, hostname and port as an existing Studio session to retain its browser storage.

Studio supports content, imagery, typography, spacing and motion settings. **Save Draft** saves locally; **Publish Preview** updates the local website preview on the same browser origin. It does not deploy to hosting or publish to WordPress. `/local-studio-backup.html` exports local drafts, preview data and recovery records. Historical defaults reconcile through a backup-preserving compatibility adapter; custom edits remain intact.

## Project structure

- `app/`: Next.js routes, fonts and shared styles. `/studio/` and `/studio-preview/` are editor routes; `/our-studio/` is a public agency page.
- `components/ConceptSite.tsx`: shared public website and Studio rendering. `components/Studio.tsx` contains editor controls and saving.
- `lib/concept-12/`: original markup, motion runtime, content bindings and historical compatibility data.
- `content/`: editable page and global defaults.
- `public/`: approved brand artwork, photographs and self-hosted fonts.
- `reference/CONCEPT_12_APPROVED.html`: definitive Concept 12 reference. Brand guidelines are included in `reference/`. Apply only explicitly approved refinements; do not use cancelled redesign branches as design authority.
- `qa/`: repeatable Playwright checks and before/after evidence.
- `backend/`: existing PHP/MySQL publishing source and schema, retained for future secure integration. It is not an authenticated production deployment in the current local workflow.

See [CONCEPT12_RESTORATION.md](CONCEPT12_RESTORATION.md), [CONCEPT12_REFINEMENTS.md](CONCEPT12_REFINEMENTS.md) and [QA_REFINEMENT_RESULTS.md](QA_REFINEMENT_RESULTS.md) for implementation and verification details.

## Checks and build

```sh
npm run check
npm run lint:source
npm run build
```

The production build uses Next.js static export with directory-style URLs and writes to `out/`. Run `npm run package:xneelo` to assemble a PHP-gated preview package for standard xneelo hosting. It places the export in `out/protected-site/` and adds a server-side password gate, public cover assets and the PHP API. Configure `api/showset/config.local.php` on the server with a separately generated `preview_password_hash`; never commit that file or deploy the package before explicit approval. See [docs/XNEELO_PREVIEW_GATE.md](docs/XNEELO_PREVIEW_GATE.md) for setup and security details. The browser checks in `qa/` require Playwright and Chrome; see the refinement documentation for configuration. Existing contrast findings, physical-device testing and the preview form's non-delivery behaviour are documented honestly.

## Branches and collaboration

- `main`: shared baseline containing restored Concept 12, approved UI improvements and this README.
- `refine/concept-12-ui`: approved UI implementation branch.
- `restore/concept-12-exact`: exact restoration checkpoint before the approved refinements.
- `wip/staging-preparation`: preserved, unfinished staging packaging work from the interrupted hosting task. It is not approved for deployment.
- `staging`: preserved deployment branch checkpoint; no automatic deployment is configured.
- Older `experience/*`, `archive/*` and restoration branches preserve history. Cancelled experiments are not the active website.

Use feature branches and pull requests targeting `main`. Review changes before merging. The existing personal repository remote is preserved; `axle-media` is the shared organisation remote and the default push destination for this checkout.

## Deployment and secrets

Production deployment is authorised for the reviewed `main` branch at https://showset-website.vercel.app/. Vercel deploys after an approved PR merge. This does not authorise publishing to showset.co.za or changing xneelo/WordPress. Studio saves locally on localhost; the static Vercel deployment has no authenticated PHP publishing backend. The legacy `package:xneelo` command includes PHP backend files and editor routes; it is not the public-only staging package.

New case studies use **+ New case study** in Studio and automatically receive the shared cinematic template. Static URLs and SEO require a content export and site rebuild; adding a project needs no custom component, route-map entry or motion code. See [case-study release audit](docs/case-study-production-audit.md) for the production candidate and verification. Environment files, private keys, local credentials, dependencies, build outputs, database dumps and temporary backups stay out of Git. Only placeholder configuration examples and the source database schema are intentionally tracked. Keep hosting and GitHub credentials in secure stores, never in source or chat.

## Studio 2.0 local preview

The opt-in visual builder is available at `/studio/next/` with `npm run dev -- -p 3001`. It requires a verified backup before adopting classic drafts into its separate store. Classic `/studio/` remains available. Production exports disable the new workspace; local preview does not publish the website.

See the [Phase 1 report and browser evidence](docs/studio-builder-phase1.md), [operator guide](docs/studio-builder-operator.md), [coverage audit](docs/studio-builder-audit.md) and [architecture](docs/studio-builder-architecture.md). Issue #57 remains open for complete template/global coverage and authenticated shared release.
