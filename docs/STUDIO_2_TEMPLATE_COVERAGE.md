# Studio 2.0: existing SHOWSET template editing coverage

Updated: 30 October 2026
Branch: `feat/studio2-existing-page-media-20261029`
Target: draft Studio integration PR #81; **not the public production branch**.

## Canonical edits implemented

| Template | Image bindings | Copy bindings | Selectable section styles |
| --- | --- | --- | --- |
| Home | Hero, story scenes, service photos | Existing hero title, accent, body and actions | All seven original Home chapters (hero, manifesto, film, portfolio, services, approach, closing) |
| Events & Experiences | Hero, three triptych stage photos | Opening, intro, story, expertise, individual stage heading and paragraph, grouped capability labels | Opening, intro, story, expertise and close |
| Creative & Design | Hero, three artboards | Same service copy controls; artboard titles and paragraphs | Same five scopes |
| Digital & Marketing | Four production-stage photos; digital hero remains illustrative | Same service copy controls; four stage titles and paragraphs | Same five scopes |
| Content & Production | Hero, three production frames | Same service copy controls; three stage titles and paragraphs | Same five scopes |
| Our Studio | Hero and storyboard chapters | Hero, manifesto, exploration, stage titles and descriptions, outlook and close | Five editorial sections |
| Our Work | Hero only: cards are owned by case-study records | Opening, intro and closing headings and paragraphs | Opening, intro, portfolio and close |
| Case studies | Two opening photos; three chapter photos (both mirrored image locations); individual gallery images preserving credit/order | Opening and second-scene headings/paragraphs; brief/intention/approach headings and paragraphs | Opening and narrative sequences |
| Contact | No image in the approved markup | Heading, intro text and submit label | Contact section |

Each control updates an existing `PageData` or `CaseExperience` field, with responsive overrides keyed by stable target ID. Authored content is not copied into independent UI-only draft strings. Case study opener photos power linked index cards; the private Studio preview resolves unpublished `asset:` originals to browser blob URLs. Media is still local to the current owner/browser, not hosted.

## Preservation

- Never replace the approved service, studio or case-study renderers with generic builder markup.
- Never mutate seed images, media bytes or source copy as part of editing UI.
- No DB migration, reset or replacement of existing browser-owned draft/revision/backups.
- Existing service process stage count is preserved. New owner-created sections can be added, duplicated, reordered, hidden and deleted in the safe pre-CTA extension area. Eligible standard-flow editorial sections can be rebuilt at their exact native position with an archived reversible original. Arbitrary movement/deletion of approved cinematic sections is still prohibited.
- Section bindings expose styling controls and only supported editorial sections offer native rebuilding. Pinned scroll choreography and template scene ordering remain owned by the approved renderer, not a generic drag-to-reorder control.
- Case-study photographs in Our Work are read-only linked references. Edit the owning case study to change them.

## Native editorial visual controls (30 October milestone)

- All seven original Home sections are selectable in Studio's Layers list. The existing Studio, Work, Services, Case and Contact section-style bindings remain available.
- **Safe editorial zones only:** Home manifesto/portfolio, Studio manifesto/partnership, Work introduction/portfolio, and Services introduction/expertise permit independently editable S-dot overlay position, size, repeat, rotation, blend and opacity at desktop/tablet/mobile breakpoints.
- Native patterns render as separate pointer-events-free overlays rather than replacing any original `::before` artwork. Turning off a Studio overlay preserves the original page design.
- Optional editorial entrance effects (none, fade, slide, scale) use a bounded load-time animation, never replace scroll-driven choreography, and are automatically disabled for `prefers-reduced-motion`.
- Pinned/scroll-driven Home hero, film, services and dot tracks, service storytelling, Studio scroll heroes, case-study sequences and closing CTAs **remain protected** from generic patterns and motion. Their original custom animation engines are not editable as generic motion presets in this milestone.
- Native overrides now use one compositor in the Studio editor, the static Next.js HTML and the hydrated public runtime. Override data is validated before an imported workspace can be restored.
- New browser regression `qa/studio2-native-editorial.cjs` tests desktop/mobile pattern positions, load entrance, pin protection, save/reload and standalone preview. The Studio component suite also checks allowed destinations, escaping and no-JS/public wiring.

**Not yet covered:** arbitrary reconstruction or reordering of protected scenes, a full cinematic timeline designer, source-controlled pattern asset replacement, global synchronised reusable sections and authenticated cloud publishing. No production rollout is included.

## Safety gaps blocking online availability

- Authentication and shared owner access controls.
- Persistent backed-up cloud media and drafts.
- Approval, preview, publication and rollback.
- Static export reconciler for `asset:` IDs before release.
- Audit/migration of all older classic-Studio-only fields.
- Further native template coverage and safe layout composition, beyond reversible standard-flow replacement. Original animated or pinned sections are still protected.

## Verification

`qa/studio2-existing-media.cjs` tests service, Studio, Work, case hero/gallery and linked-card image editing with reload; `qa/studio2-existing-text.cjs` tests stage descriptions, grouped capability names, Studio and case headings and paragraphs with persisted canonical storage. `qa/studio2-model.cjs` rejects references to originals absent from imported workspaces. These are run under the Studio 2.0 GitHub Actions job. General public-site visual QA remains a separate, historically failing baseline suite on `main`.

Native position acceptance: a rebuilt service introduction must appear immediately before its still-preserved original DOM anchor, not at the closing CTA; restoring it removes only the replacement wrapper, keeps owner edits archived, and puts the original section back. The build-time static renderer, hydrated public renderer and editor preview use the same compositor. Tests: `qa/studio2-native-rebuild.cjs` and `qa/studio2-public-template-parity.cjs`.

Do not merge the Studio integration PR #81 into public main until its staging/security and website acceptance gates are met. No deployment or public editor exposure is authorised by this development work.
