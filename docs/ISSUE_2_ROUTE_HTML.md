# Issue 2 route-first HTML and navigation

Each public static export now contains one route-specific view, primary heading and meaningful body before hydration. Service and case copy is populated using the same source DOM functions as browser navigation. Build-time DOM parsing is server-only; LinkeDOM is not imported into browser rendering. Studio still uses the same approved source renderer and binding adapter.

The browser mounts the full inactive scene catalogue after hydration so original pinned scenes, case rail and route curtain keep their exact structure. Inactive views are hidden/inert. A no-JavaScript stylesheet exposes readable content without changing the default motion experience. Exported links already point to real routes.

Navigation retains the original native History API approach, which Next.js explicitly integrates with usePathname. The shared host observes Next pathname state without remounting the animation engine. Accepted transitions retain 530ms apply and 580ms curtain completion. Rapid repeated links cannot update the URL behind an in-flight curtain; browser history requests during it are queued. Route focus moves to the new primary heading without scrolling.

## Executed validation

- TypeScript, source/assets, authored SEO checks and production static build pass.
- `qa/concept12-routes.cjs`: 117 assertions pass, covering all 12 routes with JavaScript off/on, direct refresh, one active primary document, meaningful copy, pre-hydration links, Next pathname synchronisation, heading focus, back/forward and back during the curtain. No runtime/hydration errors.
- `qa/concept12-seo.cjs`: all 24 route/JavaScript combinations retain one correct authored description/title.
- Existing 50 functional assertions pass, including original scroll scenes, service interactions, rail, route curtain and Studio draft/publish geometry.
- Local evidence includes the six-width scene matrix and desktop/mobile motion recordings, compared with the approved Concept 12 refinement evidence. Transient carousel and reveal frames are distinguished from geometry regressions.

This branch is stacked on draft PR 1 and has not been merged. The original HTML reference, visual CSS, photography, motion equations and Studio persistence schema are unchanged. Hosted CI remains subject to the documented account billing restriction. No hosting/deployment actions were taken.
