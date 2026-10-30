# SHOWSET Studio 2.0: private staging and release candidate runbook

Updated 30 October 2026. **Not a production deployment procedure.**
The public site stays on its separate `main` branch until explicit
owner sign-off. No production deployment credential or webhook is used.

## Release chain and ownership

1. An invited Studio editor saves a shared draft, requests review, and records
   the current shared workspace revision. The owner/publisher reviews the
   design and creates an **immutable release checkpoint** in the private Studio.
2. A publisher exports that checkpoint as a verified JSON backup, including
   original image bytes. Store this file privately, outside the Git repository.
   The backup checksum detects changes, **not the publisher's identity**; the
   operator must confirm the checkpoint ID and revision in Studio's release
   history before any source preparation.
3. In an **isolated checkout** of the SHOWSET integration branch, create
   `release/studio-r<checkpoint>-rev<revision>` (for example
   `release/studio-r42-rev7`). Keep this separate from public `main`.
4. Use the exact ID and revision from Studio's release archive. Dry-run the
   source materialisation and inspect the proposed file list before apply:

   ```bash
   node scripts/prepare-studio-release.mjs /secure/approved.json --dry-run --target . --release-id 42 --expect-revision 7
   node scripts/prepare-studio-release.mjs /secure/approved.json --apply --target . --release-id 42 --expect-revision 7
   node scripts/verify-studio-release.mjs --target .
   ```

   The file is never committed. Only `content/pages.json`,
   `content/globals.json`, the referenced immutable originals in
   `public/media/studio/`, and `.showset-staging/manifest.json` belong to
   this candidate. Before commit, inspect `git diff` and `git status`.
5. Open a pull request from the release branch into the **private Studio
   integration branch** for now. The existing SHOWSET quality workflow
   validates source hashes, runs Next.js's static build, checks each generated
   route and verifies Studio remains unavailable/noindex in the public export.
   The existing website and Studio Chromium suites must also pass.
6. On success, GitHub Actions creates a **private repository artifact**
   named `showset-staging-<commit SHA>` containing `out/` and the public
   staging manifest. It is retained for seven days. A collaborator may
   download it and view it locally:

   ```bash
   python3 -m http.server 3004 --directory out
   ```

   Visit `http://127.0.0.1:3004/` and review desktop/tablet/mobile,
   editorial text, all pages, images, buttons, patterns and animations.
   This artifact is a reviewable site, **not a publicly accessible staging URL**.
7. Only after explicit owner approval, a separate and protected
   promotion/hosting process may be authorised. This milestone does not
   create a Vercel deployment, xneelo upload or GitHub-to-production secret.
   Do **not** merge the Studio integration PR to `main` based solely on
   these candidate checks; complete live authentication, PostgreSQL/RLS,
   accessibility, compatibility and final owner QA first.

## Rollback rehearsal, not destructive revert

Studio rollback itself creates a **new** approved checkpoint, rather than
editing or deleting an earlier one. Export the new rollback checkpoint,
create a new `release/studio-r<new-id>-rev<new-revision>` branch, and repeat
the same dry-run, staging checks, owner review and promotion sequence.
Do not overwrite or reuse the previous candidate branch or checkpoint.

The static site cannot roll itself back. Actual public rollback, should
deployment be authorised later, requires a separate checked release using
the hosting provider's controlled deployment mechanism.

## Failure conditions that must block promotion

- Wrong review ID or revision, malformed or checksum-mismatched export,
  missing original bytes, or mismatched immutable media hashes.
- Changed source files after manifest generation, unresolved `asset:`
  references, missing static pages, or an active public Studio editor.
- Any TypeScript, SEO, build, Studio/security, public browser or release
  verification check failing.
- Any unreviewed changes or a newer release in Studio during rollback.
- Missing owner sign-off, unclear account permissions or unknown hosting cost.

`SHOWSET` uses a private GitHub repo and can use existing Actions quota
for these review artifacts, but **free capacity and quota availability are
not guaranteed**. The workflow does not provision or enable paid services.

## What is still required for real online staging

A dedicated, isolated Studio database/storage setup that passes real
PostgreSQL and RLS tests; protected preview authentication; an explicit
choice of static staging host; approved release provenance verified by the
server rather than just backup checksum; controlled publisher credentials;
protected production environment and rollback tests. None is silently
enabled by this runbook.
