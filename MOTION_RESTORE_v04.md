> Historical verification/implementation notes. Superseded by CONCEPT12_RESTORATION.md and the current browser evidence.

> **For the complete standalone package:** v0.4 is already integrated. Ignore the old patch-install instructions below. Open `START_HERE_WINDOWS.md` and run this project directly.

# SHOWSET Motion Restoration v0.4

## Scope

This is a **source-level port** of the major interaction principles from approved Concept 12 into the current Next.js/Studio React application. It replaces the simplified motion in v0.3; it is **not a verified pixel-identical clone** of the original HTML. The restored sections continue using Studio's existing editable page data and global motion settings.

### Implemented

- **Hero:** extended pinned scroll track, inset image expanding to the viewport, camera-like image movement, first text fading as a second editable scene enters. Essential heading remains visible without relying on an IntersectionObserver.
- **Three-act story:** scroll-driven chapter selection with full-frame image crossfades, subtle image zoom, circular chapter headline reveal and a progress line.
- **Services:** desktop pinned scroll progression with hover/focus overrides, full-frame image transition and description; on mobile the section flows normally with tap/focus feedback.
- **Expanding dot:** circular clipping of a full-viewport layer at 50%/50%, with radius calculated from the viewport diagonal to prevent fuzzy upscaling. Its headline preserves the original line breaks and sand emphasis.
- **Case studies:** horizontal three-column view, smooth timed advancement, duplicated rail for seamless wrap, hover/focus/visibility pause, keyboard left/right/Enter and touch-swipe controls. No navigation arrows or visible numerical counters.
- **Navigation:** circular route curtain for internal React navigation with state reset on new dynamic paths. Includes a thin reading progress indicator.
- **Secondary pages:** gentle image-depth movement, circular headings and soft-rise cards/accordions.
- **Accessibility:** reduced-motion fallbacks, keyboard carousel controls, hover pause, page content visible without animation and mobile-specific layout.
- **Studio:** no modification to demo save/publish keys, PHP API or login; page structure, copy, images, global and per-section settings remain editable. An editable `hero-second-scene` item is included in the *default* homepage seed; previously published local homepage data uses a safe fallback until you choose to add/edit that item.

### Validation performed here

- TypeScript JSX syntax transpilation: passed.
- Browser **style fixture** (not the Next.js app) at 1440×900, 1024×768, 768×1024, 390×844 and 320×700: no page errors or horizontal document overflow detected, and the key layouts were visually inspected.
- Source diff against Concept 12's reference interaction engine: main movement principles transferred.

### What still requires running locally

The environment could not download Next.js/React dependencies from npm (`EAI_AGAIN`), therefore **a full Next.js build, actual React runtime E2E checks, Studio publish→reload regression test and exact video-level Concept 12 comparison are not yet verified**. Do not publish to showset.co.za before those tests pass.

## Install into your existing local project

Back up the three source files plus default page seed, then overlay the four paths from the PATCH ZIP into the existing `showset-next-studio` directory. **Do not clear browser localStorage and do not delete your local Studio drafts/published content.** Keep port **3001**, because local browser drafts and previews are origin-specific.

In PowerShell, from your existing project directory:

```powershell
# Stop the current development server first with Ctrl+C.
$patch = "$env:USERPROFILE\Downloads\SHOWSET_Motion_Restore_v04_Patch.zip"
New-Item -ItemType Directory -Force .\_restore_backup | Out-Null
Copy-Item .\components\SiteShell.tsx .\_restore_backup\SiteShell.tsx -Force
Copy-Item .\components\studio.css .\_restore_backup\studio.css -Force
Copy-Item .\app\globals.css .\_restore_backup\globals.css -Force
Copy-Item .\content\pages.json .\_restore_backup\pages.json -Force
Expand-Archive $patch -DestinationPath .\_restore_v04 -Force
Copy-Item .\_restore_v04\components\SiteShell.tsx .\components\SiteShell.tsx -Force
Copy-Item .\_restore_v04\components\studio.css .\components\studio.css -Force
Copy-Item .\_restore_v04\app\globals.css .\app\globals.css -Force
Copy-Item .\_restore_v04\content\pages.json .\content\pages.json -Force
if (Test-Path .next) { Remove-Item .next -Force -Recurse }
npm run dev -- -p 3001
```

**IMPORTANT:** Overwriting `content/pages.json` affects the compiled seed, not the demo edits stored in your browser. If you have manually edited JSON on disk, skip that Copy-Item and add the optional home hero item through Studio instead.

## Acceptance test at http://localhost:3001

1. Scroll slowly from the opening image to the full-frame hero scene. Check the second headline appears and the original headline never disappears prematurely.
2. Scroll through all **three** image chapters, both forwards and backwards; watch text and images change in sync.
3. At **services**, scroll the desktop view and test hover on each category. On mobile, the section should flow without trapping scrolling.
4. Check the circle originates in the **centre** and expands sharply to fill the viewport; its wording must stay legible.
5. Check three horizontal case-study cards on desktop and swipeable cards on mobile. Pause on hover and with keyboard focus; navigate using arrows and Enter when the carousel is focused.
6. Open each service page and Our Studio/Work/Contact. Check the circular page transition, photo movement, focus and dropdown outside-click behaviour.
7. In Studio, change one headline, Save draft, Publish preview, refresh localhost:3001, then verify both the saved headline and motion remain.
8. Check at 320, 390, 768, 1024 and 1440 pixels, including Safari/iOS or Chrome/Android if available.
9. Test reduced-motion OS/browser settings. Text must remain visible and movement should simplify.
10. Before staging run `npm run check` and `npm run build` on the local development machine. Do not deploy while either fails.

## Rollback

Stop the server and copy your four files from `_restore_backup` back to their original locations; clear `.next`, restart on the same port. Your browser-local Studio content will remain unchanged.
