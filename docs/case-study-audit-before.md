# Case study audit before changes

Base: main 23f7044bfe4a4a325850c26e9218b05bfe129268 (merged PR 19). Reference: all four rendered pages of Case-Study-Changes.docx and all ten embedded images. Local and deployed screenshots captured at 1440, 768 and 390 pixels.

| Requirement | Before status | Finding and correction needed |
|---|---|---|
| A Hero typography | Wrong | Legacy -.066em tracking rather than approved token; 1.035 leading still separated by wrapper padding. No teal second line. |
| B Header overlay | Correct at opening | Transparent overlay present at y=0; preserve scrolled/menu behaviour. |
| C Photo reveals | Wrong | Case primary headings omitted from homepage rectangular-swipe selectors; second copy has additional 42px vertical drift and opacity fade. |
| D Indicator | Partial | Markup/runtime removed, obsolete CSS retained. |
| E Eyebrows | Partial | Markup removed, obsolete marker/progress CSS retained. |
| F Editorial headings | Wrong | Duplicated forced tracking/size rules; Intention title overflows into photographs. No accent line treatment. |
| G Approach | Partial | Supporting photos present but duplicated Approach-only layout overrides; consolidate same chapter rules. |
| H Gallery position | Correct | Separate section immediately after pinned story. Preserve. |
| I Square gallery | Correct | Near-square desktop, square mobile. Verify drag/snap. |
| J Decoration | Partial | Visible controls removed; obsolete topline/footer/buttons CSS retained. |
| K Lightbox | Partial | Close/arrows retained; focus trap only includes buttons, excluding visible attribution links. Verify scroll/focus restoration and drag suppression. |
| L Image window | Partial | Render/runtime removed, unused CSS and Studio controls remain. Retain legacy stored fields for compatibility without exposing dead controls. |
| M Partners | Partial | Logo/name/role render, but heading remains oversized. Preserve editable own logos/URLs. |
| N Related | Partial | Compact images/descriptions present; consolidate typography and verify project-specific copy and links. |
| O Disclaimer | Correct visually | Long paragraph removed; demo flag/fictional partner roles retained. Attribution present in lightbox. Studio checkbox misleadingly promises a visible disclaimer. |
| P Tokens | Wrong | Duplicated case CSS block with hardcoded tracking and leading/size overrides. Consolidate into one ruleset using approved tokens. |
| Q Pattern | Partial | Correct asset present. Verify stacking, low opacity and consistent scale across pinned acts. |

Additional page 4 requirement: all wrapped headings need teal continuation lines and off-white final punctuation. Pinned chapters must crossfade in a stationary stage, not rise. Preserve homepage CTA, SVG transitions and all homepage content. No homepage content changes planned.

Evidence: work/case-study-audit/before and live (task workspace), plus rendered page-1 through page-4 PNGs.
