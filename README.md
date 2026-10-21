# SHOWSET Next.js + Studio — Complete Local Project

**Consolidated version 0.4.0 (Concept 12 motion restoration).** This package combines the original Next.js and SHOWSET Studio application with the v0.2 local Publish Preview workflow, the v0.3 invisible-headline fix, and the v0.4 motion restoration. **No older source folders or patches are needed.**

## Quick start on Windows

1. Extract this ZIP. Open PowerShell **inside the `SHOWSET-Next-Studio-Complete` folder containing `package.json`**.
2. Close the previous development server with Ctrl+C. Use **port 3001** and the **same browser** to retain your browser-local Studio edits.
3. Run:

   ```powershell
   npm install
   npm run dev -- -p 3001
   ```

4. Open `http://localhost:3001/` for the public website and `http://localhost:3001/studio/` for Studio.
5. Confirm the hero headline is visible and Studio > Save draft > Publish preview > website refresh works.
6. For a backup of your local content, open `http://localhost:3001/local-studio-backup.html` and choose **Download Studio backup**.

For step-by-step setup and safe migration, see [START_HERE_WINDOWS.md](START_HERE_WINDOWS.md).

## Included

- 11 page routes, 62 editorial sections, service destinations, studio, concept studies and contact.
- React components for cinematic hero, 3-act scroll story, responsive service showcase, centre-expanding sharp brand dot, horizontal case studies, circular heading reveals, internal page curtain, reduced-motion handling, mobile menu and other interactions.
- SHOWSET Studio visual editor for sections, text, images, styling, global colours/type, device previews, motion settings and **local browser draft/publish preview**.
- PHP/MySQL backend source for staging/production publishing (not enabled or deployed).
- Brand assets and approved Concept 12 reference design/copy materials (in `reference/`).
- Developer docs, source check, example backend config, tests and QA notes.

## Important limitations

- **Publish preview is LOCAL ONLY.** It saves to the browser's localStorage at the chosen localhost address and port, not to WordPress/xneelo or another browser. It worked in the user's local v0.3 environment, but the merged v0.4 runtime still needs to be checked locally.
- **Changing port, browser profile or hostname means separate browser storage.** Back up using `/local-studio-backup.html` before changing. The backup tool is blocked outside localhost.
- The v0.4 animations underwent source/syntax and standalone fixture tests; the **actual Next.js app and visual motion parity with Concept 12 remain unverified in this build environment**. Verify locally before replacing the working old folder.
- Static export doesn't support request-time SSR, automatic new routes or live SEO metadata regeneration; rebuilding/exporting is necessary for new routes and SEO.
- Backend needs real database, administrator authentication, staging and email testing before production deployment. **Do not upload or activate on showset.co.za yet.**

## Commands

```powershell
npm run lint:source   # validate section types and local images
npm run check         # TypeScript check (after npm install)
npm run build         # Next.js static build
npm run package:xneelo # static build + PHP backend export
```

Refer to `MOTION_RESTORE_v04.md`, `docs/QA_REPORT.md` and `docs/XNEELO_DEPLOYMENT.md` for technical details.
