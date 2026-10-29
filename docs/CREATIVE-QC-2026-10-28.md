# SHOWSET creative QC — 28–29 October 2026

## Scope and reference

Reviewed the live Vercel site and source, all 11 principal public URLs (home, four services, studio, work, contact, three case studies), and all 12 content routes in the static export. The attached Studio screenshot defines the desktop text grid: approximately 85 / 780 = 10.9% inset. This is the inner content edge, not the wider photograph frame. Photographs and intentional full-bleed backgrounds retain their framing.

## Changes

- Shared desktop text gutter: 10.9vw, capped by a centred 1500px content grid on very wide screens. Tablet uses 6vw, 24–48px; mobile uses 24px. Header logo and desktop CTA share the content edges; homepage hero and centred statement now align with the grid.
- Photo headlines: Poppins 650, 1.08 leading, responsive 40–67px desktop scale. Main editorial headlines: Poppins 650, 1.08 leading, 32–47px desktop scale. Smaller card/subheadings keep a consistent separate 22–26px tier. All scales reduce responsively.
- Main body and description paragraphs: Manrope 17px, 1.65 leading. Removed the exceptional 14px related-case description size. Labels, navigation, controls and metadata retain their functional hierarchy.
- Existing periods in white headline lines are teal; periods in accent lines are ivory. This covers first-line periods, server-rendered HTML, subsequent route changes and responsive wrapping. Authored wording and question marks are preserved; periods are not inserted halfway through a continuous phrase.
- All ten closing invitations share the Studio SVG, gradient, size and placement, including home and three case studies that previously used a different ending. Pattern opacity is 0.42 desktop, 0.32 tablet and 0.24 mobile; desktop placement moves 125px farther right. CTA main headings now use the editorial scale.
- Fixed mobile editorial heading overscan and adjusted header navigation to fit the narrower text grid without clipping its button.

- Preserved the newer approved compact Contact layout from main; shortened name/email placeholder hints to avoid truncation in its paired fields. Navigation retains the approved 14px text.

## Evidence and checks

- Production build and TypeScript checks pass.
- Source checks: 12 pages, 52 sections, zero errors; three complete distinct case studies with local assets.
- SEO content check: 12 unique routes and metadata pass.
- Static export scan: 439 anchor elements, 126 image elements; no missing local target paths; one H1 per exported content route.
- Browser inspection of all 11 public routes at desktop: no broken loaded images or page-level horizontal overflow observed.
- Preview computed styles: all ten CTA sections share exactly the same background, opacity, pattern size and position. All main-content paragraphs report 17px.
- Responsive iframe tests at 390px and 768px viewport widths, with classic scrollbar content widths of 375px and 753px: all 11 routes inspected. No page-level horizontal overflow. Small editorial heading overscan found on Events and Creative was corrected and rechecked.
- Mobile menu opens; desktop route navigation works; case-study lightbox opens, advances and closes with focus restored; contact project selector and optional-details disclosure work; empty contact submission focuses the required name field.

## Remaining launch work / limitations

1. **Direct enquiry delivery is not connected in the observed Vercel experience.** The form says “Prepare the email” and opens the user's mail app. It does not submit an enquiry through this website. Configure a supported delivery endpoint and validate receipt if direct website submission is intended. No live enquiry or email was sent in this audit.
2. **Portfolio naming needs a content decision.** The “Atmosphere is everything” card/URL leads to an Awards Night demonstration page whose hero says “A night made for the spotlight.” Align the card, title and story name before launch.
3. **Portfolio work is demonstration material.** Existing copy explicitly describes fictional/AI-generated creative studies. Keep this disclosure or replace with approved real projects, client permissions and final photography before presenting these as completed client work.
4. **The large blank region in a full-page Studio screenshot is associated with its scroll-driven hero track.** Still-image captures do not reproduce the sticky sequence. Review the actual scroll experience on target phones before deciding to remove the track.
5. **External social ownership and delivery remain unverified.** Facebook, Instagram and LinkedIn links, mailto and tel targets are wired, but this audit does not verify account ownership, inbox receipt or telephone availability.
6. **Maintainability:** many historical CSS overrides remain. The final shared stylesheet now establishes a clear visual contract; a separate cleanup can remove superseded rules without mixing that risk into this design pass.

This is a focused visual and interaction QC, not a security audit, exhaustive assistive-technology certification or performance benchmark. Mobile/tablet layout checks used Chromium iframe viewports, not physical iOS/Android devices. Preview checks do not themselves prove a Vercel deployment has completed.
