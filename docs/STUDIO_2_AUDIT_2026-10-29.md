# SHOWSET Studio 2.0: audit and corrective pass

Date: 29 October 2026  
Audit baseline: Studio integration PR #81 (`a93f86d782f6fbf22c2efa7b13870b0c9594f2c7`)  
Fix branch: `fix/studio2-audit-ui-safety-20261029`  
Scope: Studio UI source, navigation/inspector, media lifecycle and backup/storage, keyboard editing, CI and existing design QA. No changes to owner browser data, public site copy or media assets.

## Findings corrected in this branch

| Priority | Finding from code/CI | Correction | Verification |
|---|---|---|---|
| High | The Images tab rendered the image gallery inside `.s2-panel-title`, a horizontal flex row intended for only the panel title and small actions. Cards were constrained within the title row instead of occupying the navigator width. | Move Images into a separate block after the search field. Add a clear selected state and query-specific empty result. | Playwright geometry, selection and search checks added to `qa/studio2-selection.cjs`. |
| High | Asynchronous `mediaUrls` could resolve after component cleanup and create unreleased `blob:` URLs. A rejected IndexedDB read could also strand URLs already created by sibling reads. | Dispose late results immediately, complete reads before creating URLs, and revoke partial URLs if creation fails; expose load failures rather than silently hiding errors. | Existing media load/save/reload and recovery suites; manually review resource lifecycle under rapid navigation. |
| Medium | Ctrl/Cmd+S was ignored while editing inside a text field due to an early keyboard handler return. | Commit the focused draft via blur, then save the updated workspace. Preserve native Undo/Delete editing inside form controls. | New Playwright case reads the persisted draft from IndexedDB. |
| Medium | Inspector text stayed stale immediately after an Undo/Redo/history-driven value update in a prior CI run. | Synchronise the DraftField from its parent value in `useLayoutEffect` before paint. | Existing motion/Undo/Redo suite remains the acceptance gate; prior flaky CI failure is not falsely claimed resolved without rerun. |
| Medium | File inputs retained their previous selection. Selecting the identical image again could produce no change event, including after validation or interrupted upload. | Reset file input values as soon as an original is captured, in Studio, Inspector and ContextInspector. | Existing real image upload and selection tests; repeated original upload should remain idempotent. |
| Design | Studio controls, dialog and image handles used Manrope even though SHOWSET's approved body/headline family is Poppins. | Use self-hosted Poppins consistently for Studio UI and image-edit handles. | Font metrics and mobile UI need browser screenshot review. |
| High | Evidence captured at 390px showed the editor canvas opening as a 1440px desktop canvas at approximately 25% fit, too small to inspect the real mobile composition. | Choose the actual phone width (minimum 320px) on initial load and 768px on tablets, while retaining manually selected widths and the 1440px desktop default. | `qa/studio2-touch.cjs` asserts the phone opens with Mobile selected and a 390px canvas. |
| QA | Mobile Digital & Marketing correctly rendered four centred stages, but a global mobile assertion required exactly three, creating ten false-negative stage-count failures. | Require four for Digital and three for the other two layouts while preserving the rail/marker and geometry checks for every stage. | Browser mobile-tablet audit; no visual CSS changed. |
| CI | The quality workflow only ran on PRs against main, so child Studio-audit PRs did not automatically run. | Run QA on Studio fix branches and PRs targeting the Studio integration branch. Keep Vercel deployments disabled for both branch groups. | GitHub Actions runs on this PR. |

## Outstanding product and security work (not represented as complete)

1. **Existing-template coverage:** service, Studio, Work and case-study scenes and galleries still lack complete canonical image, layout and section edit controls. Existing home and custom builder pages have working subsets. Unsupported controls must not silently edit fields ignored by the renderer.
2. **Online accounts and storage:** IndexedDB is a local browser workspace, not multi-owner persistent storage. No remote Studio should be enabled until server authentication, roles, access checks, protected media storage and backups are implemented.
3. **Release lifecycle:** protected preview, approvals, immutable content release, static rebuild and rollback are not implemented. Vercel remains staging only until this is secure; xneelo package must use a host-independent content/media contract.
4. **Editor product UX:** richer template structure editing, reusable components, video/gallery authoring, contextual position controls and animation timeline editor need subsequent work.
5. **Mobile and accessibility:** browser emulation does not replace real iOS Safari/Android and keyboard/screen-reader user acceptance. The brand-font change needs screenshot inspection.
6. **Potential preview-save race:** `save()` presently returns false when autosave is already active, so clicking Save local preview during a save may not create a preview. Requires deliberate serialization and regression coverage in the next persistence pass.
7. **Baseline browser QA:** approved main itself has failures relating to old typography/hero expectations, and the Studio integration branch inherited them. Treat actual public regressions separately from outdated tests; preserve approved visuals.

## Data preservation and rollout

Keep `feat/studio-2-foundation`, PR #77 and draft integration PR #81 intact until QA and product review. This audit PR targets the Studio integration branch and has no authorization to merge to main or deploy Vercel. Do not reset the `showset-studio2` IndexedDB database, discard `showset-*` records, or replace local owner's media. No migration has been run.

Validation is recorded in this PR's GitHub Actions run. Status should be considered pending until those jobs conclude; passing TypeScript/build alone does not imply visual approval or a complete editor.
