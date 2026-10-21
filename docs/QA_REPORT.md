# SHOWSET Next + Studio: development QA

## Tests completed in the current environment

- Source schema: 11 pages, 62 sections, all referenced built-in images present.
- Reviewed the supplied reference seed, brand SVG pattern and content; used the word deck's published copy direction rather than optional proposals.
- PHP 8.4 syntax checks on backend API and sample config passed.
- TypeScript and TSX **syntax parsing** passed across source files using the globally installed TypeScript parser. This is NOT a complete TypeScript typecheck.
- Generated a browser-review site from the same content data and CSS. Used Chromium and Playwright to test 11 routes at 1440, 1024, 768, 390 and 320 CSS pixels: 55 combinations, 0 horizontal overflows, 0 broken `<img>` assets, 0 page JavaScript exceptions observed. These tests apply to the standalone review rendering, NOT the compiled React/Next.js application.
- Desktop and mobile screenshot inspection covered hero, services, contact and portfolio states.
- Standalone interactive review: 9/9 targeted checks passed, including initial dropdown hidden state, outside-click dismissal, service hover, scrollable horizontal case studies, page navigation and mobile menu close.

## Not yet verified

- `npm install`, Next.js bundling and real `next build`: npm registry was unavailable from this isolated environment.
- React type checking against installed React / Next type definitions.
- Runtime operation of SHOWSET Studio in a compiled Next app, including editor save/publish and drag ordering.
- PHP integration against a real MySQL database, session-cookie behaviour on actual xneelo HTTPS, and backups.
- Real email delivery and anti-spam effectiveness.
- Browsers on physical Android and iOS devices; Lighthouse Core Web Vitals, accessibility audit and sustained media stress testing.
- Compatibility of Apache rewrites with existing WordPress routing during deployment.

## Deployment decision

**Development prototype: not production approved.** Run `npm install`, `npm run build`, real CMS integration tests and physical-device checks on staging before pointing showset.co.za at the new site.
