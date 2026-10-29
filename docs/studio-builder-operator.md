# Studio 2.0 local operator guide

## Start safely

1. Run `npm run dev -- -p 3001` in this existing project and open <http://localhost:3001/studio/next/>. Keep using the same browser origin; a different hostname or port has separate browser storage.
2. Choose **Back up and start editing**. Retain the downloaded JSON privately. Studio verifies its checksum and retained local copy before creating the separate v2 draft. Existing classic drafts, published-preview records and recoveries are not overwritten.
3. If historical data cannot load, use **Export original recovery records**. Do not reset browser storage. Classic Studio remains the fallback.

## Edit the existing homepage

Choose Layers → Hero headline, or select it in the canvas. Double-click text for plain-text inline editing. Content and validated unit fields commit on blur/Enter; Escape cancels. Typography controls apply to that element. Choose Mobile, Tablet or Desktop before editing to create the corresponding override; empty fields inherit. Reset clears that breakpoint's explicit overrides. Advanced cinematic timeline controls are not implemented in this slice.

**Interactive preview** allows real scroll/navigation/menu behaviour; editing mode selects elements. Contact transport is suppressed in Studio previews. Use the canvas itself to check scroll scenes in both directions.

## Build a new local page

Pages → New. Enter a unique directory-style address and title. Add a Section, then a Container; add elements inside the selected container. Drag a layer onto a container to nest, or use Move up/down for keyboard-friendly reordering. Copy/paste and duplicate create independent IDs. Locked elements must be unlocked before editing. Delete is recoverable through Undo and saved History.

Use Layout for rows/grids, dimensions, spacing and crop; Typography for type/accent; Background for colours and the genuine pattern. **Restore approved closing CTA pattern** applies the current exact responsive artwork recipe. Custom pattern controls become available when choosing the custom treatment. Motion shows only parameters used by the selected preset/trigger. Scroll progress has no duration setting because it scrubs with scroll distance.

A page's address is its future release route, not a deployed URL. In this milestone it is viewed through the saved local preview.

## Images

Select an image and use Replace image, or add originals to Media. Genuine PNG/JPEG/WebP only, below 8 MB, at most 24 megapixels and 8192px on either dimension. Original bytes remain in IndexedDB and are included in portable snapshots. SVG/HTML uploads are rejected. Set useful alt text and independent mobile crop. Media library selection attaches an asset only when an image is selected; uploading elsewhere simply adds to the library.

## Save, preview and recovery

Autosave follows completed edits. **Save draft** commits a new local revision; read the saved/error state. **Save local preview** first commits successfully, then writes a separate read-only preview snapshot. **Open saved preview** shows that snapshot rather than unsaved edits. No online publishing occurs.

If another tab saved a newer revision, saving is blocked instead of overwriting it. Download your changes, or choose **Back up and load latest**; replacement occurs only after backup succeeds. History restores into a new revision. Undo/redo retains 50 local steps; saved revision history remains in IndexedDB.

Site → Download verified backup exports the current workspace, original image bytes and exact legacy recovery strings. Import verifies the checksum/schema/image hashes first, backs up the current workspace, adds immutable media and creates a new draft. A tampered or incomplete backup is rejected. The entire v2 history log is not exported. Keep backup files private; they may contain unpublished content.

Never clear localStorage/IndexedDB to fix a problem. No publish/release control exists until authenticated shared storage and the approved release adapter have been implemented and configured. Production exports intentionally show Studio 2.0 as unavailable.
