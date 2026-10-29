# SHOWSET Studio 2.0: dedicated staging and publishing setup

Status: **implementation review only**. This branch is not deployed, the database has not been provisioned, and public SHOWSET remains unchanged.

## Hosting architecture

The website is currently a Next.js 16 static export. Vercel and the eventual xneelo deployment serve static HTML/CSS/JS, so they cannot safely save user uploads to their own filesystem or host the current PHP-only editor API in the Vercel build.

Studio 2.0 now has a browser-to-Supabase transport, but it **must** point to a separate SHOWSET-owned Supabase project. Do not use the existing Mahzya or Axle One projects. The browser has only the URL, publishable key and scoped user JWT; it never receives a service-role or secret key. This is a portability boundary: xneelo can serve the same frontend while Supabase remains the private content/media backend.

## Before enabling protected Vercel staging

1. Create a separate **SHOWSET** Supabase project in the chosen organisation and region; confirm any quoted cost before provisioning.
2. From the Supabase dashboard, create the private `showset-studio-media` bucket, enforce MIME types `image/jpeg,image/png,image/webp,image/avif` and maximum 8 MB per object. Keep public access **OFF**.
3. Run and review [studio2-cloud-schema.sql](./studio2-cloud-schema.sql) against **only** the new SHOWSET database. Validate RLS policies, grants and `showset_studio_publish` in a staging account. The SQL must be applied before sign-in.
4. Disable open sign-ups in Auth. Invite owners individually through Supabase Auth, have them set their passwords, and insert their exact `auth.users.id` and roles into `public.showset_studio_members` from the admin SQL editor. **Never** assign roles through user-editable `user_metadata`. Role `owner` can edit/approve; `publisher` can edit/approve; `editor` can edit only.
5. Use a private Vercel preview or staging domain with preview deployment protection. Set these **build-time** environment values in the staging project, not in Git:
   - `NEXT_PUBLIC_SHOWSET_STUDIO_CLOUD_ENABLED=true`
   - `NEXT_PUBLIC_SHOWSET_SUPABASE_URL=https://<SHOWSET_PROJECT_REF>.supabase.co`
   - `NEXT_PUBLIC_SHOWSET_SUPABASE_PUBLISHABLE_KEY=<public publishable key>`
6. Keep the public `main` build separate, with `NEXT_PUBLIC_SHOWSET_STUDIO_CLOUD_ENABLED` unset. Do not remove the branch deployment exclusions in `vercel.json` until the staging domain has protection and a complete security acceptance run.
7. Test on staging with two different invited owners:
   - No role cannot open the editor or read documents/media.
   - An active editor can read, edit, upload and save a private draft, but cannot approve releases.
   - Simultaneous saves detect a revision conflict and preserve the losing draft for full backup.
   - An owner can approve a release snapshot only for the current saved revision.
   - Release rows are immutable; their snapshots come from the saved DB document, not arbitrary JSON passed in by the browser.
   - Original image downloads are authenticated and the bucket is never public.
   - Logout revokes credentials and protected routes are inaccessible without signing in.
   - Download a checksum-verified complete backup and verify media IDs/content before any restore.
8. Verify responsive editing, all existing case/media scenes, motion/reduced motion, keyboard editing and public-site snapshots on the staging build before enabling it for all owners.

## Supported online workflow

- Invitation-only email/password login with Supabase Auth.
- User's active role is read from owner-managed RLS-protected member rows.
- Full canonical workspace JSON is loaded from one shared `site` draft record.
- Saves use optimistic revision matching. A concurrent update produces a conflict instead of a silent overwrite. Underlying DB policies restrict authors.
- Private JPEG/PNG/WebP/AVIF original images are uploaded before draft references are saved.
- Owner/publisher **Approve release snapshot** calls a server-side, revision-checked database function. This creates an immutable record and **does not publish public pages**. Public release deployment needs a separate export/snapshot asset reconciler.
- Local Studio continues as a separate fallback, with previous browser data untouched.

## Prepare a reviewed static release

After an owner/publisher approves a snapshot in Studio, click **Export latest approved release**. This downloads `SHOWSET-approved-release-<id>.json` with the exact saved snapshot and all immutable image originals, protected by an SHA-256 backup checksum.

On a **separate reviewed GitHub release branch** (never directly on `main`), run:

```bash
node scripts/prepare-studio-release.mjs SHOWSET-approved-release-123.json --dry-run
node scripts/prepare-studio-release.mjs SHOWSET-approved-release-123.json --apply
npm run check
npm run lint:source
npm run build
```

The script checks every image checksum, rewrites `asset:` references to `/media/studio/asset-<SHA-256>.<ext>`, prepares `content/pages.json` and `content/globals.json` for a reviewed commit, and copies only the approved media. It never contacts GitHub or Vercel, triggers a deployment or modifies a public hosting environment. To prepare a temporary release directory instead of the working repo, use `--target /path/to/isolated/source`.

Once approved, an operator can deploy the resulting reviewed static build through Vercel or run `npm run package:xneelo` for the private xneelo archive. The actual public release deployment and release rollback are **still manual** until the dedicated publish controller and immutable release manifest are tested. Never run the preparer on unapproved backups.

## Safety constraints and open work

- Staging is not production-ready until an actual dedicated Supabase project exists, RLS is validated there, and browser/security acceptance tests pass. Mock contract tests alone do not prove live backend readiness.
- Importing backups into a shared cloud workspace is disabled until a safe, atomic original-image migration and collision/review strategy is designed. Cloud backup exports include original bytes and a checksum.
- A private draft can contain `asset:` image references that are **not** public URLs. Public release packaging must copy images into immutable approved release assets and rewrite every reference. Never publish `blob:` URLs or expose the private media bucket.
- There is no automatic Vercel deployment, no xneelo upload, and no SEO re-generation. The approved snapshot is a review artifact only.
- MFA for publisher approval and scheduled audit logging should be evaluated before production access.
- Original pinned/scroll-driven cinematic sections remain protected. Standard-flow editorial sections can be rebuilt nondestructively into builder sections with restore and Undo/Redo.
- Browser-in-memory sessions require sign-in after a full reload; credentials are not written to localStorage. Persistent secure cookie sessions require a server runtime/proxy and are a separate staging upgrade.

## Release acceptance

Source code and tests must pass on draft PR #87. Public desktop and mobile visual checks need to be re-run after enabling the staging environment. Before first public publish, build a release manifest, reconcile media and HTML, test static generation, create rollback snapshots and get owner approval. Keep the public `main` release channel unchanged until then.
