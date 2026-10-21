# START HERE — SHOWSET replacement project

This ZIP is a **complete replacement project**. Do not copy any files from the previous folder. It includes the prior headline fix, local publishing and the restored Concept 12 motion source.

## 1. Keep your previous folder temporarily

**Do not delete your working old project until the new one has started and passed the short checklist below.** If you made edits in SHOWSET Studio, those are saved in the browser, not in the old project's source files.

## 2. Start the new project

1. Download and extract the ZIP into a new folder, e.g. `C:\Users\james\Documents\SHOWSET-Next-Studio-Complete`.
2. Close the old Next.js terminal with **Ctrl+C**.
3. Open the new **SHOWSET-Next-Studio-Complete** folder and make sure `package.json` is visible.
4. Click the Windows File Explorer address bar, enter `powershell`, press Enter.
5. Run exactly:

```powershell
npm install
npm run dev -- -p 3001
```

If port 3001 is occupied, stop the old server. **Avoid switching ports** because browser-local Studio data is keyed to the exact localhost address and port.

## 3. Open the website and Studio

- Public website: **http://localhost:3001/**
- SHOWSET Studio: **http://localhost:3001/studio/**
- Backup tool: **http://localhost:3001/local-studio-backup.html**

Use the same Chrome profile as before. Do not clear browser storage. Existing drafts and published previews should load because this project intentionally keeps their original localStorage keys.

## 4. Back up your Studio content before removing the old folder

Open the backup tool and select **Download Studio backup**. This JSON backup is portable. A future move to a different port or browser requires importing it there through the same tool.

## 5. Acceptance checklist

- [ ] The hero heading “Great ideas should move people.” is visible in white/teal.
- [ ] Scrolling expands the hero, moves through the three story chapters and centres the expanding dot.
- [ ] The services area and case studies work by pointer/touch; site menu and dropdowns close as expected.
- [ ] Studio loads and your existing changes remain.
- [ ] Edit a harmless piece of text, **Save draft**, **Publish preview**, refresh the public localhost site and check the change.
- [ ] At phone width, no horizontal scrolling, clipped buttons or unreadable text.
- [ ] `npm run check` and `npm run build` pass locally before any hosting work.

Only after passing the checklist should you delete the *previous source folder*. It is unrelated to your browser's localStorage, but keep a downloaded backup anyway.

## Safety and limitations

This remains a development project. Real xneelo publishing is not enabled. No WordPress, DNS or email configuration needs changing now. The real Next.js runtime and exact Concept 12 motion parity could not be validated in the packaging environment; the acceptance test must be performed on your computer.

If `npm install` or `npm run dev -- -p 3001` fails, share the PowerShell error rather than altering your working project.
