# Studio 2.0: existing SHOWSET template editing coverage

Updated: 29 October 2026
Branch: `feat/studio2-existing-page-media-20261029`
Target: draft Studio integration PR #81; **not the public production branch**.

## Canonical edits implemented

| Template | Image bindings | Copy bindings | Selectable section styles |
| --- | --- | --- | --- |
| Home | Hero, story scenes, service photos | Existing hero title, accent, body and actions | Opening scene (existing) |
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
- Existing service process stage count is preserved. Whole-section addition, deletion and arbitrary rearrangement **are not yet supported** for these tightly authored templates. Only custom builder pages currently offer unconstrained section composition.
- Section bindings expose styling controls but do **not** promise arbitrary layout rearrangement or new section templates.
- Case-study photographs in Our Work are read-only linked references. Edit the owning case study to change them.

## Safety gaps blocking online availability

- Authentication and shared owner access controls.
- Persistent backed-up cloud media and drafts.
- Approval, preview, publication and rollback.
- Static export reconciler for `asset:` IDs before release.
- Audit/migration of all older classic-Studio-only fields.
- General-purpose template section registry and safe layout composition, rather than changing section order in page data without ensuring the renderer reflects it.

## Verification

`qa/studio2-existing-media.cjs` tests service, Studio, Work, case hero/gallery and linked-card image editing with reload; `qa/studio2-existing-text.cjs` tests stage descriptions, grouped capability names, Studio and case headings and paragraphs with persisted canonical storage. `qa/studio2-model.cjs` rejects references to originals absent from imported workspaces. These are run under the Studio 2.0 GitHub Actions job. General public-site visual QA remains a separate, historically failing baseline suite on `main`.

Do not merge PR #83 until its Studio-specific checks are green. No deploy or public editor exposure is authorised by this development work.
