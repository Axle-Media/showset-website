# SHOWSET Next.js + Studio — Concept 12 restoration

The approved frontend is `reference/CONCEPT_12_APPROVED.html`. The 2.0/3.0 redesigns and motion prototype are cancelled. Do not reinterpret or restyle Concept 12.

See [CONCEPT12_RESTORATION.md](CONCEPT12_RESTORATION.md) for implementation, recovery checkpoints, compatibility handling and evidence. [CONCEPT12_NOT_IMPLEMENTED.md](CONCEPT12_NOT_IMPLEMENTED.md) records observations without applying design changes.

## Run locally

Use the same browser, hostname and port as your existing Studio session to retain its local storage.

```powershell
npm install
npm run dev -- -p 3001
```

Open `http://localhost:3001/` and `http://localhost:3001/studio/`. `/local-studio-backup.html` exports local drafts, published previews and the restoration recovery snapshot. Changing hostname, port or browser profile selects different browser storage.

## Implementation

- The eleven original page designs use the original DOM, CSS, photographs, patterns, responsive rules and animation equations inside the real Next.js runtime.
- Public pages and responsive Studio canvases use the same source-based component and editor bindings.
- Save Draft and Publish Preview retain their existing four storage keys. Publish Preview is local to this browser/origin and does not publish to WordPress or xneelo.
- Known historical defaults reconcile to the approved source only after a raw backup is saved under `showset-concept12-recovery`. Loading does not overwrite original saved keys. Custom values and optional project modules are preserved.
- The former Services index data is retained as a compatibility entry using the original homepage composition. No cancelled index layout remains active.
- PHP/MySQL publishing and media API source remains present and unchanged. It has not been deployed or tested against a production database in this restoration.

## Verification and build

```powershell
npm run lint:source
npm run check
npm run build
npm run package:xneelo
```

The production build exports the actual Next.js application to `out/`; the existing xneelo architecture is unchanged. New routes and crawler-visible SEO changes require rebuilding. The browser evidence includes matched screenshots at six widths, original/restored recordings, motion measurements and isolated Studio tests. Automated checks are not creative approval.

The original preview contact form honestly reports that it does not send messages. SMTP/mail delivery, remote publishing and physical-device Safari/Android testing are not claimed. Approved-source contrast findings are documented without restyling.

Older v0.2/v0.4 reports are historical, not current acceptance evidence. Nothing has been pushed or deployed.
