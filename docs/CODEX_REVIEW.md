# Independent Codex audit request

Review this Next.js static export + React Studio + PHP/MySQL CMS repository. **Do not deploy or change live showset.co.za.**

Priorities:
1. Run npm install, TypeScript typecheck, Next static build and inspect all static routes.
2. Review security of PHP session auth, CSRF, rate limiting, uploads, contact mail, JSON validation and secrets placement; verify on PHP/MySQL staging.
3. Verify responsive design at 320, 360, 390, 430, 768, 1024, 1440 and 1920 widths, including full-page content and small-height viewports.
4. Audit consistent heading, paragraph, spacing, buttons, dropdowns, motion, pattern alignment and tap targets.
5. Exercise Studio draft/save/publish/reload, upload, drag/drop, section ordering, global tokens and all section editor panels.
6. Confirm server-side pre-rendered SEO limitations and stop publishing new routes without regeneration.
7. Validate reduced-motion support, focus outlines, keyboard navigation, contrast, screen-reader semantics and form errors.
8. Audit runtime performance, assets, Core Web Vitals, safe hydration, no animation jank.
9. Fix defects with tests and a documented changelog; compare against /preview for visual direction.
10. Report evidence, unresolved limitations and rollback instructions.

Acceptance gate: no deployment until no broken routes, no editor loss of data, no auth bypass, safe media handling, working mail delivery and physical device QA.
