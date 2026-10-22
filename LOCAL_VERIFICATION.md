> Historical verification/implementation notes. Superseded by CONCEPT12_RESTORATION.md and the current browser evidence.

# SHOWSET Consolidated v0.4: packaging verification

## Confirmed in this session

- The consolidated project contains the same `components/Studio.tsx` as v0.3 (including Save draft and local Publish preview).
- The consolidated `SiteShell.tsx`, `app/globals.css`, `components/studio.css` and `content/pages.json` match the previously prepared v0.4 motion restoration.
- 11 page seeds, 62 sections, no invalid section types or unresolved built-in image paths (`npm run lint:source` source check).
- PHP syntax: `backend/api/index.php` and `backend/api/config.example.php` pass `php -l`.
- Eleven TypeScript/TSX source files have zero parser diagnostics. This is syntax parsing, not a complete typecheck.
- Local backup page's embedded JavaScript compiles without syntax errors.
- Consolidated ZIP passes CRC validation, with all required source files present.
- Includes approved Concept 12 reference HTML, preview, Word copy deck and PDF brand guide for visual comparison.

## Must still be verified on your own localhost

- Successful `npm install`, `npm run check` and `npm run build` against full Next.js/React dependencies.
- Real runtime motion behaviour and pixel-level parity with the approved Concept 12 HTML.
- Save draft → Publish preview → reload regression test in your browser after replacement.
- Mobile touch and reduced-motion tests in actual devices.
- PHP/MySQL backend and xneelo deployment (these have **not** been configured or tested live).

**Do not remove your existing working folder until the replacement passes the checks in `START_HERE_WINDOWS.md`.**
